// src/components/verification/GenericVerificationDetail.tsx
import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppHeader from '../common/AppHeader';
import VerificationActions from './Actions/VerificationActions';

interface DetailField {
    label: string;
    value: string | number;
    highlight?: boolean;
    icon?: React.ReactNode;
}

interface DetailSection {
    title: string;
    fields: DetailField[];
    icon?: React.ReactNode;
}

interface GenericVerificationDetailProps {
    title: string;
    itemId: string;
    badge?: { text: string; color: string };
    sections: DetailSection[];
    onApprove: (remarks?: string) => Promise<void>;
    onReject: (remarks?: string) => Promise<void>;
    onReturn?: (remarks?: string) => Promise<void>;
    isLoading?: boolean;
    showRemarksInput?: boolean;
    showReturnButton?: boolean;
}

const GenericVerificationDetail: React.FC<GenericVerificationDetailProps> = ({
                                                                                 title,
                                                                                 itemId,
                                                                                 badge,
                                                                                 sections,
                                                                                 onApprove,
                                                                                 onReject,
                                                                                 onReturn,
                                                                                 isLoading = false,
                                                                                 showRemarksInput = true,
                                                                                 showReturnButton = true,
                                                                             }) => {
    const router = useRouter();
    const [remarks, setRemarks] = useState('');
    const [showRemarks, setShowRemarks] = useState(false);

    const handleAction = async (action: 'Approve' | 'Reject' | 'Return', actionFn: (remarks?: string) => Promise<void>) => {
        Alert.alert(
            `Confirm ${action}`,
            `Are you sure you want to ${action.toLowerCase()} this item?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: action === 'Reject' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await actionFn(remarks);
                            Alert.alert('Success', `Item ${action.toLowerCase()}d successfully`, [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || `Failed to ${action.toLowerCase()} item`);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <AppHeader title={title} showBackButton={true} />

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header with Badge */}
                <View className="bg-white border-b border-gray-200 px-4 py-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="text-gray-600 text-sm mb-1">ID</Text>
                            <Text className="text-gray-900 text-lg font-bold">{itemId}</Text>
                        </View>
                        {badge && (
                            <View className={`px-4 py-2 rounded-full ${badge.color}`}>
                                <Text className="text-sm font-semibold">{badge.text}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Dynamic Sections */}
                {sections.map((section, sectionIndex) => (
                    <View
                        key={sectionIndex}
                        className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-100"
                    >
                        <View className="flex-row items-center mb-3">
                            {section.icon}
                            <Text className="text-gray-900 text-base font-bold ml-2">
                                {section.title}
                            </Text>
                        </View>
                        <View className="space-y-2">
                            {section.fields.map((field, fieldIndex) => (
                                <View
                                    key={fieldIndex}
                                    className="flex-row items-center py-2 border-b border-gray-100"
                                >
                                    {field.icon}
                                    <Text className="text-gray-600 text-sm flex-1 ml-2">
                                        {field.label}
                                    </Text>
                                    <Text
                                        className={`text-sm font-semibold flex-1 text-right ${
                                            field.highlight ? 'text-blue-600 text-base' : 'text-gray-900'
                                        }`}
                                    >
                                        {field.value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Remarks Input */}
                {showRemarksInput && (
                    <View className="bg-white mx-4 mt-4 mb-4 rounded-xl p-4 shadow-sm border border-gray-100">
                        <TouchableOpacity
                            onPress={() => setShowRemarks(!showRemarks)}
                            className="flex-row items-center justify-between"
                        >
                            <Text className="text-gray-900 text-base font-bold">
                                Add Remarks (Optional)
                            </Text>
                            <Text className="text-orange-500 text-sm font-medium">
                                {showRemarks ? 'Hide' : 'Show'}
                            </Text>
                        </TouchableOpacity>

                        {showRemarks && (
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3 text-gray-900"
                                placeholder="Enter your comments here..."
                                placeholderTextColor="#9ca3af"
                                value={remarks}
                                onChangeText={setRemarks}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        )}
                    </View>
                )}

                <View className="h-24" />
            </ScrollView>

            {/* Action Buttons */}
            <View className="absolute bottom-0 left-0 right-0">
                <VerificationActions
                    onApprove={() => handleAction('Approve', onApprove)}
                    onReject={() => handleAction('Reject', onReject)}
                    onReturn={onReturn ? () => handleAction('Return', onReturn) : undefined}
                    isLoading={isLoading}
                    showReturn={showReturnButton}
                />
            </View>
        </SafeAreaView>
    );
};

export default GenericVerificationDetail;