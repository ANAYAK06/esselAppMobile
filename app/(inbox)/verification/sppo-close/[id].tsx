// SPPO Close verification — closing balance, PO period, services and remarks, then
// verify / approve the close (web: pages/SPPO/VerifySPPOClose.jsx). The close date sent is
// today (dd-MMM-yyyy) and the approval trail goes in POCloseRemarks, as on the web.
import React, { useCallback, useState } from 'react';
import { Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Archive } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import { approveCloseSPPO, getSPPOForClose, type SPPOCloseRow } from '@/src/api/verification/sppoVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildSPPOUrl } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import SPPOServiceCard, { num } from '@/src/components/verification/sppo/SPPOServiceCard';

// dd-MMM-yyyy built by hand — locale formatting can give "Sept" or spaces depending on the device
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const today = () => {
    const t = new Date();
    return `${String(t.getDate()).padStart(2, '0')}-${MON[t.getMonth()]}-${t.getFullYear()}`;
};

export default function SPPOCloseDetailScreen() {
    const row = useRowParam<SPPOCloseRow>();
    const { roleId, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getSPPOForClose(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const services = d?.ItemDescList ?? [];

    const submit = async (action: StatusAction, note: string) => {
        if (!row) return;
        try {
            const status = await approveCloseSPPO({
                VendorCode: d?.VendorCode || row.VendorCode || '',
                SPPONo: d?.SPPONo || row.SPPONo || '',
                CCCode: d?.CCCode || row.CCCode || '',
                POCloseDate: today(),
                POCloseRemarks: appendApprovalComment(d?.POCloseRemarks || '', roleCode || 'SPPO Close Verifier', userName, note),
                RoleId: roleId,
                CreatedBy: userName,
                Action: action.value || action.text || action.type,
            });
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="SPPO Close"
            subtitle={row?.SPPONo}
            icon={Archive}
            backHref={'/verification/sppo-close/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="SPPO not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the SPPO" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={d.SPPONo || row.SPPONo}
                        amount={money(d.ClosingBalance ?? 0)}
                        amountLabel={`Closing balance · total ${money(d.TotalValue ?? 0)}`}
                        chips={[d.VendorName || row.VendorName, d.Status && `Status ${d.Status}`, d.POCloseDate && `Close requested ${d.POCloseDate}`]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['SPPO No', d.SPPONo || row.SPPONo],
                                ['Vendor Code', d.VendorCode || row.VendorCode],
                                ['Cost Center', d.CCCode || row.CCCode],
                                ['Total Value', money(d.TotalValue ?? 0)],
                                ['Start Date', d.SPPOStartDate],
                                ['End Date', d.SPPOEndDate],
                            ]}
                        />
                    </Section>

                    {services.length ? (
                        <Section title={`Services (${services.length})`}>
                            {services.map((s, i) => <SPPOServiceCard key={String(s.SPPOItemId ?? i)} service={s} index={i} />)}
                        </Section>
                    ) : null}

                    {d.Remarks ? (
                        <Section title="PO remarks">
                            <Text className="text-xs text-gray-700 leading-5">{d.Remarks}</Text>
                        </Section>
                    ) : null}

                    <DocumentLinks links={[{ label: 'SPPO attachment', url: buildSPPOUrl(d.FilePath) }]} />

                    <RemarksTimeline trno={d.SPPONo || row.SPPONo} moid={d.MOID} />
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        chkAmt={num(d.ClosingBalance)}
                        showReturn
                        confirmLabel="I have verified the SPPO close details — closing balance, period and services"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
