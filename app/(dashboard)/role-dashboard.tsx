// app/(dashboard)/role-dashboard.tsx
// Role (department) dashboard — mobile version of the Corex web RoleBasedApplication dashboard.
// The role's department (GetUserRoleDashboardType) picks the layout: Top Level, HR, Accounts,
// Finance, Store & Purchase, Project, Administration, or Base when none is assigned.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    fetchUserInboxNotifications,
    setNotificationFilters,
} from '@/src/slice/notifications/inboxNotificationsSlice';
import { fetchRejectionAlerts, selectUnreadRejectionCount } from '@/src/slice/notifications/rejectionAlertsSlice';
import { useAppBadge } from '@/src/hooks/useAppBadge';
import { useApiData } from '@/src/hooks/useApiData';
import { getUserRoleDashboardType, type DepartmentCode } from '@/src/api/dashboard/roleDashboardAPI';
import RoleHeader from '@/src/components/roleDashboard/RoleHeader';
import DetailSheet from '@/src/components/common/DetailSheet';
import { RoleDashboardProvider, type SheetContent } from '@/src/components/roleDashboard/RoleDashboardContext';
import { DASHBOARDS } from '@/src/components/roleDashboard/DepartmentDashboards';
import { InboxCard, WelcomeCard } from '@/src/components/roleDashboard/SharedCards';
import { Spinner } from '@/src/components/roleDashboard/DashboardUI';
import RejectionAlertsBody from '@/src/components/roleDashboard/RejectionAlerts';
import { brand } from '@/src/theme/colors';

export default function RoleDashboard() {
    const dispatch = useAppDispatch();
    const userData = useAppSelector((state) => state.auth.userData);
    const roleId = useAppSelector((state) => state.auth.roleId);
    const unreadRejections = useAppSelector(selectUnreadRejectionCount);

    useAppBadge();

    const userId = userData?.uid || userData?.employeeId || '';
    const ccCodes = Array.isArray(userData?.ccCodes) ? userData.ccCodes.join(',') : String(userData?.ccCodes || '');
    const groupId = Number(userData?.groupId) || 0;

    const [refreshKey, setRefreshKey] = useState(0);
    const [sheet, setSheet] = useState<SheetContent | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Inbox notifications feed the inbox card and the app icon badge; rejection alerts feed the bell
    const loadNotifications = useCallback(() => {
        if (!userId || !roleId) return;
        dispatch(setNotificationFilters({ userId, roleId }));
        dispatch(fetchUserInboxNotifications({ userId, roleId }));
        dispatch(fetchRejectionAlerts(userId));
    }, [dispatch, userId, roleId]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const loadDepartment = useCallback(() => getUserRoleDashboardType(roleId!), [roleId]);
    const department = useApiData(roleId ? loadDepartment : null);

    // A new scope object on every refresh makes each card reload its data
    const scope = useMemo(() => ({ roleId: roleId || '', userId, refresh: refreshKey }), [roleId, userId, refreshKey]);

    const openSheet = useCallback((content: SheetContent) => {
        setSheet(content);
        setSheetOpen(true);
    }, []);

    const context = useMemo(() => ({ scope, ccCodes, groupId, openSheet }), [scope, ccCodes, groupId, openSheet]);

    const onRefresh = () => {
        setRefreshKey((k) => k + 1);
        loadNotifications();
    };

    // Unknown code or no department assigned → Base, same as the web
    const assignedCode = department.data?.DepartmentCode;
    const code: DepartmentCode = assignedCode && DASHBOARDS[assignedCode] ? assignedCode : 'BASE';
    const Dashboard = DASHBOARDS[code].component;

    return (
        <SafeAreaView className="flex-1 bg-brand-navy" edges={['top']}>
            <StatusBar style="light" />
            <RoleHeader
                roleCode={userData?.roleCode}
                rejectionCount={unreadRejections}
                onBellPress={() => openSheet({
                    title: 'Rejection Alerts',
                    subtitle: unreadRejections > 0 ? `${unreadRejections} unread` : 'Entries rejected back to you',
                    tone: 'red',
                    body: <RejectionAlertsBody userId={String(userId)} />,
                })}
            />

            <RoleDashboardProvider value={context}>
                <ScrollView
                    className="flex-1 bg-gray-50"
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={brand.orange} colors={[brand.orange]} />
                    }
                >
                    <WelcomeCard
                        name={userData?.firstName?.trim()}
                        roleCode={userData?.roleCode}
                        department={department.loading ? undefined : DASHBOARDS[code].name}
                    />

                    <InboxCard />

                    {department.loading ? (
                        <View className="py-10"><Spinner /></View>
                    ) : (
                        <Dashboard key={code} />
                    )}

                    <View className="items-center mt-2">
                        <Text className="text-[10px] text-gray-400 mb-1">Powered by</Text>
                        <Image
                            source={require('@/assets/images/corex-wordmark.png')}
                            style={{ width: 110, height: 44 }}
                            resizeMode="contain"
                        />
                    </View>
                </ScrollView>

                <DetailSheet visible={sheetOpen} sheet={sheet} onClose={() => setSheetOpen(false)} />
            </RoleDashboardProvider>
        </SafeAreaView>
    );
}
