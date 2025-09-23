import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface ComparisonIndicatorProps {
    percentage: number;
    isIncrease: boolean;
}

export default function ComparisonIndicator({ percentage, isIncrease }: ComparisonIndicatorProps) {
    return (
        <View className="flex-row items-center">
            {isIncrease ? (
                <TrendingUp size={16} color="white" />
            ) : (
                <TrendingDown size={16} color="white" />
            )}
            <Text className="text-white text-sm ml-1">
                {isIncrease ? '+' : '-'}{percentage}% vs last month
            </Text>
        </View>
    );
}
