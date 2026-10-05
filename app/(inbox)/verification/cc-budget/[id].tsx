// Cost Center Budget — detail, verify / approve, or update a returned budget
// (web: verificationConfigs.jsx CCBudget on ConfigVerification.jsx)
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveCCBudget,
    getCCBudgetById,
    isNonPerformingCC,
    isSubmitted,
    type CCBudgetRow,
} from '@/src/api/verification/budgetVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult } from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { ACTION_DONE } from '@/src/components/verification/kit/actionText';
import CCDocuments from '@/src/components/verification/budget/CCDocuments';
import CCBudgetResubmit from '@/src/components/verification/budget/CCBudgetResubmit';

export default function CCBudgetDetail() {
    const row = useRowParam<CCBudgetRow>();
    const { roleId, uid, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getCCBudgetById(row!.Budgetid), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);

    const returned = String(row?.Status) === '0';
    const nonPerforming = isNonPerformingCC(d?.CCType);

    const submit = async (action: StatusAction, note: string) => {
        if (!d) return;
        try {
            const status = await approveCCBudget({
                CostCenter: d.CostCenter,
                Action: action.type,
                ApprovalNote: note,
                Year: d.Year,
                RoleId: roleId,
                Createdby: userName,
                UID: uid,
            });
            if (isSubmitted(status)) showSubmitResult(`Budget ${ACTION_DONE[action.type]}`, status, () => router.back());
            else Alert.alert('Not applied', status || 'The server returned no confirmation.');
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Something went wrong');
        }
    };

    return (
        <PortalScreen
            title="Cost Center Budget"
            subtitle={row?.CostCenter}
            icon={Wallet}
            backHref={'/verification/cc-budget/list' as Href}
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
                        title={`${d.CostCenter}${d.CC_Name ? ` - ${d.CC_Name}` : ''}`}
                        amount={money(d.Amount)}
                        amountLabel="Budget value"
                        chips={[d.CCType, d.SubType, nonPerforming && d.Year]}
                        returned={returned}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['Cost Center', d.CostCenter],
                                ['Cost Center Name', d.CC_Name],
                                ['Cost Center Type', d.CCType],
                                ['Sub Type', d.SubType],
                                ['Budget Value', money(d.Amount)],
                                ['Created Date', d.ReturnCreatedate || d.BudgetCreationDate],
                                nonPerforming && ['Year', d.Year],
                                ['Remarks', d.Remarks, true],
                            ]}
                        />
                    </Section>
                    <CCDocuments
                        ccCode={d.CostCenter}
                        uid={uid}
                        execPath={d.CCType === 'Performing' ? d.Approvedbudgetexecution || null : null}
                    />

                    {returned ? (
                        <CCBudgetResubmit detail={d} roleId={roleId} userName={userName} onDone={() => router.back()} />
                    ) : (
                        <>
                            <RemarksTimeline trno={d.Refno} moid={d.MOID} />
                            <ActionPanel moid={d.MOID} roleId={roleId} showReturn onSubmit={submit} />
                        </>
                    )}
                </>
            )}
        </PortalScreen>
    );
}
