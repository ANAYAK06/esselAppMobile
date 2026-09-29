// app/(dashboard)/employee-dashboard.tsx
// Employee self-service dashboard — mobile version of the Corex web portal's DashboardHome
// (RAPP-SLAPP frontend: src/pages/EmployeePortal/pages/DashboardHome.jsx).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowRight, Bell, CalendarCheck, ChevronRight, ClipboardCheck, Clock, CreditCard, LayoutGrid, ListChecks, Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    fetchIsPortalReportingPerson,
    fetchMyAttendance,
    fetchMyLeaveBalances,
    fetchMyPayslipList,
    fetchMyPortalRequests,
    fetchPortalPendingApprovals,
} from '@/src/slice/hr/employeePortalSlice';
import EmployeeHeader from '@/src/components/employee/EmployeeHeader';
import EmployeeSidebar from '@/src/components/employee/EmployeeSidebar';
import { Badge, PrimaryButton, SectionCard, StatCard } from '@/src/components/employee/PortalUI';
import { formatRupees, requestTitle } from '@/src/components/employee/portalFormat';
import { brand } from '@/src/theme/colors';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const leaveBarColors = ['bg-blue-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500', 'bg-purple-500', 'bg-cyan-500'];

const quickActions: { href: Href; label: string; icon: LucideIcon }[] = [
    { href: '/employee/request-leave', label: 'Request Leave', icon: CalendarCheck },
    { href: '/employee/request-advance', label: 'Request Advance', icon: Wallet },
    { href: '/employee/my-requests', label: 'My Requests', icon: ListChecks },
    { href: '/employee/loan-advance-status', label: 'Loan / Advance', icon: CreditCard },
];


export default function EmployeeDashboard() {
    const dispatch = useAppDispatch();
    const employeeData = useAppSelector((state) => state.auth.employeeData);
    const {
        leaveBalances, payslipList, attendance, myPortalRequests,
        isPortalReportingPerson, portalPendingApprovals, loading,
    } = useAppSelector((state) => state.employeePortal);

    const [refreshing, setRefreshing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const d = employeeData || {};
    const empRefNo: string | undefined = d.EmpRefno;
    const firstName = d.Firstname?.trim();
    const designation = d.Appointed || d.UserRole;
    const initials = [d.Firstname, d.Lastname].filter(Boolean).map((n: string) => n.trim()[0]).join('');

    const today = useMemo(() => new Date(), []);
    const monthName = MONTHS[today.getMonth()];
    const year = today.getFullYear();

    const loadDashboard = useCallback(() => {
        if (!empRefNo) return Promise.resolve();
        return Promise.all([
            dispatch(fetchIsPortalReportingPerson(empRefNo)),
            dispatch(fetchPortalPendingApprovals(empRefNo)),
            dispatch(fetchMyLeaveBalances(empRefNo)),
            dispatch(fetchMyPayslipList(empRefNo)),
            dispatch(fetchMyAttendance({ empRefNo, month: monthName, year })),
            dispatch(fetchMyPortalRequests(empRefNo)),
        ]);
    }, [dispatch, empRefNo, monthName, year]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    }, [loadDashboard]);

    const pendingCount = isPortalReportingPerson ? portalPendingApprovals.length : 0;

    const totalBalance = leaveBalances.reduce((s, l) => s + Number(l.BalanceLeaves || 0), 0);
    const totalAssigned = leaveBalances.reduce((s, l) => s + Number(l.AssignedLeaves || 0), 0);
    const totalUsed = Math.max(0, totalAssigned - totalBalance);

    // Day columns are keyed like "01#Mon"; count the days marked present
    const attendancePresent = attendance
        ? Object.keys(attendance).filter((key) => key.includes('#') && attendance[key] === 'P').length
        : 0;

    const lastPayslip = payslipList[0];
    const openRequests = myPortalRequests.filter((r) => r.Status === 'Pending').length;

    const onBellPress = () =>
        pendingCount > 0
            ? router.push('/employee/pending-approvals')
            : Alert.alert('Notifications', "You're all caught up.");

    return (
        <SafeAreaView className="flex-1 bg-brand-navy" edges={['top']}>
            <StatusBar style="light" />
            <EmployeeHeader
                initials={initials}
                pendingCount={pendingCount}
                onBellPress={onBellPress}
                onMenuPress={() => setSidebarOpen(true)}
                onAvatarPress={() => router.push('/employee/profile')}
            />

            <ScrollView
                className="flex-1 bg-gray-50"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.orange} colors={[brand.orange]} />
                }
            >
                {/* Welcome */}
                <View className="flex-row items-center gap-3 mb-5">
                    <View className="w-10 h-10 rounded-xl bg-brand-navy items-center justify-center">
                        <Bell size={20} color={brand.orangeLight} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-brand-navy" numberOfLines={1}>
                            Welcome back{firstName ? `, ${firstName}` : ''}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                            {designation || 'Here is what is happening with your account today.'}
                        </Text>
                    </View>
                </View>

                {/* Stat cards */}
                <View className="gap-3 mb-5">
                    <View className="flex-row gap-3">
                        <StatCard
                            label="Leave Balance"
                            value={loading.leaveBalances ? '…' : `${totalBalance} days`}
                            sub={loading.leaveBalances ? undefined : `${totalUsed} of ${totalAssigned} used`}
                            icon={CalendarCheck}
                            tone="navy"
                            onPress={() => router.push('/employee/leave-balance')}
                        />
                        <StatCard
                            label="Attendance"
                            value={loading.attendance ? '…' : `${attendancePresent}/${attendance?.TotalMonthDays ?? '—'}`}
                            sub={`${monthName} ${year}`}
                            icon={Clock}
                            tone="orange"
                            onPress={() => router.push('/employee/attendance')}
                        />
                    </View>
                    <View className="flex-row gap-3">
                        <StatCard
                            label="Last Payslip"
                            value={loading.payslipList ? '…' : lastPayslip ? formatRupees(lastPayslip.NetValue) : '—'}
                            sub={lastPayslip ? `${lastPayslip.MonthName} ${lastPayslip.Year}` : 'No payslip yet'}
                            icon={Wallet}
                            tone="white"
                        />
                        <StatCard
                            label="Open Requests"
                            value={loading.myPortalRequests ? '…' : openRequests}
                            sub="Awaiting verification"
                            icon={ListChecks}
                            tone="white"
                            onPress={() => router.push('/employee/my-requests')}
                        />
                    </View>
                </View>

                {/* Quick actions */}
                <SectionCard title="Quick Actions">
                    <View className="flex-row flex-wrap justify-between gap-y-2.5">
                        {quickActions.map(({ href, label, icon: Icon }) => (
                            <TouchableOpacity
                                key={label}
                                onPress={() => router.push(href)}
                                activeOpacity={0.7}
                                className="w-[48.5%] items-center justify-center gap-2 py-4 px-2 rounded-xl border border-gray-200"
                            >
                                <View className="w-9 h-9 rounded-lg bg-brand-navy items-center justify-center">
                                    <Icon size={18} color={brand.orangeLight} />
                                </View>
                                <Text className="text-xs font-semibold text-gray-700 text-center">{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        onPress={() => setSidebarOpen(true)}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-center gap-1.5 mt-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200"
                    >
                        <LayoutGrid size={15} color={brand.orange} />
                        <Text className="text-xs font-semibold text-orange-600">All Services</Text>
                        <ChevronRight size={14} color={brand.orange} />
                    </TouchableOpacity>
                </SectionCard>

                {/* Recent requests */}
                <SectionCard
                    title="Recent Requests"
                    action={
                        <TouchableOpacity onPress={() => router.push('/employee/my-requests')} className="flex-row items-center gap-1">
                            <Text className="text-xs font-semibold text-orange-500">View all</Text>
                            <ArrowRight size={12} color={brand.orange} />
                        </TouchableOpacity>
                    }
                >
                    {loading.myPortalRequests ? (
                        <Text className="text-sm text-gray-400 py-4 text-center">Loading…</Text>
                    ) : myPortalRequests.length === 0 ? (
                        <Text className="text-sm text-gray-400 py-4 text-center">You haven&apos;t raised any requests yet.</Text>
                    ) : (
                        myPortalRequests.slice(0, 4).map((r, index) => (
                            <View
                                key={`${r.RequestType}-${r.Id}`}
                                className={`flex-row items-center justify-between gap-3 py-2.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                            >
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{requestTitle(r)}</Text>
                                    <Text className="text-xs text-gray-400 mt-0.5">{r.RequestType} · {r.SubmittedOn}</Text>
                                </View>
                                <Badge label={r.Status} />
                            </View>
                        ))
                    )}
                </SectionCard>

                {/* Reporting person callout, otherwise the leave snapshot */}
                {isPortalReportingPerson ? (
                    <SectionCard title="Team Approvals" icon={ClipboardCheck}>
                        <Text className="text-sm text-gray-600 mb-3">
                            {pendingCount} request{pendingCount !== 1 ? 's' : ''} from your team awaiting your verification.
                        </Text>
                        <PrimaryButton label="Review Now" onPress={() => router.push('/employee/pending-approvals')} />
                    </SectionCard>
                ) : (
                    <SectionCard title="Leave Snapshot">
                        {loading.leaveBalances ? (
                            <Text className="text-sm text-gray-400 py-4 text-center">Loading…</Text>
                        ) : leaveBalances.length === 0 ? (
                            <Text className="text-sm text-gray-400 py-4 text-center">No leave balance found.</Text>
                        ) : (
                            <View className="gap-3">
                                {leaveBalances.map((l, index) => {
                                    const assigned = Number(l.AssignedLeaves || 0);
                                    const balance = Math.max(0, Number(l.BalanceLeaves || 0));
                                    const used = Math.max(0, assigned - balance);
                                    const percent = assigned ? Math.min(100, (used / assigned) * 100) : 0;
                                    return (
                                        <View key={String(l.LeaveTypeId)}>
                                            <View className="flex-row justify-between mb-1">
                                                <Text className="text-xs font-medium text-gray-600">{l.LeaveName}</Text>
                                                <Text className="text-xs text-gray-400">{used}/{assigned}</Text>
                                            </View>
                                            <View className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <View
                                                    className={`h-full rounded-full ${leaveBarColors[index % leaveBarColors.length]}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </SectionCard>
                )}

                {/* Powered by */}
                <View className="items-center mt-2">
                    <Text className="text-[10px] text-gray-400 mb-1">Powered by</Text>
                    <Image
                        source={require('@/assets/images/corex-wordmark.png')}
                        style={{ width: 110, height: 44 }}
                        resizeMode="contain"
                    />
                </View>
            </ScrollView>

            <EmployeeSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </SafeAreaView>
    );
}
