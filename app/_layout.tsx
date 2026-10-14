// app/_layout.tsx - Updated to use separated Redux components
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import separated Redux Provider
import { ReduxProvider } from '@/src/store/ReduxProvider';
import { useOtaUpdates } from '@/src/hooks/useOtaUpdates';
import { store } from '@/src/store/store';
import { logout } from '@/src/slice/auth/authSlice';
import { installAuthInterceptor } from '@/src/service/authInterceptor';

import './globals.css';

// Bearer token on every API call (see src/service/authToken.ts); when the API ends the session,
// clear the login state - the interceptor then opens the login screen.
installAuthInterceptor(() => store.dispatch(logout()));

export default function RootLayout() {
    useOtaUpdates();

    useEffect(() => {
        console.log('App initializing...');
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ReduxProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />
                    <StatusBar style="auto" />
                </ReduxProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}