// Accounts receipts, refunds & day book — the Corex web's dedicated pages expressed as configs:
//   RetentionPayment pages/Accounts/VerifyRetentionPayment.jsx        (accountsSlice/retentionPaymentVerificationSlice)
//   HoldPayment      pages/Accounts/VerifyHoldPayment.jsx             (accountsSlice/holdPaymentVerificationSlice)
//   ClientRecievable pages/Accounts/VerifyClientRecievable.jsx        (accountsSlice/clientRecievableVerificationSlice)
//   ScrapSaleReceipt pages/Accounts/VerifyReceiptAgainstScrapSale.jsx (accountsSlice/scrapSaleReceiptVerificationSlice)
//   Refund           pages/Accounts/VerifyRefund.jsx                  (accountsSlice/refundVerificationSlice)
//   CentralDayBook   pages/Accounts/VerifyCentralDayBook.jsx          (accountsSlice/centralDayBookVerificationSlice)
// All ask for the "I have verified" tick, keep Return, and treat "Submitted…" as success.
import React from 'react';
import { BookOpenCheck, PauseCircle, PiggyBank, Receipt, Recycle, Undo2 } from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { TableBlock, fmt } from '../parts';
import type { Rec, VerificationConfig } from '../types';
import { codeName, csv, list, splitCoded, submitted } from './shared';

const REFUND_CATEGORY: Record<string, string> = { Refund: 'Refund (SD)', OtherRefund: 'Other Refund' };
const DAYBOOK_CATEGORY: Record<string, string> = { CostCenter: 'Cost Center', Bank: 'Bank' };
const nameOf = (raw: unknown) => splitCoded(raw).name || splitCoded(raw).code;

const deductionsTable = (rows: Rec[]) => (rows.length ? (
    <TableBlock
        title="Deductions"
        heads={['Cost Center', 'Account Head', 'Sub Account Head', 'Amount']}
        rows={rows.map((x) => [x.CCCode, x.DCAName || x.DCACode, x.SubDcaName || x.SubDcaCode, fmt(x.DeducationValue)])}
    />
) : null);

// Retention and Hold payment verifications are the same page with a different invoice list / balance
const retentionOrHold = (kind: 'Retention' | 'Hold'): VerificationConfig => {
    const hold = kind === 'Hold';
    const rows = (d: Rec) => list(hold ? d.HoldInvoiceList : d.RetInvDetailsList);
    const bal = (x: Rec) => (hold ? x.HoldBalance : x.RetBalance);
    return {
        title: `${kind} Payment Verification`,
        successLabel: `${kind} Payment`,
        noun: `${kind.toLowerCase()} payment`,
        icon: hold ? PauseCircle : PiggyBank,
        searchPlaceholder: 'Search client, transaction ref…',
        queue: { route: hold ? 'Accounts/GetVerificationholdPeyments' : 'Accounts/GetVerificationRetentionPeyments', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionRefNo,
        card: { title: (r) => r.ClientName || r.ClientCode, subtitle: (r) => `Txn ${r.BankTransactionRefNo}`, meta: (r) => r.ReturnPayDate, amount: (r) => money(r.PaymentAmount) },
        searchText: (r) => `${r.ClientName} ${r.ClientCode} ${r.BankTransactionRefNo}`,
        detail: {
            route: hold ? 'Accounts/GetVerificationHoldDetailsbyRefno' : 'Accounts/GetVerificationRetentionDetailsbyRefno',
            params: (r) => ({ TransRefno: r.BankTransactionRefNo }),
        },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTransactionRefNo || r.BankTransactionRefNo,
        showReturn: 'Yes',
        confirmLabel: `I have verified this ${kind.toLowerCase()} payment.`,
        header: {
            title: (r, d) => d.ClientName || d.ClientCode || r.ClientName,
            subtitle: (r, d) => money(d.PaymentAmount),
            chips: (r, d) => [`${kind} Payment`, `Txn ${d.BankTransactionRefNo || r.BankTransactionRefNo}`, d.ReturnPayDate],
        },
        sections: (r, d) => [{
            title: 'Payment details',
            fields: [
                ['Bank', d.Bank], ['Mode of Pay', d.ModeOfPay], ['Reference No', d.No], ['Client', d.ClientName || d.ClientCode],
                ['Sub Client', d.SubClientName || d.SubClientCode], ['Total Amount', money(d.PaymentAmount)], d.Remarks && ['Remarks', d.Remarks, true],
            ],
        }],
        extra: (r, d) => (rows(d).length ? (
            <TableBlock title="Invoices" heads={['Invoice No', 'PO', 'Date', kind]} rows={rows(d).map((x) => [x.ClientInvoiceNo, x.PONumber, x.InvoiceDate, fmt(bal(x))])} />
        ) : null),
        approve: {
            route: hold ? 'Accounts/ApproveHoldPayment' : 'Accounts/ApproveRetentionPayment',
            payload: (r, d, { value, note, user, roleId }) => ({
                BankTransactionRefNo: d.BankTransactionRefNo || r.BankTransactionRefNo,
                InvoiceNos: csv(rows(d).map((x) => x.ClientInvoiceNo)),
                [hold ? 'PaidHoldAmounts' : 'PaidRetAmounts']: csv(rows(d).map(bal)),
                Action: value, ApprovalNote: note, Bank: d.Bank, PaymentAmount: parseFloat(d.PaymentAmount) || 0,
                Createdby: user, Roleid: parseInt(roleId, 10),
            }),
            ok: submitted,
        },
    };
};

export const ACCOUNTS_RECEIPT_CONFIGS: Record<string, VerificationConfig> = {
    RetentionPayment: retentionOrHold('Retention'),
    HoldPayment: retentionOrHold('Hold'),

    ClientRecievable: {
        title: 'Client Receipt Verification',
        successLabel: 'Client Receipt',
        noun: 'receipt',
        icon: Receipt,
        searchPlaceholder: 'Search invoice, PO…',
        queue: { route: 'Accounts/GetVerificationClientRecievable', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionId,
        card: { title: (r) => r.InvoiceNo, subtitle: (r) => `PO ${r.PONo}`, meta: (r) => r.TransactionDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.InvoiceNo} ${r.PONo}`,
        detail: { route: 'Accounts/GetVerificationClientRecievablebyTransId', params: (r) => ({ TransactionId: r.BankTransactionId }) },
        rowAux: [{ name: 'deductions', route: 'Accounts/GetClientDeductions', params: (r) => ({ InvoiceNo: r.InvoiceNo }) }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTransactionRefNo,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this receipt.',
        header: {
            title: (r, d) => d.InvoiceNo || r.InvoiceNo,
            subtitle: (r, d) => money(d.Amount),
            chips: (r, d) => [d.InvoiceCategory || 'Invoice Service', `PO ${d.PONo || r.PONo}`, d.InvoiceDate],
        },
        sections: (r, d) => [
            { title: 'Client details', fields: [['Client', d.Client], ['Sub Client', splitCoded(d.SubClient).code], ['Cost Center', splitCoded(d.CCCode).code]] },
            {
                title: 'Payment details',
                fields: [
                    ['Bank', d.Bank], ['Reference No', d.Number], ['Transaction Date', d.TransactionDate], ['Basic Value', money(d.Basic_Value)],
                    ['Advance', money(d.Advance)], ['Retention', money(d.Rentention)], ['Hold', money(d.Hold)], ['Amount', money(d.Amount)],
                    d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
        ],
        extra: (r, d, { aux }) => deductionsTable(list(aux.deductions)),
        approve: {
            route: 'Accounts/ApproveClientRecievable',
            payload: (r, d, { value, note, user, roleId, aux }) => {
                const ded = list(aux.deductions);
                return {
                    BankTransactionId: r.BankTransactionId, InvoiceNo: d.InvoiceNo,
                    DedCcs: csv(ded.map((x) => x.CCCode)), DedDcas: csv(ded.map((x) => x.DCACode)),
                    DedSubdcas: csv(ded.map((x) => x.SubDcaCode)), DedAmounts: csv(ded.map((x) => x.DeducationValue)),
                    Action: value, ApprovalNote: note, Createdby: user, InvoiceDate: d.InvoiceDate, Roleid: parseInt(roleId, 10),
                    Rentention: parseFloat(d.Rentention) || 0, Advance: parseFloat(d.Advance) || 0, Hold: parseFloat(d.Hold) || 0,
                    Bank: d.Bank, Amount: parseFloat(d.Amount) || 0,
                };
            },
            ok: submitted,
        },
    },

    ScrapSaleReceipt: {
        title: 'Receipt against Scrap Sale Verification',
        successLabel: 'Scrap sale receipt',
        noun: 'receipt',
        icon: Recycle,
        searchPlaceholder: 'Search client, ref no…',
        queue: { route: 'Accounts/VerifyReceiptAgainstScrapSaleGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTranNo,
        card: { title: (r) => nameOf(r.ClientCode), subtitle: (r) => `Ref ${r.BankTranNo}`, meta: (r) => r.Date, amount: (r) => money(r.BalanceAmount) },
        searchText: (r) => `${r.ClientCode} ${r.BankTranNo}`,
        detail: { route: 'Accounts/VerifyReceiptAgainstScrapeSaleView', params: (r) => ({ Refno: r.BankTranNo }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTranNo,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this receipt.',
        header: {
            title: (r, d) => nameOf(d.ClientCode) || r.ClientCode,
            subtitle: (r, d) => money(d.TotalAmount),
            chips: (r, d) => [d.ScrapSaleClientInvoiceno || 'Scrap Sale Receipt', `Ref ${d.BankTranNo || r.BankTranNo}`, d.InvoiceDate],
        },
        sections: (r, d) => [
            {
                title: 'Client details',
                fields: [
                    ['Client', nameOf(d.ClientCode)], ['Sub Client', nameOf(d.SubClientCode)],
                    ['Cost Center', d.CostCenterName ? `${d.CostCenter} — ${d.CostCenterName}` : d.CostCenter], ['Request No', d.ScrapSaleRequestno],
                ],
            },
            {
                title: 'Payment details',
                fields: [
                    ['Bank', d.Bank], ['Mode of Pay', d.ModeofPay], ['Reference No', d.No], ['Payment Date', d.Date],
                    ['Basic Amount', money(d.BasicAmount)], ['Paid Amount', money(d.PaidAmount)], ['Total Amount', money(d.TotalAmount)],
                    ['Balance Amount', money(d.BalanceAmount)], d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
        ],
        extra: (r, d) => {
            const heads = ['Cost Center', 'Account Head', 'Sub Account Head', 'Amount'];
            const gst = d.GstApplicable === 'Yes'
                ? [[d.CCCode1, d.DCA1, d.SDCA1, d.Taxvalue1], [d.CCCode2, d.DCA2, d.SDCA2, d.Taxvalue2]].filter((x) => x[1])
                : [];
            return (
                <>
                    {gst.length ? <TableBlock title="GST breakup" heads={heads} rows={gst.map(([cc, dca, sdca, amt]) => [cc, dca, sdca, fmt(amt)])} /> : null}
                    {d.TCSApplicable === 'Yes' && d.TcsDCA ? (
                        <TableBlock title="TCS breakup" heads={heads} rows={[[d.TcsCCCode, d.TcsDCA, d.TcsSDCA, fmt(d.TcsValue)]]} />
                    ) : null}
                </>
            );
        },
        approve: {
            route: 'Accounts/ApproveReceiptAgainstScrapSale',
            payload: (r, d, { value, note, user, roleId }) => ({ BankTranNo: r.BankTranNo, AprovalRemarks: note, Status: value, RoleID: parseInt(roleId, 10), Createdby: user }),
            ok: submitted,
        },
    },

    Refund: {
        title: 'Refund Verification',
        successLabel: 'Refund',
        noun: 'refund',
        icon: Undo2,
        searchPlaceholder: 'Search name, ref no…',
        queue: { route: 'Accounts/Getrefund', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Refno,
        card: {
            title: (r) => r.Name,
            subtitle: (r) => [`Ref ${r.Refno}`, REFUND_CATEGORY[r.paymentcategory] || r.paymentcategory].filter(Boolean).join(' · '),
            meta: (r) => r.Date,
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.Name} ${r.Refno}`,
        detail: { route: 'Accounts/GetrefverificationbyId', params: (r) => ({ Tranno: r.Refno }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.Amount,
        remarksKey: (r, d) => d.Refno,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this refund.',
        header: {
            title: (r, d) => d.Name || r.Name,
            subtitle: (r, d) => money(d.Amount),
            chips: (r, d) => [REFUND_CATEGORY[d.paymentcategory] || d.paymentcategory || 'Refund', `Ref ${d.Refno || r.Refno}`, d.Date],
        },
        sections: (r, d) => [
            {
                title: 'Cost center & account head',
                fields: [
                    ['Cost Center', codeName(d.Refund_CC_Code)], ['Account Head', codeName(d.Refund_DCA_Code)],
                    ['Sub Account Head', codeName(d.Refund_Sub_DCA_Code)], ['Amount', money(d.RefAmount)],
                ],
            },
            parseFloat(d.RefIntAmount || 0) > 0 && {
                title: 'Interest breakup',
                fields: [
                    ['Interest CC', codeName(d.RefIntCC)], ['Interest Account Head', codeName(d.RefIntDCA)],
                    ['Interest Sub Account Head', codeName(d.RefIntSDCA)], ['Interest Amount', money(d.RefIntAmount)],
                ],
            },
            {
                title: 'Payment details',
                fields: [
                    ['Bank', d.Bank], ['Mode of Pay', d.ModeofPay], ['Reference No', d.No], ['Payment Date', d.PaymentDate],
                    ['Final Amount', money(d.Amount)], d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
        ],
        approve: {
            route: 'Accounts/VerifyRefund',
            payload: (r, d, { value, note, user, roleId }) => ({ Refno: r.Refno, ApprovalRemarks: note, Approvalstatus: value, RoleID: parseInt(roleId, 10), Createdby: user }),
            ok: submitted,
        },
    },

    CentralDayBook: {
        title: 'Central Day Book Verification',
        successLabel: 'Day book entry',
        noun: 'entry',
        icon: BookOpenCheck,
        searchPlaceholder: 'Search name, row id, category…',
        queue: { route: 'Accounts/Getcentraldaybook', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Rowid,
        card: {
            title: (r) => r.Name,
            subtitle: (r) => [`Row ${r.Rowid}`, DAYBOOK_CATEGORY[r.Category] || r.Category].filter(Boolean).join(' · '),
            meta: (r) => r.VoucherDate,
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.Name} ${r.Rowid} ${r.Category}`,
        detail: { route: 'Accounts/GetcdbverificationbyId', params: (r) => ({ Rowid: r.Rowid }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.Amount,
        remarksKey: (r, d) => d.Rowid,
        showReturn: 'Yes',
        confirmLabel: 'I have verified this entry.',
        header: {
            title: (r, d) => d.Name || r.Name,
            subtitle: (r, d) => money(d.Amount),
            chips: (r, d) => [DAYBOOK_CATEGORY[d.Category || r.Category] || d.Category || 'Central Day Book', `Row ${d.Rowid || r.Rowid}`, d.VoucherDate || r.VoucherDate],
        },
        sections: (r, d) => {
            const category = d.Category || r.Category;
            const amount = (v: unknown) => (v !== null && v !== undefined ? money(v as number) : null);
            return [{
                title: 'Transfer details',
                fields: [
                    ['Transfer To', DAYBOOK_CATEGORY[category] || category],
                    [category === 'Bank' ? 'Bank' : 'Cost Center', category === 'Bank' ? d.Bankname : d.CostCenter],
                    ['Amount', money(d.Amount)], ['Unassigned Balance', amount(d.Unassignedbalance)],
                    ['Total Cost Center Balance', amount(d.TotalCostCenterBalance)], ['Pending Cost Center Balance', amount(d.PendingCostCenterBalance)],
                    d.Remarks && ['Remarks', d.Remarks, true],
                ],
            }];
        },
        approve: {
            route: 'Accounts/Verifycdb',
            payload: (r, d, { value, note, user, roleId }) => ({ Rowid: r.Rowid, Remarks: note, Appstatus: value, RoleID: parseInt(roleId, 10), Createdby: user }),
            ok: submitted,
        },
    },
};
