// src/components/verification/RemarksHistory/IndentRemarksHistory.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react-native';

interface IndentRemarkItem {
    Remarks: string;
}

interface IndentRemarksHistoryProps {
    remarks: IndentRemarkItem[];
    defaultExpanded?: boolean;
}

export default function IndentRemarksHistory({
                                                 remarks,
                                                 defaultExpanded = false,
                                             }: IndentRemarksHistoryProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Parse the remarks string to extract individual approval entries
    const parseRemarks = (remarksString: string, startIndex: number) => {
        if (!remarksString) return [];

        // Split by " |" to get individual entries
        const entries = remarksString.split(' |').filter(entry => entry.trim());

        return entries.map((entry, index) => {
            // Each entry format: "Action : RoleName : UserName : Comment"
            const parts = entry.split(' : ').map(part => part.trim());

            if (parts.length >= 4) {
                return {
                    id: startIndex + index,
                    action: parts[0], // "Verify", "Approve", "Created By", etc.
                    role: parts[1],   // "Store Keeper", "Planning", etc.
                    user: parts[2],   // User name
                    comment: parts.slice(3).join(' : '), // Remaining is the comment
                };
            }

            // Fallback for entries that don't match the expected format
            return {
                id: startIndex + index,
                action: 'Unknown',
                role: '',
                user: '',
                comment: entry,
            };
        });
    };

    // Get all parsed remarks from all remark objects with unique IDs
    const allParsedRemarks = remarks.reduce((acc, remarkObj, remarkIndex) => {
        const startIndex = acc.length;
        const remarksText = remarkObj.Remarks || '';
        const parsed = parseRemarks(remarksText, startIndex);
        return [...acc, ...parsed];
    }, [] as Array<{
        id: number;
        action: string;
        role: string;
        user: string;
        comment: string;
    }>);

    // Get action color
    const getActionColor = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('approve')) return 'text-green-700';
        if (actionLower.includes('verify')) return 'text-blue-700';
        if (actionLower.includes('reject')) return 'text-red-700';
        if (actionLower.includes('return')) return 'text-orange-700';
        if (actionLower.includes('created')) return 'text-purple-700';
        return 'text-gray-700';
    };

    const getActionBgColor = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('approve')) return 'bg-green-50 border-green-200';
        if (actionLower.includes('verify')) return 'bg-blue-50 border-blue-200';
        if (actionLower.includes('reject')) return 'bg-red-50 border-red-200';
        if (actionLower.includes('return')) return 'bg-orange-50 border-orange-200';
        if (actionLower.includes('created')) return 'bg-purple-50 border-purple-200';
        return 'bg-gray-50 border-gray-200';
    };

    if (!remarks || remarks.length === 0) {
        return (
            <View className="bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center mb-3">
                    <MessageSquare size={20} color="#6b7280" />
                    <Text className="text-gray-900 font-bold ml-2">Approval History</Text>
                </View>
                <Text className="text-gray-500 text-sm">No approval history available</Text>
            </View>
        );
    }

    return (
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header - Always Visible */}
            <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                className="flex-row items-center justify-between p-4 bg-gray-50"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center flex-1">
                    <MessageSquare size={20} color="#3b82f6" />
                    <Text className="text-gray-900 font-bold ml-2">Approval History</Text>
                    <View className="ml-2 bg-blue-100 px-2 py-1 rounded-full">
                        <Text className="text-blue-700 text-xs font-semibold">
                            {allParsedRemarks.length} {allParsedRemarks.length === 1 ? 'entry' : 'entries'}
                        </Text>
                    </View>
                </View>
                {isExpanded ? (
                    <ChevronUp size={20} color="#6b7280" />
                ) : (
                    <ChevronDown size={20} color="#6b7280" />
                )}
            </TouchableOpacity>

            {/* Expandable Content */}
            {isExpanded && (
                <ScrollView className="max-h-96">
                    <View className="p-4 space-y-3">
                        {allParsedRemarks.length > 0 ? (
                            allParsedRemarks.map((remark) => (
                                <View
                                    key={`remark-${remark.id}`}
                                    className={`p-4 rounded-lg border ${getActionBgColor(remark.action)}`}
                                >
                                    {/* Action Badge */}
                                    <View className="flex-row items-center mb-2">
                                        <View className="flex-row items-center flex-1">
                                            <Text className={`font-bold text-sm ${getActionColor(remark.action)}`}>
                                                {remark.action}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Role and User */}
                                    <View className="mb-2">
                                        <Text className="text-gray-900 font-semibold text-sm">
                                            {remark.role}
                                        </Text>
                                        <Text className="text-gray-600 text-xs mt-1">
                                            By: {remark.user}
                                        </Text>
                                    </View>

                                    {/* Comment */}
                                    {remark.comment && (
                                        <View className="mt-2 pt-2 border-t border-gray-200">
                                            <Text className="text-gray-700 text-sm">
                                                {remark.comment}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text className="text-gray-500 text-sm text-center py-4">
                                No remarks to display
                            </Text>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}