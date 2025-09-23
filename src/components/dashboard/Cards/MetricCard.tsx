import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ComparisonIndicator from './ComparisonIndicator';

interface MetricCardProps {
    title: string;
    subtitle: string;
    amount: string;
    percentageChange: number;
    isIncrease: boolean;
    color: string;
    style?: any;
}

export default function MetricCard({
                                       title,
                                       subtitle,
                                       amount,
                                       percentageChange,
                                       isIncrease,
                                       color,
                                       style
                                   }: MetricCardProps) {
    return (
        <View style={[styles.cardContainer, style]}>
            <LinearGradient
                colors={[color, `${color}dd`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">{title}</Text>
                    <Text className="text-white/80 text-sm">{subtitle}</Text>

                    <View className="flex-1 justify-center">
                        <Text className="text-white text-2xl font-bold">{amount}</Text>
                    </View>

                    <ComparisonIndicator
                        percentage={percentageChange}
                        isIncrease={isIncrease}
                    />
                </View>

                {/* Card decoration */}
                <View className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full" />
                <View className="absolute bottom-4 right-6 w-6 h-6 bg-white/10 rounded-full" />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        height: 160,
        borderRadius: 16,
        marginVertical: 8,
    },
    card: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
});