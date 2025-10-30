// app/(inbox)/verification/cc-budget/[id].tsx
import React, {useCallback, useEffect, useState} from 'react';
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
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Circle,
    Eye,
    FileDown
} from 'lucide-react-native';
import {
    buildCCBudgetAmendmentUrl,
    getFileName,
    isImageFile,
    isPdfFile
} from '@/src/service/s3Config';

import AppHeader from '@/src/components/common/AppHeader';
import RemarksHistorySection from '@/src/components/verification/RemarksHistory/RemarksHistorySection';
import DynamicActionButtons from '@/src/components/verification/Actions/DynamicActionButtons';

import {
    fetchAmendmentById,
    approveAmendment,
    clearCurrentAmendment,
    resetApprovalState,
    selectCurrentAmendment,
    selectCurrentAmendmentLoading,
    selectApprovalLoading,
    selectApprovalSuccess,


} from '@/src/slice/budget/ccBudgetAmendmentSlice';
import type { AppDispatch } from '@/src/store/store';

export default function CCBudgetDetailPage() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    // Extract params
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const type = Array.isArray(params.type) ? params.type[0] : params.type;

    console.log('🔍 Detail Page Params:', { id, type, rawParams: params });

    const amendment = useSelector(selectCurrentAmendment);
    const loading = useSelector(selectCurrentAmendmentLoading);
    const approvalLoading = useSelector(selectApprovalLoading);
    const approvalSuccess = useSelector(selectApprovalSuccess);

    // Get auth data
    const authState = useSelector((state: any) => state.auth);
    const uid = authState.userData?.uid?.toString();
    const roleId = authState.roleId?.toString();
    const userName = authState.userData?.userName;

    // Local state
    const [remarks, setRemarks] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const safeNavigateBack = useCallback(() => {
        try {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(inbox)/verification/cc-budget/list');
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    }, [router]);

    // Handle approval success
    useEffect(() => {
        if (approvalSuccess) {
            Alert.alert('Success', 'Amendment processed successfully', [
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
        if (!id || !type) {
            console.error('❌ Cannot load: Missing id or type');
            Alert.alert('Error', 'Invalid amendment parameters');
            return;
        }

        try {
            console.log('📋 Fetching amendment by ID:', { amendId: id, amendType: type });

            await dispatch(
                fetchAmendmentById({
                    amendId: id.toString(),
                    amendType: type.toString()
                })
            ).unwrap();

            console.log('✅ Amendment details loaded');
        } catch (error: any) {
            console.error('❌ Failed to load amendment details:', error);
            Alert.alert('Error', error || 'Failed to load amendment details');
        }
    }, [id, type, dispatch]);

    // Load amendment details
    useEffect(() => {
        console.log('🔍 Detail Page - useEffect triggered');
        console.log('   ID:', id, 'Type:', type);

        if (id && type) {
            loadAmendmentDetails();
        } else {
            console.error('❌ Missing params:', { id, type });
        }

        return () => {
            console.log('🧹 Cleaning up detail page');
            dispatch(clearCurrentAmendment());
        };
    }, [id, type, dispatch, loadAmendmentDetails]);

    // ✅ Handle action from DynamicActionButtons
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
            const payload = {
                AmendedValue: amendment.AmendedValue?.toString() || "0",
                AmendmentType: amendment.AmendmentType,
                ApprovalNote: remarks,
                BudgetId: amendment.BudgetId?.toString() || "",
                CCBudgetAmendmentid: amendment.CCBudgetAmendmentid.toString(),
                CCCode: amendment.CCCode,
                CreatedBy: userName || uid,
                Roleid: roleId.toString(),
                VerificationType: action.value || action.text
            };

            console.log('✅ Action payload (web format):', payload);
            await dispatch(approveAmendment(payload)).unwrap();

            // ✅ SUCCESS - Let the useEffect handle the success alert
            console.log('✅ Approval successful - waiting for state update');

        } catch (error: any) {
            console.error('❌ Action failed:', error);
            Alert.alert('Error', error.message || 'Failed to process action');
        }
    };
    const handleDownloadAttachment = () => {
        if (!amendment?.FilePath) {
            Alert.alert('No Attachment', 'No supporting document available');
            return;
        }

        const attachmentUrl = buildCCBudgetAmendmentUrl(amendment.FilePath);
        if (!attachmentUrl) {
            Alert.alert('Error', 'Invalid file path');
            return;
        }

        const fileName = getFileName(amendment.FilePath);
        const isImage = isImageFile(amendment.FilePath);
        const isPdf = isPdfFile(amendment.FilePath);

        Alert.alert(
            'View Document',
            `${fileName}\n${isImage ? '📷 Image' : isPdf ? '📄 PDF' : '📎 Document'}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open',
                    onPress: () => {
                        Linking.openURL(attachmentUrl).catch((error) => {
                            console.error('Failed to open URL:', error);
                            Alert.alert('Error', 'Failed to open document');
                        });
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar style="dark" />
                <AppHeader title="Amendment Details" showBackButton={true} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-4">Loading details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!amendment) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar style="dark" />
                <AppHeader title="Amendment Details" showBackButton={true} />
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-gray-900 text-lg font-semibold mb-4">
                        Amendment not found
                    </Text>
                    <Text className="text-gray-500 text-sm mb-4">
                        ID: {id}, Type: {type}
                    </Text>
                    <TouchableOpacity
                        className="bg-green-500 px-6 py-3 rounded-lg"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-semibold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Calculate amounts
    const oldBudget = amendment.OldBudget || 0;
    const oldBudgetBalance = amendment.OldBudgetBalance || 0;
    const amendedValue = amendment.AmendedValue || 0;
    const newBudget = amendment.NewBudget ||
        (amendment.AmendmentType === 'Add' ? oldBudget + amendedValue : oldBudget - amendedValue);
    const newBudgetBalance = amendment.NewBudgetBalance ||
        (amendment.AmendmentType === 'Add' ? oldBudgetBalance + amendedValue : oldBudgetBalance - amendedValue);
    const percentChange = oldBudget ? ((amendedValue / oldBudget) * 100).toFixed(2) : '0';

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <AppHeader title="Budget Amendment" showBackButton={true} />

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header Card */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm border border-gray-100">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-600 text-sm mb-1">Amendment ID</Text>
                            <Text className="text-gray-900 text-xl font-bold">
                                {amendment.CCBudgetAmendmentid}
                            </Text>
                        </View>
                        <View className="bg-yellow-100 px-4 py-2 rounded-full border border-yellow-300">
                            <Text className="text-yellow-800 text-sm font-semibold">
                                {amendment.Status || 'Pending'}
                            </Text>
                        </View>
                    </View>

                    <View className="bg-gray-50 p-4 rounded-lg">
                        <Text className="text-gray-600 text-sm mb-1">Cost Center</Text>
                        <Text className="text-gray-900 text-lg font-bold">{amendment.CCCode}</Text>
                        <Text className="text-gray-600 text-sm mt-1">{amendment.CCName}</Text>
                    </View>

                    {/* Attachment Section */}
                    {amendment.FilePath && (
                        <View className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <FileDown size={20} color="#3b82f6" />
                                    <View className="ml-3 flex-1">
                                        <Text className="text-blue-900 font-semibold text-sm">
                                            Supporting Document Available
                                        </Text>
                                        <Text className="text-blue-700 text-xs mt-0.5">
                                            {getFileName(amendment.FilePath)}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={handleDownloadAttachment}
                                    className="bg-blue-500 px-4 py-2 rounded-lg ml-2"
                                >
                                    <View className="flex-row items-center">
                                        <Eye size={16} color="#fff" />
                                        <Text className="text-white font-semibold text-sm ml-1">View</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Budget Comparison with Balances */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm border border-gray-100">
                    <Text className="text-gray-900 text-base font-bold mb-4">
                        Budget Comparison
                    </Text>

                    {/* Current Budget & Balance */}
                    <View className="bg-gray-50 rounded-lg p-4 mb-3">
                        <Text className="text-gray-600 text-sm mb-2">Current Budget</Text>
                        <Text className="text-gray-900 text-2xl font-bold mb-3">
                            ₹{oldBudget.toLocaleString('en-IN')}
                        </Text>
                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                            <Text className="text-gray-600 text-xs">Balance:</Text>
                            <Text className="text-gray-900 text-sm font-semibold">
                                ₹{oldBudgetBalance.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    </View>

                    {/* Change Indicator */}
                    <View className="flex-row items-center justify-center my-3">
                        {amendment.AmendmentType === 'Add' ? (
                            <TrendingUp size={24} color="#22c55e" />
                        ) : (
                            <TrendingDown size={24} color="#ef4444" />
                        )}
                        <Text className={`ml-2 text-lg font-bold ${
                            amendment.AmendmentType === 'Add' ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {amendment.AmendmentType === 'Add' ? '+' : '-'}
                            {percentChange}%
                        </Text>
                    </View>

                    {/* Amendment Amount */}
                    <View className={`rounded-lg p-4 mb-3 ${
                        amendment.AmendmentType === 'Add' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                        <Text className="text-gray-600 text-sm mb-1">Amendment Amount</Text>
                        <Text className={`text-2xl font-bold ${
                            amendment.AmendmentType === 'Add' ? 'text-green-700' : 'text-red-700'
                        }`}>
                            ₹{amendedValue.toLocaleString('en-IN')}
                        </Text>
                    </View>

                    {/* New Budget & Balance */}
                    <View className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                        <Text className="text-green-600 text-sm mb-2">Revised Budget</Text>
                        <Text className="text-green-700 text-2xl font-bold mb-3">
                            ₹{newBudget.toLocaleString('en-IN')}
                        </Text>
                        <View className="flex-row items-center justify-between pt-3 border-t border-green-200">
                            <Text className="text-green-600 text-xs">New Balance:</Text>
                            <Text className="text-green-700 text-sm font-semibold">
                                ₹{newBudgetBalance.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Remarks/Justification */}
                {amendment.Remarks && (
                    <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-100">
                        <Text className="text-gray-900 text-base font-bold mb-3">
                            Amendment Justification
                        </Text>
                        <Text className="text-gray-700 text-sm leading-5">
                            {amendment.Remarks}
                        </Text>
                    </View>
                )}

                {/* Remarks History Component */}
                <View className="mx-4 mt-4">
                    <RemarksHistorySection
                        trno={amendment.Refno || amendment.CCBudgetAmendmentid}
                        moid={amendment.MOID}
                        title="Approval History"
                        defaultExpanded={false}
                    />
                </View>

                {/* Verification Checkbox */}
                <View className="mx-4 mt-4">
                    <TouchableOpacity
                        onPress={() => setIsVerified(!isVerified)}
                        className="bg-green-50 rounded-xl p-5 border-2 border-green-200"
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            {isVerified ? (
                                <CheckCircle size={24} color="#22c55e" />
                            ) : (
                                <Circle size={24} color="#9ca3af" />
                            )}
                            <Text className="ml-3 flex-1 text-sm text-gray-800">
                                I have verified all amendment details including budget amounts,
                                CC code, justification, and supporting documents
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
                    />
                </View>

                {/* ✅ NEW Dynamic Action Buttons Component */}
                <View className="mx-4 mb-4">
                    <DynamicActionButtons
                        moid={amendment.MOID}
                        roid={roleId || ''}
                        chkAmt={amendment.AmendedValue || 0}
                        onAction={handleAction}
                        disabled={!isVerified || !remarks.trim() || approvalLoading}
                    />
                </View>

                <View className="h-32" />
            </ScrollView>
        </SafeAreaView>
    );
}