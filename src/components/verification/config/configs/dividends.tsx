// Dividends — the Corex web's dedicated pages expressed as configs:
//   DividendDeclaration   pages/shares/DividendDeclarationVerification.jsx   (capitalSlice/dividendDeclarationSlice)
//   DividendDistribution  pages/shares/DividendDistributionVerification.jsx  (capitalSlice/dividendDistributionSlice)
//   DividendBankPayment   pages/shares/DividendBankPaymentVerification.jsx   (capitalSlice/dividendBankPaymentSlice)
// Queue and detail routes take the role / transaction in the URL path. All three ask for the
// "I have verified" tick, keep Return and accept whatever the approve route answers (the web
// only checks for an HTTP error); the GetStatuslist Value is posted as the action.
import React from 'react';
import { Coins, Landmark, Users } from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { TableBlock, fmt } from '../parts';
import type { Rec, VerificationConfig } from '../types';
import { ANY, list } from './shared';

const count = (v: unknown) => (v || v === 0 ? Number(v).toLocaleString('en-IN') : null);

const approvePayload = (ref: (r: Rec, d: Rec) => unknown): VerificationConfig['approve']['payload'] =>
    (r, d, { value, note, user, roleId }) => ({
        TransactionRefno: parseInt(String(ref(r, d)), 10), Roleid: parseInt(roleId, 10), Action: value, Note: note, Createdby: user,
    });

export const DIVIDEND_CONFIGS: Record<string, VerificationConfig> = {
    DividendDeclaration: {
        title: 'Dividend Declaration Verification',
        successLabel: 'Dividend Declaration',
        noun: 'declaration',
        icon: Coins,
        searchPlaceholder: 'Search ref no, financial year, status…',
        queue: { route: 'Accounts/GetVerifyDividendDeclaration/{roleId}', params: () => ({}) },
        itemKey: (r) => r.TransactionRefNo,
        card: {
            title: (r) => `${r.FinancialYear} · ${r.DividendPercentage}%`,
            subtitle: (r) => `Ref ${r.TransactionRefNo}`,
            meta: (r) => [r.DeclarationDate, r.TotalShares != null && `${count(r.TotalShares)} shares`].filter(Boolean).join(' · '),
            amount: (r) => money(r.TotalDividendAmount || 0),
        },
        searchText: (r) => `${r.TransactionRefNo} ${r.FinancialYear} ${r.Status}`,
        detail: { route: (r) => `Accounts/GetDividendDeclarationByRefno/${r.TransactionRefNo}`, params: () => ({}) },
        // The web falls back to MOID 680 when the record carries none
        moid: (r, d) => d.MOID || 680,
        remarksKey: (r, d) => String(d.TransactionRefNo ?? r.TransactionRefNo ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all dividend declaration details.',
        header: {
            title: (r, d) => `${d.FinancialYear || r.FinancialYear} Dividend Declaration`,
            subtitle: (r, d) => money(d.TotalDividendAmount || 0),
            chips: (r, d) => [`Ref ${d.TransactionRefNo || r.TransactionRefNo}`, `${d.DividendPercentage ?? r.DividendPercentage}% dividend`, d.Status],
        },
        sections: (r, d) => [{
            fields: [
                ['Financial Year', d.FinancialYear], ['Declaration Date', d.DeclarationDate], ['Net Profit After Tax', money(d.NetProfitAfterTax || 0)],
                ['Dividend %', `${d.DividendPercentage || 0}%`], ['Total Dividend', money(d.TotalDividendAmount || 0)], ['Total Shares', count(d.TotalShares || 0)],
                ['Per Share Value', money(d.PerShareValue || 0)], ['Dividend Balance', money(d.DividendBalance || 0)], ['Status', d.Status],
                ['Created By', d.CreatedBy], ['Created Date', d.CreatedDate],
            ],
        }],
        approve: { route: 'Accounts/ApproveDividendDeclaration', payload: approvePayload((r, d) => r.TransactionRefNo || d.TransactionRefNo), ok: ANY },
    },

    DividendDistribution: {
        title: 'Dividend Distribution Verification',
        successLabel: 'Dividend Distribution',
        noun: 'distribution',
        icon: Users,
        searchPlaceholder: 'Search ref no, financial year, lot, status…',
        queue: { route: 'Accounts/GetVerifyDividendDistribution/{roleId}', params: () => ({}) },
        itemKey: (r) => r.TransactionRefNo,
        card: {
            title: (r) => r.LotName,
            subtitle: (r) => `Ref ${r.TransactionRefNo} · FY ${r.FinancialYear}`,
            meta: (r) => [`${r.TDSPercentage}% TDS`, r.ShareholderCount != null && `${r.ShareholderCount} shareholders`].filter(Boolean).join(' · '),
            amount: (r) => money(r.NetPayableAmount || 0),
        },
        searchText: (r) => `${r.TransactionRefNo} ${r.FinancialYear} ${r.LotName} ${r.Status}`,
        // Data = { Master, Details }
        detail: { route: (r) => `Accounts/GetDividendDistributionByRefno/${r.TransactionRefNo}`, params: () => ({}) },
        moid: (r, d) => (d.Master || {}).MOID || 684,
        remarksKey: (r, d) => String((d.Master || {}).TransactionRefNo ?? r.TransactionRefNo ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all dividend distribution details.',
        header: {
            title: (r, d) => (d.Master || {}).LotName || r.LotName || 'Distribution Lot',
            subtitle: (r, d) => money((d.Master || {}).NetPayableAmount ?? r.NetPayableAmount ?? 0),
            chips: (r, d) => [`Ref ${r.TransactionRefNo}`, `FY ${r.FinancialYear}`, `${r.TDSPercentage}% TDS`, (d.Master || {}).Status],
        },
        sections: (r, d) => {
            const m = d.Master || {};
            return [{
                fields: [
                    ['Financial Year', m.FinancialYear], ['Lot Name', m.LotName], m.LotDescription && ['Lot Description', m.LotDescription, true],
                    ['Total Shares in Lot', count(m.TotalSharesInLot || 0)], ['Per Share Value', money(m.PerShareValue || 0)],
                    ['Gross Dividend', money(m.GrossDividendAmount || 0)], ['TDS %', `${m.TDSPercentage || 0}%`], ['Total TDS', money(m.TotalTDSAmount || 0)],
                    ['Net Payable', money(m.NetPayableAmount || 0)], ['Shareholders', m.ShareholderCount ?? '0'], ['Status', m.Status],
                    ['Created By', m.CreatedBy], ['Created Date', m.CreatedDate],
                ],
            }];
        },
        extra: (r, d) => {
            const rows = list(d.Details);
            if (!rows.length) return null;
            const sum = (k: string) => rows.reduce((a, x) => a + (Number(x[k]) || 0), 0);
            return (
                <TableBlock
                    title={`Shareholders (${rows.length})`}
                    heads={['Shareholder', 'Type', 'PAN', 'Shares', 'Per Share', 'Gross', 'TDS', 'TDS Amount', 'Net Payable', 'Bank', 'Account', 'IFSC', 'Email', 'Mobile']}
                    rows={rows.map((x) => [
                        x.ShareholderName, x.ShareholderType, x.PANNumber, count(x.NoOfShares), fmt(x.PerShareValue), fmt(x.GrossDividendAmount),
                        x.IsTDSApplicable ? `${x.TDSPercentage}%` : 'N/A', fmt(x.TDSAmount), fmt(x.NetPayableAmount), x.BankName, x.AccountNumber,
                        x.IFSCCode, x.EmailId, x.MobileNumber,
                    ])}
                    foot={[`Total ${count(sum('NoOfShares'))} shares · gross ${fmt(sum('GrossDividendAmount'))} · TDS ${fmt(sum('TDSAmount'))} · net ${fmt(sum('NetPayableAmount'))}`]}
                />
            );
        },
        approve: { route: 'Accounts/ApproveDividendDistribution', payload: approvePayload((r, d) => r.TransactionRefNo || (d.Master || {}).TransactionRefNo), ok: ANY },
    },

    DividendBankPayment: {
        title: 'Dividend Bank Payment Verification',
        successLabel: 'Dividend Bank Payment',
        noun: 'payment',
        icon: Landmark,
        searchPlaceholder: 'Search ref no, lot, bank…',
        queue: { route: 'Accounts/GetVerifyDividendBankPayment/{roleId}', params: () => ({}) },
        itemKey: (r) => r.TransactionRefNo,
        card: {
            title: (r) => r.LotName,
            subtitle: (r) => `Ref ${r.TransactionRefNo}`,
            meta: (r) => [r.PaymentMode, r.BankName, r.PaymentDate].filter(Boolean).join(' · '),
            amount: (r) => money(r.TotalAmount || 0),
        },
        searchText: (r) => `${r.TransactionRefNo} ${r.LotName} ${r.BankName} ${r.Status}`,
        // Data = { PaymentMaster, ShareholderDetails, BankTransactionInfo }
        detail: { route: (r) => `Accounts/GetDividendBankPaymentByRefno/${r.TransactionRefNo}`, params: () => ({}) },
        moid: (r, d) => (d.PaymentMaster || {}).MOID,
        remarksKey: (r, d) => String((d.PaymentMaster || {}).TransactionRefNo ?? r.TransactionRefNo ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all dividend bank payment details.',
        header: {
            title: (r, d) => (d.PaymentMaster || {}).LotName || r.LotName,
            subtitle: (r, d) => money((d.PaymentMaster || {}).TotalAmount ?? r.TotalAmount ?? 0),
            chips: (r, d) => [`Ref ${r.TransactionRefNo}`, (d.PaymentMaster || {}).PaymentMode, (d.PaymentMaster || {}).Status],
        },
        sections: (r, d) => {
            const m = d.PaymentMaster || {};
            const b = d.BankTransactionInfo || {};
            return [
                {
                    fields: [
                        ['Financial Year', m.FinancialYear], ['Lot Name', m.LotName], ['Distribution ID', m.DistributionId],
                        ['Bank Name', m.BankName], ['Account Number', m.AccountNo], ['Account Holder', m.AccountHolderName],
                        ['Current Bank Balance', money(m.CurrentBankBalance || 0)], ['Bank Location', m.BankLocation],
                        ['Payment Mode', m.PaymentMode], ['Cheque Number', m.ChequeNo || 'N/A'], ['Cheque Date', m.ChequeDate || 'N/A'],
                        ['Total Payment', money(m.TotalAmount || 0)], ['Payment Date', m.PaymentDate], ['Status', m.Status],
                        ['Created By', m.CreatedBy], ['Created Date', m.CreatedDate],
                    ],
                },
                d.BankTransactionInfo && {
                    title: 'Bank transaction',
                    fields: [['Transaction ID', b.BankTransactionId], ['Mode of Pay', b.ModeOfPay], ['Number', b.Number], ['Remarks', b.Remarks, true]],
                },
            ];
        },
        approve: { route: 'Accounts/ApproveDividendBankPayment', payload: approvePayload((r, d) => r.TransactionRefNo || (d.PaymentMaster || {}).TransactionRefNo), ok: ANY },
    },
};
