// src/components/verification/RemarksHistory/RemarksHistorySection.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, User, UserCheck, FileX, Calendar, MessageSquare } from 'lucide-react-native';
import {
    fetchRemarks,
    selectRemarks,
    selectRemarksLoading,
    clearRemarks,
} from '@/src/slice/common/remarksSlice';
import type { AppDispatch } from '@/src/store/store';

interface RemarksHistorySectionProps {
    trno: string | number;           // Transaction number
    moid: string | number;           // Module Object ID
    title?: string;                  // Custom title
    autoLoad?: boolean;              // Auto-load on mount
    defaultExpanded?: boolean;       // Default expanded state
}

const RemarksHistorySection: React.FC<RemarksHistorySectionProps> = ({
                                                                         trno,
                                                                         moid,
                                                                         title = 'Approval History',
                                                                         autoLoad = true,
                                                                         defaultExpanded = false,
                                                                     }) => {
    const dispatch = useDispatch<AppDispatch>();
    const remarks = useSelector(selectRemarks);
    const remarksLoading = useSelector(selectRemarksLoading);

    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    useEffect(() => {
        if (autoLoad && trno && moid) {
            loadRemarks();
        }

        return () => {
            dispatch(clearRemarks());
        };
    }, [trno, moid, autoLoad]);

    const loadRemarks = async () => {
        if (!trno || !moid) {
            console.warn('⚠️ Cannot load remarks: Missing trno or moid');
            return;
        }

        try {
            await dispatch(fetchRemarks({ trno, moid })).unwrap();
        } catch (error) {
            console.error('❌ Failed to load remarks:', error);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const getActionColor = (action: string) => {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('approve') || actionLower.includes('verify')) {
            return 'bg-green-100 text-green-700 border-green-200';
        }
        if (actionLower.includes('reject')) {
            return 'bg-red-100 text-red-700 border-red-200';
        }
        if (actionLower.includes('return')) {
            return 'bg-orange-100 text-orange-700 border-orange-200';
        }
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
            {/* Header - Collapsible */}
            <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                className="flex-row items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center flex-1">
                    <View className="bg-indigo-500 p-2 rounded-lg mr-3">
                        <UserCheck size={20} color="#fff" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-bold text-base">{title}</Text>
                        <Text className="text-gray-600 text-sm mt-0.5">
                            {remarks.length} {remarks.length === 1 ? 'Action' : 'Actions'}
                        </Text>
                    </View>
                </View>
                {isExpanded ? (
                    <ChevronUp size={20} color="#6b7280" />
                ) : (
                    <ChevronDown size={20} color="#6b7280" />
                )}
            </TouchableOpacity>

            {/* Content - Expandable */}
            {isExpanded && (
                <View className="p-4">
                    {remarksLoading ? (
                        <View className="py-8 items-center">
                            <ActivityIndicator size="large" color="#6366f1" />
                            <Text className="text-gray-500 mt-3 text-sm">Loading history...</Text>
                        </View>
                    ) : remarks.length === 0 ? (
                        <View className="py-8 items-center">
                            <FileX size={48} color="#9ca3af" />
                            <Text className="text-gray-500 mt-3 text-sm">No approval history found</Text>
                            <Text className="text-gray-400 text-xs mt-1">This item has not been processed yet</Text>
                        </View>
                    ) : (
                        <ScrollView className="space-y-3" showsVerticalScrollIndicator={false}>
                            {remarks.map((remark, index) => (
                                <View
                                    key={index}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                >
                                    {/* User Info Row */}
                                    <View className="flex-row items-start mb-3">
                                        <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                                            <User size={18} color="#6366f1" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-bold text-base">
                                                {remark.ActionBy}
                                            </Text>
                                            <Text className="text-gray-600 text-xs mt-0.5">
                                                {remark.ActionRole}
                                            </Text>
                                        </View>
                                        <View className={`px-3 py-1 rounded-full border ${getActionColor(remark.Action)}`}>
                                            <Text className="text-xs font-bold">
                                                {remark.Action}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Remarks/Comments */}
                                    {remark.ActionRemarks && (
                                        <View className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                            <View className="flex-row items-center mb-2">
                                                <MessageSquare size={14} color="#6b7280" />
                                                <Text className="text-gray-600 text-xs ml-1 font-semibold">
                                                    Comments:
                                                </Text>
                                            </View>
                                            <Text className="text-gray-800 text-sm leading-5">
                                                {remark.ActionRemarks}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Date/Time */}
                                    {remark.ActionDate && (
                                        <View className="flex-row items-center">
                                            <Calendar size={12} color="#9ca3af" />
                                            <Text className="text-gray-500 text-xs ml-1">
                                                {formatDate(remark.ActionDate)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}
        </View>
    );
};

export default RemarksHistorySection;