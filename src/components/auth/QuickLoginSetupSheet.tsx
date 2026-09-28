// Bottom-sheet content (rendered inside BottomSheet) offered once after a successful password login: set a 4-digit PIN and, when the phone
// supports it, fingerprint / Face ID — so the next sign-in skips the password.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, KeyRound, ScanFace, ShieldCheck } from 'lucide-react-native';
import PinPad from '@/src/components/auth/PinPad';
import { brand } from '@/src/theme/colors';
import {
    PIN_LENGTH,
    BiometricSupport,
    confirmBiometric,
    declineQuickLogin,
    enableQuickLogin,
    getBiometricSupport,
} from '@/src/service/quickLogin';

type Props = {
    employeeId: string;
    password: string;
    onDone: () => void;
};

type Step = 'intro' | 'create' | 'confirm' | 'biometric';

const GradientButton = ({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) => (
    <TouchableOpacity onPress={onPress} disabled={busy} activeOpacity={0.85}>
        <LinearGradient
            colors={['#1e3a8a', brand.orange]} // Tailwind blue-900 → orange-500
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
        >
            {busy
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text className="text-white font-semibold text-base">{label}</Text>}
        </LinearGradient>
    </TouchableOpacity>
);

export default function QuickLoginSetupSheet({ employeeId, password, onDone }: Props) {
    const [step, setStep] = useState<Step>('intro');
    const [pin, setPin] = useState('');
    const [firstPin, setFirstPin] = useState('');
    const [mismatch, setMismatch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [biometric, setBiometric] = useState<BiometricSupport>({ available: false, label: 'Biometrics' });

    useEffect(() => {
        getBiometricSupport().then(setBiometric);
    }, []);

    const save = async (withBiometric: boolean) => {
        setSaving(true);
        try {
            await enableQuickLogin({ employeeId, password, pin: firstPin, biometric: withBiometric });
            onDone();
        } catch (error) {
            console.error('Quick login setup failed:', error);
            Alert.alert('Setup failed', 'Quick login could not be saved on this device. You can keep using your password.');
            onDone();
        }
    };

    const onPinChange = (value: string) => {
        setMismatch(false);
        setPin(value);
        if (value.length < PIN_LENGTH) return;

        if (step === 'create') {
            setFirstPin(value);
            setPin('');
            setStep('confirm');
        } else if (value === firstPin) {
            setPin('');
            if (biometric.available) setStep('biometric');
            else save(false);
        } else {
            setMismatch(true);
            setPin('');
            setFirstPin('');
            setStep('create');
        }
    };

    const enableBiometric = async () => {
        if (await confirmBiometric(`Enable ${biometric.label} for Essel Projects`)) {
            await save(true);
        } else {
            Alert.alert(`${biometric.label} not enabled`, `You can still sign in with your PIN.`);
        }
    };

    const BiometricIcon = biometric.label === 'Face ID' ? ScanFace : Fingerprint;

    return (
        <View>
                    {step === 'intro' && (
                        <View>
                            <View className="items-center mb-5">
                                <View className="w-14 h-14 rounded-2xl bg-brand-navy items-center justify-center mb-3">
                                    <ShieldCheck size={28} color={brand.orangeLight} />
                                </View>
                                <Text className="text-lg font-bold text-brand-navy">Sign in faster next time</Text>
                                <Text className="text-sm text-gray-500 text-center mt-1">
                                    Skip the password on this phone — unlock with a PIN
                                    {biometric.available ? ` or ${biometric.label}` : ''}.
                                </Text>
                            </View>

                            <View className="gap-3 mb-6">
                                <View className="flex-row items-center gap-3">
                                    <KeyRound size={20} color={brand.orange} />
                                    <Text className="text-sm text-gray-700 flex-1">A {PIN_LENGTH}-digit PIN only you know</Text>
                                </View>
                                {biometric.available && (
                                    <View className="flex-row items-center gap-3">
                                        <BiometricIcon size={20} color={brand.orange} />
                                        <Text className="text-sm text-gray-700 flex-1">{biometric.label}, if you want it</Text>
                                    </View>
                                )}
                                <View className="flex-row items-center gap-3">
                                    <ShieldCheck size={20} color={brand.orange} />
                                    <Text className="text-sm text-gray-700 flex-1">
                                        Saved encrypted on this phone only
                                    </Text>
                                </View>
                            </View>

                            <GradientButton label="Set up quick login" onPress={() => setStep('create')} />
                            <TouchableOpacity onPress={onDone} className="py-3.5 mt-2 rounded-xl border border-gray-200 items-center">
                                <Text className="text-sm font-semibold text-gray-700">Not now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    await declineQuickLogin(employeeId);
                                    onDone();
                                }}
                                className="py-3 items-center"
                            >
                                <Text className="text-xs text-gray-400">Don&apos;t ask again</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(step === 'create' || step === 'confirm') && (
                        <View className="items-center">
                            <Text className="text-lg font-bold text-brand-navy">
                                {step === 'create' ? `Create a ${PIN_LENGTH}-digit PIN` : 'Confirm your PIN'}
                            </Text>
                            <Text className={`text-sm mt-1 mb-6 ${mismatch ? 'text-red-500' : 'text-gray-500'}`}>
                                {mismatch
                                    ? "PINs didn't match — try again"
                                    : step === 'create' ? "You'll use it to sign in on this phone" : 'Enter the same PIN again'}
                            </Text>
                            <PinPad variant="light" value={pin} onChange={onPinChange} error={mismatch} disabled={saving} />
                            <TouchableOpacity onPress={onDone} disabled={saving} className="py-3 mt-3">
                                <Text className="text-sm text-gray-500">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'biometric' && (
                        <View>
                            <View className="items-center mb-6">
                                <View className="w-14 h-14 rounded-2xl bg-brand-navy items-center justify-center mb-3">
                                    <BiometricIcon size={28} color={brand.orangeLight} />
                                </View>
                                <Text className="text-lg font-bold text-brand-navy">Use {biometric.label}?</Text>
                                <Text className="text-sm text-gray-500 text-center mt-1">
                                    Sign in with {biometric.label} and keep your PIN as a backup.
                                </Text>
                            </View>
                            <GradientButton label={`Enable ${biometric.label}`} onPress={enableBiometric} busy={saving} />
                            <TouchableOpacity
                                onPress={() => save(false)}
                                disabled={saving}
                                className="py-3.5 mt-2 rounded-xl border border-gray-200 items-center"
                            >
                                <Text className="text-sm font-semibold text-gray-700">PIN only</Text>
                            </TouchableOpacity>
                        </View>
                    )}
        </View>
    );
}
