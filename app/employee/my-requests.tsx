// app/employee/my-requests.tsx
// Mirrors the Corex web portal's MyRequests page (pages/EmployeePortal/pages/MyRequests.jsx)
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ListChecks } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyPortalRequests } from '@/src/slice/hr/employeePortalSlice';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { Badge, ChipTabs, EmptyState, LoadingText, SectionCard } from '@/src/components/employee/PortalUI';
import { requestSubtitle, requestTitle } from '@/src/components/employee/portalFormat';

const tabs = ['All', 'Pending', 'Approved', 'Rejected'] as const;

export default function MyRequests() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { myPortalRequests, loading } = useAppSelector((s) => s.employeePortal);
    const [tab, setTab] = useState<(typeof tabs)[number]>('All');

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchMyPortalRequests(empRefNo)) : Promise.resolve()),
        [dispatch, empRefNo]
    );

    useEffect(() => {
        load();
    }, [load]);

    const filtered = tab === 'All' ? myPortalRequests : myPortalRequests.filter((r) => r.Status === tab);

    return (
        <PortalScreen
            title="My Requests"
            subtitle="Track everything you have submitted from the portal"
            icon={ListChecks}
            onRefresh={load}
        >
            <SectionCard title="Request History" icon={ListChecks}>
                <ChipTabs options={tabs} value={tab} onChange={setTab} />

                {loading.myPortalRequests && myPortalRequests.length === 0 ? (
                    <LoadingText />
                ) : filtered.length === 0 ? (
                    <EmptyState icon={ListChecks} title="No requests found" subtitle="Nothing matches this filter yet." />
                ) : (
                    filtered.map((r, index) => (
                        <View
                            key={`${r.RequestType}-${r.Id}`}
                            className={`flex-row items-start justify-between gap-3 py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                        >
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-800">{requestTitle(r)}</Text>
                                <Text className="text-xs text-gray-400 mt-0.5">
                                    {requestSubtitle(r)} · submitted {r.SubmittedOn}
                                    {r.Status === 'Approved' && r.TransactionRefNo ? ` · Ref ${r.TransactionRefNo}` : ''}
                                </Text>
                                {r.Reason ? (
                                    <Text className="text-xs text-gray-500 mt-0.5">
                                        {r.RequestType === 'Advance' ? 'Purpose' : 'Reason'}: {r.Reason}
                                    </Text>
                                ) : null}
                                {r.Status === 'Rejected' && r.RejectRemarks ? (
                                    <Text className="text-xs text-rose-500 mt-0.5">Rejected: {r.RejectRemarks}</Text>
                                ) : null}
                            </View>
                            <Badge label={r.Status} />
                        </View>
                    ))
                )}
            </SectionCard>
        </PortalScreen>
    );
}
