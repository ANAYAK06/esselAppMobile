// src/components/common/AppHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
    title: string;
    showBackButton?: boolean;
    showRefreshButton?: boolean;
    isLoading?: boolean;
    onRefresh?: () => void;
    onBackPress?: () => void;
    rightComponent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
                                                 title,
                                                 showBackButton = true,
                                                 showRefreshButton = false,
                                                 isLoading = false,
                                                 onRefresh,
                                                 onBackPress,
                                                 rightComponent
                                             }) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            // Fallback - go to dashboard
            router.push('/(dashboard)/role-dashboard');
        }
    };

    return (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                {/* Left side - Back button + Title */}
                <View className="flex-row items-center flex-1">
                    {showBackButton && (
                        <TouchableOpacity
                            onPress={handleBackPress}
                            className="mr-3 p-2"
                        >
                            <ArrowLeft size={20} color="#6b7280" />
                        </TouchableOpacity>
                    )}
                    <Text className="text-gray-900 text-xl font-bold">{title}</Text>
                </View>

                {/* Right side - Actions */}
                <View className="flex-row items-center">
                    {showRefreshButton && onRefresh && (
                        <TouchableOpacity onPress={onRefresh} className="p-2 mr-2">
                            <RefreshCw
                                size={20}
                                color={isLoading ? "#3b82f6" : "#6b7280"}
                                style={{
                                    transform: isLoading ? [{ rotate: '360deg' }] : []
                                }}
                            />
                        </TouchableOpacity>
                    )}
                    {rightComponent}
                </View>
            </View>
        </View>
    );
};

export default AppHeader;