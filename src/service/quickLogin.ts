// src/service/quickLogin.ts
// "Quick login" — sign in with a 4-digit PIN or fingerprint / Face ID instead of the password.
//
// Device-only design (no backend changes): after a successful password login the employee ID and
// password are kept in the platform secure store (iOS Keychain / Android Keystore), readable only
// while the device is unlocked and never included in backups. A PIN or biometric check unlocks
// them, and the app then signs in through the normal validateEmployee call. The PIN itself is
// never stored — only a salted SHA-256 hash.
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

export const PIN_LENGTH = 4;
export const MAX_PIN_ATTEMPTS = 5;

const KEYS = {
    employeeId: 'ql_employeeId',
    password: 'ql_password',
    displayName: 'ql_displayName',
    pinSalt: 'ql_pinSalt',
    pinHash: 'ql_pinHash',
    biometric: 'ql_biometric',
    failedAttempts: 'ql_failedAttempts',
    declined: 'ql_declined', // employee IDs that chose "Don't ask again", comma separated
};

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const get = (key: string) => SecureStore.getItemAsync(key, STORE_OPTIONS);
const set = (key: string, value: string) => SecureStore.setItemAsync(key, value, STORE_OPTIONS);
const remove = (key: string) => SecureStore.deleteItemAsync(key, STORE_OPTIONS);

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const hashPin = (pin: string, salt: string) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

// ==============================================
// TYPES
// ==============================================

export interface QuickLoginInfo {
    employeeId: string;
    displayName: string | null;
    biometricEnabled: boolean;
}

export interface BiometricSupport {
    available: boolean;
    label: string; // "Face ID", "Fingerprint", ...
}

export type PinCheckResult =
    | { ok: true; password: string }
    | { ok: false; attemptsLeft: number; locked: boolean };

// ==============================================
// STATUS
// ==============================================

// The quick login saved on this device, or null when none is set up
export const getQuickLogin = async (): Promise<QuickLoginInfo | null> => {
    try {
        const [employeeId, password, pinHash, displayName, biometric] = await Promise.all([
            get(KEYS.employeeId),
            get(KEYS.password),
            get(KEYS.pinHash),
            get(KEYS.displayName),
            get(KEYS.biometric),
        ]);
        if (!employeeId || !password || !pinHash) return null;
        return { employeeId, displayName, biometricEnabled: biometric === '1' };
    } catch (error) {
        console.warn('Quick login unavailable:', error);
        return null;
    }
};

export const getBiometricSupport = async (): Promise<BiometricSupport> => {
    try {
        const [hasHardware, isEnrolled, types] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        const { AuthenticationType } = LocalAuthentication;
        const label = types.includes(AuthenticationType.FACIAL_RECOGNITION)
            ? 'Face ID'
            : types.includes(AuthenticationType.FINGERPRINT)
                ? 'Fingerprint'
                : types.includes(AuthenticationType.IRIS) ? 'Iris' : 'Biometrics';
        return { available: hasHardware && isEnrolled, label };
    } catch {
        return { available: false, label: 'Biometrics' };
    }
};

export const isDeclined = async (employeeId: string) => {
    const declined = (await get(KEYS.declined)) || '';
    return declined.split(',').includes(employeeId);
};

// ==============================================
// SET UP / UPDATE / REMOVE
// ==============================================

export const enableQuickLogin = async ({
    employeeId, password, pin, biometric,
}: { employeeId: string; password: string; pin: string; biometric: boolean }) => {
    const salt = toHex(Crypto.getRandomBytes(16));
    const pinHash = await hashPin(pin, salt);

    await clearQuickLogin();
    await Promise.all([
        set(KEYS.employeeId, employeeId),
        set(KEYS.password, password),
        set(KEYS.pinSalt, salt),
        set(KEYS.pinHash, pinHash),
        set(KEYS.biometric, biometric ? '1' : '0'),
        set(KEYS.failedAttempts, '0'),
    ]);
};

// Keep the saved password current after a password login (e.g. after a password change)
export const updateSavedPassword = async (employeeId: string, password: string) => {
    if ((await get(KEYS.employeeId)) === employeeId) {
        await set(KEYS.password, password);
    }
};

// Name for the "Welcome back" greeting, learned once the employee / role details load
export const setDisplayName = async (employeeId: string | null, name: string | undefined) => {
    if (!employeeId || !name?.trim()) return;
    if ((await get(KEYS.employeeId)) === employeeId) {
        await set(KEYS.displayName, name.trim());
    }
};

export const declineQuickLogin = async (employeeId: string) => {
    const declined = ((await get(KEYS.declined)) || '').split(',').filter(Boolean);
    if (!declined.includes(employeeId)) {
        await set(KEYS.declined, [...declined, employeeId].join(','));
    }
};

export const clearQuickLogin = async () => {
    await Promise.all(
        [KEYS.employeeId, KEYS.password, KEYS.displayName, KEYS.pinSalt, KEYS.pinHash, KEYS.biometric, KEYS.failedAttempts]
            .map((key) => remove(key))
    );
};

// ==============================================
// UNLOCK
// ==============================================

// Check the PIN; after MAX_PIN_ATTEMPTS wrong tries the saved login is wiped
export const verifyPin = async (pin: string): Promise<PinCheckResult> => {
    const [salt, pinHash, password, failed] = await Promise.all([
        get(KEYS.pinSalt),
        get(KEYS.pinHash),
        get(KEYS.password),
        get(KEYS.failedAttempts),
    ]);
    if (!salt || !pinHash || !password) {
        return { ok: false, attemptsLeft: 0, locked: true };
    }

    if ((await hashPin(pin, salt)) === pinHash) {
        await set(KEYS.failedAttempts, '0');
        return { ok: true, password };
    }

    const attempts = Number(failed || 0) + 1;
    if (attempts >= MAX_PIN_ATTEMPTS) {
        await clearQuickLogin();
        return { ok: false, attemptsLeft: 0, locked: true };
    }
    await set(KEYS.failedAttempts, String(attempts));
    return { ok: false, attemptsLeft: MAX_PIN_ATTEMPTS - attempts, locked: false };
};

// Prompt for fingerprint / Face ID; resolves to the saved password, or null if cancelled / failed
export const unlockWithBiometric = async (promptMessage = 'Sign in to Essel Projects'): Promise<string | null> => {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true, // the PIN is our fallback, not the phone passcode
    });
    if (!result.success) return null;
    return get(KEYS.password);
};

// One biometric check while enabling it, so it is only switched on after it has worked once
export const confirmBiometric = async (promptMessage: string) =>
    (await LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: true })).success;
