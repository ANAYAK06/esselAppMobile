// app/_layout.tsx - Updated to use separated Redux components
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import separated Redux Provider
import { ReduxProvider } from '@/src/store/ReduxProvider';

import './globals.css';

export default function RootLayout() {
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