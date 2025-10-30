// src/components/inbox/InboxScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
    View,
    Text,
    TouchableOpacity,

} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

// Import notification actions and selectors
import {
    fetchUserInboxNotifications,
    selectNotificationsSummary,
    selectNotificationsLoading,
    selectNotificationsError,
    selectTotalPendingCount,
    setNotificationFilters,
    NotificationsSummaryItem,
} from '@/src/slice/notifications/inboxNotificationsSlice';

// Import custom components
// Remove this line:
// import InboxHeader from './Header/InboxHeader';

// Add this line instead:
import AppHeader from '../common/AppHeader';

import NotificationSummaryCard from './Card/NotificationSummaryCard';
import NotificationCard from './Card/NotificationCard';

// Import types
import type { AppDispatch } from '@/src/store/store';

interface InboxScreenProps {
    navigation?: any;
}

const InboxScreen: React.FC<InboxScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch<AppDispatch>();

    const router = useRouter();

    // Redux selectors
    const notificationsSummary = useSelector(selectNotificationsSummary);
    const isLoading = useSelector(selectNotificationsLoading);
    const error = useSelector(selectNotificationsError);
    const totalPendingCount = useSelector(selectTotalPendingCount);

    // Get user data from auth slice
    const userData = useSelector((state: any) => state.auth.userData);
    const roleId = useSelector((state: any) => state.auth.roleId);

    // Local state
    const [refreshing, setRefreshing] = useState(false);

    // Load notifications on mount
    useEffect(() => {
        loadNotifications();
    }, [userData, roleId]);

    const loadNotifications = async () => {
        if (!userData || !roleId) {
            console.warn('User data or roleId not available');
            return;
        }

        try {
            console.log('Loading notifications for:', {
                userId: userData.uid || userData.employeeId,
                roleId
            });

            // Set filters
            dispatch(setNotificationFilters({
                userId: userData.uid || userData.employeeId,
                roleId: roleId
            }));

            // Fetch notifications
            await dispatch(fetchUserInboxNotifications({
                userId: userData.uid || userData.employeeId,
                roleId: roleId
            })).unwrap();

            console.log('Notifications loaded successfully');
        } catch (error: any) {
            console.error('Failed to load notifications:', error);
            Alert.alert(
                'Error',
                error || 'Failed to load notifications. Please try again.',
                [
                    { text: 'Retry', onPress: () => loadNotifications() },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadNotifications();
        } finally {
            setRefreshing(false);
        }
    };

    // Add this function to your InboxScreen.tsx

    const handleNotificationPress = (item: NotificationsSummaryItem) => {
        console.log('📱 Notification pressed:', item.ModuleDisplayName);

        const moduleName = item.ModuleDisplayName?.toLowerCase() || '';

        // Budget amendments
        if (moduleName.includes('budget') || moduleName.includes('cc amend')) {
            router.push('/(inbox)/verification/cc-budget/list');
        }
        // Purchase Orders

        // Supplier Invoice

        // Cost Center

        // Generic fallback
        else {
            Alert.alert(
                'Coming Soon',
                `${item.ModuleDisplayName} verification will be available soon.`
            );
        }
    };
    const renderEmptyState = () => (
        <View className="flex-1 items-center justify-center px-8 mt-20">
            <CheckCircle size={64} color="#22c55e" />
            <Text className="text-gray-900 text-xl font-semibold mt-4 text-center">
                All Caught Up!
            </Text>
            <Text className="text-gray-500 text-base mt-2 text-center">
                You have no pending notifications at the moment.
            </Text>
            <TouchableOpacity
                onPress={loadNotifications}
                className="bg-blue-500 px-6 py-3 rounded-lg mt-6"
            >
                <View className="flex-row items-center">
                    <RefreshCw size={16} color="#fff" />
                    <Text className="text-white font-medium ml-2">Refresh</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 mt-4">Loading notifications...</Text>
        </View>
    );

    const renderNotUserLoggedInState = () => (
        <View className="flex-1 items-center justify-center px-8">
            <AlertCircle size={64} color="#ef4444" />
            <Text className="text-gray-900 text-xl font-semibold mt-4 text-center">
                Authentication Required
            </Text>
            <Text className="text-gray-500 text-base mt-2 text-center">
                Please login to view your notifications.
            </Text>
        </View>
    );

    // Show loading state for initial load
    if (isLoading && notificationsSummary.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <AppHeader
                    title="Inbox"
                    showBackButton={true}
                    showRefreshButton={true}
                    isLoading={isLoading}
                    onRefresh={loadNotifications}
                />
                {renderLoadingState()}
            </SafeAreaView>
        );
    }

    // Show auth required state
    if (!userData || !roleId) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <AppHeader
                    title="Inbox"
                    showBackButton={true}
                    showRefreshButton={false}
                />
                {renderNotUserLoggedInState()}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Replace InboxHeader with AppHeader */}
            <AppHeader
                title="Inbox"
                showBackButton={true}
                showRefreshButton={true}
                isLoading={isLoading}
                onRefresh={loadNotifications}
            />

            {/* Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
            >
                {/* Summary Header Card */}
                <NotificationSummaryCard totalPendingCount={totalPendingCount} />

                {/* Notifications List */}
                {notificationsSummary.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View className="pb-20">
                        {notificationsSummary.map((item: NotificationsSummaryItem, index: number) => (
                            <NotificationCard
                                key={`${item.MasterId}-${index}`}
                                item={item}
                                onPress={() => handleNotificationPress(item)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Error State */}
            {error && (
                <View className="absolute bottom-20 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <View className="flex-row items-center">
                        <AlertCircle size={20} color="#ef4444" />
                        <Text className="text-red-800 ml-2 flex-1">{error}</Text>
                        <TouchableOpacity onPress={loadNotifications}>
                            <Text className="text-red-600 font-medium">Retry</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default InboxScreen;