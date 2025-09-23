import React from 'react';
import { View, Text } from 'react-native';
import QuickAccessItem from './QuickAccessItem';
import { Clock, MapPin, XCircle, CreditCard } from 'lucide-react-native';

export default function QuickAccessGrid() {
    const quickAccessItems = [
        {
            icon: Clock,
            label: 'Frequent Access',
            onPress: () => {/* Navigate to frequent access */},
            color: '#3b82f6',
        },
        {
            icon: MapPin,
            label: 'Tracking Entries',
            onPress: () => {/* Navigate to tracking */},
            color: '#10b981',
        },
        {
            icon: XCircle,
            label: 'Rejected Entries',
            onPress: () => {/* Navigate to rejected */},
            color: '#ef4444',
        },
        {
            icon: CreditCard,
            label: 'Recent Transactions',
            onPress: () => {/* Navigate to transactions */},
            color: '#8b5cf6',
        },
    ];

    return (
        <View className="px-4 py-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Access</Text>

            <View className="flex-row flex-wrap justify-between">
                {quickAccessItems.map((item, index) => (
                    <QuickAccessItem
                        key={index}
                        icon={item.icon}
                        label={item.label}
                        onPress={item.onPress}
                        color={item.color}
                    />
                ))}
            </View>
        </View>
    );
}