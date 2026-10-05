// Fixed deposits, loans & shares — the Corex web's dedicated pages expressed as configs:
//   OpenFD                pages/Accounts/VerifyOpenFD.jsx         (accountsSlice/verifyOpenFDSlice)
//   PartialFD / CloseFD   pages/Accounts/VerifyPartialFD.jsx      (accountsSlice/verifyPartialFDSlice — fdMode Partial | Close)
//   FDInterest            pages/Accounts/VerifyFDInterest.jsx     (accountsSlice/verifyFDInterestSlice)
//   TermLoan              pages/Accounts/VerifyTermLoan.jsx       (accountsSlice/verifyTermLoanSlice)
//   TLAgency              pages/Accounts/VerifyTLAgency.jsx       (accountsSlice/verifyTLAgencySlice)
//   TLPayment             pages/Accounts/VerifyTLPayment.jsx      (accountsSlice/verifyTLPaymentSlice)
//   UnsecuredLoan<Type>   pages/Accounts/VerifyUnsecuredLoan.jsx  (accountsSlice/verifyUnsecuredLoanSlice — New | Existing | Return)
//   UnsLoanInterest       pages/Accounts/VerifyUnsLoanInterest.jsx(accountsSlice/verifyUnsLoanInterestSlice)
//   ShareCapital          pages/Accounts/VerifyShareCapital.jsx   (accountsSlice/verifyShareCapitalSlice)
//   ShareCreation         pages/Accounts/VerifyShareCreation.jsx  (accountsSlice/verifyShareCreationSlice)
import React from 'react';
import { Banknote, Building2, CircleDollarSign, HandCoins, Landmark, Percent, PieChart, PiggyBank, ScrollText, Vault } from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { buildCapitalShareUrl, buildShareCreationUrl } from '@/src/service/s3Config';
import { DocButton, TableBlock, displayDate, fmt, isoDate, todayIso } from '../parts';
import type { Rec, VerificationConfig } from '../types';
import { csv, list } from './shared';

const OK = ['Submitted', 'Submited'];
const num = (v: unknown) => parseFloat(String(v ?? '')) || 0;
const returnedStatus = (r: Rec) => String(r.Status) === '0';
const AMOUNT = /^\d*\.?\d{0,2}$/;

// ---- Partial / Close FD: same page, two queues --------------------------------------------------------
const FD_MODES = {
    Partial: { queue: 'GetVerificationPartialFD', detail: 'GetPartialFDbyTransno', title: 'Partial FD', closure: 'Partial Closure', noun: 'partial FD' },
    Close: { queue: 'GetVerificationCloseFD', detail: 'GetCloseFDbyTransno', title: 'Close FD', closure: 'Closure', noun: 'FD closure' },
};
const fdClosure = (mode: keyof typeof FD_MODES): VerificationConfig => {
    const m = FD_MODES[mode];
    const deductions = (d: Rec) => list(d.FDDeductionList);
    const dedTotal = (d: Rec) => deductions(d).reduce((a, x) => a + num(x.DeductionValue), 0);
    return {
        title: `${m.title} Verification`,
        successLabel: m.title,
        noun: m.noun,
        icon: mode === 'Close' ? Vault : PiggyBank,
        searchPlaceholder: 'Search FD no, closing date, amount…',
        queue: { route: `Accounts/${m.queue}`, params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionRefNo,
        card: { title: (r) => `FD ${r.FDRNo}`, subtitle: (r) => `Closing ${r.FDRClosingDate}`, amount: (r) => money(r.FDRAmount) },
        searchText: (r) => `${r.FDRNo} ${r.FDRClosingDate} ${r.FDRAmount}`,
        detail: { route: `Accounts/${m.detail}`, params: (r) => ({ Transactionno: r.BankTransactionRefNo }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTransactionRefNo,
        showReturn: 'No',
        isReturned: returnedStatus,
        returnedNotice: `Correct and resubmit it from the ${m.title} entry screen — there is nothing to verify until it is resubmitted.`,
        header: { title: (r, d) => `FD ${d.FDRNo} — ${m.closure}`, subtitle: (r, d) => money(d.FDRAmount), chips: (r, d) => [`Closing ${d.FDRClosingDate}`, 'Credited'] },
        sections: (r, d) => {
            const n = d.NewFDDetails;
            return [
                {
                    fields: [
                        ['FD Number', d.FDRNo], ['Closing Date', d.FDRClosingDate], ['Maturity Amount', money(d.Amount)], ['Interest', money(d.IntAmount)],
                        d.ReturnBudgetFYYear && ['Budget Return FY Year', d.ReturnBudgetFYYear],
                    ],
                },
                n && (n.NewFDRAmount != null || n.NewFDBalance != null) && {
                    title: 'FD after partial closure',
                    fields: [
                        ['Begin Date', n.NewFDRFromDate], ['End Date', n.NewFDRToDate], ['Amount', money(n.NewFDRAmount)],
                        ['Balance', money(n.NewFDBalance)], ['Rate of Interest (%)', n.NewFDRROI],
                    ],
                },
                {
                    title: 'Payment',
                    fields: [
                        ['Bank', d.BankName], ['Mode of Pay', d.ModeofPay], ['No', d.No], ['Payment Date', d.PaymentDate],
                        ['Amount Credited', money(d.FDRAmount)], ['Remarks', d.Remarks, true],
                    ],
                },
            ];
        },
        extra: (r, d) => (deductions(d).length ? (
            <TableBlock title="Deductions" heads={['Account Head', 'Sub Account Head', 'Amount']}
                rows={deductions(d).map((x) => [x.DCACode, x.SubDCACode, fmt(x.DeductionValue)])} foot={['Total', fmt(dedTotal(d))]} />
        ) : null),
        approve: {
            route: 'Accounts/ApprovePartialFD',
            payload: (r, d, { action, note, user, roleId }) => ({
                BankTransactionRefNo: d.BankTransactionRefNo, Action: action, ApprovalNote: note, Bankid: d.Bankid, Roleid: roleId, Createdby: user,
                PaymentAmount: d.FDRAmount, FDRClosingDate: d.FDRClosingDate,
                DedDcas: csv(deductions(d).map((x) => x.DCACode)), DedSDcas: csv(deductions(d).map((x) => x.SubDCACode)),
                DedAmounts: csv(deductions(d).map((x) => x.DeductionValue)),
                Capitalcc: 'CCC', FDRNo: d.FDRNo, Fdtype: d.Fdtype, Amount: num(d.Amount) + num(d.IntAmount) - dedTotal(d),
            }),
            ok: OK,
        },
    };
};

// ---- Unsecured loan: one page, three loan types ------------------------------------------------------
const LOAN_TYPES = {
    New: { title: 'Unsecured Loan (New)', noun: 'new loan', dateLabel: 'Loan Date' },
    Existing: { title: 'Unsecured Loan (Existing)', noun: 'loan top-up', dateLabel: 'Additional Loan Date' },
    Return: { title: 'Unsecured Loan (Return)', noun: 'loan repayment', dateLabel: 'Return Date' },
};
const unsecuredLoan = (type: keyof typeof LOAN_TYPES): VerificationConfig => {
    const t = LOAN_TYPES[type];
    const repayment = type === 'Return';
    return {
        title: `${t.title} Verification`,
        successLabel: t.title,
        noun: t.noun,
        icon: repayment ? HandCoins : Banknote,
        searchPlaceholder: 'Search loan no, name, amount…',
        queue: { route: 'Accounts/GetVerificationUnsecuredLoans', params: ({ roleId }) => ({ Roleid: roleId, type }) },
        itemKey: (r) => r.BankTransactionRefNo,
        card: { title: (r) => r.Name, subtitle: (r) => `Loan ${r.LoanNo}`, meta: (r) => displayDate(r.PaymentDate), amount: (r) => money(r.LoanAmount) },
        searchText: (r) => `${r.LoanNo} ${r.Name} ${r.LoanAmount}`,
        detail: { route: 'Accounts/GetLoanbyRefno', params: (r) => ({ TransRefno: r.BankTransactionRefNo, Type: type }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTransactionRefNo,
        showReturn: repayment ? 'No' : 'Yes',
        isReturned: returnedStatus,
        returnedNotice: 'Correct and resubmit it from the Unsecured Loan entry screen — there is nothing to verify until it is resubmitted.',
        header: { title: (r, d) => d.Name, subtitle: (r, d) => money(d.paymentAmount), chips: (r, d) => [`Loan ${d.LoanNo}`, d.LoanType || type] },
        sections: (r, d) => [
            {
                fields: [
                    ['Loan No', d.LoanNo], [t.dateLabel, d.ReturnLoanDate], ['Name', d.Name],
                    ...(repayment
                        ? [['Principal Repaid', money(d.RePayPrinciple)], ['Interest Paid', money(d.RePayInterest)], ['TDS Amount', money(d.TDSAmount)]] as [string, unknown][]
                        : [['Loan Amount', money(d.LoanAmount)], ['Rate of Interest (%)', d.RateOfIntrest]] as [string, unknown][]),
                ],
            },
            type === 'New' && (d.NatureGroupName || d.GroupName) && {
                title: 'Ledger',
                fields: [
                    ['Nature of Group', d.NatureGroupName], ['Group Name', d.GroupName], ['Sub Group Name', d.SubGroupName],
                    ['Opening Balance', money(d.OpeningBalance)], ['Balance As On Date', d.BalanceAsOnDate], ['Ledger Value Type', d.LedgerValueType],
                ],
            },
            {
                title: 'Payment',
                fields: [
                    ['Bank Name', d.Bank], ['Transaction Number', d.UnsLoanPaymentNo], ['Transaction Date', d.ReturnPayDate],
                    ['Transaction Amount', money(d.paymentAmount)], ['Mode of Pay', d.ModeofPay], ['Remarks', d.Remarks, true],
                ],
            },
        ],
        approve: {
            route: 'Accounts/ApproveLoan',
            payload: (r, d, { action, note, user, roleId }) => ({
                BankTransactionRefNo: d.BankTransactionRefNo, Action: action, Roleid: roleId, ApprovalNote: note, Createdby: user,
                Type: d.LoanType || type, Bank: d.Bank, paymentAmount: d.paymentAmount, LoanNo: d.LoanNo,
            }),
            ok: ['Submited', 'Submitted'],
        },
    };
};

export const ACCOUNTS_FINANCE_CONFIGS: Record<string, VerificationConfig> = {
    OpenFD: {
        title: 'Open FD Verification',
        successLabel: 'Open FD',
        noun: 'FD',
        icon: Landmark,
        searchPlaceholder: 'Search FD no, dates, amount…',
        queue: { route: 'Accounts/GetVerificationOpenFD', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionRefNo,
        card: { title: (r) => `FD ${r.FDRNo}`, subtitle: (r) => `${r.ReturnFromDate} → ${r.ReturnToDate}`, amount: (r) => money(r.FDRAmount) },
        searchText: (r) => `${r.FDRNo} ${r.ReturnFromDate} ${r.ReturnToDate} ${r.FDRAmount}`,
        detail: { route: 'Accounts/GetOpenFDbyTransno', params: (r) => ({ Transactionno: r.BankTransactionRefNo }) },
        aux: [{ name: 'banks', route: 'Accounts/GetBankDetails' }],
        moid: (r, d) => d.MOID,
        showReturn: 'No',
        isReturned: returnedStatus,
        header: {
            title: (r, d) => `FD ${d.FDRNo}`,
            subtitle: (r, d) => money(d.FDRAmount),
            chips: (r, d) => [`${d.ReturnFromDate} → ${d.ReturnToDate}`, d.FDRROI != null && `${d.FDRROI}% p.a.`],
        },
        sections: (r, d) => (String(r.Status) === '0' ? [{ fields: [['FD Number', d.FDRNo]] }] : [{
            fields: [
                ['FD Number', d.FDRNo], ['Begin Date', d.ReturnFromDate], ['End Date', d.ReturnToDate], ['Rate of Interest (%)', d.FDRROI],
                ['FD Value', money(d.FDRAmount)], ['Bank Name', d.BankName], ['Transaction Number', d.No], ['Transaction Date', d.ReturnPayDate],
                ['Transaction Amount', money(d.PaymentAmount)], d.Remarks && ['Remarks', d.Remarks, true],
            ],
        }]),
        approve: {
            route: 'Accounts/ApproveOpenFD',
            payload: (r, d, { action, note, user, roleId }) => ({
                BankTransactionRefNo: d.BankTransactionRefNo, Action: action, Roleid: roleId, ApprovalNote: note, Createdby: user,
                Bankid: d.Bankid, PaymentAmount: d.PaymentAmount, ReturnFromDate: d.ReturnFromDate,
            }),
            ok: OK,
        },
        // spOpenFD Action 'Update' — success literal "Updated"
        resubmit: {
            fields: [
                { key: 'fromDate', label: 'Begin Date', type: 'date', required: true },
                { key: 'toDate', label: 'End Date', type: 'date', required: true },
                { key: 'roi', label: 'Rate of Interest (%)', required: true, filter: AMOUNT },
                { key: 'amount', label: 'FD Amount', required: true, filter: AMOUNT },
                { key: 'bankId', label: 'Bank Name', type: 'select', required: true, options: (aux) => list(aux.banks).map((b) => ({ value: String(b.Bank_Id), label: String(b.Bank_Name) })) },
                { key: 'mode', label: 'Mode of Pay', type: 'select', required: true, options: [{ value: 'RTGS/E-Trans', label: 'RTGS/E-Trans' }] },
                { key: 'no', label: 'No', required: true },
                { key: 'payDate', label: 'Payment Date', type: 'date', required: true },
                { key: 'remarks', label: 'Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => ({
                fromDate: isoDate(d.ReturnFromDate), toDate: isoDate(d.ReturnToDate), roi: d.FDRROI != null ? String(d.FDRROI) : '',
                amount: d.FDRAmount != null ? String(d.FDRAmount) : '', bankId: d.Bankid ? String(d.Bankid) : '',
                mode: d.ModeofPay === 'RTGS/E-Trans' ? d.ModeofPay : '', no: d.No || '', payDate: isoDate(d.ReturnPayDate), remarks: d.Remarks || '',
            }),
            validate: (v, r, d) => [
                !d.FDRNo && 'Enter FD No',
                v.fromDate && v.toDate && v.toDate < v.fromDate && 'To Date must be on or after From Date',
                v.fromDate && v.fromDate > todayIso() && 'Begin Date cannot be in the future',
                !(parseFloat(v.amount) > 0) && 'Enter FD Amount',
                v.payDate && v.fromDate && v.payDate < v.fromDate && 'Payment Date cannot be before the Begin Date',
                v.payDate && v.payDate > todayIso() && 'Payment Date cannot be in the future',
            ],
            route: 'Accounts/UpdateOpenFD',
            payload: (r, d, v, { user, roleId }) => ({
                FDRNo: d.FDRNo, FDRFromDate: displayDate(v.fromDate), FDRClosingDate: displayDate(v.toDate), FDRAmount: parseFloat(v.amount),
                FDRROI: parseFloat(v.roi), Createdby: user, Bankid: v.bankId, Remarks: v.remarks.trim(), ModeofPay: v.mode, No: v.no.trim(),
                PaymentDate: displayDate(v.payDate), Action: 'Update', Roleid: roleId, BankTransactionRefNo: d.BankTransactionRefNo,
            }),
            ok: ['Updated'],
        },
    },

    PartialFD: fdClosure('Partial'),
    CloseFD: fdClosure('Close'),

    FDInterest: {
        title: 'FD Interest Verification',
        successLabel: 'FD Interest',
        noun: 'FD interest',
        icon: Percent,
        searchPlaceholder: 'Search FD no, interest date, amount…',
        queue: { route: 'Accounts/GetVerificationFDInterest', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.BankTransactionRefNo,
        card: { title: (r) => `FD ${r.FDRNo}`, subtitle: (r) => `Interest on ${r.IntDate}`, amount: (r) => money(r.IntAmount) },
        searchText: (r) => `${r.FDRNo} ${r.IntDate} ${r.IntAmount}`,
        detail: { route: 'Accounts/GetFDInterestbyTransno', params: (r) => ({ Transactionno: r.BankTransactionRefNo }) },
        // Capital cost center the interest deduction is booked against
        aux: [{ name: 'deductionData', route: 'Accounts/GetFDIntDeductionData' }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.BankTransactionRefNo,
        showReturn: 'No',
        isReturned: returnedStatus,
        returnedNotice: 'Correct and resubmit it from the FD Interest entry screen — there is nothing to verify until it is resubmitted.',
        header: { title: (r, d) => `FD ${d.FDRNo} — Interest`, subtitle: (r, d) => money(d.IntAmount), chips: (r, d) => [`Interest date ${d.IntDate}`, 'Credited'] },
        sections: (r, d) => {
            const ded = list(d.FDDeductionList);
            const gross = num(d.IntAmount) + ded.reduce((a, x) => a + num(x.DeductionValue), 0);
            return [
                { fields: [['FD Number', d.FDRNo], ['Interest Date', d.IntDate], ['Interest Amount', money(ded.length ? gross : d.IntAmount)]] },
                {
                    title: 'Payment',
                    fields: [
                        ['Bank', d.PaymentBankName], ['Mode of Pay', d.PaymentModeofPay], ['No', d.PaymentNo], ['Payment Date', d.FDRPaymentDate],
                        ['Payment Amount', money(d.IntAmount)], ['Remarks', d.PaymentRemarks, true],
                    ],
                },
            ];
        },
        extra: (r, d) => {
            const ded = list(d.FDDeductionList);
            return ded.length ? (
                <TableBlock title="Deductions" heads={['Cost Center', 'Account Head', 'Sub Account Head', 'Amount']}
                    rows={ded.map((x) => [x.CCCode, x.DCACode, x.SubDCACode, fmt(x.DeductionValue)])}
                    foot={['Total', fmt(ded.reduce((a, x) => a + num(x.DeductionValue), 0))]} />
            ) : null;
        },
        approve: {
            route: 'Accounts/ApproveFDInterest',
            payload: (r, d, { action, note, user, roleId, aux }) => {
                const ded = list(d.FDDeductionList);
                const last = ded[ded.length - 1];
                const gross = num(d.IntAmount) + ded.reduce((a, x) => a + num(x.DeductionValue), 0);
                const cfg = Array.isArray(aux.deductionData) ? aux.deductionData[0] : aux.deductionData;
                return {
                    BankTransactionRefNo: d.BankTransactionRefNo, Action: action, ApprovalNote: note, Bankid: d.Bankid, Roleid: roleId, Createdby: user,
                    IntAmount: ded.length ? gross : num(d.IntAmount), IntDate: d.IntDate, DedDcas: last?.DCACode || '', ParIntcc: cfg?.CC || '',
                    FDRAmount: last ? num(last.DeductionValue) : 0,
                };
            },
            ok: OK,
        },
    },

    TermLoan: {
        title: 'Term Loan Verification',
        successLabel: 'Term Loan',
        noun: 'term loan',
        icon: Building2,
        searchPlaceholder: 'Search loan no, agency, type, date…',
        queue: { route: 'Accounts/GetVerificationtlDetails', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Termloanid,
        card: { title: (r) => `Loan ${r.LoanNo}`, subtitle: (r) => [r.AgencyNo, r.LoanType].filter(Boolean).join(' · '), meta: (r) => r.Appdate, amount: (r) => money(r.TotalAmt) },
        searchText: (r) => `${r.LoanNo} ${r.AgencyNo} ${r.LoanType} ${r.Appdate}`,
        detail: { route: 'Accounts/GettlverificationbyId', params: (r) => ({ Rowid: r.Termloanid }) },
        moid: (r) => r.MOID,
        remarksKey: (r) => r.LoanNo,
        showReturn: 'Yes',
        isReturned: returnedStatus,
        returnedNotice: 'Correct and resubmit this loan from the Term Loan entry screen — there is nothing to verify until it is resubmitted.',
        header: { title: (r, d) => `Loan ${d.LoanNo}`, subtitle: (r, d) => money(d.TotalAmt), chips: (r, d) => [d.LoanType, `Agency ${d.AgencyNo}`] },
        sections: (r, d) => [
            {
                fields: [
                    ['Loan Type', d.LoanType], ['Loan No', d.LoanNo], ['Agency Code', d.AgencyNo], ['Loan Applied Date', d.Appdate],
                    ['Disbursal Amount', money(d.DisbursalAmt)], ['Interest Rate (%)', d.IntrestRate], ['Processing Amount', money(d.ProcessingAmt)],
                    ['Total Amount', money(d.TotalAmt)], ['Installment Start', d.Istartdate], ['Installment End', d.Ienddate],
                    ['EMI Type', d.Emitype], ['No. of Installments', d.InstallmentNos],
                ],
            },
            d.LoanType === 'For Capital' && {
                title: 'Bank',
                fields: [['Bank Name', d.BankName], ['Bank Date', d.Bkdate], ['Mode of Pay', d.Modeofpay], ['Instrument No', d.Instrumentno], ['Loan Purpose', d.Loanpurpose, true]],
            },
        ],
        approve: {
            route: 'Accounts/Verifytermloan',
            payload: (r, d, { action, note, user, roleId }) => ({ Termloanid: d.Termloanid, Appstatus: action, AppRemarks: note, Createdby: user, RoleId: roleId }),
            ok: OK,
        },
    },

    TLAgency: {
        title: 'Term Loan Agency Verification',
        successLabel: 'Agency',
        noun: 'agency',
        icon: CircleDollarSign,
        searchPlaceholder: 'Search agency code, name, nature…',
        queue: { route: 'Accounts/GetApprovalTLAgency', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.AgencyId,
        card: { title: (r) => r.AgencyName, subtitle: (r) => r.AgencyId, meta: (r) => r.NatureGroupName },
        searchText: (r) => `${r.AgencyId} ${r.AgencyName} ${r.NatureGroupName}`,
        detail: { route: 'Accounts/GetApproveTLAgencyCodebyid', params: (r) => ({ id: r.AgencyId }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.AgencyId,
        showReturn: 'Yes',
        excludeActions: (r, d) => (d.AgencyStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedStatus,
        header: { title: (r, d) => d.AgencyName, subtitle: (r, d) => d.AgencyId, chips: (r, d) => [d.AgencyStatus && `Agency Status: ${d.AgencyStatus}`] },
        sections: (r, d) => {
            const returned = String(r.Status) === '0';
            return [{
                fields: [
                    ['Agency Code', d.AgencyId], !returned && ['Agency Name', d.AgencyName], !returned && ['Agency Address', d.AgencyAddress, true],
                    ['Nature of Group', d.NatureGroupName], ['Group Name', d.GroupName],
                    d.SubGroupId && d.SubGroupId !== '0' && ['Sub Group Name', d.SubGroupName], !returned && ['Agency Status', d.AgencyStatus],
                ],
            }];
        },
        approve: {
            route: 'Accounts/ApproveTLAgency',
            payload: (r, d, { action, note, user, roleId }) => ({
                RoleId: roleId, Createdby: user, AgencyId: d.AgencyId, Action: action, RemarksNote: note, AgencyStatus: d.AgencyStatus,
            }),
            ok: OK,
        },
        resubmit: {
            fields: [
                { key: 'name', label: 'Agency Name', required: true },
                { key: 'address', label: 'Agency Address', required: true },
            ],
            initial: (r, d) => ({ name: d.AgencyName || '', address: d.AgencyAddress || '' }),
            route: 'Accounts/EditTermLoanAgency',
            payload: (r, d, v, { user, roleId }) => ({
                AgencyId: d.AgencyId, RoleId: roleId, Createdby: user, Action: 'Update', AgencyName: v.name.trim(), AgencyAddress: v.address.trim(),
                CheckUpdationType: 'ReturnUpdate',
            }),
            ok: OK,
        },
    },

    TLPayment: {
        title: 'Term Loan Payment Verification',
        successLabel: 'Term Loan Payment',
        noun: 'payment',
        icon: Banknote,
        searchPlaceholder: 'Search transaction, bank, date, amount…',
        queue: { route: 'Accounts/GetVerificationtlPDetails', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.PaymentTransactionNo,
        card: { title: (r) => `Txn ${r.PaymentTransactionNo}`, subtitle: (r) => r.BankName, meta: (r) => r.BDate, amount: (r) => money(r.TotalAmount) },
        searchText: (r) => `${r.PaymentTransactionNo} ${r.BankName} ${r.BDate} ${r.TotalAmount}`,
        detail: { route: 'Accounts/GettlverificationtlpbyId', params: (r) => ({ Rowid: r.PaymentTransactionNo }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.TNO,
        showReturn: 'No',
        isReturned: (r) => String(r.paymentstatus) === '0',
        returnedNotice: 'Correct and resubmit it from the Term Loan Payment entry screen — there is nothing to verify until it is resubmitted.',
        header: { title: (r, d) => `Loan ${d.LoanNos} — Repayment`, subtitle: (r, d) => money(d.TotalAmount), chips: (r, d) => [d.PaymentType] },
        sections: (r, d) => [
            {
                fields: [
                    ['Payment Type', d.PaymentType], ['Loan No', d.LoanNos], ['Agency', d.Acodeandname], ['Payment For', d.paymentstatus],
                    ['Principal Amount', money(d.Principleamt)], ['Interest Amount', money(d.IntrestAmt)], ['Installment No', d.instno],
                    ['Balance Principal', money(d.BalPricipleamt)], ['Remarks', d.TLPRemarks, true],
                ],
            },
            {
                title: 'Bank',
                fields: [
                    ['Bank Name', d.BankName], ['Mode of Pay', d.Modeofpay], ['Instrument No', d.Instrumentno], ['Payment Date', d.BDate],
                    ['Total Amount', money(d.TotalAmount)], ['Amount in Words', d.AmountInWords, true], ['Bank Remarks', d.BankRemarks, true],
                ],
            },
        ],
        approve: {
            route: 'Accounts/Verifytermloanpayment',
            payload: (r, d, { action, note, user, roleId }) => ({ TNO: d.TNO, Apprstatus: action, ApprovalRemarks: note, Createdby: user, RoleId: roleId }),
            ok: OK,
        },
    },

    UnsecuredLoanNew: unsecuredLoan('New'),
    UnsecuredLoanExisting: unsecuredLoan('Existing'),
    UnsecuredLoanReturn: unsecuredLoan('Return'),

    UnsLoanInterest: {
        title: 'Unsecured Loan Interest Verification',
        successLabel: 'Loan interest',
        noun: 'loan interest',
        icon: Percent,
        searchPlaceholder: 'Search loan no, rate, remarks…',
        queue: { route: 'Accounts/GetVerificationUnsLoanInterest', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.UnsecuredLoadId ?? r.LoanNo,
        card: { title: (r) => `Loan ${r.LoanNo}`, subtitle: (r) => r.Remarks, amount: (r) => (r.RateOfIntrest != null ? `${r.RateOfIntrest}%` : null) },
        searchText: (r) => `${r.LoanNo} ${r.RateOfIntrest} ${r.Remarks}`,
        moid: (r) => r.MOID,
        remarksKey: (r) => r.LoanNo,
        showReturn: 'No',
        header: { title: (r) => `Loan ${r.LoanNo}`, subtitle: (r) => `New interest rate ${r.RateOfIntrest}%` },
        sections: (r) => [{ fields: [['Loan No', r.LoanNo], ['Rate of Interest (%)', r.RateOfIntrest], ['Remarks', r.Remarks, true]] }],
        approve: {
            route: 'Accounts/ApproveUnsLaonInterest',
            payload: (r, d, { action, note, user, roleId }) => ({
                Action: action, ApprovalNote: note, UnsecuredLoadId: r.UnsecuredLoadId, RateOfIntrest: r.RateOfIntrest, LoanNo: r.LoanNo,
                Createdby: user, Roleid: roleId,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    ShareCapital: {
        title: 'Share Capital Verification',
        successLabel: 'Share Capital',
        noun: 'share capital update',
        icon: PieChart,
        searchPlaceholder: 'Search transaction, date…',
        queue: { route: 'Accounts/VerifyShareCapitalGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => `Transaction ${r.Refno}`, subtitle: (r) => r.Date },
        searchText: (r) => `${r.Refno} ${r.Date}`,
        detail: { route: 'Accounts/VerifyShareCapitalView', params: (r) => ({ Refno: r.Refno }) },
        // Existing approved capital, shown for comparison
        aux: [{ name: 'capital', route: 'Accounts/GetCapitaldetails' }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.Refno,
        showReturn: 'No',
        header: { title: () => 'Share Capital Updation', subtitle: (r, d) => `Transaction ${d.Refno}`, chips: (r) => [r.Date && `Date: ${r.Date}`] },
        extra: (r, d, { aux }) => (
            <>
                <TableBlock
                    title="New share capital"
                    heads={['Capital', 'No of Shares', 'Price per Share', 'Amount']}
                    rows={[
                        ['Authorised Capital', d.AccountCapitalNoofShare, fmt(d.AccountCapitalEachSharePrice), fmt(d.AccountCapitalAmount)],
                        ['Issued Capital', d.IssuedCapitalNoofShare, fmt(d.IssuedCapitalEachSharePrice), fmt(d.IssuedCapitalAmount)],
                        ['Paid Up Capital', d.PaidCapitalNoofShare, fmt(d.PaidCapitalEachSharePrice), fmt(d.PaidCapitalAmount)],
                    ]}
                />
                <DocButton label="View uploaded documents" url={d.FileName ? buildCapitalShareUrl(d.FileName) : null} />
                <TableBlock
                    title="Existing approved capital"
                    heads={['Capital Type', 'No of Shares', 'Each Share', 'Amount', 'Date']}
                    empty="No data found"
                    rows={list(aux.capital).map((c) => [c.CapitalType, c.shares, fmt(c.Eachshare), fmt(c.shareAmount), c.ShareCapitalDate])}
                />
            </>
        ),
        approve: {
            route: 'Accounts/ApproveShareCapital',
            payload: (r, d, { action, note, user, roleId }) => ({ Refno: d.Refno, Status: action, Remarks: note, RoleId: roleId, CreatedBy: user }),
            ok: OK,
        },
    },

    ShareCreation: {
        title: 'Share Detail Verification',
        successLabel: 'Share detail',
        noun: 'share detail',
        icon: ScrollText,
        searchPlaceholder: 'Search ref no, name, employee…',
        queue: { route: 'Accounts/VerifyShareCreationGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.RefNo,
        card: { title: (r) => r.FirstName, subtitle: (r) => `${r.EmpRefNo} · Ref ${r.RefNo}`, meta: (r) => r.Date },
        searchText: (r) => `${r.RefNo} ${r.FirstName} ${r.EmpRefNo} ${r.Date}`,
        detail: { route: 'Accounts/VerifyShareCreationView', params: (r) => ({ Refno: r.RefNo }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.RefNo,
        showReturn: 'No',
        header: { title: (r, d) => d.EmployeeName || r.FirstName, subtitle: (r, d) => `Ref ${d.RefNo}`, chips: (r, d) => [d.SchemeType && `Scheme: ${d.SchemeType}`] },
        sections: (r, d) => [
            {
                title: 'Employee details',
                fields: [
                    ['Employee Name', d.EmployeeName], ['Employee ID', d.EmployeeId], ['Department', d.Department], ['Position', d.Position],
                    ['Employment Start', d.EmpStartDate], ['Vesting Start', d.VestingStartDate], ['Vesting End', d.VestingEndDate],
                    ['Vesting %', d.VestingPercentage], ['Exercise Price / Share', d.ExercisePricePerShare],
                ],
            },
            {
                title: 'Allocation details',
                fields: [['Grant ID', d.GrantID], ['Grant Date', d.GrantDate], ['Shares Granted', d.NumberofSharesGranted], ['Grant Status', d.GrantStatus]],
            },
            {
                title: 'Exercise option',
                fields: [
                    ['Option ID', d.OptionID], ['Exercise Date', d.ExerciseDate], ['Shares Exercised', d.NumberofSharesExercised],
                    ['Exercise Price', d.ExercisePrice], ['Exercise Amount', d.ExerciseAmount], ['Exercise Status', d.ExerciseStatus],
                ],
            },
        ],
        extra: (r, d) => <DocButton label="View compliance upload" url={d.ComplianceUploadDocs ? buildShareCreationUrl(d.ComplianceUploadDocs) : null} />,
        approve: {
            route: 'Accounts/ApproveShareCreation',
            payload: (r, d, { action, note, user, roleId }) => ({ RefNo: d.RefNo, Status: action, Remarks: note, RoleId: roleId, CreatedBy: user }),
            ok: OK,
        },
    },
};
