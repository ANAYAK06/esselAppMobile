// src/service/authToken.ts - Token based login (access token + refresh token)
//
// Login (GetValidEmployee / GetValidUser) returns response.Token. The app sends "X-Client: mobile",
// so the API returns the refresh token in the body (no cookies on mobile):
//   - access token  -> memory only, sent as "Authorization: Bearer ..." by authInterceptor.ts
//   - refresh token -> expo-secure-store (Keychain / Keystore), used by api/Auth/Refresh to get a
//                      new access token after an app restart or when the old one expires.
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/src/service/apiConfig';

export interface TokenInfo {
    TokenType?: string;
    AccessToken: string;
    AccessTokenExpiresAt?: string;
    ExpiresIn?: number;
    RefreshToken?: string;
    RefreshTokenExpiresAt?: string;
}

export const CLIENT_HEADER = { 'X-Client': 'mobile' };

const REFRESH_TOKEN_KEY = 'auth_refreshToken';
// Readable after the first unlock so background notification work can still refresh; never in backups
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
const REFRESH_MARGIN_MS = 60 * 1000;            // refresh when less than 1 minute is left
const REFRESH_RETRY_BACKOFF_MS = 5 * 60 * 1000;  // after a failed refresh, wait before retrying
const AUTH_TIMEOUT_MS = 30000;

// Separate axios instance: auth calls must not go through our own interceptors
const authAxios = axios.create({ timeout: AUTH_TIMEOUT_MS, headers: CLIENT_HEADER });

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshToken: string | null | undefined; // undefined = not read from secure store yet
let refreshPromise: Promise<boolean> | null = null;
let lastRefreshFailure = 0;

const readRefreshToken = async (): Promise<string | null> => {
    if (refreshToken === undefined) {
        try {
            refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, STORE_OPTIONS);
        } catch {
            refreshToken = null;
        }
    }
    return refreshToken;
};

const writeRefreshToken = async (value: string | null) => {
    refreshToken = value;
    try {
        if (value) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, value, STORE_OPTIONS);
        else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, STORE_OPTIONS);
    } catch (error) {
        console.warn('Secure token storage unavailable:', error);
    }
};

// Called with response.Token from login and with response.Data from refresh
export const setTokenInfo = async (token?: TokenInfo | null) => {
    if (!token?.AccessToken) return;
    accessToken = token.AccessToken;
    accessTokenExpiresAt = token.AccessTokenExpiresAt
        ? new Date(token.AccessTokenExpiresAt).getTime()
        : Date.now() + (token.ExpiresIn || 0) * 1000;
    lastRefreshFailure = 0;
    if (token.RefreshToken) await writeRefreshToken(token.RefreshToken);
};

export const clearTokens = async () => {
    accessToken = null;
    accessTokenExpiresAt = 0;
    refreshPromise = null;
    await writeRefreshToken(null);
};

export const hasRefreshToken = async () => !!(await readRefreshToken());

const hasUsableToken = () => !!accessToken && Date.now() < accessTokenExpiresAt - REFRESH_MARGIN_MS;

// One refresh at a time - parallel callers share the same request.
// Resolves true when a new access token was stored, false otherwise (never throws).
export const refreshAccessToken = (): Promise<boolean> => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const current = await readRefreshToken();
        if (!current) return false;
        try {
            const response = await authAxios.post(`${API_BASE_URL}/Auth/Refresh`, { RefreshToken: current });
            const token: TokenInfo | undefined = response.data?.Data;
            if (token?.AccessToken) {
                await setTokenInfo(token);
                return true;
            }
        } catch (error: any) {
            // 401 = the API ended this session (expired / logged out / password changed)
            if (error?.response?.status === 401) await writeRefreshToken(null);
        }
        accessToken = null;
        lastRefreshFailure = Date.now();
        return false;
    })().finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
};

// Access token for the next request, refreshing first if it is missing / about to expire.
// Returns null when there is no usable token (the request is then sent without one).
export const getAccessToken = async (): Promise<string | null> => {
    if (hasUsableToken()) return accessToken;
    if (Date.now() - lastRefreshFailure < REFRESH_RETRY_BACKOFF_MS) return accessToken;
    if (!(await readRefreshToken())) return accessToken;

    await refreshAccessToken();
    return accessToken;
};

// Ends the session on the server (revokes the refresh token). Fire and forget.
export const serverLogout = async () => {
    const current = await readRefreshToken();
    await clearTokens();
    if (!current) return;
    authAxios.post(`${API_BASE_URL}/Auth/Logout`, { RefreshToken: current }).catch(() => { /* logged out locally */ });
};
