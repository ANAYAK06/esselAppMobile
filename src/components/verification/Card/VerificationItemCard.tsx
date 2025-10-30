// src/components/verification/Card/VerificationItemCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Calendar, User, Clock } from 'lucide-react-native';

interface VerificationItemCardProps {
    id: string;
    title: string;
    amount?: string | number;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate?: string;
    requestedBy?: string;
    status?: string;
    badge?: string;
    leftBorderColor?: string;
    onPress: () => void;
}

const VerificationItemCard: React.FC<VerificationItemCardProps> = ({
                                                                       id,
                                                                       title,
                                                                       amount,
                                                                       priority,
                                                                       dueDate,
                                                                       requestedBy,
                                                                       status,
                                                                       badge,
                                                                       leftBorderColor = '#3b82f6',
                                                                       onPress,
                                                                   }) => {
    const getPriorityColor = (priority?: string) => {
        if (priority === 'HIGH') return 'bg-red-100 text-red-700';
        if (priority === 'MEDIUM') return 'bg-orange-100 text-orange-700';
        if (priority === 'LOW') return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-700';
    };

    const formatAmount = (amount?: string | number) => {
        if (!amount) return null;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `₹${numAmount.toLocaleString('en-IN')}`;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white mx-4 mb-3 rounded-xl shadow-sm border border-gray-100"
            activeOpacity={0.7}
            style={{ borderLeftWidth: 4, borderLeftColor: leftBorderColor }}
        >
            <View className="p-4">
                {/* Header Row */}
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-500 text-xs font-medium">{id}</Text>
                    {priority && (
                        <View className={`px-2 py-1 rounded ${getPriorityColor(priority)}`}>
                            <Text className="text-xs font-bold">{priority}</Text>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Text className="text-gray-900 text-base font-bold mb-2" numberOfLines={2}>
                    {title}
                </Text>

                {/* Amount */}
                {amount && (
                    <Text className="text-blue-600 text-lg font-bold mb-3">
                        {formatAmount(amount)}
                    </Text>
                )}

                {/* Badge */}
                {badge && (
                    <View className="bg-blue-50 px-3 py-1 rounded-lg mb-3 self-start">
                        <Text className="text-blue-700 text-xs font-semibold">{badge}</Text>
                    </View>
                )}

                {/* Footer Info */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-1">
                        {dueDate && (
                            <View className="flex-row items-center mb-1">
                                <Clock size={12} color="#9ca3af" />
                                <Text className="text-gray-500 text-xs ml-1">
                                    Due: {dueDate}
                                </Text>
                            </View>
                        )}
                        {requestedBy && (
                            <View className="flex-row items-center">
                                <User size={12} color="#9ca3af" />
                                <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                                    {requestedBy}
                                </Text>
                            </View>
                        )}
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default VerificationItemCard;