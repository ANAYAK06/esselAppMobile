// src/service/authInterceptor.ts - adds the access token to every API call (default axios instance).
// Installed once in app/_layout.tsx; every file in src/api uses the default axios import, so no API
// file needs changes.
//
// While the server runs Auth.Mode Off / LogOnly a missing or failed token never blocks or logs
// anyone out. Only when an API call itself returns 401 (Auth.Mode Enforce) do we refresh and retry
// once, and end the session (back to the login screen) if the refresh is refused.
import axios from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/src/service/apiConfig';
import { CLIENT_HEADER, clearTokens, getAccessToken, hasRefreshToken, refreshAccessToken } from '@/src/service/authToken';

const LOGIN_PATHS = ['/Security/GetValidEmployee', '/Security/GetValidUser'];

const isApiCall = (url = '') => url.startsWith(API_BASE_URL);
const isLoginCall = (url = '') => LOGIN_PATHS.some((path) => url.includes(path));
const isAuthCall = (url = '') => url.includes('/Auth/');

let installed = false;

// onSessionEnded: clears the app's login state (dispatches logout) - passed in to avoid a
// store <-> interceptor import cycle
export const installAuthInterceptor = (onSessionEnded: () => void) => {
    if (installed) return;
    installed = true;

    axios.interceptors.request.use(async (config) => {
        const url = config.url || '';
        if (!isApiCall(url) || isAuthCall(url)) return config;

        if (isLoginCall(url)) {
            // Ask for the refresh token in the response body (mobile has no cookies)
            config.headers.set(CLIENT_HEADER);
            return config;
        }

        const token = await getAccessToken();
        if (token) config.headers.set('Authorization', `Bearer ${token}`);
        return config;
    });

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const config = error?.config;
            const url: string = config?.url || '';

            if (error?.response?.status !== 401 || !config || config._authRetried
                || !isApiCall(url) || isAuthCall(url) || isLoginCall(url) || !(await hasRefreshToken())) {
                return Promise.reject(error);
            }

            config._authRetried = true;
            if (await refreshAccessToken()) {
                const token = await getAccessToken();
                if (token) config.headers.set('Authorization', `Bearer ${token}`);
                return axios(config);
            }

            // Session ended on the server (expired, logged out elsewhere, password changed)
            await clearTokens();
            onSessionEnded();
            router.replace('/(auth)/login');
            return Promise.reject(error);
        }
    );
};
