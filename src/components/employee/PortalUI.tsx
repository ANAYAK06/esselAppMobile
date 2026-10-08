// Mobile counterparts of the Corex web Employee Portal building blocks
// (RAPP-SLAPP frontend: src/pages/EmployeePortal/components/PortalUI.jsx)
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';

// Status pill colours shared by the dashboard recent-requests list, My Requests, etc.
export const requestStatusStyles: Record<string, { bg: string; text: string }> = {
    Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    Verified: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Approved: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    Rejected: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

// Pass `tone` for pills that are not request statuses (loan status, staff type, ...)
export const Badge = ({ label, tone }: { label: string; tone?: { bg: string; text: string } }) => {
    const style = tone ?? requestStatusStyles[label] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
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
    title?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        {title ? (
            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                <View className="flex-row items-center gap-2.5 flex-1">
                    {Icon && (
                        <View className="w-7 h-7 rounded-lg items-center justify-center bg-brand-navy">
                            <Icon size={16} color={brand.orangeLight} />
                        </View>
                    )}
                    <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={1}>{title}</Text>
                </View>
                {action}
            </View>
        ) : null}
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
    onPress,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon;
    tone?: StatTone;
    onPress?: () => void;
}) => {
    const isDark = tone !== 'white';

    const content = (
        <>
            <View className="flex-row items-center justify-between">
                <Text className={`text-xs font-medium flex-1 ${isDark ? 'text-white/70' : 'text-gray-500'}`} numberOfLines={1}>
                    {label}
                </Text>
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
        const gradient = (
            <LinearGradient
                colors={[brand.orange, brand.orangeDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flexGrow: 1, borderRadius: 12, padding: 16 }}
            >
                {content}
            </LinearGradient>
        );
        return onPress ? (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
                {gradient}
            </TouchableOpacity>
        ) : (
            <View style={{ flex: 1 }}>{gradient}</View>
        );
    }

    const Card = onPress ? TouchableOpacity : View;
    return (
        <Card
            onPress={onPress}
            activeOpacity={0.8}
            className={`flex-1 rounded-xl p-4 ${tone === 'navy' ? 'bg-brand-navy' : 'bg-white border border-gray-200'}`}
        >
            {content}
        </Card>
    );
};

type ButtonProps = {
    label: string;
    onPress: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
    loading?: boolean;
    compact?: boolean;
};

// Navy → orange gradient button, the web portal's PrimaryButton
export const PrimaryButton = ({ label, onPress, icon: Icon, disabled, loading, compact }: ButtonProps) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled || loading}
        style={{ opacity: disabled ? 0.5 : 1 }}
    >
        <LinearGradient
            colors={['#1e3a8a', brand.orange]} // Tailwind blue-900 → orange-500
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
                borderRadius: 8,
                paddingVertical: compact ? 8 : 11,
                paddingHorizontal: compact ? 12 : 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
            }}
        >
            {loading ? <ActivityIndicator size="small" color="#ffffff" /> : Icon ? <Icon size={15} color="#ffffff" /> : null}
            <Text className="text-sm font-semibold text-white">{label}</Text>
        </LinearGradient>
    </TouchableOpacity>
);

// White outlined button; `danger` gives the rose Reject style
export const SecondaryButton = ({
    label, onPress, icon: Icon, disabled, compact, danger,
}: ButtonProps & { danger?: boolean }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        className={`flex-row items-center justify-center gap-1.5 rounded-lg border bg-white ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} ${danger ? 'border-rose-300' : 'border-gray-300'}`}
        style={{ opacity: disabled ? 0.5 : 1 }}
    >
        {Icon ? <Icon size={15} color={danger ? '#e11d48' : '#374151'} /> : null}
        <Text className={`text-sm font-semibold ${danger ? 'text-rose-600' : 'text-gray-700'}`}>{label}</Text>
    </TouchableOpacity>
);

export const InfoRow = ({ label, value, last }: { label: string; value?: string | number | null; last?: boolean }) => (
    <View className={`py-2.5 ${last ? '' : 'border-b border-gray-100'}`}>
        <Text className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</Text>
        {value !== undefined && value !== null && value !== '' ? (
            <Text className="text-sm text-gray-900 font-medium">{value}</Text>
        ) : (
            <Text className="text-sm text-gray-400">—</Text>
        )}
    </View>
);

export const EmptyState = ({ icon: Icon, title, subtitle }: { icon?: LucideIcon; title: string; subtitle?: string }) => (
    <View className="items-center py-8 px-4">
        {Icon && (
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-3">
                <Icon size={24} color="#9ca3af" />
            </View>
        )}
        <Text className="text-sm font-semibold text-gray-700 text-center">{title}</Text>
        {subtitle ? <Text className="text-xs text-gray-400 mt-1 text-center">{subtitle}</Text> : null}
    </View>
);

export const LoadingText = ({ label = 'Loading…' }: { label?: string }) => (
    <Text className="text-sm text-gray-400 py-6 text-center">{label}</Text>
);

export const SearchInput = ({
    value,
    onChangeText,
    placeholder = 'Search…',
}: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}) => (
    <View className="flex-row items-center gap-2 px-3 rounded-lg border border-gray-300 bg-white mb-3">
        <Search size={16} color="#9ca3af" />
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            autoCorrect={false}
            autoCapitalize="none"
            className="flex-1 py-2.5 text-sm text-gray-900"
        />
    </View>
);

// Pill filter row (My Requests tabs, year pickers, ...)
export const ChipTabs = <T extends string | number>({
    options,
    value,
    onChange,
}: {
    options: readonly T[];
    value: T;
    onChange: (value: T) => void;
}) => (
    <View className="flex-row flex-wrap gap-2 mb-4">
        {options.map((option) => {
            const active = option === value;
            return (
                <TouchableOpacity
                    key={String(option)}
                    onPress={() => onChange(option)}
                    className={`px-3.5 py-1.5 rounded-full ${active ? 'bg-brand-navy' : 'bg-gray-100'}`}
                >
                    <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{String(option)}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

// Thin coloured progress bar used by leave balance and loan cards
export const ProgressBar = ({ percent, colorClass = 'bg-orange-500' }: { percent: number; colorClass?: string }) => (
    <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <View
            className={`h-full rounded-full ${colorClass}`}
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
    </View>
);
