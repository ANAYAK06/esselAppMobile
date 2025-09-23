// app/(dashboard)/role.tsx - Improved Role Dashboard
import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {useEffect} from "react";
import type { AppDispatch, RootState } from '@/src/store/store';

import {
    fetchUserInboxNotifications,
    setNotificationFilters
} from '@/src/slice/notifications/inboxNotificationsSlice';
import {useAppBadge} from "@/src/hooks/useAppBadge";

// Import dashboard components
import DashboardHeader from '../../src/components/dashboard/Header/DashboardHeader';
import MetricsCarousel from '../../src/components/dashboard/Cards/MetricsCarousel';
import QuickAccessGrid from '../../src/components/dashboard/QuickAcces/QuickAccessGrid'; // Fixed typo
import TabNavigation from '../../src/components/dashboard/Footer/TabNavigation';

export default function RoleDashboard() {
    const [refreshing, setRefreshing] = useState(false);

    const dispatch = useDispatch<AppDispatch>()
    const userData = useSelector((state: any) => state.auth.userData);
    const roleId = useSelector((state: any) => state.auth.roleId);

    useAppBadge()


    useEffect(() => {
        loadNotificationsForBadge();
    }, [userData, roleId]);

    const loadNotificationsForBadge = async () => {
        if (!userData || !roleId) {
            console.log('No user data or roleId available for notifications');
            return;
        }

        try {
            console.log('Loading notifications for badge:', {
                userId: userData.uid || userData.employeeId,
                roleId: roleId
            });

            // Set filters
            dispatch(setNotificationFilters({
                userId: userData.uid || userData.employeeId,
                roleId: roleId
            }));

            // Fetch notifications in background
            const result = await dispatch(fetchUserInboxNotifications({
                userId: userData.uid || userData.employeeId,
                roleId: roleId
            }));

            console.log('✅ Notifications loaded for badge');
        } catch (error) {
            console.warn('⚠️ Failed to load notifications for badge:', error);
            // Don't show alert on dashboard - just log the error
        }
    };




    // Handle pull-to-refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Refresh both dashboard data and notifications
            await Promise.all([
                new Promise(resolve => setTimeout(resolve, 1000)), // Your dashboard refresh logic
                loadNotificationsForBadge() // Refresh notifications too
            ]);
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        } finally {
            setRefreshing(false);
        }
    }, [userData, roleId]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.wrapper}>
                    {/* Header Section */}
                    <DashboardHeader />

                    {/* Main Content */}
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#3b82f6"
                                colors={['#3b82f6']}
                            />
                        }
                        bounces={true}
                        alwaysBounceVertical={false}
                    >
                        {/* Metrics Cards */}
                        <View style={styles.section}>
                            <MetricsCarousel />
                        </View>

                        {/* Quick Access Icons */}
                        <View style={styles.section}>
                            <QuickAccessGrid />
                        </View>

                        {/* Future sections can be added here */}
                        <View style={styles.bottomSpacing} />
                    </ScrollView>

                    {/* Footer Navigation */}
                    <TabNavigation />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardView: {
        flex: 1,
    },
    wrapper: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100, // Space for footer
    },
    section: {
        marginBottom: 8, // Small spacing between sections
    },
    bottomSpacing: {
        height: 20, // Extra bottom spacing
    },
});