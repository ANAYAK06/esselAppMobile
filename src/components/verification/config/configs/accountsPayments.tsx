// Accounts payments & receipts — the Corex web's dedicated pages expressed as configs (same queue,
// detail and approve routes and payloads as each page + its slice/API):
//   CashVoucher      pages/Accounts/VerifyCashVoucher.jsx        (accountsSlice/cashVoucherSlice)
//   CCCashTransfer   pages/Accounts/VerifyCCCashTransfer.jsx     (accountsSlice/ccCashTransferSlice)
//   CCClosing        pages/Accounts/VerifyCCClosing.jsx          (accountsSlice/ccClosingSlice)
//   LoadWallet       pages/Accounts/VerifyLoadWallet.jsx         (accountsSlice/loadWalletSlice)
//   MiscPayment      pages/Accounts/VerifyMiscPayment.jsx        (accountsSlice/miscPaymentVerificationSlice)
//   MiscInvoice      pages/Accounts/VerifyMiscInvoice.jsx        (accountsSlice/miscInvoiceVerificationSlice)
//   AdvancePayment   pages/Accounts/VerifyAdvancePayment.jsx     (accountsSlice/advancePaymentVerificationSlice)
// These pages ask for the "I have verified" tick and accept whatever the approve route answers
// unless noted (the web only checks for an HTTP error).
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { ArrowRightLeft, Banknote, CircleX, FileText, HandCoins, Pencil, Save, Wallet, WalletCards } from 'lucide-react-native';
import { putRoute } from '@/src/api/verification/configVerificationAPI';
import { FormField, TextField } from '@/src/components/employee/FormControls';
import { PrimaryButton, SecondaryButton } from '@/src/components/employee/PortalUI';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { Block, TableBlock, fmt } from '../parts';
import type { Rec, VerificationConfig } from '../types';
import { ANY, codeName, list, splitCoded, submitted } from './shared';

const CLOSING_TYPE_LABELS: Record<string, string> = { 5: 'Temporary Close', 6: 'Permanent Close', 7: 'Re-Open CC', 8: 'Complete Close' };
const closingTypeId = (r: Rec, d: Rec = {}) => d.ClosingTypeid || r.ClosingTypeid || r.Typeid || r.TypeId || '';

// Misc payment queue type comes from the inbox path (?ptype=…), default CL
const pTypeFrom = (path: string) => {
    const m = /[?&]ptype=([^&]+)/i.exec(path || '');
    return m ? decodeURIComponent(m[1]) : 'CL';
};

// Misc invoice: the verifier may correct name / amounts / remarks before acting (web inline edit → Accounts/UpdateMisc)
function MiscInvoiceEditor({ d, roleId, userName, onSaved }: { d: Rec; roleId: string; userName: string; onSaved: () => void }) {
    const initial = () => ({
        Name: d.Name || '',
        MiscAmount: String(d.MiscIntAmount ?? 0),
        MiscDedAmount: String(d.MiscDedAmount ?? 0),
        Remarks: d.Remarks || '',
    });
    const [form, setForm] = useState<Record<string, string> | null>(null);
    const [busy, setBusy] = useState(false);
    const finalAmt = (f: Record<string, string>) => Math.max(0, (parseFloat(f.MiscAmount) || 0) - (parseFloat(f.MiscDedAmount) || 0));
    const set = (k: string) => (v: string) => {
        if (k !== 'Name' && k !== 'Remarks' && v !== '' && !/^\d*\.?\d{0,2}$/.test(v)) return;
        setForm((p) => ({ ...(p ?? initial()), [k]: v }));
    };

    const save = async () => {
        if (!form) return;
        if (!form.Name.trim()) return Alert.alert('Check the form', 'Name is required.');
        setBusy(true);
        try {
            await putRoute('Accounts/UpdateMisc', {
                Refno: d.Refno,
                Misc_Name: form.Name.trim(),
                MiscAmount: parseFloat(form.MiscAmount) || 0,
                MiscDedAmount: parseFloat(form.MiscDedAmount) || 0,
                Misc_final_Amount: finalAmt(form),
                Remarks: form.Remarks || null,
                RoleID: roleId,
                CreatedBy: userName,
            });
            setForm(null);
            Alert.alert('Saved', 'The invoice was updated.');
            onSaved();
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to save changes');
        } finally {
            setBusy(false);
        }
    };

    if (!form) {
        return (
            <View className="mb-4">
                <SecondaryButton label="Edit name / amounts" icon={Pencil} onPress={() => setForm(initial())} />
            </View>
        );
    }
    return (
        <Block title="Edit invoice">
            <FormField label="Name" required><TextField value={form.Name} onChangeText={set('Name')} /></FormField>
            <FormField label="Amount (₹)"><TextField value={form.MiscAmount} onChangeText={set('MiscAmount')} keyboardType="decimal-pad" /></FormField>
            <FormField label="Deduction Amount (₹)"><TextField value={form.MiscDedAmount} onChangeText={set('MiscDedAmount')} keyboardType="decimal-pad" /></FormField>
            <FormField label="Remarks"><TextField value={form.Remarks} onChangeText={set('Remarks')} multiline /></FormField>
            <FormField label="Final Amount">{null}</FormField>
            <View className="-mt-3 mb-3"><TextField value={money(finalAmt(form)) || '₹0'} editable={false} /></View>
            <View className="flex-row gap-2">
                <View className="flex-1"><SecondaryButton label="Cancel" onPress={() => setForm(null)} /></View>
                <View className="flex-1"><PrimaryButton label="Save" icon={Save} onPress={save} loading={busy} disabled={busy} /></View>
            </View>
        </Block>
    );
}

export const ACCOUNTS_PAYMENT_CONFIGS: Record<string, VerificationConfig> = {
    CashVoucher: {
        title: 'Cash Voucher Verification',
        successLabel: 'Cash Voucher',
        noun: 'voucher',
        icon: Banknote,
        searchPlaceholder: 'Search voucher no, payee, DCA, cost center…',
        queue: { route: 'Accounts/GetgeneralpayablebycashFirst', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Voucherno,
        card: { title: (r) => r.Name || '—', subtitle: (r) => [r.Voucherno, r.SelfCCCode].filter(Boolean).join(' · '), meta: (r) => [r.PaymentDate, r.DCACode].filter(Boolean).join(' · '), amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Voucherno} ${r.Name} ${r.DCACode} ${r.SelfCCCode}`,
        detail: { route: 'Accounts/GetgeneralpayablebycashverificationbyId', params: (r) => ({ Tranno: r.Voucherno }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.Amount,
        remarksKey: (r, d) => d.Voucherno || r.Voucherno,
        showReturn: 'Yes',
        confirmLabel: 'I have verified the payee, amount, cost center, DCA and payment dates on this cash voucher.',
        header: { title: (r, d) => d.Name, subtitle: (r, d) => money(d.Amount), chips: (r, d) => [`Voucher ${d.Voucherno}`, d.PaymentType, d.PaymentDate] },
        sections: (r, d) => [
            {
                title: 'Payment details',
                fields: [
                    ['Invoice Date', d.InvoiceDate], ['Payment Date', d.PaymentDate],
                    ['Self Cost Center', [d.SelfCCCode, d.SelfCCName].filter(Boolean).join(' — ')],
                    !!d.PaidAgainstCCCode && ['Paid Against CC', [d.PaidAgainstCCCode, d.PaidAgainstCCName].filter(Boolean).join(' — ')],
                    ['DCA (Account Head)', [d.DCACode, d.DCAName].filter(Boolean).join(' — ')],
                    ['Sub DCA', [d.SubDCACode, d.SubDCAName].filter(Boolean).join(' — ')],
                    d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
            d.PaymentType === 'GST' && {
                title: 'GST breakdown',
                fields: [
                    ['GST No', d.GSTNo], ['Invoice Amount', money(d.InvoiceAmount)], ['IGST', money(d.IGSTAmount)],
                    ['CGST / SGST', `${money(d.CGSTAmount) || '₹0'} / ${money(d.SGSTAmount) || '₹0'}`], ['Total (incl. GST)', money(d.Amount)],
                ],
            },
        ],
        // The web hides a "send back" action here; ActionPanel only shows Verify / Approve / Return / Reject anyway
        approve: {
            route: 'Accounts/VerifyGeneralpayablebycash',
            payload: (r, d, { value, note, user, roleId }) => ({
                Voucherno: d.Voucherno || r.Voucherno, ApprovalRemarks: note, Approvalstatus: value,
                RoleID: roleId || 0, Createdby: user, UID: d.UID || 0, CID: d.CID || r.CID || 0,
            }),
            ok: ANY,
        },
    },

    CCCashTransfer: {
        title: 'CC Cash Transfer Verification',
        successLabel: 'CC Cash Transfer',
        noun: 'transfer',
        icon: ArrowRightLeft,
        searchPlaceholder: 'Search voucher no, ref no, CC code…',
        queue: { route: 'Accounts/Getcccashtransfer', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => r.Voucherno, subtitle: (r) => `To ${r.PaidAgainstCCCode || '—'} · ${r.Refno}`, meta: (r) => r.InvoiceDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Refno} ${r.Voucherno} ${r.PaidAgainstCCCode} ${r.Amount}`,
        detail: { route: 'Accounts/GetcccashtransferverificationbyId', params: (r) => ({ voucherid: r.Voucherno, Refno: r.Refno }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.Amount,
        remarksKey: (r, d) => d.Refno || r.Refno,
        showReturn: 'Yes',
        confirmLabel: 'I have reviewed the from / to cost centers, amount and transfer date.',
        header: { title: (r, d) => d.Voucherno || r.Voucherno, subtitle: (r, d) => money(d.Amount), chips: (r, d) => [d.Refno, d.InvoiceDate] },
        sections: (r, d) => [{
            fields: [
                ['Reference No', d.Refno], ['Date', d.InvoiceDate],
                ['From Cost Center', codeName(d.SelfCCCodename, ' , ')], ['To Cost Center', codeName(d.OtherCCCodename, ' , ')],
                ['Transfer Amount', money(d.Amount)], d.AmountInWords && ['Amount in Words', d.AmountInWords, true],
                d.Remarks && ['Remarks', d.Remarks, true],
            ],
        }],
        approve: {
            route: 'Accounts/VerifyCCCashTransfer',
            payload: (r, d, { value, note, user, roleId, userId }) => ({
                Refno: r.Refno, ApprovalRemarks: note, Approvalstatus: value, RoleID: roleId, Createdby: user, UID: userId,
            }),
            ok: ANY,
        },
    },

    CCClosing: {
        title: 'CC Closing Verification',
        successLabel: 'CC Closing',
        noun: 'closing',
        icon: CircleX,
        searchPlaceholder: 'Search tran no, CC code, type…',
        queue: { route: 'Accounts/VerifyCCClosingGrid', params: ({ roleId, userId, user }) => ({ Roleid: roleId, Created: user, Userid: userId }) },
        itemKey: (r) => r.Tranno,
        card: {
            title: (r) => r.CCCode || r.Tranno,
            subtitle: (r) => [r.CCName, CLOSING_TYPE_LABELS[closingTypeId(r)] || r.ClosingType].filter(Boolean).join(' · '),
            meta: (r) => [r.Tranno, r.ClosingDate].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.Tranno} ${r.CCCode} ${r.CCName} ${r.ClosingType} ${r.CreatedBy}`,
        detail: { route: 'Accounts/VerifyCCClosingView', params: (r, { roleId }) => ({ Tranno: r.Tranno, Rid: roleId, Typeid: closingTypeId(r) }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.Amount || d.TotalCost,
        remarksKey: (r, d) => d.Tranno || r.Tranno,
        showReturn: 'Yes',
        confirmLabel: 'I have reviewed the CC closing record thoroughly.',
        header: {
            title: (r, d) => d.CCCode || r.CCCode,
            subtitle: (r, d) => d.CCName || r.CCName,
            chips: (r, d) => [CLOSING_TYPE_LABELS[closingTypeId(r, d)] || d.ClosingType, d.Tranno || r.Tranno],
        },
        sections: (r, d) => [
            {
                fields: [
                    ['Closing Date', d.CCClosingDate || d.ClosingDate], ['CC Start Date', d.CCStartDate || d.StartDate], ['CC End Date', d.CCEndDate || d.EndDate],
                    d.CreatedBy && ['Created By', d.CreatedBy],
                ],
            },
            (d.Amount || d.TotalCost || d.TotalRevenue) && {
                title: 'Financial summary',
                fields: [
                    d.TotalRevenue != null && ['Total Revenue', money(d.TotalRevenue)], d.TotalCost != null && ['Total Cost', money(d.TotalCost)],
                    d.Amount != null && ['Amount', money(d.Amount)], d.NetProfit != null && ['Net P&L', money(d.NetProfit)],
                ],
            },
            {
                fields: [
                    d.ResourceHead && ['Resource Head', d.ResourceHead, true], d.ResDetails && ['Resource Details', d.ResDetails, true],
                    d.Alertnote && ['Alert Note', d.Alertnote, true], d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
        ],
        extra: (r, d) => (list(d.DCABudgetData).length ? (
            <TableBlock title="DCA budget" heads={['DCA Head', 'Budget', 'Actual', 'Balance']}
                rows={list(d.DCABudgetData).map((x) => [x.DCAHead || x.DCAName, fmt(x.Budget), fmt(x.Actual), fmt(x.Balance)])} />
        ) : null),
        approve: {
            route: 'Accounts/ApproveCCClose',
            payload: (r, d, { value, note, user, roleId, userId }) => ({
                STranno: d.Tranno || r.Tranno || '', SId: d.Id || r.Id || 0,
                SCCClosingDate: d.CCClosingDate || d.ClosingDate || '', SAlertnote: d.Alertnote || d.AlertNote || '',
                SRemarks: note, Appstatus: value, SRoleID: roleId, SCreatedby: user, SUserId: userId,
                SCCStartDate: d.CCStartDate || d.StartDate || '', SCCEndDate: d.CCEndDate || d.EndDate || '',
                SClosingTypeid: closingTypeId(r, d), ResourceHead: d.ResourceHead || '', ResDetails: d.ResDetails || '',
            }),
            ok: ANY,
        },
    },

    LoadWallet: {
        title: 'Load Wallet Verification',
        successLabel: 'Wallet transfer',
        noun: 'wallet transfer',
        icon: Wallet,
        searchPlaceholder: 'Search ref no, wallet, bank…',
        queue: { route: 'Accounts/GetVerificationLoadWallet', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.TransactionRefno,
        card: {
            title: (r) => r.ToWalletName || '—',
            subtitle: (r) => `${r.Transferfrom === 'Bank' ? r.FromBankName : r.FromWalletName} → ${r.Transferfrom} · ${r.TransactionRefno}`,
            amount: (r) => money(r.TransferAmount),
        },
        searchText: (r) => `${r.TransactionRefno} ${r.ToWalletName} ${r.Transferfrom} ${r.FromBankName} ${r.FromWalletName}`,
        detail: { route: 'Accounts/GetVerificationLoadwalletbyNo', params: (r) => ({ Refno: r.TransactionRefno, TransferType: r.Transferfrom }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.TransferAmount,
        remarksKey: (r) => r.TransactionRefno,
        showReturn: 'Yes',
        confirmLabel: 'I have verified all wallet transfer details.',
        header: { title: (r, d) => d.ToWalletName || r.ToWalletName, subtitle: (r, d) => money(d.TransferAmount), chips: (r, d) => [d.TransactionRefno, `From ${d.Transferfrom}`] },
        sections: (r, d) => [{
            fields: [
                [d.Transferfrom === 'Bank' ? 'Source Bank' : 'Source Wallet', d.Transferfrom === 'Bank' ? r.FromBankName : d.FromWalletName],
                ['To Wallet', d.ToWalletName], ['Date', d.TransactionDate], ['Mode of Payment', d.Modeofpay],
                ['Transaction No', d.TransactionNo], ['Reference No', d.TransactionRefno],
                d.AmountInWords && ['Amount in Words', d.AmountInWords, true],
                d.WalletRemarks && ['Wallet Remarks', d.WalletRemarks, true], d.Remarks && ['Remarks', d.Remarks, true],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveLoadWallet',
            payload: (r, d, { value, note, user, roleId }) => ({
                Transferfrom: d.Transferfrom || r.Transferfrom, FormId: d.FormId || 0, ToId: d.ToId || 0,
                TransactionRefno: r.TransactionRefno, TransferAmount: d.TransferAmount || '0', Action: value,
                Remarks: note, RoleId: roleId || 0, Createdby: user,
            }),
            ok: ANY,
        },
    },

    MiscPayment: {
        title: 'Misc Payment Verification',
        successLabel: 'Misc Payment',
        noun: 'payment',
        icon: HandCoins,
        searchPlaceholder: 'Search name, ref no…',
        queue: { route: 'Accounts/VerifyMiscPayment', params: ({ roleId, userId, path }) => ({ Roleid: roleId, UID: userId, PType: pTypeFrom(path) }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => r.Name, subtitle: (r) => r.Refno, meta: (r) => r.InvoiceDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Name} ${r.Refno}`,
        detail: { route: 'Accounts/VerifyMiscPaymentView', params: (r) => ({ RefNo: r.Refno }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r, d) => d.Refno || r.Refno,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this payment.',
        header: { title: (r, d) => d.Name || r.Name, subtitle: (r, d) => money(d.Amount), chips: (r, d) => [d.Refno || r.Refno, d.InvoiceDate || r.InvoiceDate, d.Status] },
        sections: (r, d) => [
            !!d.clientid && {
                title: 'Client details',
                fields: [['Client', d.clientid], ['Sub Client', d.Subclient], ['Cost Center', d.MiscIntCCCode], ['DCA', d.MiscIntDCACode], ['Amount', money(d.MiscIntAmount)]],
            },
            (d.MiscDedCCCode || d.MiscDedAmount > 0) && {
                title: 'Deduction account head',
                fields: [['Cost Center', d.MiscDedCCCode], ['DCA', d.MiscDedDCACode], ['Amount', money(d.MiscDedAmount)]],
            },
            {
                title: 'Bank payment',
                fields: [
                    ['Bank', d.Bank], ['Mode of Pay', d.ModeofPay], ['Reference / Cheque No', d.No], ['Payment Date', d.PaymentDate],
                    ['Final Amount', money(d.Amount)], d.BankPaymentRemarks && ['Payment Remarks', d.BankPaymentRemarks, true],
                    d.Remarks && ['Invoice Remarks', d.Remarks, true],
                ],
            },
        ],
        approve: {
            route: 'Accounts/ApproveMiscPayment',
            payload: (r, d, { value, note, user, roleId }) => ({ Refno: d.Refno || r.Refno, ApprovalRemarks: note, Approvalstatus: value, RoleID: roleId, Createdby: user }),
            ok: submitted,
        },
    },

    MiscInvoice: {
        title: 'Misc Invoice Verification',
        successLabel: 'Misc Invoice',
        noun: 'invoice',
        icon: FileText,
        searchPlaceholder: 'Search name, ref no…',
        queue: { route: 'Accounts/GetMisc', params: ({ roleId }) => ({ Roleid: roleId, Type: 'CL' }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => r.Name, subtitle: (r) => r.Refno, meta: (r) => r.InvoiceDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Name} ${r.Refno}`,
        detail: { route: 'Accounts/GetmiscverificationbyId', params: (r) => ({ RefNo: r.Refno }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r, d) => d.Refno || r.Refno,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this invoice.',
        header: {
            title: (r, d) => d.Name || r.Name,
            subtitle: (r, d) => money(d.Amount),
            chips: (r, d) => [d.Refno || r.Refno, d.clientid ? 'Interest from Client' : 'Interest from Others', d.InvoiceDate || r.InvoiceDate],
        },
        sections: (r, d) => [
            !!d.clientid && {
                title: 'Client details',
                fields: [['Client', d.clientid], ['Sub Client', d.Subclient], ['Cost Center', d.MiscIntCCCode], ['DCA', d.MiscIntDCACode], ['Sub DCA', d.MiscIntSubDCACode]],
            },
            (d.MiscDedCCCode || d.MiscDedAmount > 0) && {
                title: 'Deduction account head',
                fields: [['Cost Center', d.MiscDedCCCode], ['DCA', d.MiscDedDCACode], ['Sub DCA', d.MiscDedSubDCACode]],
            },
            { title: 'Summary', fields: [['Name', d.Name], ['Final Amount', money(d.Amount)], d.Remarks && ['Remarks', d.Remarks, true]] },
        ],
        extra: (r, d, { reload, roleId, user }) => <MiscInvoiceEditor d={d} roleId={roleId} userName={user} onSaved={reload} />,
        approve: {
            route: 'Accounts/VerifyMisc',
            payload: (r, d, { value, note, user, roleId }) => ({ Refno: d.Refno || r.Refno || '', RoleID: roleId, Createdby: user, Approvalstatus: value, ApprovalRemarks: note }),
            ok: submitted,
        },
    },

    AdvancePayment: {
        title: 'Advance Payment Verification',
        successLabel: 'Advance Payment',
        noun: 'advance payment',
        icon: WalletCards,
        searchPlaceholder: 'Search PO, transaction ref…',
        queue: { route: 'Accounts/GetVerificationAdvancePeyments', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionId,
        card: { title: (r) => `PO ${r.PONo}`, subtitle: (r) => `CC ${r.CCCode}`, meta: (r) => r.TransactionDate, amount: (r) => money(r.InvTotalValue) },
        searchText: (r) => `${r.PONo} ${r.BankTransactionRefNo}`,
        detail: { route: 'Accounts/GetVerificationAdvancePaybyId', params: (r) => ({ TransactionId: r.BankTransactionId }) },
        rowAux: [{ name: 'deductions', route: 'Accounts/GetClientDeductions', params: (r) => ({ InvoiceNo: r.BankTransactionRefNo }), when: (r) => !!r.BankTransactionRefNo }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTransactionRefNo || r.BankTransactionRefNo,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this advance payment.',
        header: {
            title: (r, d) => `PO ${d.PONo || r.PONo}`,
            subtitle: (r, d) => money(d.InvTotalValue),
            chips: (r, d) => ['Advance Payment', `CC ${splitCoded(d.CCName || d.CCCode).code || d.CCCode}`, d.RequestDate],
        },
        sections: (r, d) => [
            { title: 'Client details', fields: [['Client', d.Client], ['Sub Client', d.SubClient], ['RA Number', d.RANo]] },
            {
                title: 'Payment details',
                fields: [
                    ['Bank', d.Bank], ['Reference No', d.Number], ['Transaction Date', d.TransactionDate],
                    ['Basic Value', money(d.BasicValue)], ['Total Amount', money(d.InvTotalValue)], d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
        ],
        extra: (r, d, { aux }) => (list(aux.deductions).length ? (
            <TableBlock title="Deductions" heads={['Cost Center', 'Account Head', 'Sub Account Head', 'Amount']}
                rows={list(aux.deductions).map((x) => [x.CCCode, x.DCAName || x.DCACode, x.SubDcaName || x.SubDcaCode, fmt(x.DeducationValue)])} />
        ) : null),
        approve: {
            route: 'Accounts/ApproveAdvancePayment',
            payload: (r, d, { value, note, user, roleId, aux }) => {
                // Deductions go as trailing-comma CSVs
                const ded = list(aux.deductions);
                const csv = (k: string) => (ded.length ? `${ded.map((x) => x[k]).join(',')},` : '');
                return {
                    BankTransactionId: r.BankTransactionId, BankTransactionRefNo: d.BankTransactionRefNo,
                    DedCcs: csv('CCCode'), DedDcas: csv('DCACode'), DedSubdcas: csv('SubDcaCode'), DedAmounts: csv('DeducationValue'),
                    Action: value, ApprovalNote: note, Createdby: user, RequestDate: d.RequestDate,
                    Roleid: parseInt(roleId, 10), Bank: d.Bank, Amount: parseFloat(d.InvTotalValue) || 0,
                };
            },
            ok: submitted,
        },
    },
};
