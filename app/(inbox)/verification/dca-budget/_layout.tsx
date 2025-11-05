// app/(inbox)/verification/dca-budget/_layout.tsx
import { Stack } from 'expo-router';

export default function DCABudgetLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="list"
                options={{
                    title: 'DCA Budget Amendments',
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'DCA Amendment Details',
                    presentation: 'card',
                }}
            />
        </Stack>
    );
}