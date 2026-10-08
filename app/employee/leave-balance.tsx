// app/employee/leave-balance.tsx
// Mirrors the Corex web portal's LeaveBalance page (pages/EmployeePortal/pages/LeaveBalance.jsx)
import React, { useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyLeaveBalances } from '@/src/slice/hr/employeePortalSlice';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText, PrimaryButton, ProgressBar, SectionCard } from '@/src/components/employee/PortalUI';

const barColors = ['bg-blue-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500', 'bg-purple-500', 'bg-cyan-500'];

export default function LeaveBalance() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { leaveBalances, loading } = useAppSelector((s) => s.employeePortal);

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchMyLeaveBalances(empRefNo)) : Promise.resolve()),
        [dispatch, empRefNo]
    );

    useEffect(() => {
        load();
    }, [load]);

    return (
        <PortalScreen title="Leave Balance" subtitle="Your entitlement and usage by leave type" icon={CalendarCheck} onRefresh={load}>
            {loading.leaveBalances && leaveBalances.length === 0 ? (
                <LoadingText />
            ) : leaveBalances.length === 0 ? (
                <SectionCard>
                    <EmptyState
                        icon={CalendarCheck}
                        title="No leave balance found"
                        subtitle="Your leave entitlements will appear here once assigned."
                    />
                </SectionCard>
            ) : (
                leaveBalances.map((l, index) => {
                    const assigned = Number(l.AssignedLeaves || 0);
                    const balance = Math.max(0, Number(l.BalanceLeaves || 0));
                    const used = Math.max(0, assigned - balance);
                    return (
                        <SectionCard key={String(l.LeaveTypeId)}>
                            <View className="flex-row items-start justify-between mb-3">
                                <Text className="text-sm font-semibold text-gray-800 flex-1">{l.LeaveName}</Text>
                                <View className="items-end">
                                    <Text className="text-xl font-bold text-brand-navy">{balance}</Text>
                                    <Text className="text-xs text-gray-400">days left</Text>
                                </View>
                            </View>
                            <ProgressBar
                                percent={assigned ? (used / assigned) * 100 : 0}
                                colorClass={barColors[index % barColors.length]}
                            />
                            <View className="flex-row justify-between mt-1.5">
                                <Text className="text-xs text-gray-400">{used} used</Text>
                                <Text className="text-xs text-gray-400">{assigned} entitled</Text>
                            </View>
                        </SectionCard>
                    );
                })
            )}

            <PrimaryButton label="Request Leave" icon={CalendarCheck} onPress={() => router.push('/employee/request-leave')} />
        </PortalScreen>
    );
}
