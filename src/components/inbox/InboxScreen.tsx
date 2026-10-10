// src/components/inbox/InboxScreen.tsx
// Approvals inbox — one row per module waiting on this role (Corex web: components/Inbox).
// Modules with a mobile verification screen open it; the rest are marked "Web only" until
// their mobile page is built.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, type Href } from 'expo-router';
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, Inbox, RefreshCw } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    fetchUserInboxNotifications,
    selectNotificationsError,
    selectNotificationsLoading,
    selectNotificationsSummary,
    selectTotalPendingCount,
    setNotificationFilters,
    type NotificationsSummaryItem,
} from '@/src/slice/notifications/inboxNotificationsSlice';
import { brand } from '@/src/theme/colors';
import { getNotificationIcon } from './Utils/notificationUtils';
import { inboxRouteFor } from './inboxRoutes';
import { setOpenInboxItem } from './openInboxItem';

const MAX_CC_CHIPS = 4;

const ModuleRow = ({ item, onPress }: { item: NotificationsSummaryItem; onPress: () => void }) => {
    const supported = !!inboxRouteFor(item);
    const icon = React.createElement(getNotificationIcon(item.ModuleDisplayName || '', item.ModuleCategory || ''), {
        size: 18,
        color: supported ? brand.orangeLight : '#9ca3af',
    });
    const extraCCs = (item.CCCodes?.length || 0) - MAX_CC_CHIPS;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className={`bg-white rounded-2xl border p-4 mb-3 ${supported ? 'border-gray-200' : 'border-dashed border-gray-300'}`}
        >
            <View className="flex-row items-center gap-3">
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${supported ? 'bg-brand-navy' : 'bg-gray-100'}`}>
                    {icon}
                </View>
                <View className="flex-1">
                    <Text className={`text-sm font-semibold ${supported ? 'text-gray-900' : 'text-gray-600'}`} numberOfLines={2}>
                        {item.ModuleDisplayName}
                    </Text>
                    {item.ModuleCategory ? (
                        <Text className="text-[11px] text-gray-400 mt-0.5" numberOfLines={1}>{item.ModuleCategory}</Text>
                    ) : null}
                </View>
                <View className="items-end gap-1">
                    <View className={`min-w-[28px] h-7 px-2 rounded-full items-center justify-center ${supported ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <Text className="text-xs font-bold text-white">{item.TotalPendingCount}</Text>
                    </View>
                    {!supported && <Text className="text-[10px] font-semibold text-gray-400">Web only</Text>}
                </View>
                {supported && <ChevronRight size={16} color={brand.orange} />}
            </View>

            {item.CCCodes?.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {item.CCCodes.slice(0, MAX_CC_CHIPS).map((cc) => (
                        <View key={cc} className="px-2 py-0.5 rounded-md bg-indigo-50">
                            <Text className="text-[11px] font-medium text-brand-navy">{cc}</Text>
                        </View>
                    ))}
                    {extraCCs > 0 && (
                        <View className="px-2 py-0.5 rounded-md bg-gray-100">
                            <Text className="text-[11px] font-medium text-gray-500">+{extraCCs} more</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function InboxScreen() {
    const dispatch = useAppDispatch();
    const summary: NotificationsSummaryItem[] = useAppSelector(selectNotificationsSummary);
    const loading = useAppSelector(selectNotificationsLoading);
    const error = useAppSelector(selectNotificationsError);
    const totalPending = useAppSelector(selectTotalPendingCount);
    const userData = useAppSelector((state) => state.auth.userData);
    const roleId = useAppSelector((state) => state.auth.roleId);

    const [refreshing, setRefreshing] = useState(false);
    const userId = userData?.uid || userData?.employeeId;

    const load = useCallback(async () => {
        if (!userId || !roleId) return;
        dispatch(setNotificationFilters({ userId, roleId }));
        await dispatch(fetchUserInboxNotifications({ userId, roleId }));
    }, [dispatch, userId, roleId]);

    // Reload every time the inbox is shown, so counts drop after verifying an item
    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const openModule = (item: NotificationsSummaryItem) => {
        const route = inboxRouteFor(item);
        if (route) {
            setOpenInboxItem(item);
            router.push(route.href as Href);
        } else {
            Alert.alert(
                'Not on mobile yet',
                `${item.ModuleDisplayName} verification isn't available in the app yet. Please verify it from the Corex web app for now.`,
            );
        }
    };

    // Modules the app can open first, then web-only ones
    const sorted = [...summary].sort((a, b) => Number(!!inboxRouteFor(b)) - Number(!!inboxRouteFor(a)));
    const mobileCount = summary.filter((s) => inboxRouteFor(s)).length;

    return (
        <SafeAreaView className="flex-1 bg-brand-navy" edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row items-center gap-3 px-4 pt-2 pb-4 bg-brand-navy">
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/role-dashboard'))}
                    className="p-2 -ml-1 rounded-lg bg-white/10"
                    hitSlop={6}
                >
                    <ArrowLeft size={20} color="#ffffff" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-white text-base font-bold">Approvals Inbox</Text>
                    <Text className="text-orange-300 text-[11px]">{userData?.roleCode || 'Pending verification'}</Text>
                </View>
                <TouchableOpacity onPress={load} disabled={loading} className="p-2 rounded-lg bg-white/10">
                    <RefreshCw size={18} color={loading ? brand.orangeLight : '#ffffff'} />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 bg-gray-50"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.orange} colors={[brand.orange]} />}
            >
                {/* Summary */}
                <View className="flex-row items-center gap-4 bg-white rounded-2xl border border-orange-200 p-4 mb-4">
                    <View className="w-12 h-12 rounded-xl bg-orange-50 items-center justify-center">
                        <Inbox size={22} color={brand.orange} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-900">{totalPending}</Text>
                        <Text className="text-xs text-gray-500">
                            item{totalPending === 1 ? '' : 's'} across {summary.length} module{summary.length === 1 ? '' : 's'}
                            {summary.length > 0 ? ` · ${mobileCount} on mobile` : ''}
                        </Text>
                    </View>
                </View>

                {error ? (
                    <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                        <AlertCircle size={18} color="#ef4444" />
                        <Text className="flex-1 text-xs text-red-700">{String(error)}</Text>
                        <TouchableOpacity onPress={load}>
                            <Text className="text-xs font-semibold text-red-600">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {loading && summary.length === 0 ? (
                    <Text className="text-sm text-gray-400 text-center py-16">Loading inbox…</Text>
                ) : summary.length === 0 ? (
                    <View className="items-center py-16 px-6">
                        <CheckCircle size={56} color="#22c55e" />
                        <Text className="text-lg font-semibold text-gray-900 mt-4">All caught up!</Text>
                        <Text className="text-sm text-gray-500 mt-1 text-center">Nothing is waiting for your verification.</Text>
                    </View>
                ) : (
                    sorted.map((item) => (
                        <ModuleRow key={`${item.MasterId}_${item.ModuleDisplayName}`} item={item} onPress={() => openModule(item)} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
