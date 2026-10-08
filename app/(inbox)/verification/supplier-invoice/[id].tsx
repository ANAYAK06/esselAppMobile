// Supplier Invoice verification — invoice + MRR documents, received items, other charges,
// deductions and GST, then verify / approve (web: pages/VendorInvoice/VerifySupplierInvoice.jsx).
// Return is hidden for this module, as on the web.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { ReceiptIndianRupee } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveSupplierInvoice,
    getSupplierInvoiceDetail,
    vendorDisplayName,
    type SupplierInvoiceRow,
} from '@/src/api/verification/invoiceVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildMRRUrl, buildVendorInvoiceUrl } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { ApprovalTrail, ChargeLines } from '@/src/components/verification/invoice/InvoiceParts';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export default function SupplierInvoiceDetailScreen() {
    const row = useRowParam<SupplierInvoiceRow>();
    const { roleId, uid, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getSupplierInvoiceDetail(row!.InvoiceNo), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const items = d?.MRRItemData ?? [];

    const submit = async (action: StatusAction, note: string) => {
        if (!row) return;
        const act = action.value || action.type;
        const payload: Record<string, unknown> = {
            InvoiceNo: row.InvoiceNo,
            ApprovalNote: note,
            Remarks: appendApprovalComment(d?.ApprovedUser, roleCode || 'Invoice Verifier', userName, note),
            Action: act,
            Roleid: roleId,
            Userid: uid,
            SupplierCode: row.VendorId,
            Createdby: userName,
            Amount: d?.NetAmount || row.NetAmount,
            InvoiceDate: d?.InvoiceDate || row.InvoiceDate,
            ApprovalStatus: act,
            ...(d?.MOID ? { MOID: d.MOID } : {}),
            ...(d?.PONo ? { PONo: d.PONo } : {}),
            ...(d?.MRR ? { MRR: d.MRR } : {}),
            ...(d?.InvoiceValue ? { InvoiceValue: d.InvoiceValue } : {}),
        };
        try {
            const status = await approveSupplierInvoice(payload);
            showSubmitResult(`${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Supplier Invoice"
            subtitle={row?.InvoiceNo}
            icon={ReceiptIndianRupee}
            backHref={'/verification/supplier-invoice/list' as Href}
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
                        title={vendorDisplayName(d.VendorName || row.VendorName) || row.InvoiceNo}
                        amount={money(d.NetAmount)}
                        amountLabel={`Net amount · invoice value ${money(d.InvoiceValue) || '₹0'}`}
                        chips={[d.InvoiceNo || row.InvoiceNo, d.VendorType || 'Supplier', d.GSTType]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['PO Number', d.PONo],
                                ['MRR', d.MRR],
                                ['Invoice Date', d.InvoiceDate],
                                ['Cost Center', d.CCCode],
                            ]}
                        />
                    </Section>

                    <DocumentLinks
                        links={[
                            { label: 'Invoice document', url: buildVendorInvoiceUrl(d.FileName) },
                            { label: `MRR / QMQC document${d.MRR ? ` (${d.MRR})` : ''}`, url: buildMRRUrl(d.MrrPath) },
                        ]}
                    />
                    {!d.FileName && !d.MrrPath ? (
                        <Text className="text-xs text-gray-400 text-center -mt-2 mb-4">No document attachments available</Text>
                    ) : null}

                    {items.length ? (
                        <Section title={`Items (${items.length})`}>
                            {items.map((it, i) => (
                                <View key={`${it.itemcode}-${i}`} className={`py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                    <View className="flex-row items-start gap-3">
                                        <View className="flex-1">
                                            <Text className="text-[11px] font-mono text-brand-navy">{it.itemcode}</Text>
                                            <Text className="text-sm font-semibold text-gray-900">{it.itemname}</Text>
                                            {it.specification ? <Text className="text-[11px] text-gray-500">{it.specification}</Text> : null}
                                            <Text className="text-[11px] text-indigo-600 mt-0.5">{it.dcacode}{it.subdcacode ? ` / ${it.subdcacode}` : ''}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-sm font-bold text-gray-900">{money(it.Amount)}</Text>
                                            <Text className="text-[11px] text-gray-500">{it.Requestedqty} {it.units} × {money(it.NewBasicprice)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <View className="flex-row justify-between pt-2 border-t border-gray-200">
                                <Text className="text-xs font-bold text-gray-600">Total</Text>
                                <Text className="text-xs font-bold text-brand-navy">{money(d.ItemTotal)}</Text>
                            </View>
                        </Section>
                    ) : null}

                    <ChargeLines title="Other charges" lines={d.OtherChargeList} />
                    <ChargeLines title="Deductions" lines={d.DeductionList} tone="deduct" />

                    <Section title="GST">
                        <FieldGrid
                            fields={[
                                ['CGST', money(num(d.CGSTTotal || d.InvTotalCGSTAmt))],
                                ['SGST', money(num(d.SGSTTotal || d.InvTotalSGSTAmt))],
                                ['IGST', money(num(d.IGSTTotal || d.InvTotalIGSTAmt))],
                                ['Total GST', money(num(d.InvGSTTotal))],
                                ['Vendor GST', d.VendorGST],
                                ['Company GST', d.CompanyGST],
                            ]}
                        />
                    </Section>

                    <ApprovalTrail text={d.ApprovedUser} />
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        chkAmt={num(d.NetAmount || d.InvoiceValue)}
                        showReturn={false}
                        confirmLabel="I have verified the invoice details — items, charges, GST and documents"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
