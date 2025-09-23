import React, { useRef, useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import MetricCard from './MetricCard';

const { width } = Dimensions.get('window');

export default function MetricsCarousel() {
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const metricsData = [
        {
            title: 'Purchase',
            subtitle: 'This Month',
            amount: '₹12,45,000',
            percentageChange: 15.6,
            isIncrease: true,
            color: '#3b82f6', // Blue
        },
        {
            title: 'Sales',
            subtitle: 'This Month',
            amount: '₹18,67,500',
            percentageChange: 8.3,
            isIncrease: true,
            color: '#10b981', // Green
        },
    ];

    const onScroll = (event: any) => {
        const slideSize = width - 40; // Account for padding
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentIndex(index);
    };

    return (
        <View className="py-4">
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: 20 }}
            >
                {metricsData.map((metric, index) => (
                    <MetricCard
                        key={index}
                        {...metric}
                        style={{ width: width - 40, marginRight: 10 }}
                    />
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View className="flex-row justify-center mt-3 space-x-2">
                {metricsData.map((_, index) => (
                    <View
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                            index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                    />
                ))}
            </View>
        </View>
    );
}