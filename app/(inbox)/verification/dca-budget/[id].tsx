// app/(inbox)/verification/dca-budget/[id].tsx
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
import {
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Circle,
    Hash,
    FileText,
} from 'lucide-react-native';

import AppHeader from '@/src/components/common/AppHeader';
import RemarksHistorySection from '@/src/components/verification/RemarksHistory/RemarksHistorySection';
import DynamicActionButtons from '@/src/components/verification/Actions/DynamicActionButtons';

import {
    fetchDCAAmendmentById,
    fetchDCABudgetAmendGrid,
    approveDCAAmendment,
    resetApprovalState,
    selectCurrentDCAAmendment,
    selectCurrentDCAAmendmentLoading,
    selectDCAGridData,
    selectDCAGridLoading,
    selectDCAApprovalLoading,
    selectDCAApprovalSuccess,
} from '@/src/slice/budget/dcaBudgetAmendmentSlice';
import type { AppDispatch } from '@/src/store/store';

export default function DCABudgetDetailPage() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    // Extract params
    const ccCode = Array.isArray(params.ccCode) ? params.ccCode[0] : params.ccCode;
    const fyear = Array.isArray(params.fyear) ? params.fyear[0] : params.fyear;
    const ctype = Array.isArray(params.ctype) ? params.ctype[0] : params.ctype;
    const status = Array.isArray(params.status) ? params.status[0] : params.status;

    console.log('🔍 DCA Detail Page Params:', { ccCode, fyear, ctype, status });

    const amendment = useSelector(selectCurrentDCAAmendment);
    const loading = useSelector(selectCurrentDCAAmendmentLoading);
    const dcaBudgetLines = useSelector(selectDCAGridData);
    const gridLoading = useSelector(selectDCAGridLoading);
    const approvalLoading = useSelector(selectDCAApprovalLoading);
    const approvalSuccess = useSelector(selectDCAApprovalSuccess);

    // Get auth data
    const authState = useSelector((state: any) => state.auth);
    const uid = authState.userData?.uid?.toString();
    const roleId = authState.roleId?.toString();
    const userName = authState.userData?.userName;

    // Local state
    const [remarks, setRemarks] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    const safeNavigateBack = useCallback(() => {
        try {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('../(inbox)/verification/dca-budget/list');
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    }, [router]);

    // Handle approval success
    useEffect(() => {
        if (approvalSuccess) {
            Alert.alert('Success', 'DCA Amendment processed successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(resetApprovalState());
                        setTimeout(safeNavigateBack, 100);
                    },
                },
            ]);
        }
    }, [approvalSuccess, dispatch, safeNavigateBack]);

    const loadAmendmentDetails = useCallback(async () => {
        if (!ccCode || !fyear || !ctype || !status) {
            console.error('❌ Cannot load: Missing parameters');
            Alert.alert('Error', 'Invalid amendment parameters');
            return;
        }

        try {
            console.log('📋 Fetching DCA amendment details:', { ccCode, fyear, ctype, status });

            // Fetch main amendment details
            await dispatch(
                fetchDCAAmendmentById({
                    ccCode: ccCode.toString(),
                    fyear: fyear.toString(),
                    ctype: ctype.toString(),
                    status: status.toString(),
                })
            ).unwrap();

            // Fetch DCA budget lines
            await dispatch(
                fetchDCABudgetAmendGrid({
                    ccCode: ccCode.toString(),
                    fyear: fyear.toString(),
                    status: status.toString(),
                })
            ).unwrap();

            console.log('✅ DCA Amendment details loaded');
        } catch (error: any) {
            console.error('❌ Failed to load DCA amendment details:', error);
            Alert.alert('Error', error || 'Failed to load amendment details');
        }
    }, [ccCode, fyear, ctype, status, dispatch]);

    // Load amendment details
    useEffect(() => {
        console.log('🔍 DCA Detail Page - useEffect triggered');
        if (ccCode && fyear && ctype && status) {
            loadAmendmentDetails();
        } else {
            console.error('❌ Missing params:', { ccCode, fyear, ctype, status });
        }
    }, [ccCode, fyear, ctype, status, loadAmendmentDetails]);

    // Helper to get DCA lines array
    const getDCALinesArray = (): any[] => {
        if (!dcaBudgetLines) return [];

        // Check for BudgetItems key (from your web app)
        if (typeof dcaBudgetLines === 'object' && 'BudgetItems' in dcaBudgetLines) {
            const budgetItems = (dcaBudgetLines as any).BudgetItems;
            if (Array.isArray(budgetItems)) {
                return budgetItems;
            }
        }

        // Already an array
        if (Array.isArray(dcaBudgetLines)) {
            return dcaBudgetLines;
        }

        // Try Data property
        if (typeof dcaBudgetLines === 'object' && 'Data' in dcaBudgetLines) {
            const data = (dcaBudgetLines as any).Data;
            if (Array.isArray(data)) {
                return data;
            }
        }

        return [];
    };

    // Calculate totals
    const calculateTotals = () => {
        const linesArray = getDCALinesArray();

        if (linesArray.length === 0) {
            return { totalAddition: 0, totalSubtraction: 0, netChange: 0 };
        }

        const totalAddition = linesArray.reduce((sum: number, item: any) => {
            return sum + parseFloat(item.AAddition || 0);
        }, 0);

        const totalSubtraction = linesArray.reduce((sum: number, item: any) => {
            return sum + parseFloat(item.ASubstraction || 0);
        }, 0);

        const netChange = totalAddition - totalSubtraction;

        return { totalAddition, totalSubtraction, netChange };
    };

    // Handle action from DynamicActionButtons
    const handleAction = async (action: any) => {
        console.log('🎬 handleAction called with:', action);

        if (!amendment || !uid || !roleId) {
            Alert.alert('Error', 'Missing required data');
            return;
        }

        if (!isVerified) {
            Alert.alert('Required', 'Please verify the amendment details first');
            return;
        }

        if (!remarks.trim()) {
            Alert.alert('Required', 'Please add your remarks');
            return;
        }

        try {
            const { totalAddition, totalSubtraction, netChange } = calculateTotals();

            const payload = {
                Action: action.value || action.text,
                AmendedValue: netChange.toString(),
                ApprovalNote: remarks,
                CCCode: ccCode,
                CreatedBy: userName || uid,
                FYYear: fyear,
                RoleId: roleId.toString(),
                Status: status,
            };

            console.log('✅ DCA Approval payload:', payload);
            await dispatch(approveDCAAmendment(payload)).unwrap();

            console.log('✅ Approval successful - waiting for state update');
        } catch (error: any) {
            console.error('❌ Action failed:', error);
            Alert.alert('Error', error.message || 'Failed to process action');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar style="dark" />
                <AppHeader title="DCA Amendment Details" showBackButton={true} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text className="text-gray-500 mt-4">Loading details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!amendment) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar style="dark" />
                <AppHeader title="DCA Amendment Details" showBackButton={true} />
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-gray-900 text-lg font-semibold mb-4">
                        Amendment not found
                    </Text>
                    <Text className="text-gray-500 text-sm mb-4">
                        CC: {ccCode}, FY: {fyear}
                    </Text>
                    <TouchableOpacity
                        className="bg-purple-500 px-6 py-3 rounded-lg"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-semibold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const { totalAddition, totalSubtraction, netChange } = calculateTotals();
    const dcaLines = getDCALinesArray();

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <AppHeader title="DCA Budget Amendment" showBackButton={true} />

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
                                <Text className="text-gray-600 text-sm mb-1">Cost Center</Text>
                                <Text className="text-gray-900 text-xl font-bold">
                                    {amendment.CCCode}
                                </Text>
                            </View>
                            <View className="bg-yellow-100 px-4 py-2 rounded-full border border-yellow-300">
                                <Text className="text-yellow-800 text-sm font-semibold">
                                    Pending
                                </Text>
                            </View>
                        </View>

                        <View className="bg-gray-50 p-4 rounded-lg">
                            <Text className="text-gray-600 text-sm mb-1">Cost Center Name</Text>
                            <Text className="text-gray-900 text-base font-semibold">
                                {amendment.CCName || 'N/A'}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                FY: {fyear} | Type: {ctype}
                            </Text>
                        </View>
                    </View>

                    {/* Net Change Summary Card */}
                    <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-gray-900 text-base font-bold">
                                Amendment Summary
                            </Text>
                            <View className={`px-3 py-1 rounded-full ${
                                netChange >= 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                                <Text className={`text-xs font-semibold ${
                                    netChange >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {netChange >= 0 ? 'Addition' : 'Reduction'}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-center mb-4">
                            {netChange >= 0 ? (
                                <TrendingUp size={32} color="#22c55e" />
                            ) : (
                                <TrendingDown size={32} color="#ef4444" />
                            )}
                            <Text className={`ml-2 text-3xl font-bold ${
                                netChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {netChange >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(netChange))}
                            </Text>
                        </View>

                        <View className="grid grid-cols-2 gap-3">
                            <View className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <Text className="text-green-600 text-xs mb-1">Total Addition</Text>
                                <Text className="text-green-700 text-lg font-bold">
                                    +₹{formatCurrency(totalAddition)}
                                </Text>
                            </View>
                            <View className="bg-red-50 rounded-lg p-3 border border-red-200">
                                <Text className="text-red-600 text-xs mb-1">Total Subtraction</Text>
                                <Text className="text-red-700 text-lg font-bold">
                                    -₹{formatCurrency(totalSubtraction)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* DCA Budget Lines Section */}
                    <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="bg-purple-100 p-2 rounded-lg mr-3">
                                    <FileText size={20} color="#8b5cf6" />
                                </View>
                                <Text className="text-gray-900 text-base font-bold">
                                    DCA Budget Lines
                                </Text>
                            </View>
                            <View className="bg-purple-100 px-3 py-1 rounded-full">
                                <Text className="text-purple-700 text-xs font-semibold">
                                    {dcaLines.length} lines
                                </Text>
                            </View>
                        </View>

                        {gridLoading ? (
                            <View className="py-8 items-center">
                                <ActivityIndicator size="small" color="#8b5cf6" />
                                <Text className="text-gray-500 text-sm mt-2">Loading lines...</Text>
                            </View>
                        ) : dcaLines.length > 0 ? (
                            <View className="space-y-3">
                                {dcaLines.map((line: any, index: number) => {
                                    const addition = parseFloat(line.AAddition || 0);
                                    const subtraction = parseFloat(line.ASubstraction || 0);
                                    const hasChange = addition > 0 || subtraction > 0;

                                    return (
                                        <View
                                            key={`${line.ADCA}-${index}`}
                                            className={`bg-gray-50 rounded-lg p-4 border ${
                                                hasChange ? 'border-purple-200' : 'border-gray-200'
                                            }`}
                                        >
                                            {/* DCA Header */}
                                            <View className="flex-row items-start justify-between mb-3">
                                                <View className="flex-1">
                                                    <View className="flex-row items-center mb-1">
                                                        <Hash size={14} color="#6b7280" />
                                                        <Text className="text-gray-900 text-sm font-bold ml-1">
                                                            {line.ADCA || 'N/A'}
                                                        </Text>
                                                    </View>
                                                    <Text className="text-gray-600 text-xs">
                                                        {line.ADCAName || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Amounts */}
                                            <View className="flex-row justify-between items-center">
                                                {/* Addition */}
                                                <View className="flex-1 mr-2">
                                                    <Text className="text-gray-500 text-xs mb-1">
                                                        Addition
                                                    </Text>
                                                    <View className="flex-row items-center">
                                                        {addition > 0 ? (
                                                            <>
                                                                <TrendingUp size={14} color="#22c55e" />
                                                                <Text className="text-green-600 text-sm font-bold ml-1">
                                                                    +₹{formatCurrency(addition)}
                                                                </Text>
                                                            </>
                                                        ) : (
                                                            <Text className="text-gray-400 text-sm">—</Text>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Subtraction */}
                                                <View className="flex-1 ml-2">
                                                    <Text className="text-gray-500 text-xs mb-1">
                                                        Subtraction
                                                    </Text>
                                                    <View className="flex-row items-center">
                                                        {subtraction > 0 ? (
                                                            <>
                                                                <TrendingDown size={14} color="#ef4444" />
                                                                <Text className="text-red-600 text-sm font-bold ml-1">
                                                                    -₹{formatCurrency(subtraction)}
                                                                </Text>
                                                            </>
                                                        ) : (
                                                            <Text className="text-gray-400 text-sm">—</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}

                                {/* Totals Row */}
                                <View className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300 mt-2">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-purple-900 text-sm font-bold">
                                            Total
                                        </Text>
                                        <View className="flex-row items-center space-x-4">
                                            <View className="items-end mr-4">
                                                <Text className="text-green-600 text-xs mb-1">
                                                    Addition
                                                </Text>
                                                <Text className="text-green-700 text-base font-bold">
                                                    +₹{formatCurrency(totalAddition)}
                                                </Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-red-600 text-xs mb-1">
                                                    Subtraction
                                                </Text>
                                                <Text className="text-red-700 text-base font-bold">
                                                    -₹{formatCurrency(totalSubtraction)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                                <Text className="text-yellow-700 text-sm text-center">
                                    No DCA budget lines found
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Remarks History Component */}
                    <View className="mx-4 mt-4">
                        <RemarksHistorySection
                            trno={amendment.RefNo || ccCode}
                            moid={amendment.MOID}
                            title="Approval History"
                            defaultExpanded={false}
                        />
                    </View>

                    {/* Verification Checkbox */}
                    <View className="mx-4 mt-4">
                        <TouchableOpacity
                            onPress={() => setIsVerified(!isVerified)}
                            className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                {isVerified ? (
                                    <CheckCircle size={24} color="#8b5cf6" />
                                ) : (
                                    <Circle size={24} color="#9ca3af" />
                                )}
                                <Text className="ml-3 flex-1 text-sm text-gray-800">
                                    I have verified all DCA budget line items, additions, subtractions,
                                    and net change calculations
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
                            moid={amendment.MOID}
                            roid={roleId || ''}
                            chkAmt={Math.abs(netChange)}
                            onAction={handleAction}
                            disabled={!isVerified || !remarks.trim() || approvalLoading}
                        />
                    </View>

                    <View className="h-32" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}