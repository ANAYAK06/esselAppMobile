// Cost Center Budget Amendment — detail and verify / approve (web: pages/Budget/VerifyCCBudgetAmendment.jsx).
// NB: the API's OldBudget is the revised total (after this amendment); the existing total is
// derived from it, exactly as the web does.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveCCAmendment,
    getCCAmendmentById,
    type CCAmendmentRow,
} from '@/src/api/verification/budgetVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildCCBudgetAmendmentUrl } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import CCDocuments from '@/src/components/verification/budget/CCDocuments';

const BudgetLine = ({ label, value, tone = 'plain', hint }: { label: string; value: string | null; tone?: 'plain' | 'add' | 'deduct' | 'total'; hint?: string }) => (
    <View className={`flex-row items-center justify-between gap-3 px-3 py-3 rounded-xl mb-2 ${
        tone === 'add' ? 'bg-green-50' : tone === 'deduct' ? 'bg-red-50' : tone === 'total' ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <View className="flex-1">
            <Text className={`text-xs ${tone === 'total' ? 'font-semibold text-brand-navy' : 'text-gray-600'}`}>{label}</Text>
            {hint ? <Text className="text-[11px] text-indigo-600 mt-0.5">{hint}</Text> : null}
        </View>
        <Text className={`text-sm font-bold ${tone === 'add' ? 'text-green-700' : tone === 'deduct' ? 'text-red-700' : tone === 'total' ? 'text-brand-navy' : 'text-gray-900'}`}>
            {value}
        </Text>
    </View>
);

export default function CCAmendmentDetail() {
    const row = useRowParam<CCAmendmentRow>();
    const { roleId, uid, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getCCAmendmentById(row!.CCBudgetAmendmentid, row!.AmendmentType || ''), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);

    const isAdd = (d?.AmendmentType || row?.AmendmentType) === 'Add';
    const amended = Number(d?.AmendedValue) || 0;
    const revised = Number(d?.OldBudget) || 0;
    const existing = isAdd ? revised - amended : revised + amended;

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        try {
            const status = await approveCCAmendment({
                AmendedValue: d.AmendedValue != null ? String(d.AmendedValue) : '0',
                AmendmentType: row.AmendmentType,
                ApprovalNote: note,
                BudgetId: d.BudgetId != null ? String(d.BudgetId) : '',
                CCBudgetAmendmentid: String(row.CCBudgetAmendmentid),
                CCCode: d.CCCode || row.CCCode,
                CreatedBy: userName,
                FYYear: d.FYYear || '',
                Roleid: roleId,
                UID: uid || 0,
                VerificationType: action.value || action.type,
            });
            showSubmitResult(`${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Something went wrong');
        }
    };

    return (
        <PortalScreen
            title="CC Budget Amendment"
            subtitle={row?.CCCode}
            icon={TrendingUp}
            backHref={'/verification/cc-budget-amendment/list' as Href}
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
                        title={`${d.CCCode || row.CCCode}${d.CCName || row.CCName ? ` - ${d.CCName || row.CCName}` : ''}`}
                        amount={`${isAdd ? '+' : '−'}${money(amended)}`}
                        amountLabel={row.OtherCCCode ? `Transferred from ${row.OtherCCCode}` : 'Amendment requested'}
                        chips={[d.AmendmentType || row.AmendmentType, d.CCType, d.FYYear, d.AmendmentDate || row.AmendmentDate]}
                    />

                    <Section title="Budget">
                        <BudgetLine label="Existing total basic budget" value={money(existing)} />
                        <BudgetLine
                            label={row.OtherCCCode ? `Amount transferred from ${row.OtherCCCode}` : 'Amendment requested value'}
                            value={`${isAdd ? '+' : '−'}${money(amended)}`}
                            tone={isAdd ? 'add' : 'deduct'}
                            hint={row.OtherCCCode ? `Source CC: ${row.OtherCCCode}` : undefined}
                        />
                        <BudgetLine label="Revised total basic budget" value={money(revised)} tone="total" />
                        <View className="flex-row items-center gap-2 my-1.5">
                            <View className="flex-1 h-px bg-gray-200" />
                            {isAdd ? <ArrowUpRight size={14} color="#16a34a" /> : <ArrowDownRight size={14} color="#dc2626" />}
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>
                        <BudgetLine label="Balance budget before amendment" value={money(d.OldBudgetBalance)} />
                        <BudgetLine label="Balance budget after amendment" value={money(d.NewBudgetBalance)} tone="total" />
                    </Section>

                    {d.Remarks ? (
                        <Section title="Justification">
                            <FieldGrid fields={[['Remarks', d.Remarks, true]]} />
                        </Section>
                    ) : null}

                    <CCDocuments
                        ccCode={d.CCCode || row.CCCode}
                        uid={uid}
                        extra={[{ label: 'Amendment supporting document', url: buildCCBudgetAmendmentUrl(d.FilePath) }]}
                    />
                    <RemarksTimeline trno={d.Refno} moid={d.MOID} />
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        chkAmt={amended}
                        showReturn
                        confirmLabel="I have verified the amendment details — amounts, cost center, justification and documents"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
