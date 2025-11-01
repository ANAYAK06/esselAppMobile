// app/(inbox)/verification/indent/_layout.tsx
import { Stack } from 'expo-router';

export default function IndentLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="list" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}