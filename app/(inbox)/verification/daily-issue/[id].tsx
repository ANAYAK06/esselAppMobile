// Daily Issue verification — the items a cost center issued from stock, with quantities and
// basic prices, then verify / approve / return (web: pages/Stock/VerifyDailyIssue.jsx).
// MOID comes from the queue row; the detail call returns only the item list.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Layers } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveDailyIssue, getDailyIssueItems, getDailyIssueRemarks, type DailyIssueItem, type DailyIssueRow,
} from '@/src/api/verification/stockVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const num = (v: unknown) => {
    const n = parseFloat(String(v ?? ''));
    return Number.isNaN(n) ? 0 : n;
};

// "2400.0000" → "2,400"
const qty = (v: unknown) => num(v).toLocaleString('en-IN', { maximumFractionDigits: 3 });

// Amount is null from the API — fall back to quantity × basic price
const lineValue = (it: DailyIssueItem) => (it.Amount != null && it.Amount !== '' ? num(it.Amount) : num(it.Qty) * num(it.Basic));

export default function DailyIssueDetailScreen() {
    const row = useRowParam<DailyIssueRow>();
    const { roleId, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getDailyIssueItems(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data, loading, error } = useApiData(row ? load : null);
    const loadRemarks = useCallback(() => getDailyIssueRemarks(row!.Tranno), [row]);
    const items = data ?? [];
    const total = items.reduce((s, it) => s + lineValue(it), 0);

    const submit = async (action: StatusAction, note: string) => {
        if (!row) return;
        try {
            const status = await approveDailyIssue({
                Tranno: row.Tranno,
                Status: action.value || action.text || action.type,
                // The web starts from the first item's Remarks (empty in practice)
                Remarks: appendApprovalComment(items[0]?.Remarks || '', roleCode || 'Daily Issue Verifier', userName, note),
                Createdby: userName,
                RoleID: roleId,
            });
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Daily Issue"
            subtitle={row?.Tranno}
            icon={Layers}
            backHref={'/verification/daily-issue/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Issue not found" subtitle="Go back and open it again from the list." />
            ) : loading && !data ? (
                <LoadingText />
            ) : error && !data ? (
                <EmptyState title="Could not load the issue" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={`Daily issue ${row.Tranno}`}
                        amount={total > 0 ? money(total) : null}
                        amountLabel={`Issue value · ${items.length} item${items.length === 1 ? '' : 's'}`}
                        chips={[row.FromCC && `From ${row.FromCC}`, row.Status]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['Transaction No', row.Tranno],
                                ['Cost Center', row.FromCC],
                                ['Date', row.Date?.split(' ')[0]],
                                ['Items', items.length],
                            ]}
                        />
                    </Section>

                    <Section title={`Issued items (${items.length})`}>
                        {items.length ? (
                            items.map((it, i) => <IssueItemCard key={String(it.Rid ?? i)} item={it} first={i === 0} />)
                        ) : (
                            <Text className="text-xs text-gray-400 py-3 text-center">No items on this issue</Text>
                        )}
                    </Section>

                    <RemarksTimeline load={loadRemarks} />
                    <ActionPanel
                        moid={row.MOID}
                        roleId={roleId}
                        showReturn
                        confirmLabel="I have verified the daily issue — items, quantities, prices and cost center"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}

function IssueItemCard({ item: it, first }: { item: DailyIssueItem; first: boolean }) {
    return (
        <View className={`py-3 ${first ? '' : 'border-t border-gray-100'}`}>
            <View className="flex-row items-start gap-2">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{(it.ItemName || '—').trim()}</Text>
                    <Text className="text-[11px] text-gray-500">
                        {[it.ItemCode, it.Specification?.trim(), [it.DcaCode, it.SubDCAcode].filter(Boolean).join(' / ')].filter(Boolean).join(' · ')}
                    </Text>
                </View>
                <Text className="text-sm font-bold text-brand-navy">{money(lineValue(it)) || '₹0'}</Text>
            </View>
            <Text className="text-xs text-gray-600 mt-1">
                {qty(it.Qty)} {it.Units || ''} × {money(it.Basic) || '₹0'}
            </Text>
        </View>
    );
}
