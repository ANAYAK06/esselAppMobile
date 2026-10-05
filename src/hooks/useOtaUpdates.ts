// OTA updates: expo-updates already checks on cold start and downloads in the background, but
// would only apply the update on the *next* launch. This hook also checks whenever the app comes
// back to the foreground, downloads what it finds, and offers to restart right away.
// No-op in development / Expo Go (Updates.isEnabled is false there).
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Updates from 'expo-updates';

const FOREGROUND_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function useOtaUpdates() {
    const { isUpdateAvailable, isUpdatePending, isDownloading, downloadedUpdate } = Updates.useUpdates();
    const enabled = !__DEV__ && Updates.isEnabled;
    const lastCheck = useRef(0); // 0 → the first foreground return always checks
    const promptedFor = useRef<string | null>(null);

    // Re-check when the app returns to the foreground (throttled).
    useEffect(() => {
        if (!enabled) return;
        const sub = AppState.addEventListener('change', (state) => {
            if (state !== 'active' || Date.now() - lastCheck.current < FOREGROUND_CHECK_INTERVAL_MS) return;
            lastCheck.current = Date.now();
            Updates.checkForUpdateAsync().catch((e) => console.log('OTA check failed:', e?.message));
        });
        return () => sub.remove();
    }, [enabled]);

    // An update was found but not downloaded yet → download it.
    useEffect(() => {
        if (!enabled || !isUpdateAvailable || isUpdatePending || isDownloading) return;
        Updates.fetchUpdateAsync().catch((e) => console.log('OTA download failed:', e?.message));
    }, [enabled, isUpdateAvailable, isUpdatePending, isDownloading]);

    // Downloaded and ready → ask once per update.
    useEffect(() => {
        if (!enabled || !isUpdatePending) return;
        const id = downloadedUpdate?.updateId ?? 'pending';
        if (promptedFor.current === id) return;
        promptedFor.current = id;
        Alert.alert(
            'Update available',
            'A new version of the app has been downloaded. Restart now to use it?',
            [
                { text: 'Later', style: 'cancel' },
                { text: 'Restart', onPress: () => Updates.reloadAsync().catch(() => {}) },
            ],
        );
    }, [enabled, isUpdatePending, downloadedUpdate]);
}
