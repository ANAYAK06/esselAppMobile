// app/(inbox)/verification/cc-budget/_layout.tsx
import { Stack } from 'expo-router';

export default function CCBudgetLayout() {
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