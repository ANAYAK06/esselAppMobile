// Shown in the navy login panel instead of the password form when a quick login is saved:
// "Welcome back" + PIN pad, with fingerprint / Face ID when enabled.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import PinPad from '@/src/components/auth/PinPad';
import {
    PIN_LENGTH,
    QuickLoginInfo,
    getBiometricSupport,
    unlockWithBiometric,
    verifyPin,
} from '@/src/service/quickLogin';

type Props = {
    info: QuickLoginInfo;
    busy: boolean; // the unlocked credentials are being validated
    onUnlocked: (password: string) => void;
    onUsePassword: () => void;
    onForget: () => void; // remove the saved quick login ("Not you?" or too many wrong PINs)
};

export default function QuickLoginPanel({ info, busy, onUnlocked, onUsePassword, onForget }: Props) {
    const [pin, setPin] = useState('');
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
    const autoPrompted = useRef(false);

    const tryBiometric = async () => {
        const password = await unlockWithBiometric();
        if (password) onUnlocked(password);
    };

    // Offer fingerprint / Face ID straight away when it is enabled and still set up on the phone
    useEffect(() => {
        if (!info.biometricEnabled) return;
        getBiometricSupport().then((support) => {
            if (!support.available) return;
            setBiometricLabel(support.label);
            if (!autoPrompted.current) {
                autoPrompted.current = true;
                tryBiometric();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [info.biometricEnabled]);

    const onPinChange = async (value: string) => {
        setMessage(null);
        setPin(value);
        if (value.length < PIN_LENGTH) return;

        setChecking(true);
        const result = await verifyPin(value);
        setChecking(false);
        setPin('');

        if (result.ok) {
            onUnlocked(result.password);
        } else if (result.locked) {
            Alert.alert(
                'Quick login turned off',
                'Too many incorrect PINs. Please sign in with your password — you can set up a new PIN afterwards.'
            );
            onForget();
        } else {
            setMessage(`Incorrect PIN. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} left.`);
        }
    };

    const confirmForget = () =>
        Alert.alert('Use another account?', 'Quick login for this account will be removed from this phone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: onForget },
        ]);

    const firstName = info.displayName?.split(' ')[0];

    return (
        <View className="items-center">
            <View className="w-14 h-14 rounded-full bg-white/10 border border-orange-400/40 items-center justify-center mb-3">
                <Text className="text-lg font-bold text-orange-400">
                    {(firstName?.[0] || info.employeeId[0] || '?').toUpperCase()}
                </Text>
            </View>
            <Text className="text-2xl font-bold text-white">Welcome back{firstName ? `, ${firstName}` : ''}</Text>
            <Text className="text-orange-200 text-sm mt-1">Employee ID: {info.employeeId}</Text>

            <View className="h-10 justify-center">
                {busy || checking ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text className="text-white/80 text-sm ml-2">{busy ? 'Signing in...' : 'Checking...'}</Text>
                    </View>
                ) : (
                    <Text className={`text-sm ${message ? 'text-red-300' : 'text-white/60'}`}>
                        {message || 'Enter your PIN'}
                    </Text>
                )}
            </View>

            <View className="mt-2">
                <PinPad
                    value={pin}
                    onChange={onPinChange}
                    error={!!message}
                    disabled={busy || checking}
                    biometricLabel={biometricLabel}
                    onBiometric={tryBiometric}
                />
            </View>

            <View className="flex-row justify-between w-full mt-6 px-2">
                <TouchableOpacity onPress={onUsePassword} disabled={busy}>
                    <Text className="text-sm font-medium text-orange-400">Use password instead</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmForget} disabled={busy}>
                    <Text className="text-sm text-white/50">Not you?</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
