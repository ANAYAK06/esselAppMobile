import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface QuickAccessItemProps {
    icon: LucideIcon;
    label: string;
    onPress: () => void;
    color: string;
}

export default function QuickAccessItem({ icon: Icon, label, onPress, color }: QuickAccessItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="w-[48%] mb-4 p-4 bg-white rounded-xl border border-gray-200"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            <View
                className="w-12 h-12 rounded-lg items-center justify-center mb-3"
                style={{ backgroundColor: `${color}15` }}
            >
                <Icon size={24} color={color} />
            </View>
            <Text className="text-gray-800 font-medium text-sm">{label}</Text>
        </TouchableOpacity>
    );
}