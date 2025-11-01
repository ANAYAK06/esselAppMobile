// app/(inbox)/verification/indent/list.tsx
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

import AppHeader from '@/src/components/common/AppHeader';
import VerificationItemCard from '@/src/components/verification/Card/VerificationItemCard';
import {
    fetchVerificationGrid,
    selectVerificationItems,
    selectVerificationItemsLoading,
} from '@/src/slice/indent/indentSlice';
import type { AppDispatch } from '@/src/store/store';

export default function IndentListPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const indents = useSelector(selectVerificationItems);
    const isLoading = useSelector(selectVerificationItemsLoading);

    const authState = useSelector((state: any) => state.auth);
    const uid = authState.userData?.uid?.toString();
    const roleId = authState.roleId?.toString();

    // ✅ Function to load indents
    const loadIndents = useCallback(async () => {
        if (!uid || !roleId) {
            console.warn('⚠️ Missing auth data');
            return;
        }

        try {
            console.log('📋 Loading indents:', { roleId, uid });
            // Using "All" for created parameter - adjust based on your API requirements
            await dispatch(fetchVerificationGrid({
                roleId,
                created: 'All',
                userId: uid
            })).unwrap();
            console.log('✅ Indents loaded successfully');
        } catch (error: any) {
            console.error('❌ Failed to load indents:', error);
            Alert.alert('Error', error || 'Failed to load indents');
        }
    }, [uid, roleId, dispatch]);

    // ✅ Load on mount (first time)
    useEffect(() => {
        console.log('🎬 Component mounted - Initial load');
        if (uid && roleId) {
            loadIndents();
        }
    }, [uid, roleId, loadIndents]);

    // ✅ IMPORTANT: Reload when screen comes into focus (when navigating back)
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 Screen focused - Auto-refreshing list');
            if (uid && roleId) {
                loadIndents();
            }

            // Optional: cleanup function (runs when screen loses focus)
            return () => {
                console.log('👋 Screen unfocused');
            };
        }, [uid, roleId, loadIndents])
    );

    const handleItemPress = (item: any) => {
        console.log('📄 Opening indent:', item.Indentno);
        router.push({
            pathname: '/verification/indent/[id]',
            params: {
                id: item.Indentno,
                moid: item.MOID?.toString() || '',
                costcenter: item.Costcenter || '',
                rowid: item.Rowid?.toString() || '', //
            },
        });
    };

    if (isLoading && indents.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <AppHeader title="Indent Verification" showBackButton={true} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-500 mt-4">Loading indents...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <AppHeader
                title="Indent Verification"
                showBackButton={true}
                showRefreshButton={true}
                isLoading={isLoading}
                onRefresh={loadIndents}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View className="mx-4 mt-4 mb-6 rounded-2xl overflow-hidden bg-blue-500">
                    <View className="p-6">
                        <Text className="text-white text-lg font-semibold mb-2">
                            Indent Verification
                        </Text>
                        <Text className="text-white/80 text-sm mb-4">
                            Pending Approval
                        </Text>
                        <View className="items-center pt-4 border-t border-white/20">
                            <Text className="text-white text-5xl font-bold">
                                {indents.length}
                            </Text>
                            <Text className="text-white/90 text-base mt-2">
                                Items Awaiting Action
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Indents List */}
                {indents.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8 mt-20">
                        <CheckCircle size={64} color="#3b82f6" />
                        <Text className="text-gray-900 text-xl font-semibold mt-4 text-center">
                            All Verified!
                        </Text>
                        <Text className="text-gray-500 text-base mt-2 text-center">
                            No indents pending verification.
                        </Text>
                    </View>
                ) : (
                    <View className="pb-20">
                        {indents.map((item: any, index: number) => (
                            <VerificationItemCard
                                key={`${item.Indentno}-${index}`}
                                id={item.Indentno || `INDENT-${index}`}
                                title={item.Costcenter || 'No Cost Center'}
                                amount={item.ChkAmt || item.TotalAmount}
                                dueDate={
                                    item.Date
                                        ? new Date(item.Date).toLocaleDateString('en-IN')
                                        : undefined
                                }
                                requestedBy={item.Createdby}
                                badge={item.CCType || 'Indent'}
                                leftBorderColor="#3b82f6"
                                onPress={() => handleItemPress(item)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}