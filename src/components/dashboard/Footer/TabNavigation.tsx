// TabNavigation.tsx - Working version
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home, Settings, Inbox } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'expo-router';
import { selectTotalPendingCount } from '@/src/slice/notifications/inboxNotificationsSlice';

export default function TabNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const totalPendingCountRaw = useSelector(selectTotalPendingCount);
    const userData = useSelector((state: any) => state.auth.userData);
    const roleId = useSelector((state: any) => state.auth.roleId);

    console.log('TabNavigation Debug:', {
        totalPendingCountRaw,
        hasUserData: !!userData,
        hasRoleId: !!roleId,
        pathname
    });

    // Ensure we always have a valid number
    const totalPendingCount = typeof totalPendingCountRaw === 'number' ? totalPendingCountRaw : 0;

    const tabs = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            route: '/(dashboard)/role',
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            route: '/settings',
        },
        {
            id: 'inbox',
            label: 'Inbox',
            icon: Inbox,
            route: '/inbox',
            badge: totalPendingCount,
        },
    ];

    const getActiveTab = () => {
        if (pathname.includes('dashboard') || pathname === '/') return 'dashboard';
        if (pathname.includes('inbox')) return 'inbox';
        if (pathname.includes('settings')) return 'settings';
        return 'dashboard';
    };

    const handleTabPress = (tab: any) => {
        router.push(tab.route);
    };

    const activeTab = getActiveTab();

    return (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
            <View className="flex-row">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const badgeCount = tab.badge || 0;

                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => handleTabPress(tab)}
                            className="flex-1 items-center py-3 relative"
                        >
                            <View className="relative">
                                <tab.icon
                                    size={24}
                                    color={isActive ? '#3b82f6' : '#6b7280'}
                                />
                                {badgeCount > 0 && (
                                    <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                                        <Text className="text-white text-xs font-bold">
                                            {badgeCount > 99 ? '99+' : badgeCount.toString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text
                                className={`text-xs mt-1 ${
                                    isActive ? 'text-blue-500 font-medium' : 'text-gray-500'
                                }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}