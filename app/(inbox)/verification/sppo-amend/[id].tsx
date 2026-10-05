// SPPO Amendment verification — value summary, amended service lines, original vs amended terms,
// documents, then verify / approve (web: pages/SPPO/VerifySPPOAmend.jsx). The web posts the
// approval-comment trail itself as ApprovalNote.
import React, { useCallback, useState } from 'react';
import { Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { FilePen } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveSPPOAmend,
    getSPPOAmendDetail,
    getSPPODocs,
    type SPPOAmendDetail,
    type SPPOAmendRow,
} from '@/src/api/verification/sppoVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildSPPOAmendUrl, getFileName } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import SPPOServiceCard, { num } from '@/src/components/verification/sppo/SPPOServiceCard';

const Terms = ({ title, text }: { title: string; text?: string }) =>
    text ? (
        <>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1 mb-1">{title}</Text>
            {text.split('|').filter((t) => t.trim()).map((t, i) => (
                <Text key={i} className="text-xs text-gray-700 leading-5">• {t.trim()}</Text>
            ))}
        </>
    ) : null;

export default function SPPOAmendDetailScreen() {
    const row = useRowParam<SPPOAmendRow>();
    const { roleId, uid, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getSPPOAmendDetail(roleId, row!.AmendId, uid), [row, roleId, uid, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row && roleId ? load : null);
    const loadDocs = useCallback(() => getSPPODocs(row!.SPPONo), [row]);
    const docs = useApiData(row?.SPPONo ? loadDocs : null).data ?? [];
    const services = d?.ItemDescList ?? [];

    const submit = async (action: StatusAction, note: string) => {
        if (!row) return;
        const x: Partial<SPPOAmendDetail> = d ?? {};
        try {
            const status = await approveSPPOAmend({
                AmendId: x.AmendId || row.AmendId || 0,
                SPPONo: x.SPPONo || row.SPPONo || '',
                VendorCode: x.VendorCode || row.VendorCode || '',
                CCCode: x.CCCode || row.CCCode || '',
                DCACode: x.DCACode || row.DCACode || '',
                AmendDate: x.AmendDate || row.AmendDate || '',
                RoleId: roleId,
                Action: action.value || action.text || action.type,
                CreatedBy: userName,
                ApprovalNote: appendApprovalComment(x.ApprovalNote || '', roleCode || 'SPPO Amendment Verifier', userName, note),
                AmendAmount: x.AmendAmount || row.AmendAmount || 0,
                SubstractAmount: x.SubstractAmount || row.SubstractAmount || 0,
                Terms: x.Terms || row.Terms || '',
            });
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="SPPO Amendment"
            subtitle={row?.SPPONo}
            icon={FilePen}
            backHref={'/verification/sppo-amend/list' as Href}
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
                        title={d.SPPONo || row.SPPONo}
                        amount={money(d.AmendAmount ?? row.AmendAmount ?? 0)}
                        amountLabel="Amendment amount"
                        chips={[d.VendorName || row.VendorName, `Amend ${d.AmendId ?? row.AmendId}`, d.Status && `Status ${d.Status}`]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['Amendment ID', `${d.AmendId ?? row.AmendId}`],
                                ['SPPO No', d.SPPONo || row.SPPONo],
                                ['Vendor Code', d.VendorCode || row.VendorCode],
                                ['Cost Center', d.CCCode || row.CCCode],
                                ['Amend Date', d.AmendDate || row.AmendDate],
                                ['Account Head', d.DCACode || row.DCACode],
                            ]}
                        />
                    </Section>

                    <Section title="Values">
                        <FieldGrid
                            fields={[
                                ['Amend plus value', money(d.AmendPlusValue ?? 0)],
                                ['Amend minus value', money(d.AmendMinusValue ?? 0)],
                                num(d.SubstractAmount) > 0 && ['Subtract amount', money(d.SubstractAmount)],
                                ['Amend total value', money(d.AmendTotalValue || d.AmendAmount || 0)],
                                ['Old PO value', money(d.OldPOValue ?? 0)],
                                ['Current PO value', money(d.POValue ?? 0)],
                                ['PO balance', money(d.POBalance ?? 0)],
                            ]}
                        />
                    </Section>

                    {services.length ? (
                        <Section title={`Amended services (${services.length})`}>
                            {services.map((s, i) => <SPPOServiceCard key={String(s.SPPOItemId ?? i)} service={s} index={i} amend />)}
                        </Section>
                    ) : null}

                    {d.OldTerms || d.Terms ? (
                        <Section title="Terms">
                            <Terms title="Original terms" text={d.OldTerms} />
                            <Terms title="Amended terms" text={d.Terms} />
                        </Section>
                    ) : null}

                    <DocumentLinks
                        links={[
                            { label: 'Amendment attachment', url: buildSPPOAmendUrl(d.FilePath) },
                            ...docs.filter((doc) => doc.Path).map((doc, i) => ({
                                label: `${doc.POType || doc.For || 'Document'} — ${getFileName(doc.Path) || `Document ${i + 1}`}`,
                                url: buildSPPOAmendUrl(doc.Path),
                            })),
                        ]}
                    />

                    <RemarksTimeline trno={d.SPPONo || row.SPPONo} moid={d.MOID} />
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        chkAmt={num(d.AmendAmount)}
                        showReturn
                        confirmLabel="I have verified the SPPO amendment details — values, services, terms and documents"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
