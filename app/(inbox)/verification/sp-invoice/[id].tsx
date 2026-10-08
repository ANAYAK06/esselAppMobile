// Service Provider (SP) Invoice verification — invoice, GST, totals, charges, deductions and
// approvals so far, then verify / approve (web: verificationConfigs.jsx SPPOInvoice on
// ConfigVerification.jsx). Return is never offered; approval limits use the net amount.
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { FileSpreadsheet } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveSPInvoice,
    getSPInvoiceDetail,
    spInvoiceTaxTotal,
    type SPInvoiceRow,
} from '@/src/api/verification/invoiceVerificationAPI';
import { isSubmitted, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildVendorInvoiceUrl } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { ACTION_DONE } from '@/src/components/verification/kit/actionText';
import { ApprovalTrail, ChargeLines } from '@/src/components/verification/invoice/InvoiceParts';

export default function SPInvoiceDetailScreen() {
    const row = useRowParam<SPInvoiceRow>();
    const { roleId, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getSPInvoiceDetail(row!.SPPOInvoiceNo), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);

    const tax = d?.TaxApplicable === 'Yes';
    const intra = d?.Statecheck === true || String(d?.Statecheck).toLowerCase() === 'true';

    const submit = async (action: StatusAction, note: string) => {
        if (!d) return;
        try {
            const status = await approveSPInvoice({
                SPPOInvoiceNo: d.SPPOInvoiceNo,
                SPPONo: d.SPPONo,
                SPPOInvoiceDate: d.SPPOInvoiceDate,
                SPPOBasicValue: d.SPPOBasicValue,
                CCCode: d.CCCode,
                Action: action.type,
                ApprovalNote: note,
                CreatedBy: userName,
                RoleId: roleId,
                Taxtypes: d.GSTType,
                Taxdcas: d.Taxdcas,
                Taxamounts: spInvoiceTaxTotal(d),
                Otherchargedcas: (d.OtherChargeList || []).map((x) => `${x.DCACode},`).join(''),
                Otherchargeamounts: (d.OtherChargeList || []).map((x) => `${x.Amount},`).join(''),
                Deductiondcas: (d.DeductionList || []).map((x) => `${x.DCACode},`).join(''),
                Deductionamounts: (d.DeductionList || []).map((x) => `${x.Amount},`).join(''),
                TaxApplicable: d.TaxApplicable,
            });
            if (isSubmitted(status)) showSubmitResult(`SP Invoice ${ACTION_DONE[action.type]}`, status, () => router.back());
            else Alert.alert('Not applied', status || 'The server returned no confirmation.');
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Something went wrong');
        }
    };

    return (
        <PortalScreen
            title="SP Invoice"
            subtitle={row?.SPPOInvoiceNo}
            icon={FileSpreadsheet}
            backHref={'/verification/sp-invoice/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Invoice not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the invoice" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={row.SPPOInvoiceNo}
                        amount={money(d.NetAmount)}
                        amountLabel="Net amount"
                        chips={[d.VendorName, d.SPPONo && `PO ${d.SPPONo}`]}
                    />

                    <Section title="Invoice">
                        <FieldGrid
                            fields={[
                                ['Vendor', d.VendorName, true],
                                ['PO Number', d.SPPONo],
                                ['Cost Center', d.CCCode],
                                ['Account Head', d.DCACode],
                                ['Sub Account Head', d.SubDCACode],
                                ['Invoice No', d.SPPOInvoiceNo],
                                ['Invoice Date', d.SPPOInvoiceDate],
                                ['Invoice Making Date', d.SPPOInvoiceMakingDate],
                                ['Basic Value', money(d.SPPOBasicValue)],
                                ['Is Tax Applicable?', d.TaxApplicable],
                                tax && ['GST Type', d.GSTType],
                                tax && ['GST Nos', d.CompanyGST],
                                tax && ['Vendor GST No', d.VendorGST],
                            ]}
                        />
                    </Section>

                    {tax && d.Taxdcas != null ? (
                        <Section title="GST">
                            <FieldGrid
                                fields={[
                                    ['Account Head', d.Taxdcas, true],
                                    intra && ['CGST Sub Account Head', d.Cgstsdca],
                                    intra && ['CGST Amount', money(d.Cgstsdcaamt)],
                                    intra && ['SGST Sub Account Head', d.Sgstsdca],
                                    intra && ['SGST Amount', money(d.Sgstsdcaamt)],
                                    !intra && ['IGST Sub Account Head', d.Igstsdca],
                                    !intra && ['IGST Amount', money(d.Igstsdcaamt)],
                                    ['Total Tax', money(spInvoiceTaxTotal(d))],
                                ]}
                            />
                        </Section>
                    ) : null}

                    <Section title="Totals">
                        <FieldGrid
                            fields={[
                                ['Advance', money(d.Advance)],
                                ['Retention Value', money(d.Retention)],
                                ['Hold Value', money(d.Hold)],
                                ['Invoice Value', money(d.InvoiceValue)],
                                ['Net Amount', money(d.NetAmount)],
                                ['Description', d.Description, true],
                            ]}
                        />
                    </Section>

                    <DocumentLinks links={[{ label: 'Invoice document', url: buildVendorInvoiceUrl(d.FileName) }]} />
                    <ChargeLines title="Other charges" lines={d.OtherChargeList} />
                    <ChargeLines title="Deductions" lines={d.DeductionList} tone="deduct" />
                    <ApprovalTrail text={d.ApprovedUser} firstIsCreator />

                    <RemarksTimeline trno={row.SPPOInvoiceNo} moid={d.MOID} />
                    <ActionPanel moid={d.MOID} roleId={roleId} chkAmt={Number(d.NetAmount) || 0} showReturn={false} onSubmit={submit} />
                </>
            )}
        </PortalScreen>
    );
}
