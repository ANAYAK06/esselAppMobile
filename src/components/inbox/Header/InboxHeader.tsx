// src/components/inbox/Header/InboxHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

interface InboxHeaderProps {
    isLoading: boolean;
    onRefresh: () => void;

}

const InboxHeader: React.FC<InboxHeaderProps> = ({isLoading, onRefresh }) => {
    return (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 text-xl font-bold">Inbox</Text>
                <TouchableOpacity onPress={onRefresh} className="p-2">
                    <RefreshCw
                        size={20}
                        color={isLoading ? "#3b82f6" : "#6b7280"}
                        style={{
                            transform: isLoading ? [{ rotate: '360deg' }] : []
                        }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default InboxHeader;