import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router'; // ✅ Import useFocusEffect
import { CheckCircle } from 'lucide-react-native';

import AppHeader from '@/src/components/common/AppHeader';
import VerificationItemCard from '@/src/components/verification/Card/VerificationItemCard';
import {
    fetchAmendmentsList,
    selectAmendments,
    selectAmendmentsLoading,
} from '@/src/slice/budget/ccBudgetAmendmentSlice';
import type { AppDispatch } from '@/src/store/store';

export default function CCBudgetListPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const amendments = useSelector(selectAmendments);
    const isLoading = useSelector(selectAmendmentsLoading);

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
            console.log('📋 Loading amendments:', { roleId, uid });
            await dispatch(fetchAmendmentsList({ roleId, uid })).unwrap();
            console.log('✅ Amendments loaded successfully');
        } catch (error: any) {
            console.error('❌ Failed to load amendments:', error);
            Alert.alert('Error', error || 'Failed to load amendments');
        }
    }, [uid, roleId, dispatch]);

    // ✅ Load on mount (first time)
    useEffect(() => {
        console.log('🎬 Component mounted - Initial load');
        if (uid && roleId) {
            loadAmendments();
        }
    }, [uid, roleId, loadAmendments]);

    // ✅ IMPORTANT: Reload when screen comes into focus (when navigating back)
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 Screen focused - Auto-refreshing list');
            if (uid && roleId) {
                loadAmendments();
            }

            // Optional: cleanup function (runs when screen loses focus)
            return () => {
                console.log('👋 Screen unfocused');
            };
        }, [uid, roleId, loadAmendments])
    );

    const handleItemPress = (item: any) => {
        console.log('📄 Opening amendment:', item.CCBudgetAmendmentid);
        router.push({
            pathname: '/(inbox)/verification/cc-budget/[id]' as any,
            params: {
                id: item.CCBudgetAmendmentid,
                type: item.AmendmentType,
            },
        });
    };

    if (isLoading && amendments.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <AppHeader title="Budget Approvals" showBackButton={true} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-4">Loading amendments...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <AppHeader
                title="Budget Approvals"
                showBackButton={true}
                showRefreshButton={true}
                isLoading={isLoading}
                onRefresh={loadAmendments}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View className="mx-4 mt-4 mb-6 rounded-2xl overflow-hidden bg-green-500">
                    <View className="p-6">
                        <Text className="text-white text-lg font-semibold mb-2">
                            Budget Approvals
                        </Text>
                        <Text className="text-white/80 text-sm mb-4">
                            Pending Verification
                        </Text>
                        <View className="items-center pt-4 border-t border-white/20">
                            <Text className="text-white text-5xl font-bold">
                                {amendments.length}
                            </Text>
                            <Text className="text-white/90 text-base mt-2">
                                Items Awaiting Action
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Amendments List */}
                {amendments.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8 mt-20">
                        <CheckCircle size={64} color="#22c55e" />
                        <Text className="text-gray-900 text-xl font-semibold mt-4 text-center">
                            All Verified!
                        </Text>
                        <Text className="text-gray-500 text-base mt-2 text-center">
                            No budget amendments pending verification.
                        </Text>
                    </View>
                ) : (
                    <View className="pb-20">
                        {amendments.map((item: any, index: number) => (
                            <VerificationItemCard
                                key={`${item.CCBudgetAmendmentid}-${index}`}
                                id={item.CCBudgetAmendmentid?.toString() || `ITEM-${index}`}
                                title={item.CCName || 'No Title'}
                                amount={item.AmendedValue}
                                dueDate={
                                    item.AmendmentDate
                                        ? new Date(item.AmendmentDate).toLocaleDateString('en-IN')
                                        : undefined
                                }
                                requestedBy={item.CreatedBy}
                                badge={item.AmendmentType}
                                leftBorderColor="#22c55e"
                                onPress={() => handleItemPress(item)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}