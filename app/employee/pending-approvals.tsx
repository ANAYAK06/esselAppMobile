// app/employee/pending-approvals.tsx
// Mirrors the Corex web portal's PendingApprovals page (pages/EmployeePortal/pages/PendingApprovals.jsx):
// the reporting person accepts or rejects leave / advance requests from their team.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { CalendarCheck, Check, ClipboardCheck, Wallet, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchPortalPendingApprovals } from '@/src/slice/hr/employeePortalSlice';
import { actionPortalRequest } from '@/src/api/hr/employeePortalAPI';
import type { PortalPendingApproval } from '@/src/api/hr/employeePortalAPI';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText, PrimaryButton, SecondaryButton, SectionCard } from '@/src/components/employee/PortalUI';
import { TextField } from '@/src/components/employee/FormControls';
import { cleanError, errorText, requestSummary } from '@/src/components/employee/portalFormat';
import { brand } from '@/src/theme/colors';

const kindWord = (r: PortalPendingApproval) => (r.RequestType === 'Advance' ? 'advance' : 'leave');
const keyOf = (r: PortalPendingApproval) => `${r.RequestType}-${r.Id}`;

export default function PendingApprovals() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { portalPendingApprovals: items, loading } = useAppSelector((s) => s.employeePortal);

    const [rejectingKey, setRejectingKey] = useState<string | null>(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [busyKey, setBusyKey] = useState<string | null>(null);

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchPortalPendingApprovals(empRefNo)) : Promise.resolve()),
        [dispatch, empRefNo]
    );

    useEffect(() => {
        load();
    }, [load]);

    const runAction = async (item: PortalPendingApproval, action: 'Approve' | 'Reject', remarks?: string) => {
        setBusyKey(keyOf(item));
        try {
            const result = await actionPortalRequest({
                Id: item.Id,
                RequestType: item.RequestType,
                Action: action,
                ActionBy: empRefNo,
                RejectRemarks: remarks || null,
            });
            const status = typeof result?.Data === 'string' ? result.Data : '';
            if (!status.startsWith('Approved') && !status.startsWith('Rejected')) {
                throw new Error(cleanError(status, 'Failed to submit decision'));
            }
            const who = item.EmployeeName?.trim() || 'Request';
            Alert.alert(
                action === 'Approve' ? 'Accepted' : 'Rejected',
                action === 'Approve'
                    ? `${who} — ${kindWord(item)} accepted and sent to the approval workflow.`
                    : `${who} — ${kindWord(item)} rejected.`
            );
            setRejectingKey(null);
            setRejectRemarks('');
            load();
        } catch (error) {
            Alert.alert('Could not submit', errorText(error, 'Failed to submit decision'));
        } finally {
            setBusyKey(null);
        }
    };

    const confirmAccept = (item: PortalPendingApproval) =>
        Alert.alert(
            `Accept ${kindWord(item)} request?`,
            `${item.EmployeeName?.trim() || 'This request'} — ${requestSummary(item)}`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Accept', onPress: () => runAction(item, 'Approve') },
            ]
        );

    return (
        <PortalScreen
            title="Pending Approvals"
            subtitle="Verify leave and advance requests from your team"
            icon={ClipboardCheck}
            onRefresh={load}
        >
            <SectionCard title={`Awaiting Your Verification (${items.length})`} icon={ClipboardCheck}>
                {loading.portalPendingApprovals && items.length === 0 ? (
                    <LoadingText />
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={ClipboardCheck}
                        title="All caught up"
                        subtitle="No requests are waiting on your verification right now."
                    />
                ) : (
                    items.map((r, index) => {
                        const Icon = r.RequestType === 'Advance' ? Wallet : r.RequestType === 'Leave' ? CalendarCheck : ClipboardCheck;
                        const key = keyOf(r);
                        const isRejecting = rejectingKey === key;
                        const isBusy = busyKey === key;
                        return (
                            <View key={key} className={`py-3.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                                <View className="flex-row gap-3">
                                    <View className="w-9 h-9 rounded-lg bg-brand-navy/10 items-center justify-center">
                                        <Icon size={18} color={brand.navy} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-800">{r.EmployeeName?.trim()}</Text>
                                        <Text className="text-sm text-gray-600">{requestSummary(r)}</Text>
                                        {r.Reason ? (
                                            <Text className="text-xs text-gray-500 mt-0.5">
                                                {r.RequestType === 'Advance' ? 'Purpose' : 'Reason'}: {r.Reason}
                                            </Text>
                                        ) : null}
                                        {r.RequestType === 'Advance' && r.EMIStartDate ? (
                                            <Text className="text-xs text-gray-400 mt-0.5">EMI starts {r.EMIStartDate}</Text>
                                        ) : null}
                                        <Text className="text-xs text-gray-400 mt-0.5">
                                            {r.RequestType} · {r.EmpRefNo}
                                            {r.ContactNumber ? ` · ${r.ContactNumber}` : ''} · submitted {r.SubmittedOn}
                                        </Text>
                                    </View>
                                </View>

                                {!isRejecting && (
                                    <View className="flex-row justify-end gap-2 mt-3">
                                        <SecondaryButton
                                            label="Reject"
                                            icon={X}
                                            compact
                                            danger
                                            disabled={isBusy}
                                            onPress={() => {
                                                setRejectingKey(key);
                                                setRejectRemarks('');
                                            }}
                                        />
                                        <PrimaryButton
                                            label={isBusy ? 'Working…' : 'Accept'}
                                            icon={Check}
                                            compact
                                            loading={isBusy}
                                            onPress={() => confirmAccept(r)}
                                        />
                                    </View>
                                )}

                                {isRejecting && (
                                    <View className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                                        <Text className="text-xs font-semibold text-gray-600 mb-1.5">
                                            Reason for rejection <Text className="text-rose-500">*</Text>
                                        </Text>
                                        <TextField
                                            value={rejectRemarks}
                                            onChangeText={setRejectRemarks}
                                            placeholder="Let the employee know why this request is being rejected"
                                            multiline
                                            autoFocus
                                        />
                                        <View className="flex-row justify-end gap-2 mt-2">
                                            <SecondaryButton
                                                label="Cancel"
                                                compact
                                                disabled={isBusy}
                                                onPress={() => {
                                                    setRejectingKey(null);
                                                    setRejectRemarks('');
                                                }}
                                            />
                                            <SecondaryButton
                                                label={isBusy ? 'Working…' : 'Confirm Reject'}
                                                compact
                                                danger
                                                disabled={isBusy || !rejectRemarks.trim()}
                                                onPress={() => runAction(r, 'Reject', rejectRemarks.trim())}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </SectionCard>
        </PortalScreen>
    );
}
