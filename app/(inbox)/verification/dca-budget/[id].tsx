// Account Head (DCA) Budget — tick each account head, then verify / approve; or update a returned
// budget (web: verificationConfigs.jsx DCABudget on ConfigVerification.jsx)
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { PieChart } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveDCABudget,
    getDCABudgetDetail,
    isSubmitted,
    type DCABudgetItem,
    type DCABudgetRow,
} from '@/src/api/verification/budgetVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, CheckList, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { ACTION_DONE } from '@/src/components/verification/kit/actionText';
import CCDocuments from '@/src/components/verification/budget/CCDocuments';
import DCABudgetResubmit from '@/src/components/verification/budget/DCABudgetResubmit';

const itemsTotal = (items: DCABudgetItem[]) => items.reduce((a, it) => a + (Number(it.DCABudgetValue) || 0), 0);

export default function DCABudgetDetailScreen() {
    const row = useRowParam<DCABudgetRow>();
    const { roleId, uid, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);
    const [checked, setChecked] = useState<Record<number, boolean>>({});

    const load = useCallback(() => getDCABudgetDetail(row!, roleId), [row, roleId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row && roleId ? load : null);

    const returned = String(row?.Status) === '0';
    const performing = row?.CC_Type === 'Performing';
    const items = d?.items ?? [];
    const total = itemsTotal(items);

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        if (!items.length) return Alert.alert('Invalid', 'There are no account heads to verify.');
        if (!items.every((_, i) => checked[i])) return Alert.alert('Please verify', 'Tick every account head before you continue.');
        try {
            const status = await approveDCABudget({
                Budgetidlist: items.map((it) => `${it.DCABudgetId},`).join(''),
                CCCode: row.CC_Code,
                FYyear: d.FYyear || '',
                RoleId: roleId,
                ApprovalNote: note,
                CreatedBy: userName,
                DCABudgetValue: total,
                DcaAmounts: items.map((it) => `${it.DCABudgetValue},`).join(''),
                Action: action.type,
            });
            if (isSubmitted(status)) showSubmitResult(`Account head budget ${ACTION_DONE[action.type]}`, status, () => router.back());
            else Alert.alert('Not applied', status || 'The server returned no confirmation.');
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Something went wrong');
        }
    };

    return (
        <PortalScreen
            title="Account Head Budget"
            subtitle={row?.CC_Code}
            icon={PieChart}
            backHref={'/verification/dca-budget/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Budget not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the budget" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={`${row.CC_Code}${row.CC_Name ? ` - ${row.CC_Name}` : ''}`}
                        amount={money(total) || '₹0'}
                        amountLabel="Account head total"
                        chips={[row.CC_Type, row.FYyear !== 'N/A' && row.FYyear]}
                        returned={returned}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['Cost Center', row.CC_Code],
                                ['Cost Center Name', row.CC_Name],
                                ['Cost Center Type', row.CC_Type],
                                !performing && ['Financial Year', row.FYyear],
                                ['CC Budget Value', money(row.BudgetValue)],
                                ['CC Budget Balance', money(row.BalanceBudget)],
                                !!d.Remarks && ['Remarks', d.Remarks, true],
                            ]}
                        />
                    </Section>

                    {returned ? (
                        <>
                            <CCDocuments ccCode={row.CC_Code} uid={uid} />
                            <DCABudgetResubmit row={row} detail={d} roleId={roleId} userName={userName} onDone={() => router.back()} />
                        </>
                    ) : (
                        <>
                            <CheckList
                                title="Account heads"
                                items={items}
                                checked={checked}
                                onChange={setChecked}
                                renderItem={(it) => (
                                    <View className="flex-row items-start gap-2">
                                        <View className="flex-1">
                                            <Text className="text-sm font-semibold text-gray-900">{it.DCACode}</Text>
                                            <Text className="text-[11px] text-gray-500" numberOfLines={2}>{it.DCAName}</Text>
                                            <Text className="text-[10px] text-gray-400 mt-0.5">
                                                {[it.DCABudgetCreationdate, !performing && it.FYyear].filter(Boolean).join(' · ')}
                                            </Text>
                                        </View>
                                        <Text className="text-sm font-bold text-gray-900">{money(it.DCABudgetValue)}</Text>
                                    </View>
                                )}
                                footer={(
                                    <View className="flex-row justify-between pt-2.5 mt-1 border-t border-gray-200">
                                        <Text className="text-xs font-bold text-gray-700">Total</Text>
                                        <Text className="text-xs font-bold text-green-700">{money(total)}</Text>
                                    </View>
                                )}
                            />
                            <CCDocuments ccCode={row.CC_Code} uid={uid} />
                            <RemarksTimeline trno={d.Refno} moid={d.MOID} />
                            <ActionPanel moid={d.MOID} roleId={roleId} showReturn onSubmit={submit} />
                        </>
                    )}
                </>
            )}
        </PortalScreen>
    );
}
