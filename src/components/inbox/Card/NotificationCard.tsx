// src/components/inbox/Cards/NotificationCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NotificationsSummaryItem } from '@/src/slice/notifications/inboxNotificationsSlice';
import { getNotificationIcon, getStatusColor, getStatusText } from '../Utils/notificationUtils';

interface NotificationCardProps {
    item: NotificationsSummaryItem;
    onPress: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ item, onPress }) => {
    const IconComponent = getNotificationIcon(item.ModuleDisplayName, item.ModuleCategory);
    const statusColor = getStatusColor(item.Status, item.Priority);

    return (
        <TouchableOpacity onPress={onPress} className="mx-4 mb-3">
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        {/* Icon */}
                        <View className="w-10 h-10 rounded-lg bg-gray-50 items-center justify-center mr-3">
                            <IconComponent size={20} color="#6b7280" />
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                            <Text className="text-gray-900 font-semibold text-base">
                                {item.ModuleDisplayName}
                            </Text>
                            <Text className="text-gray-500 text-sm mt-1">
                                {getStatusText(item.Status)}
                            </Text>
                            {item.ModuleCategory && (
                                <Text className="text-gray-400 text-xs mt-1">
                                    {item.ModuleCategory}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Count Badge */}
                    <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: statusColor }}
                    >
                        <Text className="text-white font-bold text-sm">
                            {item.TotalPendingCount}
                        </Text>
                    </View>
                </View>

                {/* CC Codes Display */}
                {item.CCCodes && item.CCCodes.length > 0 && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                        <View className="flex-row flex-wrap">
                            <Text className="text-gray-500 text-xs mr-2">CC Codes:</Text>
                            {item.CCCodes.map((ccCode, index) => (
                                <View key={ccCode} className="bg-blue-50 px-2 py-1 rounded mr-1 mb-1">
                                    <Text className="text-blue-700 text-xs font-medium">
                                        {ccCode}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default NotificationCard;