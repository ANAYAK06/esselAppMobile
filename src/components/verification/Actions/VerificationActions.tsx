// src/components/verification/Actions/VerificationActions.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react-native';

interface VerificationActionsProps {
    onApprove: () => void;
    onReject: () => void;
    onReturn?: () => void;
    isLoading?: boolean;
    approveText?: string;
    rejectText?: string;
    returnText?: string;
    showReturn?: boolean;
}

const VerificationActions: React.FC<VerificationActionsProps> = ({
                                                                     onApprove,
                                                                     onReject,
                                                                     onReturn,
                                                                     isLoading = false,
                                                                     approveText = 'Approve',
                                                                     rejectText = 'Reject',
                                                                     returnText = 'Return',
                                                                     showReturn = true,
                                                                 }) => {
    return (
        <View className="bg-white border-t border-gray-200 p-4">
            <View className="flex-row gap-3">
                {/* Reject Button */}
                <TouchableOpacity
                    onPress={onReject}
                    disabled={isLoading}
                    className="flex-1 bg-red-500 py-4 rounded-xl flex-row items-center justify-center"
                    activeOpacity={0.8}
                >
                    <XCircle size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2">{rejectText}</Text>
                </TouchableOpacity>

                {/* Return Button (Optional) */}
                {showReturn && onReturn && (
                    <TouchableOpacity
                        onPress={onReturn}
                        disabled={isLoading}
                        className="flex-1 bg-orange-500 py-4 rounded-xl flex-row items-center justify-center"
                        activeOpacity={0.8}
                    >
                        <RotateCcw size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">{returnText}</Text>
                    </TouchableOpacity>
                )}

                {/* Approve Button */}
                <TouchableOpacity
                    onPress={onApprove}
                    disabled={isLoading}
                    className="flex-1 bg-green-500 py-4 rounded-xl flex-row items-center justify-center"
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <CheckCircle size={20} color="#fff" />
                            <Text className="text-white font-bold ml-2">{approveText}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default VerificationActions;