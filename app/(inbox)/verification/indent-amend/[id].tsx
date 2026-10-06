// Indent Amend verification — amended lines, plus / minus / difference, then verify / approve
// (web: pages/Purchase/VerifyIndentAmend.jsx). "Return" is never offered here (legacy drops it).
// When the amendment is flagged CloseStatus = Yes, the action also closes the indent — the user
// must confirm, and declining cancels (use Reject instead).
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { FilePen } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveIndentAmend,
    getIndentAmendDetail,
    type IndentAmendRow,
} from '@/src/api/verification/indentVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, Notice, RemarksTimeline, Section, money,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { showDone } from '@/src/components/verification/kit/verificationEvents';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
const qty = (v: unknown) => num(v).toFixed(2);

const DONE: Record<string, string> = { Verify: 'verified', Approve: 'approved', Reject: 'rejected', Return: 'returned' };

const confirmClose = (indentNo: string) =>
    new Promise<boolean>((resolve) =>
        Alert.alert('Do you want to close the indent?', `This will close Indent No: ${indentNo}. Continue?`, [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Close indent', style: 'destructive', onPress: () => resolve(true) },
        ]),
    );

export default function IndentAmendDetail() {
    const row = useRowParam<IndentAmendRow>();
    const { roleId, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getIndentAmendDetail(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const items = d?.AmendItemsList ?? [];

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        if (d.CloseStatus === 'Yes' && !(await confirmClose(row.IndentNo))) {
            Alert.alert('Not submitted', 'Use Reject if you do not want the indent closed.');
            return;
        }
        const act = action.value || action.type;
        try {
            const status = await approveIndentAmend({
                IndentNo: row.IndentNo,
                ApprovalNote: note,
                Action: act,
                CCCode: row.CCCode,
                AmendId: row.AmendId,
                RoleId: roleId,
                Createdby: userName,
            });
            if (status && status !== 'Submited') {
                Alert.alert('Not applied', status);
                return;
            }
            showDone(`Indent amend ${DONE[action.type] || `${act}d`} successfully.`, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Failed to submit verification');
        }
    };

    return (
        <PortalScreen
            title="Indent Amend"
            subtitle={row?.IndentNo}
            icon={FilePen}
            backHref={'/verification/indent-amend/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Amendment not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the amendment" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={d.IndentNo || row.IndentNo}
                        amount={money(d.DifferenceValue)}
                        amountLabel="Difference value"
                        chips={[row.CCCode, d.CCName || row.CCName, d.AmendDate || row.AmendDate]}
                    />
                    {d.CloseStatus === 'Yes' ? (
                        <Notice tone="amber" title="Closes the indent on approval" text="Approving this amendment also closes the indent. You will be asked to confirm." />
                    ) : null}

                    <Section>
                        <FieldGrid
                            fields={[
                                ['Amend plus value', money(d.AmendPlusValue)],
                                ['Amend minus value', money(d.AmendMinusValue)],
                                ['Difference value', money(d.DifferenceValue)],
                                ['Amend date', d.AmendDate || row.AmendDate],
                            ]}
                        />
                    </Section>

                    <Section title={`Amended items${items.length ? ` (${items.length})` : ''}`}>
                        {items.length === 0 ? (
                            <Text className="text-sm text-gray-400 text-center py-6">No amended items found.</Text>
                        ) : items.map((it, i) => {
                            const add = it.AmendType === 'Add';
                            return (
                                <View key={String(it.Amendindentid ?? i)} className={`py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                    <View className="flex-row items-start gap-3">
                                        <View className="flex-1">
                                            <Text className="text-[11px] font-mono text-brand-navy">{it.ItemCode}</Text>
                                            <Text className="text-sm font-semibold text-gray-900">{it.ItemName}</Text>
                                            {it.Specification ? <Text className="text-[11px] text-gray-500 mt-0.5">{it.Specification}</Text> : null}
                                            <Text className="text-[11px] text-indigo-600 mt-0.5">{it.DcaCode}{it.SubDcaCode ? ` / ${it.SubDcaCode}` : ''}</Text>
                                        </View>
                                        <Text className="text-sm font-bold text-gray-900">{money(it.Amount)}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mt-2">
                                        <View className="flex-1 rounded-lg bg-gray-50 px-2.5 py-1.5">
                                            <Text className="text-[10px] text-gray-400">Current</Text>
                                            <Text className="text-xs font-semibold text-gray-800">{qty(it.OldQty)} {it.Units}</Text>
                                        </View>
                                        <View className={`flex-1 rounded-lg px-2.5 py-1.5 ${add ? 'bg-green-50' : 'bg-rose-50'}`}>
                                            <Text className="text-[10px] text-gray-400">{it.AmendType || 'Amend'}</Text>
                                            <Text className={`text-xs font-bold ${add ? 'text-green-700' : 'text-rose-700'}`}>{add ? '+' : '−'}{qty(it.AmendQty)}</Text>
                                        </View>
                                        <View className="flex-1 rounded-lg bg-indigo-50 px-2.5 py-1.5">
                                            <Text className="text-[10px] text-gray-400">New qty</Text>
                                            <Text className="text-xs font-bold text-brand-navy">{qty(it.NewQuantity)}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-[10px] text-gray-400 mt-1">Basic price {money(it.BasicPrice)}</Text>
                                </View>
                            );
                        })}
                    </Section>

                    <RemarksTimeline trno={d.AmendId ?? row.AmendId} moid={d.MOID} />
                    <ActionPanel moid={d.MOID} roleId={roleId} chkAmt={num(d.DifferenceValue)} showReturn={false} onSubmit={submit} />
                </>
            )}
        </PortalScreen>
    );
}
