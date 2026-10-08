// Payments & accounting entries — ported from the Corex web pages/Accounts/verificationConfigs.jsx
// (GeneralPayment, JournalVoucher, CCSEPPay, TDSPayment, VendorPayableWriteoff, VendorCMSPayment,
// BOESettlement, LCBGCreation, CreditDebitNote). Routes, params, payloads and success literals are the web's.
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { BadgePercent, Banknote, Building2, Eraser, FileDiff, Landmark, NotebookPen, Ship } from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import {
    CheckedItems, RouteTable, TableBlock, TotalLine, VendorCMSVerifyGrid, allItemsChecked, fmt, splitTrail,
} from '../parts';
import type { Rec, VerificationConfig } from '../types';

const list = (v: unknown): Rec[] => (Array.isArray(v) ? v : []);

// Legacy VerifyCCSEPPayView display names for SEPPayments.PaymentFor
const SEP_PAYMENT_LABELS: Record<string, string> = { StaffPF: 'Staff PF', LabourPF: 'Labour PF', StaffESI: 'Staff ESI', LabourESI: 'Labour ESI' };
const sepPaymentLabel = (v: string) => SEP_PAYMENT_LABELS[v] || v;

// LC/BG type as the legacy view spells it (LC → Letter of Credit, anything else → Bank Guarantee)
const lcbgTypeName = (t: string) => (t === 'LC' ? 'Letter of Credit' : t ? 'Bank Guarantee' : '');

const Link = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} hitSlop={6}>
        <Text className="text-xs font-semibold text-orange-600">{label}</Text>
    </TouchableOpacity>
);

export const PAYMENT_CONFIGS: Record<string, VerificationConfig> = {
    // Legacy /AccountsApproval/VerifyGeneralPayment (+ VerifyGeneralPaymentGrid / VerifyGeneralPaymentView)
    GeneralPayment: {
        title: 'General Payable Verification',
        successLabel: 'General Payment',
        noun: 'payment',
        icon: Banknote,
        searchPlaceholder: 'Search by transaction, cost center, account head…',
        queue: { route: 'Accounts/GetVerificationGeneralPayments', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionRefNo,
        card: {
            title: (r) => r.CCCodename || r.CCCode,
            subtitle: (r) => r.DCACodename || r.DCACode,
            meta: (r) => [r.SubDcaname || r.SubDCACode, `Txn ${r.BankTransactionRefNo}`].filter(Boolean).join(' · '),
            amount: (r) => money(r.TransactionAmount),
        },
        searchText: (r) => `${r.BankTransactionRefNo} ${r.CCCodename} ${r.DCACodename} ${r.SubDcaname} ${r.TransactionAmount}`,
        detail: { route: 'Accounts/GetGeneralPaymentsbyRefno', params: (r) => ({ TransRefno: r.BankTransactionRefNo }) },
        moid: (r, d) => d.MOID,
        // Legacy passes the payment amount so approval limits apply
        chkAmt: (r, d) => d.TransactionAmount,
        remarksKey: (r) => r.BankTransactionRefNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        isReturned: (r) => String(r.Status).trim() === '0',
        returnedNotice: 'Correct and resubmit it from the General Payment screen — there is nothing to verify until it is resubmitted.',
        header: {
            title: (r, d) => d.Name || d.CCCodename,
            subtitle: (r, d) => money(d.TransactionAmount),
            chips: (r, d) => [d.ModeOfPay, `Txn ${r.BankTransactionRefNo}`, d.TransactionDate],
        },
        sections: (r, d) => [{
            fields: [
                ['Cost Center', d.CCCodename], ['Account Head', d.DCACodename], ['Sub Account Head', d.SubDcaname],
                ['Name', d.Name], ['Bank Name', d.Bank], ['Mode of Pay', d.ModeOfPay],
                ['Transaction Number', d.Number], ['Transaction Date', d.TransactionDate],
                ['Transaction Amount', money(d.TransactionAmount)],
                ['Amount in Words', d.AmountInWords, true],
                d.Remarks && ['Remarks', d.Remarks, true],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveGeneralPayment',
            payload: (r, d, { action, note, user, roleId }) => ({
                BankTransactionRefNo: r.BankTransactionRefNo, Action: action, Roleid: roleId, ApprovalNote: note,
                Createdby: user, Bank: d.Bank, TransactionAmount: d.TransactionAmount,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyJournalVoucher (+ VerifyJournalVoucherGrid / VerifyJournalVoucherView)
    JournalVoucher: {
        title: 'Journal Voucher Verification',
        successLabel: 'Journal Voucher',
        noun: 'journal voucher',
        icon: NotebookPen,
        searchPlaceholder: 'Search by transaction number, description, date…',
        queue: { route: 'Accounts/GetVerificationJV', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.TranNo,
        card: { title: (r) => `JV ${r.TranNo}`, subtitle: (r) => r.JVRemarks, meta: (r) => r.Date, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.TranNo} ${r.JVRemarks} ${r.Date} ${r.Amount}`,
        detail: { route: 'Accounts/GetVerificationJVbyNo', params: (r) => ({ TranNo: r.TranNo }) },
        rowAux: [{ name: 'jvLedgers', route: 'Accounts/GetJVledgerDetailsbyTranno', params: (r) => ({ TranNo: r.TranNo }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.TranNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        isReturned: (r) => String(r.Status).trim() === '0',
        returnedNotice: 'Correct and resubmit it from the Journal Voucher screen — there is nothing to verify until it is resubmitted.',
        header: { title: (r) => `JV ${r.TranNo}`, subtitle: (r, d) => money(d.Amount), chips: (r, d) => [d.Date] },
        sections: (r, d) => [{
            fields: [
                ['JV Creation Date', d.Date], ['Transaction Number', d.TranNo],
                ['Credit Amount', money(d.Amount)], ['Debit Amount', money(d.Amount)],
                ['JV Remarks', d.JVRemarks, true],
            ],
        }],
        extra: (r, d, { aux }) => {
            const rows = list(aux.jvLedgers);
            const sum = (t: string) => rows.filter((x) => x.Trantypes === t).reduce((a, x) => a + (Number(x.Ledgeramounts) || 0), 0);
            return (
                <TableBlock
                    title="Ledgers"
                    heads={['Ledger Name', 'Ledger Type', 'Transaction', 'Payment Type', 'Invoice No', 'Amount']}
                    rows={rows.map((x) => [x.Ledgers, x.LedgerFors, x.Trantypes, x.Paytypes, x.Invnos, fmt(x.Ledgeramounts)])}
                    foot={rows.length ? [`Credit ${fmt(sum('Credit')) || '0'} / Debit ${fmt(sum('Debit')) || '0'}`] : undefined}
                />
            );
        },
        approve: {
            route: 'Accounts/ApproveJV',
            payload: (r, d, { action, note, user, roleId }) => ({ TranNo: r.TranNo, Action: action, ApprovalNote: note, CreatedBy: user, Roleid: roleId }),
            ok: ['Successfull'],
        },
    },

    // Legacy /Accounts/VerifyCCSEPPay (+ Grid / View) — CC-wise Salary / Wages / PF / ESI payments
    CCSEPPay: {
        title: 'Salary/Wages/PF/ESI Payment Verification',
        successLabel: 'Payment',
        noun: 'payment',
        icon: Landmark,
        searchPlaceholder: 'Search by transaction, payment for, month, year…',
        queue: { route: 'Accounts/GetVerificationSEPPay', params: ({ roleId }) => ({ RoleId: roleId }) },
        itemKey: (r) => r.TransactionRefno,
        card: {
            title: (r) => sepPaymentLabel(r.PaymentFor),
            subtitle: (r) => `${r.MonthName || ''} ${r.Year || ''}`.trim(),
            meta: (r) => `Txn ${r.TransactionRefno}`,
        },
        searchText: (r) => `${r.TransactionRefno} ${r.PaymentFor} ${r.MonthName} ${r.Year}`,
        detail: { route: 'Accounts/GetSEPPaybyRefno', params: (r) => ({ TransactionRefno: r.TransactionRefno }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.TransactionRefno,
        // Legacy drops Return from this screen's status list; returned rows open the same view (no editor)
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: {
            title: (r, d) => sepPaymentLabel(d.PaymentFor),
            subtitle: (r, d) => money(d.PaymentAmount),
            chips: (r, d) => [`${d.MonthName || ''} ${d.Year || ''}`.trim(), `Txn ${r.TransactionRefno}`, String(r.Status).trim() === '0' && 'Returned'],
        },
        sections: (r, d) => [{
            title: 'Payment for',
            fields: [['Payment For', sepPaymentLabel(d.PaymentFor)], ['Year', d.Year], ['Month', d.MonthName]],
        }, {
            title: 'Payment details',
            fields: [
                ['Bank', d.BankName], ['Mode of Pay', d.ModeofPay || d.ModeOfPay], ['Payment No', d.PaymentNo],
                ['Payment Date', d.PaymentDate], ['Payment Amount', money(d.PaymentAmount)],
                ['Amount in Words', d.AmountInWords, true],
                d.Remarks && ['Remarks', d.Remarks, true],
            ],
        }],
        extra: (r, d) => {
            const pf = d.PaymentFor === 'StaffPF' || d.PaymentFor === 'LabourPF';
            const ccs = list(d.CCData);
            const total = ccs.reduce((a, x) => a + (Number(x.Amount) || 0), 0);
            // ApprovalNote carries "Role:Employee:Remarks||…" — the first entry is the creator
            const approvals = splitTrail(d.ApprovalNote).map(([role, emp, ...rest], i) => [
                emp, i === 0 ? `Created by · ${role || ''}` : 'Verified by', rest.join(':'),
            ]);
            return (
                <>
                    <TableBlock
                        title="Cost centers"
                        heads={pf ? ['Cost Center', 'Contribution', 'Amount'] : ['Cost Center', 'Amount']}
                        rows={ccs.map((x) => (pf ? [x.CCName, x.ContributeType, fmt(x.Amount)] : [x.CCName, fmt(x.Amount)]))}
                        foot={ccs.length ? ['Total', fmt(total)] : undefined}
                    />
                    {approvals.length ? <TableBlock title="Approvals" heads={['Employee', '', 'Remarks']} rows={approvals} /> : null}
                </>
            );
        },
        approve: {
            route: 'Accounts/ApproveSEPPay',
            payload: (r, d, { action, note, user, roleId }) => ({
                PaymentDate: d.PaymentDate, TransactionRefno: r.TransactionRefno, Action: action, ApprovalNote: note,
                Month: d.Month, Year: d.Year, RoleId: roleId, Createdby: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /Purchase/VerifyTDSPayment (+ VerifyTDSPaymentGrid / VerifyTDSPaymentView)
    TDSPayment: {
        title: 'Vendor TDS Payment Verification',
        successLabel: 'TDS Payment',
        noun: 'payment',
        icon: BadgePercent,
        searchPlaceholder: 'Search by transaction, date, amount…',
        queue: { route: 'Purchase/GetVerificationTDSPayment', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.TransactionRefNo,
        card: {
            title: (r) => `Txn ${r.TransactionRefNo}`,
            subtitle: (r) => r.CCName || r.CostCenter,
            meta: (r) => r.TransactionDate,
            amount: (r) => money(r.TransactionAmount),
        },
        searchText: (r) => `${r.TransactionRefNo} ${r.CCName} ${r.CostCenter} ${r.TransactionDate} ${r.TransactionAmount}`,
        detail: { route: 'Purchase/GetTDSPaymentbyNo', params: (r) => ({ Transactionno: r.TransactionRefNo }) },
        moid: (r, d) => (d.TransactionData || {}).MOID,
        remarksKey: (r) => r.TransactionRefNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: {
            title: (r) => `Txn ${r.TransactionRefNo}`,
            subtitle: (r, d) => money((d.TransactionData || {}).TransactionAmount),
            chips: (r, d) => [(d.TransactionData || {}).ModeOfPay, (d.TransactionData || {}).TransactionDate],
        },
        sections: (r, d) => {
            const t = d.TransactionData || {};
            return [{
                title: 'Payment',
                fields: [
                    ['Bank Name', t.Name], ['Transaction Number', t.Number], ['Transaction Date', t.TransactionDate],
                    ['Transaction Amount', money(t.TransactionAmount)], ['Amount in Words', t.AmountInWords, true],
                ],
            }];
        },
        extra: (r, d) => {
            const rows = list(d.TaxDeductionData);
            // TransactionData.Remarks carries "Role:Employee:Remarks||…" — the first entry is the creator
            const approvals = splitTrail((d.TransactionData || {}).Remarks).map(([role, emp, ...rest], i) => [
                emp, `${i === 0 ? 'Created by' : 'Verified by'} · ${role || ''}`, rest.join(':'),
            ]);
            return (
                <>
                    <TableBlock
                        title="TDS deductions"
                        heads={['Vendor', 'Invoice No', 'Invoice Date', 'Paid/Credited', 'Cost Center', 'IT Code', 'Basic', 'Total TDS', 'TDS Balance', 'Paid']}
                        rows={rows.map((x) => [x.Name, x.Inovicenos, x.InoviceDates, x.InoviceMakingDates, x.CostCenter, x.ITCode,
                            fmt(x.InvBasicValue), fmt(x.DeductionAmount), fmt(x.DeductionBalance), fmt(x.Amounts)])}
                    />
                    {approvals.length ? <TableBlock title="Approvals" heads={['Employee', '', 'Remarks']} rows={approvals} /> : null}
                </>
            );
        },
        approve: {
            route: 'Purchase/ApproveTDSPayment',
            payload: (r, d, { action, note, user, roleId }) => ({ TransactionRefNo: r.TransactionRefNo, Remarks: note, Action: action, RoleId: roleId, Createdby: user }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /Purchase/VerifyVendorPayableWriteoff (+ Grid / View / ViewVendorPayablewoDetailsGridView; invoice → tax
    // deductions pop-up via GetVendorInvoiceTaxDeductionWOGridVerify)
    VendorPayableWriteoff: {
        title: 'Vendor Payable Write-off Verification',
        successLabel: 'Vendor Payable Write-off',
        noun: 'write-off',
        icon: Eraser,
        searchPlaceholder: 'Search by transaction, vendor…',
        queue: { route: 'Purchase/VerifyVendorPayableWriteoffGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => r.Tranno,
        card: {
            title: (r) => r.Tranno,
            subtitle: (r) => [r.VendorCode, r.VendorName].filter(Boolean).join(' - '),
            meta: (r) => r.Date,
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.Tranno} ${r.VendorCode} ${r.VendorName} ${r.Date} ${r.Amount}`,
        rowAux: [{ name: 'vwoInvoices', route: 'Purchase/ViewVendorPayablewoDetailsGridView', params: (r) => ({ TranNo: r.Tranno }) }],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.Tranno,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Tranno, subtitle: (r) => money(r.Amount), chips: (r) => [r.VendorName, r.Date] },
        sections: (r) => [{
            fields: [['Transaction No', r.Tranno], ['Date', r.Date], ['Vendor Code', r.VendorCode], ['Vendor Name', r.VendorName], ['Amount', money(r.Amount)]],
        }],
        extra: (r, d, { aux, ext, setExt, openSheet }) => {
            const items = list(aux.vwoInvoices);
            const total = items.reduce((a, it) => a + (Number(it.TotalBalance) || 0), 0);
            const taxes = (it: Rec) => openSheet({
                title: `Invoice ${it.InvoiceNo}`,
                subtitle: 'Tax deductions',
                body: (
                    <RouteTable
                        route="Purchase/GetVendorInvoiceTaxDeductionWOGridVerify"
                        params={{ InvoiceNo: it.InvoiceNo }}
                        heads={['Cost/Job Center', 'Account Head', 'Sub Account Head', 'Reg No', 'Tax Type', 'Type', 'Balance', 'Amount']}
                        row={(x) => [x.VCCCode, x.DCACode, x.SubDCACode, x.TaxNo, x.TaxType, x.Type, fmt(x.VBalance), fmt(x.VAmount)]}
                    />
                ),
            });
            return (
                <CheckedItems
                    title="Write-off invoices"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    columns={[
                        { label: 'Invoice No', render: (it) => it.InvoiceNo },
                        { label: 'Cost Center', render: (it) => it.CCCode },
                        { label: 'PO', render: (it) => it.PONumber },
                        { label: 'Basic Balance', render: (it) => fmt(it.InvoiceBalance) },
                        { label: 'Hold Balance', render: (it) => fmt(it.HoldBalance) },
                        { label: 'Retention Balance', render: (it) => fmt(it.RetentionBalance) },
                        { label: 'Total Balance', render: (it) => fmt(it.TotalBalance) },
                        { label: 'Taxes', render: (it) => (it.TaxApplicable === 'Yes' ? <Link label="View tax deductions" onPress={() => taxes(it)} /> : null) },
                    ]}
                    footer={items.length ? <TotalLine value={fmt(total)} /> : null}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => {
            const items = list(aux.vwoInvoices);
            if (!items.length) return ['Invalid Submission'];
            return allItemsChecked(items, ext) ? [] : ['Please Verify Writeoff Invoices'];
        },
        approve: {
            route: 'Purchase/ApproveVendorPayableWriteoff',
            // The API reads the action from Status and the role from VRoleID (legacy controller mapping)
            payload: (r, d, { action, note, user, roleId }) => ({ Tranno: r.Tranno, Status: action, Remarks: note, Createdby: user, VRoleID: String(roleId) }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VendorCMSPaymentVerification (+ Grid / View / ViewCMSPaymentAddedVerificationData / …InnerData).
    // On Approve the web downloads the bank CMS sheet — the phone cannot, so the verifier is told to get it from the web.
    VendorCMSPayment: {
        title: 'Vendor CMS Payment Verification',
        successLabel: 'Vendor CMS Payment',
        noun: 'payment',
        icon: Building2,
        searchPlaceholder: 'Search by transaction, bank, date…',
        queue: { route: 'Purchase/VendorCMSPaymentVerificationGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => r.TransactionNo,
        card: { title: (r) => r.TransactionNo, subtitle: (r) => r.BankName, meta: (r) => r.TransactionDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.TransactionNo} ${r.BankName} ${r.TransactionDate} ${r.Amount}`,
        detail: { route: 'Purchase/VendorCMSPaymentVerificationView', params: (r) => ({ TranNo: r.TransactionNo, MOID: r.MOID, RID: r.RID }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.TransactionNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.TransactionNo, subtitle: (r, d) => d.BankName, chips: (r, d) => [d.ModeofPay, d.TransactionDate] },
        sections: (r, d) => [{
            title: 'Payment',
            fields: [
                ['Bank Name', d.BankName], ['Mode of Pay', d.ModeofPay], ['Number', d.Number], ['Transaction Date', d.TransactionDate],
                ['Amount in Words', d.AmountInWords, true],
            ],
        }],
        extra: (r, d, { ext, setExt }) => <VendorCMSVerifyGrid tranNo={r.TransactionNo} ext={ext} setExt={setExt} />,
        beforeAction: (action, r, d, { ext }) => (Object.values(ext.cmsVendors || {}).some(Boolean) ? [] : ['Select Vendors for payment']),
        approve: {
            route: 'Purchase/ApproveVendorCMSPayment',
            // The API reads the action from TransactionStatus (legacy controller mapping)
            payload: (r, d, { action, note, user, roleId }) => ({
                RID: String(d.RID ?? r.RID), TransactionNo: r.TransactionNo, TransactionStatus: action, Remarks: note, Createdby: user, Roleid: roleId,
            }),
            ok: ['Submitted'],
            afterOk: async (s, r, d, { action }) => (String(action).toLowerCase() === 'approve'
                ? `Download the bank CMS sheet for ${r.TransactionNo} from the Corex web (Vendor CMS Payment) — the phone app cannot create the Excel file.`
                : undefined),
        },
    },

    // Legacy /Purchase/BOESettelmentVerification (+ Grid / View / ViewBOEPaymentVerificationData; each LC → BOEPaymentInnerData)
    BOESettlement: {
        title: 'BOE Settlement Verification',
        successLabel: 'BOE Settlement',
        noun: 'settlement',
        icon: Ship,
        searchPlaceholder: 'Search by transaction, bank, date…',
        queue: { route: 'Purchase/BOESettelmentVerificationGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => r.TransactionNo,
        card: { title: (r) => r.TransactionNo, subtitle: (r) => r.BankName, meta: (r) => r.TransactionDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.TransactionNo} ${r.BankName} ${r.TransactionDate} ${r.Amount}`,
        detail: { route: 'Purchase/BOESettelmentVerificationView', params: (r) => ({ TranNo: r.TransactionNo, MOID: r.MOID, RID: r.RID }) },
        rowAux: [{ name: 'boeLcs', route: 'Purchase/ViewBOEPaymentVerificationData', params: (r) => ({ Trno: r.TransactionNo }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.TransactionNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.TransactionNo, subtitle: (r, d) => d.BankName, chips: (r, d) => [d.ModeofPay, d.TransactionDate] },
        sections: (r, d) => [{
            title: 'Payment',
            fields: [
                ['Bank Name', d.BankName], ['Mode of Pay', d.ModeofPay], ['Number', d.Number], ['Transaction Date', d.TransactionDate],
                ['Transaction Amount', money(d.TransactionAmount)], ['Amount in Words', d.AmountInWords, true],
            ],
        }],
        extra: (r, d, { aux, openSheet }) => {
            const lcs = list(aux.boeLcs);
            const total = lcs.reduce((a, x) => a + (Number(x.Amount) || 0), 0);
            const invoices = (x: Rec) => openSheet({
                title: `LC ${x.LCNO}`,
                subtitle: 'Invoices',
                body: (
                    <RouteTable
                        route="Purchase/BOEPaymentInnerData"
                        params={{ LCNO: x.LCNO, Tranno: x.TranNo }}
                        heads={['Invoice No', 'Cost Center', 'PO No', 'Amount']}
                        row={(i) => [i.InvoiceNo, i.CCCode, i.PoNo, fmt(i.DetAmount)]}
                    />
                ),
            });
            return (
                <TableBlock
                    title="LC settlements"
                    heads={['LC No', 'Transaction No', 'BOE Date', 'Settlement Date', 'Amount', '']}
                    rows={lcs.map((x) => [x.LCNO, x.TranNo, x.PaidDate, x.ValidUptoDate, fmt(x.Amount), <Link key="i" label="View invoices" onPress={() => invoices(x)} />])}
                    foot={lcs.length ? ['Total', fmt(total)] : undefined}
                />
            );
        },
        approve: {
            route: 'Purchase/ApproveVendorBOEPayment',
            // The API reads the action from TransactionStatus (legacy controller mapping)
            payload: (r, d, { action, note, user, roleId }) => ({
                RID: String(d.RID ?? r.RID), TransactionNo: r.TransactionNo, TransactionStatus: action, Remarks: note, Createdby: user, Roleid: roleId,
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/LCBGCreationVerification (+ Grid / View)
    LCBGCreation: {
        title: 'LC / BG Creation Verification',
        successLabel: 'LC/BG',
        noun: 'LC/BG',
        icon: Landmark,
        searchPlaceholder: 'Search by LC/BG no, type, dates…',
        queue: { route: 'Purchase/LCBGCreationVerificationGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => `${r.LCBGno}|${r.RID}`,
        card: {
            title: (r) => r.LCBGno,
            subtitle: (r) => lcbgTypeName(r.LCBGType),
            meta: (r) => [r.OpeningDate, r.ValidityDate].filter(Boolean).join(' → '),
            amount: (r) => money(r.TotalValue),
        },
        searchText: (r) => `${r.LCBGno} ${r.LCBGType} ${r.OpeningDate} ${r.ValidityDate} ${r.TotalValue}`,
        detail: { route: 'Purchase/LCBGCreationVerificationView', params: (r) => ({ LCBGno: r.LCBGno, MOID: r.MOID, RID: r.RID }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.LCBGno,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.LCBGno, subtitle: (r, d) => money(d.TotalValue ?? r.TotalValue), chips: (r, d) => [lcbgTypeName(d.LCBGType || r.LCBGType)] },
        // LC is raised for a vendor, BG for a client / sub client (legacy view branches on LCBGType)
        sections: (r, d) => [{
            fields: [
                ['Type', lcbgTypeName(d.LCBGType)],
                d.LCBGType === 'LC' && ['Vendor', d.VendorCode],
                d.LCBGType !== 'LC' && ['Client', d.ClientCode],
                d.LCBGType !== 'LC' && ['Sub Client', d.SubClientCode],
                ['PO Number', d.PONO, true],
                ['LC/BG No', d.LCBGno], ['Opening Date', d.OpeningDate], ['Validity Date', d.ValidityDate], ['Tolerance', d.Tolerance],
                ['Margin FD', d.FD], ['Basic Value', money(d.BasicValue)], ['GST Value', money(d.GSTValue)], ['Charges', money(d.Charges)],
                ['Total Value', money(d.TotalValue)], ['Bank Remarks', d.BankRemarks, true],
            ],
        }],
        approve: {
            route: 'Purchase/ApproveLCBG',
            // The API reads the action from Status (legacy controller mapping)
            payload: (r, d, { action, note, user, roleId }) => ({ RID: Number(r.RID), LCBGno: r.LCBGno, Status: action, Remarks: note, CreatedBy: user, RoleId: roleId }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyCreditandDebitNote (+ Grid / View)
    CreditDebitNote: {
        title: 'Credit & Debit Note Verification',
        successLabel: 'Credit/Debit Note',
        noun: 'note',
        icon: FileDiff,
        searchPlaceholder: 'Search by note no, type, client/vendor…',
        queue: { route: 'Purchase/VerifyCreditandDebitNoteGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => `${r.NoteNo}|${r.Rid}`,
        card: {
            title: (r) => r.NoteNo,
            subtitle: (r) => [r.NoteType, r.NoteFor].filter(Boolean).join(' · '),
            meta: (r) => r.Date,
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.NoteNo} ${r.NoteType} ${r.NoteFor} ${r.Date} ${r.Amount}`,
        detail: { route: 'Purchase/VerifyCreditandDebitNoteView', params: (r) => ({ Noteno: r.NoteNo, Rid: r.Rid, NoteFor: r.NoteFor }) },
        moid: (r) => r.MOID,
        remarksKey: (r) => r.NoteNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.NoteNo, subtitle: (r, d) => money(d.Amount ?? r.Amount), chips: (r) => [r.NoteType, r.NoteFor, r.Date] },
        sections: (r, d) => {
            if (r.NoteFor === 'Client') {
                return [{
                    title: 'Reason',
                    fields: [
                        d.ClientReason != null && ['Reason for Credit/Debit Note', d.ClientReason],
                        d.Clientpaymentfor != null && ['Payment for', d.Clientpaymentfor],
                        d.ClientReasonDCA != null && ['DCA', d.ClientReasonDCA],
                        d.ClientReasonDCA != null && ['SDCA', d.ClientReasonSDCA],
                    ],
                }, {
                    title: 'Client invoice',
                    fields: [
                        ['Client', d.Client], ['Sub Client', d.SubClient], ['Client Invoice', d.ClientInv], ['Client PO No', d.CPONO],
                        ['Invoice Date', d.CInvDate], ['Invoice Making Date', d.CInvMakingDate], ['RA No', d.CRANo],
                        ['Cost Center', d.CCCCode], ['Basic Value', money(d.CBasic)], ['GST Value', money(d.GSTValue)], ['Client Total', money(d.CTotal)],
                    ],
                }, {
                    title: 'Note',
                    fields: [
                        ['Note Amount', money(d.BBasicAmount)],
                        String(d.GSTCount) === '2' && ['CGST Value', money(d.BCGST)],
                        String(d.GSTCount) === '2' && ['SGST Value', money(d.BSGST)],
                        String(d.GSTCount) === '1' && ['IGST Value', money(d.BIGST)],
                        ['Total', money(d.Amount)],
                    ],
                }];
            }
            return [{
                title: 'Reason',
                fields: [
                    d.VendorReason != null && ['Reason for Credit/Debit Note', d.VendorReason],
                    d.Vendorpaymentfor != null && ['Payment for', d.Vendorpaymentfor],
                    d.VendorReasonDCA != null && ['DCA', d.VendorReasonDCA],
                    d.VendorReasonDCA != null && ['SDCA', d.VendorReasonSDCA],
                ],
            }, {
                title: 'Vendor invoice',
                fields: [
                    ['Vendor Name', d.VendorName], ['Vendor Invoice', d.VendorInv], ['Vendor PO No', d.VPONO],
                    ['Invoice Date', d.VInvDate], ['Invoice Making Date', d.VInvMakingDate], ['DCA Code', d.VDCA], ['Sub DCA Code', d.Vsubdca],
                    ['IT Code', d.VItCode], ['Amount', money(d.VBasic)], ['GST Value', money(d.VGstValue)], ['Total', money(d.VTotal)],
                ],
            }, {
                title: 'Note',
                fields: [
                    ['Note Value', money(d.BBasicAmount)],
                    String(d.VGSTCount) === '2' && ['CGST Value', money(d.BCGST)],
                    String(d.VGSTCount) === '2' && ['SGST Value', money(d.BSGST)],
                    String(d.VGSTCount) === '1' && ['IGST Value', money(d.BIGST)],
                    ['Total', money(d.Amount)],
                ],
            }];
        },
        approve: {
            route: 'Purchase/ApproveCreditandDebitNote',
            // The API reads the action from Status (legacy controller: IC.Status = appstatus)
            payload: (r, d, { action, note, user, roleId }) => ({ Rid: String(r.Rid), NoteNo: r.NoteNo, Status: action, Remarks: note, Createdby: user, RoleID: String(roleId) }),
            ok: ['Submitted'],
        },
    },
};
