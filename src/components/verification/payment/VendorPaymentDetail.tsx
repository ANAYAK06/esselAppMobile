// Vendor Payment verification detail, shared by the bank and cash screens — payee, bank / cheque
// (or cash voucher) details, the invoices (or advance) being paid and the approval trail, then
// verify / approve / reject. Both web pages read the same queue + detail and post to the same route:
//   bank → pages/VendorPayment/VerifyVendorPayment.jsx: no Return, no confirm tick, trail from the record's Remarks
//   cash → pages/Accounts/VerifyVendorPaymentByCash.jsx: Return shown, confirm tick, Purchase/Remarks history,
//          cost centers on the voucher
// The approval limit is checked against the payment amount on both.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Banknote, Landmark } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveVendorPayment, getVendorPaymentDetail, parseApprovalTrail, type VendorPaymentLine, type VendorPaymentRow,
} from '@/src/api/verification/paymentVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const num = (v: unknown) => {
    const n = parseFloat(String(v ?? ''));
    return Number.isNaN(n) ? 0 : n;
};

export default function VendorPaymentDetail({ cash = false }: { cash?: boolean }) {
    const row = useRowParam<VendorPaymentRow>();
    const { roleId, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getVendorPaymentDetail(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const remarks = d?.Remarks;
    const loadTrail = useCallback(() => Promise.resolve(parseApprovalTrail(remarks)), [remarks]);

    const lines = d?.lstPayInvoiceData ?? [];
    const isAdvance = (d?.PaymentTypeName || row?.PaymentTypeName) === 'Vendor Advance';
    const amount = d?.TransactionAmount ?? row?.TransactionAmount;
    const date = d?.TransactionDate || row?.TransactionDate;
    const title = cash ? 'Vendor Payment by Cash' : 'Vendor Payment';

    const submit = async (action: StatusAction, note: string) => {
        if (!row) return;
        const actionValue = action.value || action.type;
        try {
            const status = await approveVendorPayment({
                TransactionRefNo: row.TransactionRefNo,
                ApprovalNote: note,
                Remarks: appendApprovalComment(d?.Remarks || '', roleCode || (cash ? 'Verifier' : 'Payment Verifier'), userName, note),
                Action: actionValue,
                PaymentType: d?.PaymentTypeName || row.PaymentTypeName || 'Vendor Invoice',
                Roleid: roleId,
                VendorCode: row.VendorCode,
                TransactionType: row.TransactionType,
                Amount: amount,
                Createdby: userName,
                PaymentDate: date,
                DueDate: date,
                ApprovalStatus: actionValue,
                ...(d?.MOID ? { MOID: d.MOID } : {}),
                // The cash page never sends the bank fields
                ...(!cash && d?.BankName ? { BankName: d.BankName } : {}),
                ...(!cash && d?.ModeofPay ? { ModeofPay: d.ModeofPay } : {}),
            });
            showSubmitResult(`${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title={title}
            subtitle={row?.TransactionRefNo}
            icon={cash ? Banknote : Landmark}
            backHref={(cash ? '/verification/vendor-payment-cash/list' : '/verification/vendor-payment/list') as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Payment not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the payment" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={d.VendorName || row.VendorName || row.VendorCode || 'Vendor payment'}
                        amount={money(amount)}
                        amountLabel={d.AmountInWords ? `Rupees ${d.AmountInWords.trim()} only` : 'Payment amount'}
                        chips={cash ? [d.PaymentTypeName || row.PaymentTypeName, 'Cash'] : [d.PaymentTypeName || row.PaymentTypeName, row.TransactionType, d.ModeofPay]}
                    />
                    <Section title={cash ? 'Cash payment voucher' : 'Payment'}>
                        <FieldGrid
                            fields={cash ? [
                                ['Voucher / Ref No', d.TransactionRefNo || row.TransactionRefNo],
                                ['Payment Date', date],
                                ['Vendor Code', d.VendorCode || row.VendorCode],
                                !!d.VendorType && ['Vendor Type', d.VendorType],
                                ['Cost Center (Self)', d.CCCode || d.PaidToCC],
                                !!(d.OtherCCCode || d.PaidAganstCC) && ['Other Cost Center', d.OtherCCCode || d.PaidAganstCC],
                                !!d.PoNo && ['PO Reference', d.PoNo],
                                // The voucher shows the creator's narration — the trail's first entry
                                !!d.Remarks && ['Narration', d.Remarks.split('||')[0], true],
                            ] : [
                                ['Reference No', d.TransactionRefNo || row.TransactionRefNo],
                                ['Date', date],
                                ['Vendor Code', d.VendorCode || row.VendorCode],
                                ['Mode', d.ModeofPay],
                                ['Bank', d.BankName, true],
                                !!d.Number && d.Number !== 'Online' && ['Cheque / UTR No', d.Number],
                                !!d.PoNo && ['PO Reference', d.PoNo],
                            ]}
                        />
                    </Section>

                    {lines.length ? (
                        <Section
                            title={isAdvance ? 'Advance details' : `Invoices (${lines.length})`}
                            right={<Text className="text-xs font-bold text-brand-navy">{money(lines.reduce((s, l) => s + num(l.Amount), 0))}</Text>}
                        >
                            {lines.map((l, i) => <PaymentLineCard key={`${l.InvoiceNo ?? ''}-${i}`} line={l} first={i === 0} advance={isAdvance} />)}
                        </Section>
                    ) : null}

                    {cash
                        ? <RemarksTimeline trno={d.TransactionRefNo || row.TransactionRefNo} moid={d.MOID} />
                        : <RemarksTimeline load={loadTrail} />}
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        chkAmt={num(amount)}
                        showReturn={cash}
                        confirmLabel={cash ? 'I have verified the payee, cost center and amount on this cash voucher.' : undefined}
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}

function PaymentLineCard({ line: l, first, advance }: { line: VendorPaymentLine; first: boolean; advance: boolean }) {
    return (
        <View className={`py-3 ${first ? '' : 'border-t border-gray-100'}`}>
            <View className="flex-row items-start gap-2">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                        {advance ? 'Advance payment' : l.InvoiceNo || 'Invoice'}
                    </Text>
                    {l.Type ? <Text className="text-[11px] text-gray-500">{l.Type}</Text> : null}
                </View>
                <Text className="text-sm font-bold text-brand-navy">{money(l.Amount) || '₹0'}</Text>
            </View>
            <Text className="text-[11px] text-gray-600 mt-1">
                {[l.CCCode, [l.DCACode, l.SubDcaCode].filter(Boolean).join(' / '), l.ITCode && `IT ${l.ITCode}`].filter(Boolean).join(' · ')}
            </Text>
        </View>
    );
}
