// Text input matching the Corex web login fields: orange border when focused or filled,
// floating orange label. `dark` sits on the navy login panel, `light` on white sheets/cards.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'onFocus' | 'onBlur'> & {
    label: string;
    value: string;
    error?: string | false;
    isPassword?: boolean;
    variant?: 'dark' | 'light';
    onBlur?: () => void;
};

const variants = {
    dark: {
        text: 'text-white',
        idleLabel: 'text-white/50',
        labelBg: brand.navy,
        idleBorder: 'rgba(255,255,255,0.25)',
        fill: 'rgba(255,255,255,0.10)',
        focusFill: 'rgba(255,255,255,0.15)',
        idleIcon: 'rgba(255,255,255,0.4)',
        errorText: 'text-red-300',
    },
    light: {
        text: 'text-gray-900',
        idleLabel: 'text-gray-400',
        labelBg: '#ffffff',
        idleBorder: '#d1d5db', // gray-300
        fill: '#ffffff',
        focusFill: '#fff7ed', // orange-50
        idleIcon: '#9ca3af', // gray-400
        errorText: 'text-red-500',
    },
};

export default function BrandInput({
    label, value, error, isPassword, variant = 'dark', onBlur, editable = true, ...inputProps
}: Props) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const v = variants[variant];

    const active = focused || !!value;
    const borderColor = active ? brand.orangeLight : error ? '#f87171' : v.idleBorder;
    const iconColor = focused ? brand.orangeLight : v.idleIcon;

    return (
        <View>
            <View>
                <TextInput
                    {...inputProps}
                    value={value}
                    editable={editable}
                    secureTextEntry={isPassword && !showPassword}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setFocused(false);
                        onBlur?.();
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="transparent"
                    className={`rounded-xl px-4 py-4 text-base ${v.text}`}
                    style={{
                        borderWidth: 2,
                        borderColor,
                        backgroundColor: focused ? v.focusFill : v.fill,
                        paddingRight: isPassword ? 48 : 16,
                    }}
                />

                {/* Floating label: sits inside the field until it is focused or filled */}
                <View
                    pointerEvents="none"
                    className="absolute left-3"
                    style={active ? { top: -10, backgroundColor: v.labelBg, paddingHorizontal: 6 } : { top: 18, paddingHorizontal: 4 }}
                >
                    <Text className={active ? 'text-sm font-medium text-orange-400' : `text-base ${v.idleLabel}`}>
                        {label}
                    </Text>
                </View>

                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword((s) => !s)}
                        disabled={!editable}
                        className="absolute right-4 top-4"
                        hitSlop={8}
                    >
                        {showPassword ? <EyeOff size={20} color={iconColor} /> : <Eye size={20} color={iconColor} />}
                    </TouchableOpacity>
                )}
            </View>
            {error ? <Text className={`${v.errorText} text-sm mt-1`}>{error}</Text> : null}
        </View>
    );
}
