// Screen shell for every Employee Portal page: navy header with back button + the page title
// (the web portal's PageHeader), then a pull-to-refresh, keyboard-aware scroll area.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';

type Props = {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    onRefresh?: () => Promise<unknown> | void;
    headerAction?: React.ReactNode;
    children: React.ReactNode;
};

export default function PortalScreen({ title, subtitle, icon: Icon, onRefresh, headerAction, children }: Props) {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    };

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(dashboard)/employee-dashboard'));

    return (
        <SafeAreaView className="flex-1 bg-brand-navy" edges={['top']}>
            <StatusBar style="light" />

            <View className="bg-brand-navy px-3 pt-1 pb-4 flex-row items-center gap-2.5">
                <TouchableOpacity onPress={goBack} className="p-1.5 rounded-lg bg-white/10" hitSlop={8}>
                    <ChevronLeft size={22} color="#ffffff" />
                </TouchableOpacity>
                <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                    <Icon size={18} color={brand.orangeLight} />
                </View>
                <View className="flex-1">
                    <Text className="text-white text-base font-bold" numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text className="text-orange-300 text-[11px]" numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                </View>
                {headerAction}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
                <ScrollView
                    className="flex-1 bg-gray-50"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={brand.orange}
                                colors={[brand.orange]}
                            />
                        ) : undefined
                    }
                >
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
