// 4-dot PIN display + numeric keypad. `dark` sits on the navy login panel, `light` on white sheets.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Delete, Fingerprint, ScanFace } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';
import { PIN_LENGTH } from '@/src/service/quickLogin';

type Props = {
    value: string;
    onChange: (value: string) => void;
    variant?: 'dark' | 'light';
    error?: boolean;
    disabled?: boolean;
    // Shown in the bottom-left key when set (e.g. "Face ID", "Fingerprint")
    biometricLabel?: string | null;
    onBiometric?: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'] as const;

export default function PinPad({
    value, onChange, variant = 'dark', error, disabled, biometricLabel, onBiometric,
}: Props) {
    const dark = variant === 'dark';
    const keyText = dark ? 'text-white' : 'text-brand-navy';
    const keyBg = dark ? 'bg-white/10' : 'bg-gray-100';
    const iconColor = dark ? '#ffffff' : brand.navy;

    const press = (key: (typeof KEYS)[number]) => {
        if (disabled) return;
        if (key === 'del') onChange(value.slice(0, -1));
        else if (key === 'bio') onBiometric?.();
        else if (value.length < PIN_LENGTH) onChange(value + key);
    };

    return (
        <View className="items-center">
            {/* Dots */}
            <View className="flex-row gap-5 mb-8">
                {Array.from({ length: PIN_LENGTH }, (_, i) => {
                    const filled = i < value.length;
                    const color = error ? '#f87171' : filled ? brand.orangeLight : dark ? 'rgba(255,255,255,0.3)' : '#d1d5db';
                    return (
                        <View
                            key={i}
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                borderWidth: 2,
                                borderColor: color,
                                backgroundColor: filled || error ? color : 'transparent',
                            }}
                        />
                    );
                })}
            </View>

            {/* Keypad */}
            <View className="flex-row flex-wrap justify-between" style={{ width: 264, rowGap: 14 }}>
                {KEYS.map((key) => {
                    if (key === 'bio' && !biometricLabel) {
                        return <View key={key} style={{ width: 72, height: 72 }} />;
                    }
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => press(key)}
                            disabled={disabled}
                            activeOpacity={0.6}
                            accessibilityLabel={key === 'del' ? 'Delete' : key === 'bio' ? biometricLabel ?? undefined : key}
                            className={`items-center justify-center rounded-full ${key === 'del' || key === 'bio' ? '' : keyBg}`}
                            style={{ width: 72, height: 72, opacity: disabled ? 0.5 : 1 }}
                        >
                            {key === 'del' ? (
                                <Delete size={26} color={iconColor} />
                            ) : key === 'bio' ? (
                                biometricLabel === 'Face ID'
                                    ? <ScanFace size={30} color={brand.orangeLight} />
                                    : <Fingerprint size={30} color={brand.orangeLight} />
                            ) : (
                                <Text className={`text-2xl font-semibold ${keyText}`}>{key}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
