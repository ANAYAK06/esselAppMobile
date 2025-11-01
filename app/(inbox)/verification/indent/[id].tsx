// app/(inbox)/verification/indent/[id].tsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import {
    ScrollView,
    View,
    Text,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Circle, Package } from 'lucide-react-native';

import AppHeader from '@/src/components/common/AppHeader';
import IndentItemCard from '@/src/components/verification/Card/indentItemCard';
import IndentRemarksHistory from '@/src/components/verification/RemarksHistory/IndentRemarksHistory';
import DynamicActionButtons from '@/src/components/verification/Actions/DynamicActionButtons';

import {
    fetchIndentFullDetails,
    verifyIndent,
    clearCurrentIndent,
    resetVerificationState,
    selectCurrentIndentItems,
    selectCurrentIndentRemarks,
    selectCurrentIndentItemsLoading,
    selectVerificationLoading,
    selectVerificationSuccess,
} from '@/src/slice/indent/indentSlice';
import type { AppDispatch } from '@/src/store/store';

export default function IndentDetailPage() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    // Extract params
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const indno = Array.isArray(params.indno) ? params.indno[0] : (params.indno || id);
    const moid = Array.isArray(params.moid) ? params.moid[0] : params.moid;
    const costcenter = Array.isArray(params.costcenter) ? params.costcenter[0] : params.costcenter;

    console.log('🔍 Detail Page Params:', { id, indno, moid, costcenter, rawParams: params });

    const indentItems = useSelector(selectCurrentIndentItems);
    const indentRemarks = useSelector(selectCurrentIndentRemarks);
    const loading = useSelector(selectCurrentIndentItemsLoading);
    const verificationLoading = useSelector(selectVerificationLoading);
    const verificationSuccess = useSelector(selectVerificationSuccess);

    // Get auth data
    const authState = useSelector((state: any) => state.auth);
    const uid = authState.userData?.uid?.toString();
    const roleId = authState.roleId?.toString();
    const userName = authState.userData?.userName;

    console.log('👤 Auth Data:', {
        uid,
        roleId,
        userName,
        hasUserData: !!authState.userData
    });

    // Local state
    const [remarks, setRemarks] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    const safeNavigateBack = useCallback(() => {
        try {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/verification/indent/list');
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    }, [router]);

    // Handle verification success
    useEffect(() => {
        if (verificationSuccess) {
            Alert.alert('Success', 'Indent processed successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(resetVerificationState());
                        setTimeout(safeNavigateBack, 100);
                    },
                },
            ]);
        }
    }, [verificationSuccess, dispatch, safeNavigateBack]);

    const loadIndentDetails = useCallback(async () => {
        if (!indno) {
            console.error('❌ Cannot load: Missing indno');
            Alert.alert('Error', 'Invalid indent parameters');
            return;
        }

        try {
            console.log('📋 Fetching indent details:', { indno });

            // Fetch both items and remarks together
            await dispatch(fetchIndentFullDetails(indno.toString())).unwrap();

            console.log('✅ Indent details loaded');
        } catch (error: any) {
            console.error('❌ Failed to load indent details:', error);
            Alert.alert('Error', error || 'Failed to load indent details');
        }
    }, [indno, dispatch]);

    // Load indent details
    useEffect(() => {
        console.log('🔍 Detail Page - useEffect triggered');
        console.log('   Indno:', indno);

        if (indno) {
            loadIndentDetails();
        } else {
            console.error('❌ Missing indno:', { indno });
        }

        return () => {
            console.log('🧹 Cleaning up detail page');
            dispatch(clearCurrentIndent());
        };
    }, [indno, dispatch, loadIndentDetails]);

    // Handle action from DynamicActionButtons
    const handleAction = async (action: any) => {
        console.log('🎬 handleAction called with:', action);

        if (!indno || !uid || !roleId) {
            Alert.alert('Error', 'Missing required data');
            return;
        }

        if (!isVerified) {
            Alert.alert('Required', 'Please verify the indent details first');
            return;
        }

        if (!remarks.trim()) {
            Alert.alert('Required', 'Please add your remarks');
            return;
        }

        try {
            console.log('🎯 Complete Verification Context:', {
                userId: uid,
                userName: userName,
                roleId: roleId,
                indentNo: indno,
                moid: moid,
                costCenter: costcenter,
                rowid: params.rowid,
                indentStatus: indentItems[0]?.Status,
                totalAmount: totalAmount,
                itemCount: indentItems.length,
            });

            // Payload to match backend expectations
            const payload = {
                Rowid: params.rowid?.toString() || indentItems[0]?.Rowid || '',
                Appstatus: action.value || action.text,
                AprovalRemarks: remarks,  // ✅ Add this
                Remarks: remarks,
                Crtdby: userName || uid.toString(),
                Createdby: userName || uid.toString(),  // ✅ Add this
                Indent: indno.toString(),
                IndentNo: indno.toString(),  // ✅ Add this
                Roleid: roleId || '',
                RoleId: roleId || '',  // ✅ Add this (for compatibility)
            };

            console.log('✅ Verification payload:', payload);

            const result = await dispatch(verifyIndent(payload)).unwrap();

            // Check for workflow configuration issues
            if (result && typeof result === 'string' && result.includes('Next Level')) {
                console.warn('⚠️ Workflow issue:', result);
                Alert.alert(
                    'Workflow Issue',
                    result,
                    [{ text: 'OK' }]
                );
                return;
            }

            console.log('✅ Verification successful');
        } catch (error: any) {
            console.error('❌ Verification failed:', error);
            Alert.alert('Error', error.message || 'Failed to process verification');
        }
    };

    // Calculate total amount
    const totalAmount = indentItems.reduce((sum, item) => {
        const actualQty = parseFloat(item.ActuallQty || '0');
        const transferredQty = parseFloat(item.TransferredQty || '0');
        const balanceQty = actualQty - transferredQty;
        const price = parseFloat(item.Basic || '0');
        const balanceAmount = balanceQty * price;

        return sum + balanceAmount;
    }, 0);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar style="dark" />
                <AppHeader title="Indent Details" showBackButton={true} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-500 mt-4">Loading details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!indentItems || indentItems.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar style="dark" />
                <AppHeader title="Indent Details" showBackButton={true} />
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-gray-900 text-lg font-semibold mb-4">
                        No items found
                    </Text>
                    <Text className="text-gray-500 text-sm mb-4">
                        Indent: {indno}
                    </Text>
                    <TouchableOpacity
                        className="bg-blue-500 px-6 py-3 rounded-lg"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-semibold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <AppHeader title="Indent Verification" showBackButton={true} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >

            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                {/* Header Card */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm border border-gray-100">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-600 text-sm mb-1">Indent Number</Text>
                            <Text className="text-gray-900 text-xl font-bold">
                                {indno}
                            </Text>
                        </View>
                        <View className="bg-yellow-100 px-4 py-2 rounded-full border border-yellow-300">
                            <Text className="text-yellow-800 text-sm font-semibold">
                                Pending
                            </Text>
                        </View>
                    </View>

                    <View className="bg-gray-50 p-4 rounded-lg mb-4">
                        <Text className="text-gray-600 text-sm mb-1">Cost Center</Text>
                        <Text className="text-gray-900 text-lg font-bold">{costcenter}</Text>
                    </View>

                    {/* Total Amount Display */}
                    <View className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                        <Text className="text-blue-600 text-sm mb-2">Total Indent Value</Text>
                        <Text className="text-blue-700 text-3xl font-bold">
                            ₹{totalAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        </Text>
                        <View className="flex-row items-center mt-2">
                            <Package size={14} color="#3b82f6" />
                            <Text className="text-blue-600 text-xs ml-1">
                                {indentItems.length} {indentItems.length === 1 ? 'item' : 'items'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Items Section */}
                <View className="mt-4">
                    <View className="mx-4 mb-3">
                        <Text className="text-gray-900 text-base font-bold">
                            Indent Items
                        </Text>
                        <Text className="text-gray-500 text-sm">
                            Review all items in this indent
                        </Text>
                    </View>

                    {indentItems.map((item: any, index: number) => (
                        <IndentItemCard
                            key={`${item.Itemcode}-${index}`}
                            itemCode={item.Itemcode}
                            itemName={item.Itemname}
                            specification={item.Specification || 'N/A'}
                            quantity={item.ActuallQty || 0}
                            transferredQty={item.TransferredQty || 0}
                            unitPrice={item.Basic || 0}
                            lineTotal={item.IndentValue || 0}
                        />
                    ))}
                </View>

                {/* Remarks History Component */}
                <View className="mx-4 mt-4">
                    <IndentRemarksHistory
                        remarks={indentRemarks}
                        defaultExpanded={false}
                    />
                </View>

                {/* Verification Checkbox */}
                <View className="mx-4 mt-4">
                    <TouchableOpacity
                        onPress={() => setIsVerified(!isVerified)}
                        className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200"
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            {isVerified ? (
                                <CheckCircle size={24} color="#3b82f6" />
                            ) : (
                                <Circle size={24} color="#9ca3af" />
                            )}
                            <Text className="ml-3 flex-1 text-sm text-gray-800">
                                I have verified all indent items including quantities, prices,
                                specifications, and supporting documents
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Remarks Input */}
                <View className="bg-white mx-4 mt-4 mb-4 rounded-xl p-4 border border-gray-200">
                    <Text className="text-gray-900 font-bold mb-2">
                        Your Remarks <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        value={remarks}
                        onChangeText={setRemarks}
                        placeholder="Enter your verification comments..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={4}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900"
                        textAlignVertical="top"
                        onFocus={() => {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 300);
                        }}
                    />
                </View>

                {/* Dynamic Action Buttons Component */}
                <View className="mx-4 mb-4">
                    <DynamicActionButtons
                        moid={moid || ''}
                        roid={roleId || ''}
                        chkAmt={totalAmount}
                        onAction={handleAction}
                        disabled={!isVerified || !remarks.trim() || verificationLoading}
                    />
                </View>

                <View className="h-32" />
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}