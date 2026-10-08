// Account Head (DCA) Budget Amendment — additions / subtractions per account head, then verify /
// approve (web: pages/Budget/VerifyDCABudgetAmendment.jsx). The approval posts the server's
// AmendedValue (not a locally computed total), as the web does.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { ArrowLeftRight } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveDCAAmendment,
    getDCAAmendmentById,
    getDCAAmendmentItems,
    type DCAAmendmentRow,
} from '@/src/api/verification/budgetVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const STATIC_MOID = 142; // web fallback when the detail has no MOID

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export default function DCAAmendmentDetail() {
    const row = useRowParam<DCAAmendmentRow>();
    const { roleId, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const loadDetail = useCallback(() => getDCAAmendmentById(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const loadItems = useCallback(() => getDCAAmendmentItems(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const detail = useApiData(row ? loadDetail : null);
    const grid = useApiData(row ? loadItems : null);

    const d = detail.data;
    const items = grid.data ?? [];
    const totalAdd = items.reduce((s, it) => s + num(it.AAddition), 0);
    const totalSub = items.reduce((s, it) => s + num(it.ASubstraction), 0);
    const net = totalAdd - totalSub;
    const moid = d?.MOID || STATIC_MOID;

    const submit = async (action: StatusAction, note: string) => {
        if (!row) return;
        try {
            const status = await approveDCAAmendment({
                Action: action.value || action.text || action.type,
                AmendedValue: d?.AmendedValue != null ? String(d.AmendedValue) : '',
                ApprovalNote: note,
                CCCode: row.CCCode,
                CreatedBy: userName,
                FYYear: row.FYYear || 'NA',
                RoleId: roleId,
                Status: row.Status ?? '1',
            });
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Something went wrong');
        }
    };

    const loading = (detail.loading && !d) || (grid.loading && !grid.data);

    return (
        <PortalScreen
            title="DCA Budget Amendment"
            subtitle={row?.CCCode}
            icon={ArrowLeftRight}
            backHref={'/verification/dca-budget-amendment/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Amendment not found" subtitle="Go back and open it again from the list." />
            ) : loading ? (
                <LoadingText />
            ) : (
                <>
                    <DetailHero
                        title={`${row.CCCode}${row.CCName || d?.CCName ? ` - ${row.CCName || d?.CCName}` : ''}`}
                        amount={`${net >= 0 ? '+' : '−'}${money(Math.abs(net))}`}
                        amountLabel="Net change across account heads"
                        chips={[row.cc_Type || d?.cc_Type, row.FYYear && row.FYYear !== 'N/A' && `FY ${row.FYYear}`, row.State, row.AmdDate]}
                    />

                    <Section title="Account heads">
                        {items.length === 0 ? (
                            <Text className="text-xs text-gray-400 text-center py-4">No account head changes found</Text>
                        ) : (
                            items.map((it, i) => (
                                <View key={`${it.ADCA}-${i}`} className={`flex-row items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-900">{it.ADCA || 'N/A'}</Text>
                                        <Text className="text-[11px] text-gray-500" numberOfLines={2}>{it.ADCAName || 'N/A'}</Text>
                                    </View>
                                    <View className="items-end">
                                        {num(it.AAddition) > 0 ? <Text className="text-sm font-semibold text-green-700">+{money(num(it.AAddition))}</Text> : null}
                                        {num(it.ASubstraction) > 0 ? <Text className="text-sm font-semibold text-red-700">−{money(num(it.ASubstraction))}</Text> : null}
                                        {num(it.AAddition) <= 0 && num(it.ASubstraction) <= 0 ? <Text className="text-sm text-gray-400">—</Text> : null}
                                    </View>
                                </View>
                            ))
                        )}
                        <View className="pt-3 mt-1 border-t border-gray-200">
                            <FieldGrid
                                fields={[
                                    ['Total addition', `+${money(totalAdd)}`],
                                    ['Total subtraction', `−${money(totalSub)}`],
                                    ['Net change', `${net >= 0 ? '+' : '−'}${money(Math.abs(net))}`],
                                    d?.AmendedValue != null && ['Amended value (server)', money(d.AmendedValue)],
                                ]}
                            />
                        </View>
                    </Section>

                    <RemarksTimeline trno={d?.RefNo || row.RefNo} moid={moid} />
                    <ActionPanel
                        moid={moid}
                        roleId={roleId}
                        chkAmt={num(d?.AmendedValue)}
                        showReturn
                        confirmLabel="I have verified all DCA amendment details"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
