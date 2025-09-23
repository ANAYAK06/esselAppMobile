// app/inbox.tsx - Alternative Simple Route File
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import InboxScreen from '../../src/components/inbox/InboxScreen';
import { useRouter } from 'expo-router';

export default function InboxPage() {
    const router = useRouter();

    return (
        <>
            <StatusBar style="dark" />
            <InboxScreen navigation={router} />
        </>
    );
}