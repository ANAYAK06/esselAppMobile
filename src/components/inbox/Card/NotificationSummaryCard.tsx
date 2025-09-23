// src/components/inbox/Cards/NotificationSummaryCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NotificationSummaryCardProps {
    totalPendingCount: number;
    title?: string;
    subtitle?: string;
}

const NotificationSummaryCard: React.FC<NotificationSummaryCardProps> = ({
                                                                             totalPendingCount,
                                                                             title = "Item Pending For Verification",
                                                                             subtitle = "Awaiting...",
                                                                         }) => {
    return (
        <LinearGradient
            colors={['#3b82f6', '#8b5cf6', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mx-4 mt-4 mb-6 rounded-2xl"
        >
            <View className="p-6">
                <Text className="text-white text-lg font-medium mb-2">
                    {title}
                </Text>
                <Text className="text-white/80 text-sm mb-4">
                    {subtitle}
                </Text>

                <View className="items-center">
                    <Text className="text-white text-4xl font-bold">
                        {totalPendingCount}
                    </Text>
                    <Text className="text-white/90 text-base mt-1">
                        Items Pending Verification
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
};

export default NotificationSummaryCard;