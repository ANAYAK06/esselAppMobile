// Mobile counterparts of the Corex web Employee Portal building blocks
// (RAPP-SLAPP frontend: src/pages/EmployeePortal/components/PortalUI.jsx)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';

// Status pill colours shared by the dashboard recent-requests list, My Requests, etc.
export const requestStatusStyles: Record<string, { bg: string; text: string }> = {
    Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    Verified: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Approved: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    Rejected: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

export const Badge = ({ label }: { label: string }) => {
    const style = requestStatusStyles[label] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
        <View className={`px-2.5 py-1 rounded-full ${style.bg}`}>
            <Text className={`text-xs font-semibold ${style.text}`}>{label}</Text>
        </View>
    );
};

export const SectionCard = ({
    title,
    icon: Icon,
    action,
    children,
}: {
    title: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50">
            <View className="flex-row items-center gap-2.5 flex-1">
                {Icon && (
                    <View className="w-7 h-7 rounded-lg items-center justify-center bg-brand-navy">
                        <Icon size={16} color={brand.orangeLight} />
                    </View>
                )}
                <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>{title}</Text>
            </View>
            {action}
        </View>
        <View className="p-4">{children}</View>
    </View>
);

type StatTone = 'navy' | 'orange' | 'white';

export const StatCard = ({
    label,
    value,
    sub,
    icon: Icon,
    tone = 'navy',
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon;
    tone?: StatTone;
}) => {
    const isDark = tone !== 'white';

    const content = (
        <>
            <View className="flex-row items-center justify-between">
                <Text className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-gray-500'}`}>{label}</Text>
                {Icon && (
                    <View className={`w-7 h-7 rounded-lg items-center justify-center ${isDark ? 'bg-white/15' : 'bg-orange-50'}`}>
                        <Icon size={16} color={isDark ? brand.orangeSoft : brand.orange} />
                    </View>
                )}
            </View>
            <Text className={`text-xl font-bold mt-2 ${isDark ? 'text-white' : 'text-brand-navy'}`} numberOfLines={1}>
                {value}
            </Text>
            {sub ? (
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-400'}`} numberOfLines={1}>
                    {sub}
                </Text>
            ) : null}
        </>
    );

    // NativeWind has no gradient backgrounds, so the orange tone uses LinearGradient
    if (tone === 'orange') {
        return (
            <LinearGradient
                colors={[brand.orange, brand.orangeDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, borderRadius: 12, padding: 16 }}
            >
                {content}
            </LinearGradient>
        );
    }

    return (
        <View className={`flex-1 rounded-xl p-4 ${tone === 'navy' ? 'bg-brand-navy' : 'bg-white border border-gray-200'}`}>
            {content}
        </View>
    );
};

// Navy → orange gradient button, the web portal's PrimaryButton
export const PrimaryButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
            colors={['#1e3a8a', brand.orange]} // Tailwind blue-900 → orange-500
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
        >
            <Text className="text-sm font-semibold text-white">{label}</Text>
        </LinearGradient>
    </TouchableOpacity>
);
