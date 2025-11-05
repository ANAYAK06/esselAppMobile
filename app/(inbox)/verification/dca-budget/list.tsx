// app/(inbox)/verification/dca-budget/list.tsx
import React, { useEffect, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

import AppHeader from '@/src/components/common/AppHeader';
import VerificationItemCard from '@/src/components/verification/Card/VerificationItemCard';
import {
    fetchDCAAmendmentsList,
    selectDCAAmendments,
    selectDCAAmendmentsLoading,
} from '@/src/slice/budget/dcaBudgetAmendmentSlice';
import type { AppDispatch } from '@/src/store/store';

export default function DCABudgetListPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    //
    const amendmentsFromStore = useSelector(selectDCAAmendments);
    const amendments = useMemo(() => {
        // Force it to be an array, even if Redux returns undefined initially
        return Array.isArray(amendmentsFromStore) ? amendmentsFromStore : [];
    }, [amendmentsFromStore]);

    const isLoading = useSelector(selectDCAAmendmentsLoading);

    const authState = useSelector((state: any) => state.auth);
    const uid = authState.userData?.uid?.toString();
    const roleId = authState.roleId?.toString();

    // ✅ Function to load amendments
    const loadAmendments = useCallback(async () => {
        if (!uid || !roleId) {
            console.warn('⚠️ Missing auth data');
            return;
        }

        try {
            console.log('📋 Loading DCA amendments:', { roleId, uid });
            await dispatch(fetchDCAAmendmentsList({ roleId, userId: uid })).unwrap();
            console.log('✅ DCA amendments loaded successfully');
        } catch (error: any) {
            console.error('❌ Failed to load DCA amendments:', error);
            Alert.alert('Error', error || 'Failed to load amendments');
        }
    }, [uid, roleId, dispatch]);

    // ✅ Load on mount (first time)
    useEffect(() => {
        console.log('🎬 DCA Component mounted - Initial load');
        if (uid && roleId) {
            loadAmendments();
        }
    }, [uid, roleId, loadAmendments]);

    // ✅ IMPORTANT: Reload when screen comes into focus (when navigating back)
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 DCA Screen focused - Auto-refreshing list');
            if (uid && roleId) {
                loadAmendments();
            }

            // Optional: cleanup function (runs when screen loses focus)
            return () => {
                console.log('👋 DCA Screen unfocused');
            };
        }, [uid, roleId, loadAmendments])
    );

    const handleItemPress = useCallback((item: any) => {
        console.log('📄 Opening DCA amendment:', {
            CCCode: item.CCCode,
            FYYear: item.FYYear,
            Status: item.Status,
        });

        router.push({
            pathname: '/(inbox)/verification/dca-budget/[id]' as any,
            params: {
                ccCode: item.CCCode,
                fyear: item.FYYear || 'N/A',
                ctype: item.cc_Type || 'Performing',
                status: item.Status || '1',
            },
        });
    }, [router]);

    // ✅ Memoize the count to prevent re-renders
    const amendmentsCount = useMemo(() => amendments.length, [amendments.length]);

    if (isLoading && amendmentsCount === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <AppHeader title="DCA Budget Approvals" showBackButton={true} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text className="text-gray-500 mt-4">Loading amendments...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <AppHeader
                title="DCA Budget Approvals"
                showBackButton={true}
                showRefreshButton={true}
                isLoading={isLoading}
                onRefresh={loadAmendments}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Card - Purple/Violet theme for DCA */}
                <View className="mx-4 mt-4 mb-6 rounded-2xl overflow-hidden bg-violet-600">
                    <View className="p-6">
                        <Text className="text-white text-lg font-semibold mb-2">
                            DCA Budget Approvals
                        </Text>
                        <Text className="text-white/80 text-sm mb-4">
                            Pending Verification
                        </Text>
                        <View className="items-center pt-4 border-t border-white/20">
                            <Text className="text-white text-5xl font-bold">
                                {amendmentsCount}
                            </Text>
                            <Text className="text-white/90 text-base mt-2">
                                Cost Centers Awaiting Action
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Amendments List */}
                {amendmentsCount === 0 ? (
                    <View className="flex-1 items-center justify-center px-8 mt-20">
                        <CheckCircle size={64} color="#8b5cf6" />
                        <Text className="text-gray-900 text-xl font-semibold mt-4 text-center">
                            All Verified!
                        </Text>
                        <Text className="text-gray-500 text-base mt-2 text-center">
                            No DCA budget amendments pending verification.
                        </Text>
                    </View>
                ) : (
                    <View className="pb-20">
                        {amendments.map((item: any, index: number) => {


                            // Handle FYYear being 'N/A'
                            const fyYear = item?.FYYear && item.FYYear !== 'N/A' ? item.FYYear : null;

                            const itemId = item?.CCCode
                                ? fyYear
                                    ? `${item.CCCode} • FY: ${fyYear}`
                                    : item.CCCode
                                : `ITEM-${index}`;

                            const itemTitle = item?.CCName || item?.CCCode || 'No Title';
                            const itemAmount = item?.AmendedValue ?? 0;

                            const itemDueDate = (() => {
                                if (!item?.AmdDate) return undefined;
                                if (item.AmdDate === '0001-01-01T00:00:00') return undefined;

                                if (typeof item.AmdDate === 'string' && item.AmdDate.trim() !== '') {
                                    return item.AmdDate;
                                }

                                return undefined;
                            })();

                            const itemRequestedBy = (item?.CreatedBy != null && item.CreatedBy !== '')
                                ? String(item.CreatedBy)
                                : undefined;

                            const itemBadge = item?.cc_Type || 'Performing';


                            return (
                                <VerificationItemCard
                                    key={`dca-${item?.CCCode || index}-${index}`}
                                    id={itemId}
                                    title={itemTitle}
                                    dueDate={itemDueDate}
                                    requestedBy={itemRequestedBy}
                                    badge={itemBadge}
                                    leftBorderColor="#8b5cf6"
                                    onPress={() => handleItemPress(item)}
                                />
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}