// Client billing — ported from the Corex web pages/Accounts/verificationConfigs.jsx (ClientInvoice,
// ClientManufacturingInvoice, ClientTradingInvoice, ClientBadDebt, ClientScrapSaleInvoice, ClientPOAmend,
// WorkInProgress). Routes, params, payloads and success literals are the web's.
import React from 'react';
import { AlertOctagon, Factory, FilePen, FileText, Hammer, Recycle, ShoppingBag } from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { buildBadDebtUrl } from '@/src/service/s3Config';
import {
    CheckedItems, DocButton, TableBlock, TotalLine, WIPPartyEditor, allItemsChecked, displayDate, fmt, isoDate, stockBreakupSheet, todayIso,
} from '../parts';
import type { Rec, SectionSpec, VerificationConfig } from '../types';

const AMOUNT = /^\d*\.?\d{0,2}$/;
const list = (v: unknown): Rec[] => (Array.isArray(v) ? v : []);

// Client invoice read-only sections (Client / Manufacturing / Trading invoice views share this layout)
const invoiceSections = (d: Rec): (SectionSpec | false)[] => [
    {
        title: 'Invoice',
        fields: [
            ['Invoice Number', d.ClientInvoiceNo], ['PO Number', d.PONumber], ['Cost Center', d.CCCode],
            ['Invoice Sub Type', d.InvoiceSubType], ['Client', d.ClientName], ['Sub Client', d.SubClientName],
            ['Running Account No', d.RANO], ['Invoice Date', d.VerificationInvDate], ['Invoice Making Date', d.VerificationMakingDate],
            ['Basic Value', money(d.BasicValue)], ['Company GST', d.CompanyGST], ['Client GST', d.ClientGST],
            ['GST Applicable', d.IsGstApplicable], ['TCS Applicable', d.IsTCSApplicable],
        ],
    },
    d.IsGstApplicable === 'Yes' && {
        title: 'GST taxes',
        fields: [
            ['GST Type', d.GSTType], ['Account Head', d.Taxdcas],
            ...(d.Statecheck
                ? [['CGST Sub Account Head', d.Cgstsdca], ['CGST Amount', money(d.Cgstsdcaamt)],
                    ['SGST Sub Account Head', d.Sgstsdca], ['SGST Amount', money(d.Sgstsdcaamt)]] as SectionSpec['fields']
                : [['IGST Sub Account Head', d.Igstsdca], ['IGST Amount', money(d.Igstsdcaamt)]] as SectionSpec['fields']),
            ['Total Tax', money(d.TaxTotal)],
        ],
    },
    d.IsTCSApplicable === 'Yes' && {
        title: 'TCS',
        fields: [['Account Head', d.TCSDCA], ['Sub Account Head', d.TCSSDCA], ['Amount', money(d.TCSAmount)]],
    },
    { fields: [['Transaction Amount', money(d.Total)], d.InvoiceRemarks && ['Remarks', d.InvoiceRemarks, true]] },
];

const invoiceHeader: VerificationConfig['header'] = {
    title: (r, d) => d.ClientInvoiceNo,
    subtitle: (r, d) => money(d.Total),
    chips: (r, d) => [`PO ${d.PONumber}`, d.CCCode, d.InvoiceSubType],
};

const invoiceCard: VerificationConfig['card'] = {
    title: (r) => r.ClientInvoiceNo,
    subtitle: (r) => `PO ${r.PONumber}`,
    meta: (r) => `${r.CCCode} · ${r.InvoiceSubType}`,
};

const itemCodesCheck = (items: unknown, ext: Rec) => {
    const rows = list(items);
    if (!rows.length) return ['Invalid Submission — no item codes found for this invoice'];
    return allItemsChecked(rows, ext) ? [] : ['Please Verify ItemCodes'];
};

export const CLIENT_BILLING_CONFIGS: Record<string, VerificationConfig> = {
    // Legacy /AccountsApproval/VerifyClientInvoice (+ VerifyClientInvoiceGrid / VerifyClientInvoiceView)
    ClientInvoice: {
        title: 'Client Invoice Verification',
        successLabel: 'Client Invoice',
        noun: 'invoice',
        icon: FileText,
        searchPlaceholder: 'Search by invoice no, PO no, cost center…',
        queue: { route: 'Accounts/GetVerificationClientInvoice', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.ClientInvoiceNo,
        card: invoiceCard,
        searchText: (r) => `${r.ClientInvoiceNo} ${r.PONumber} ${r.CCCode} ${r.InvoiceSubType}`,
        detail: { route: 'Accounts/GetVerificationClientInvoicebyNo', params: (r) => ({ InvoiceNo: r.ClientInvoiceNo }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.ClientInvoiceNo,
        showReturn: 'Yes',
        isReturned: (r) => String(r.Status) === '0',
        header: invoiceHeader,
        sections: (r, d) => invoiceSections(d),
        // spApproveClientInvoice returns 'Submitted+<InvoiceNo>'
        approve: {
            route: 'Accounts/ApproveClientInvoice',
            payload: (r, d, { action, note, user, roleId }) => ({
                ClientInvoiceNo: d.ClientInvoiceNo, Action: action, ApprovalNote: note, CreatedBy: user, Roleid: roleId,
            }),
            ok: (status) => typeof status === 'string' && status.startsWith('Submitted'),
        },
        // Legacy UpdateClientInvoiceCreation → spClientInvoiceCreation (Action 'Update'). Dates stay as issued;
        // Total = Basic + GST + TCS
        resubmit: {
            fields: [
                { key: 'RANO', label: 'Running Account No', required: true },
                { key: 'InvoiceDate', label: 'Invoice Date', readOnly: true },
                { key: 'InvoiceMakingDate', label: 'Invoice Making Date', readOnly: true },
                { key: 'BasicValue', label: 'Basic Value', required: true, filter: AMOUNT },
                { key: 'Cgstsdcaamt', label: 'CGST Amount', required: true, filter: AMOUNT, show: (v) => v.gst === 'CS' },
                { key: 'Sgstsdcaamt', label: 'SGST Amount', required: true, filter: AMOUNT, show: (v) => v.gst === 'CS' },
                { key: 'Igstsdcaamt', label: 'IGST Amount', required: true, filter: AMOUNT, show: (v) => v.gst === 'I' },
                { key: 'TCSAmount', label: 'TCS Amount', required: true, filter: AMOUNT, show: (v) => v.tcs },
                { key: 'Total', label: 'Invoice Value', readOnly: true },
                { key: 'InvoiceRemarks', label: 'Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => {
                const s = (x: unknown) => (x != null ? String(x) : '');
                const gstOn = d.IsGstApplicable === 'Yes';
                return {
                    RANO: d.RANO || '', InvoiceDate: d.VerificationInvDate || '', InvoiceMakingDate: d.VerificationMakingDate || '',
                    BasicValue: s(d.BasicValue), InvoiceRemarks: d.InvoiceRemarks || '',
                    gst: !gstOn ? '' : d.Statecheck ? 'CS' : 'I', tcs: d.IsTCSApplicable === 'Yes',
                    Cgstsdcaamt: s(d.Cgstsdcaamt), Sgstsdcaamt: s(d.Sgstsdcaamt), Igstsdcaamt: s(d.Igstsdcaamt), TCSAmount: s(d.TCSAmount),
                };
            },
            derive: (v) => {
                const n = (x: unknown) => parseFloat(String(x)) || 0;
                const gst = v.gst === 'CS' ? n(v.Cgstsdcaamt) + n(v.Sgstsdcaamt) : v.gst === 'I' ? n(v.Igstsdcaamt) : 0;
                return { ...v, Total: (n(v.BasicValue) + gst + (v.tcs ? n(v.TCSAmount) : 0)).toFixed(2) };
            },
            validate: (v) => {
                const zero = (x: unknown) => !(parseFloat(String(x)) > 0);
                return [
                    zero(v.BasicValue) && 'Enter Basic Value',
                    v.gst === 'CS' && zero(v.Cgstsdcaamt) && 'Enter CGST Amount',
                    v.gst === 'CS' && zero(v.Sgstsdcaamt) && 'Enter SGST Amount',
                    v.gst === 'I' && zero(v.Igstsdcaamt) && 'Enter IGST Amount',
                    v.tcs && zero(v.TCSAmount) && 'Enter TCS Amount',
                ];
            },
            route: 'Accounts/UpdateClientInvoiceCreation',
            payload: (r, d, v, { user, roleId }) => {
                const n = (x: unknown) => parseFloat(String(x)) || 0;
                return {
                    PONumber: d.PONumber, RANO: v.RANO.trim(), CCCode: d.CCCode, ClientInvoiceNo: d.ClientInvoiceNo,
                    InvoiceDate: v.InvoiceDate, InvoiceMakingDate: v.InvoiceMakingDate,
                    BasicValue: n(v.BasicValue), Total: n(v.Total), InvoiceRemarks: v.InvoiceRemarks.trim(),
                    Clientcode: d.Clientcode, SubClientcode: d.SubClientcode, InvoiceSubType: d.InvoiceSubType,
                    CreatedBy: user, Roleid: roleId, Statecheck: !!d.Statecheck,
                    IsGstApplicable: d.IsGstApplicable, IsTCSApplicable: d.IsTCSApplicable,
                    Cgstsdcaamt: v.gst === 'CS' ? n(v.Cgstsdcaamt) : 0, Sgstsdcaamt: v.gst === 'CS' ? n(v.Sgstsdcaamt) : 0,
                    Igstsdcaamt: v.gst === 'I' ? n(v.Igstsdcaamt) : 0, TCSAmount: v.tcs ? n(v.TCSAmount) : 0,
                    Action: 'Update',
                };
            },
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyClientManufacturingInvoice (+ Grid / View / ItemCodeGrid)
    ClientManufacturingInvoice: {
        title: 'Client Manufacturing Invoice Verification',
        successLabel: 'Manufacturing Invoice',
        noun: 'invoice',
        icon: Factory,
        searchPlaceholder: 'Search by invoice no, PO no, cost center…',
        queue: { route: 'Accounts/GetVerifyClientManufacturingInvoiceGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => r.ClientInvoiceNo,
        card: invoiceCard,
        searchText: (r) => `${r.ClientInvoiceNo} ${r.PONumber} ${r.CCCode} ${r.InvoiceSubType}`,
        detail: { route: 'Accounts/GetVerificationClientManufacturingTypeInvoicebyNo', params: (r) => ({ InvoiceNo: r.ClientInvoiceNo }) },
        rowAux: [{ name: 'mfgItems', route: 'Accounts/VerifyClientManufacturingItemCodeGrid', params: (r) => ({ InvoiceNo: r.ClientInvoiceNo }) }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.ClientInvoiceNo,
        // Legacy strips Return from the status list on this screen
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: invoiceHeader,
        sections: (r, d) => invoiceSections(d),
        extra: (r, d, { aux, ext, setExt }) => {
            if (!aux.mfgItems) return null;
            const items = list(aux.mfgItems);
            const isMfg = (it: Rec) => it.Ofromtable === 'Manufacturing';
            return (
                <CheckedItems
                    title="Item codes"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    tone={(it) => (isMfg(it) ? 'MANUFACTURE' : 'STOCK')}
                    columns={[
                        { label: 'Item Code', render: (it) => it.OItemcode },
                        { label: 'Item Name', render: (it) => it.OItemname, align: 'left' },
                        { label: 'Specification', render: (it) => it.OItemspecification, align: 'left' },
                        { label: 'Unit', render: (it) => it.OItemunit },
                        { label: 'Qty', render: (it) => it.OItemqty },
                        // Stock rows are components of the manufactured item — legacy hides their rate / amount
                        { label: 'Selling Price', render: (it) => (isMfg(it) ? fmt(it.OSellingBasicprice) : '') },
                        { label: 'Amount', render: (it) => (isMfg(it) ? fmt(it.OItemamt) : '') },
                    ]}
                    footer={<TotalLine value={fmt(items.reduce((a, it) => a + (Number(it.OItemamt) || 0), 0))} />}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => itemCodesCheck(aux.mfgItems, ext),
        approve: {
            route: 'Accounts/ApproveClientManufactureInvoice',
            payload: (r, d, { action, note, user, roleId }) => ({
                ClientInvoiceNo: d.ClientInvoiceNo, Action: action, ApprovalNote: note, CreatedByM: user, Roleid: roleId,
            }),
            ok: (status) => typeof status === 'string' && status.split('+')[0] === 'Submitted',
        },
    },

    // Legacy /AccountsApproval/VerifyClientTradingInvoice (+ Grid / View / ItemCodeGrid / TradeItemCodeSummaryPopup)
    ClientTradingInvoice: {
        title: 'Client Trading Invoice Verification',
        successLabel: 'Trading Invoice',
        noun: 'invoice',
        icon: ShoppingBag,
        searchPlaceholder: 'Search by invoice no, PO no, cost center…',
        queue: { route: 'Accounts/GetVerifyClientTradingInvoiceGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => r.ClientInvoiceNo,
        card: invoiceCard,
        searchText: (r) => `${r.ClientInvoiceNo} ${r.PONumber} ${r.CCCode} ${r.InvoiceSubType}`,
        detail: { route: 'Accounts/GetVerificationClientTradingTypeInvoicebyNo', params: (r) => ({ InvoiceNo: r.ClientInvoiceNo }) },
        rowAux: [{ name: 'tradeItems', route: 'Accounts/GetClientTradingItemCodeGridDetails', params: (r) => ({ InvoiceNo: r.ClientInvoiceNo }) }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.ClientInvoiceNo,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: invoiceHeader,
        sections: (r, d) => invoiceSections(d),
        extra: (r, d, { aux, ext, setExt, openSheet }) => {
            if (!aux.tradeItems) return null;
            const items = list(aux.tradeItems);
            const has = (k: string) => items.some((it) => it[k] != null);
            const sum = (k: string) => fmt(items.reduce((a, it) => a + (Number(it[k]) || 0), 0));
            return (
                <CheckedItems
                    title="Item codes"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    onItemPress={(it) => openSheet(stockBreakupSheet(it.OItemcode, 'Accounts/TradeItemCodeSummaryPopup', { Itemcode: it.OItemcode, InvoiceNo: d.ClientInvoiceNo }))}
                    columns={[
                        { label: 'Item Code', render: (it) => it.OItemcode, link: true },
                        { label: 'Item Name', render: (it) => it.OItemname, align: 'left' },
                        { label: 'Specification', render: (it) => it.OItemspecification, align: 'left' },
                        { label: 'Units', render: (it) => it.OUnits },
                        { label: 'Qty', render: (it) => it.OItemqty },
                        { label: 'Selling Rate', render: (it) => fmt(it.OSellingBasicprice) },
                        { label: 'Amount', render: (it) => fmt(it.OItemamt) },
                        ...(has('Ocgstper') ? [{ label: 'CGST', render: (it: Rec) => `${it.Ocgstper ?? ''}% ${fmt(it.Ocgstamt)}` }] : []),
                        ...(has('Osgstper') ? [{ label: 'SGST', render: (it: Rec) => `${it.Osgstper ?? ''}% ${fmt(it.Osgstamt)}` }] : []),
                        ...(has('OIgstper') ? [{ label: 'IGST', render: (it: Rec) => `${it.OIgstper ?? ''}% ${fmt(it.OIgstamt)}` }] : []),
                        { label: 'HSN', render: (it) => it.OHSN },
                    ]}
                    footer={(
                        <>
                            <TotalLine label="Amount" value={sum('OItemamt')} />
                            {has('Ocgstper') ? <TotalLine label="CGST" value={sum('Ocgstamt')} /> : null}
                            {has('Osgstper') ? <TotalLine label="SGST" value={sum('Osgstamt')} /> : null}
                            {has('OIgstper') ? <TotalLine label="IGST" value={sum('OIgstamt')} /> : null}
                        </>
                    )}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => itemCodesCheck(aux.tradeItems, ext),
        approve: {
            route: 'Accounts/ApproveTradeClientInvoice',
            payload: (r, d, { action, note, user, roleId }) => ({
                ClientInvoiceNo: d.ClientInvoiceNo, Action: action, ApprovalNote: note, CreatedBy: user, Roleid: roleId,
            }),
            ok: (status) => typeof status === 'string' && status.split('+')[0] === 'Submitted',
        },
    },

    // Legacy /AccountsApproval/VerifyClientBadDebtRecievable — one queue, three record types by Paytype:
    // 'Invoice Service' (bad-debt receivable), 'Retention' and 'Hold' (bad-debt write-off of those balances)
    ClientBadDebt: {
        title: 'Client Bad Debt Verification',
        successLabel: 'Bad Debt',
        noun: 'bad debt',
        icon: AlertOctagon,
        searchPlaceholder: 'Search by transaction id, invoice, cost center, type…',
        queue: { route: 'Accounts/VerifyClientBadDebtRecievableGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => r.Refno,
        card: {
            title: (r) => r.InvoiceNo || `Transaction ${r.Refno}`,
            subtitle: (r) => `${r.Paytype} · Transaction ${r.Refno}`,
            meta: (r) => `${r.CCCode || ''}${r.TransactionDate ? ` · ${r.TransactionDate}` : ''}`,
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.Refno} ${r.InvoiceNo} ${r.CCCode} ${r.Paytype} ${r.TransactionDate} ${r.Amount}`,
        detail: {
            route: (r) => (r.Paytype === 'Retention' ? 'Accounts/VerifyRetentionBadDebtPaymentView'
                : r.Paytype === 'Hold' ? 'Accounts/GetVerificationBDHoldDetailsbyRefno'
                    : 'Accounts/GetVerificationClientBDRecievablebyTransId'),
            params: (r) => (r.Paytype === 'Retention' || r.Paytype === 'Hold' ? { TransRefno: r.Refno } : { TransactionId: r.Refno }),
        },
        rowAux: [
            { name: 'bdTcs', route: 'Accounts/GetCleintInvoiceTCSData', params: (r) => ({ Invoiceno: r.InvoiceNo }), when: (r) => r.Paytype === 'Invoice Service' },
            { name: 'bdTaxes', route: 'Accounts/GetClientInvTaxDetailsbyInvno', params: (r) => ({ InvNo: r.InvoiceNo }), when: (r) => r.Paytype === 'Invoice Service' },
        ],
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'Yes',
        // Legacy drops Return on the receivable screen only; Retention / Hold keep it
        excludeActions: (r) => (r.Paytype === 'Invoice Service' ? ['return'] : []),
        isReturned: (r) => String(r.Status) === '0',
        returnedNotice: 'Correct and resubmit it from the Client Bad Debt screen — there is nothing to verify until it is resubmitted.',
        header: {
            title: (r, d) => (r.Paytype === 'Invoice Service' ? d.InvoiceNo : d.ClientName) || `Transaction ${r.Refno}`,
            subtitle: (r, d) => money(r.Paytype === 'Invoice Service' ? d.Amount : d.PaymentAmount),
            chips: (r) => [r.Paytype, `Transaction ${r.Refno}`, r.CCCode],
        },
        sections: (r, d) => (r.Paytype === 'Invoice Service'
            ? [{
                title: 'Invoice',
                fields: [
                    ['PO Number', d.PONo], ['Invoice No', d.InvoiceNo], ['Invoice Date', d.InvoiceDate],
                    ['Invoice Making Date', d.InvoiceMakingDate], ['Cost Center', d.CCCode], ['Client', d.Client],
                    ['Sub Client', d.SubClient], ['Invoice Category', d.InvoiceCategory], ['RA No', d.RANo],
                    ['Basic Value', money(d.Basic_Value)],
                ],
            }, {
                title: 'Bad debt',
                fields: [['Transaction Amount', money(d.Amount)], ['Transaction Date', d.TransactionDate]],
            }]
            : [{
                fields: [
                    ['Client', d.ClientName], ['Sub Client', d.SubClientName],
                    ['Transaction Date', r.Paytype === 'Hold' ? d.ReturnPayDate : d.PaymentDate],
                    ['Transaction Amount', money(d.PaymentAmount)],
                ],
            }]),
        extra: (r, d, { aux }) => {
            const doc = <DocButton label="View document" url={d.Docpath ? buildBadDebtUrl(d.Docpath) : null} />;
            if (r.Paytype !== 'Invoice Service') {
                const hold = r.Paytype === 'Hold';
                const rows = list(hold ? d.HoldInvoiceList : d.RetInvDetailsList);
                return (
                    <>
                        <TableBlock
                            title="Invoices"
                            heads={['Invoice No', 'PO', 'Date', 'Amount']}
                            rows={rows.map((it) => [it.ClientInvoiceNo, it.PONumber, it.InvoiceDate, fmt(hold ? it.HoldBalance : it.RetBalance)])}
                        />
                        {doc}
                    </>
                );
            }
            const tcs = aux.bdTcs;
            const taxes = list(aux.bdTaxes);
            const taxTotal = taxes.reduce((a, t) => a + (Number(t.TaxValue) || 0), 0);
            return (
                <>
                    {tcs && tcs.IsTCSApplicable === 'Yes' ? (
                        <TableBlock title="TCS" heads={['Account Head', 'Sub Account Head', 'Amount']} rows={[[tcs.TCSDCA, tcs.TCSSDCA, fmt(tcs.TCSAmount)]]} />
                    ) : null}
                    {taxes.length ? (
                        <TableBlock
                            title="Taxes"
                            heads={['Tax Number', 'Cost Center', 'Account Head', 'Sub Account Head', 'Tax Value', 'Type']}
                            rows={taxes.map((t) => [t.TaxNo, t.CCCode, t.DCACode, t.SubDCACode, fmt(t.TaxValue), t.TypesOfTaxName])}
                            foot={['Tax total', fmt(taxTotal)]}
                        />
                    ) : null}
                    {doc}
                </>
            );
        },
        approve: {
            route: (r) => (r.Paytype === 'Retention' ? 'Accounts/ApproveBDRetentionPayment'
                : r.Paytype === 'Hold' ? 'Accounts/ApproveBadDebtHoldPayment'
                    : 'Accounts/ApproveClientBadDebtRecievable'),
            payload: (r, d, { action, note, user, roleId }) => {
                if (r.Paytype === 'Invoice Service') {
                    return {
                        Refno: r.Refno, Action: action, ApprovalNote: note, InvoiceDate: d.InvoiceDate, InvoiceNo: d.InvoiceNo,
                        Amount: d.Amount, Createdby: user, Roleid: roleId,
                    };
                }
                // Legacy posts the invoice list as trailing-comma CSVs
                const hold = r.Paytype === 'Hold';
                const rows = list(hold ? d.HoldInvoiceList : d.RetInvDetailsList);
                return {
                    BankTransactionRefNo: r.Refno,
                    InvoiceNos: rows.map((it) => `${it.ClientInvoiceNo},`).join(''),
                    [hold ? 'PaidHoldAmounts' : 'PaidRetAmounts']: rows.map((it) => `${hold ? it.HoldBalance : it.RetBalance},`).join(''),
                    Action: action, ApprovalNote: note, PaymentAmount: d.PaymentAmount, Createdby: user, Roleid: roleId,
                };
            },
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyClientScrapSaleInvoice (+ Grid / View)
    ClientScrapSaleInvoice: {
        title: 'Client Scrap Sale Invoice Verification',
        successLabel: 'Scrap Sale Invoice',
        noun: 'invoice',
        icon: Recycle,
        searchPlaceholder: 'Search by invoice, request no, cost center…',
        queue: { route: 'Accounts/GetVerificationClientScrapSaleInvoice', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => r.ClientInvoiceNo,
        card: {
            title: (r) => r.ClientInvoiceNo,
            subtitle: (r) => [r.RequestNumber && `Request ${r.RequestNumber}`, r.InvoiceSubType].filter(Boolean).join(' · '),
            meta: (r) => r.CCCode,
        },
        searchText: (r) => `${r.ClientInvoiceNo} ${r.RequestNumber} ${r.CCCode} ${r.InvoiceSubType}`,
        detail: { route: 'Accounts/GetVerificationClientScrapTypeInvoicebyNo', params: (r) => ({ InvoiceNo: r.ClientInvoiceNo }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.ClientInvoiceNo,
        // Legacy drops Return from this screen's status list
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.ClientInvoiceNo, subtitle: (r, d) => money(d.Total), chips: (r, d) => [d.InvoiceSubType, d.CCCode] },
        sections: (r, d) => {
            const gst = d.IsGstApplicable === 'Yes';
            const intra = d.Statecheck === true || String(d.Statecheck).toLowerCase() === 'true';
            return [{
                title: 'Invoice',
                fields: [
                    ['Client Invoice Number', d.ClientInvoiceNo], ['Request Number', d.RequestNumber], ['Cost Center', d.CCCode],
                    ['Invoice Sub Type', d.InvoiceSubType], ['Client', d.ClientName], ['Sub Client', d.SubClientName],
                    ['Running Account Number', d.RANO], ['Invoice Date', d.VerificationInvDate], ['Invoice Making Date', d.VerificationMakingDate],
                    ['Basic Value', money(d.BasicValue)], ['Is GST Applicable', d.IsGstApplicable], ['Is TCS Applicable', d.IsTCSApplicable],
                    gst && ['GST Type', d.GSTType], gst && ['Company GST', d.CompanyGST], gst && ['Client GST', d.ClientGST],
                ],
            }, {
                title: 'GST',
                fields: gst ? [
                    ['Account Head', d.Taxdcas],
                    intra && ['CGST Sub Account Head', d.Cgstsdca], intra && ['CGST Amount', money(d.Cgstsdcaamt)],
                    intra && ['SGST Sub Account Head', d.Sgstsdca], intra && ['SGST Amount', money(d.Sgstsdcaamt)],
                    !intra && ['IGST Sub Account Head', d.Igstsdca], !intra && ['IGST Amount', money(d.Igstsdcaamt)],
                    ['Total Tax', money(d.TaxTotal)],
                ] : [],
            }, {
                title: 'TCS',
                fields: d.IsTCSApplicable === 'Yes' ? [['Account Head', d.TCSDCA], ['Sub Account Head', d.TCSSDCA], ['Amount', money(d.TCSAmount)]] : [],
            }, {
                fields: [['Transaction Amount', money(d.Total)], d.InvoiceRemarks && ['Remarks', d.InvoiceRemarks, true]],
            }];
        },
        approve: {
            route: 'Accounts/ApproveScrapClientInvoice',
            payload: (r, d, { action, note, user, roleId }) => ({
                ClientInvoiceNo: r.ClientInvoiceNo, Action: action, ApprovalNote: note, CreatedBy: user, Roleid: roleId,
            }),
            // spApproveClientScrapInvoice answers "Submitted+<invoice no>"
            ok: (s) => String(s || '').split('+')[0] === 'Submitted',
        },
    },

    // Legacy /AccountsApproval/VerifyClientPOAmend (+ Grid / View; returned rows edit inline via UpdateAmendPO)
    ClientPOAmend: {
        title: 'Client PO Amendment Verification',
        successLabel: 'Client PO Amendment',
        noun: 'amendment',
        icon: FilePen,
        searchPlaceholder: 'Search by amend PO, PO, cost center…',
        queue: { route: 'Accounts/GetVerificationClientPOAmend', params: ({ roleId, userId }) => ({ Roleid: roleId, Userid: userId }) },
        itemKey: (r) => r.Amendpono,
        card: { title: (r) => r.Amendpono, subtitle: (r) => `PO ${r.oldPONO}`, meta: (r) => r.CostCenter, amount: (r) => money(r.Amendtotalvalue) },
        searchText: (r) => `${r.Amendpono} ${r.oldPONO} ${r.CostCenter} ${r.Amendtotalvalue}`,
        detail: { route: 'Accounts/GetVerificationClientPOAmendbyno', params: (r) => ({ Amendpono: r.Amendpono }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.Amendpono,
        // Legacy keeps the full status list here, Return included
        showReturn: 'Yes',
        isReturned: (r) => String(r.Status).trim() === '0',
        header: {
            title: (r) => r.Amendpono,
            subtitle: (r, d) => money(d.Amendtotalvalue),
            chips: (r, d) => [`PO ${d.oldPONO || r.oldPONO}`, d.CostCenter],
        },
        sections: (r, d) => [{
            fields: [
                ['Amend PO No', d.Amendpono], ['Purchase Order No', d.oldPONO], ['Cost Center', d.CostCenter],
                ['Completion Date', d.amendpocompletiondate], ['Amount', money(d.Amendpovalue)], ['GST', money(d.Amendegst)],
                ['Total Amount', money(d.Amendtotalvalue)],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveClientPOAmend',
            payload: (r, d, { action, note, user, roleId }) => ({
                oldPONO: d.oldPONO, Amendpono: d.Amendpono, Action: action, ApprovalNote: note, RoleId: roleId, Createdby: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
        // Legacy UpdateClientPOAmend; the completion date can be changed, from today on (as on the web)
        resubmit: {
            fields: [
                { key: 'CostCenter', label: 'Cost Center', readOnly: true },
                { key: 'oldPONO', label: 'Purchase Order No', readOnly: true },
                { key: 'Amendpono', label: 'Amend Purchase Order No', readOnly: true },
                { key: 'CompletionDate', label: 'Completion Date', type: 'date', required: true },
                { key: 'Amendpovalue', label: 'Amend PO Value', required: true, filter: AMOUNT },
                { key: 'Amendegst', label: 'GST Value', required: true, filter: AMOUNT },
                { key: 'Amendtotalvalue', label: 'Total Amend Value', readOnly: true },
            ],
            initial: (r, d) => ({
                CostCenter: d.CostCenter || '', oldPONO: d.oldPONO || '', Amendpono: d.Amendpono || '',
                CompletionDate: isoDate(d.amendpocompletiondate),
                Amendpovalue: d.Amendpovalue != null ? String(d.Amendpovalue) : '', Amendegst: d.Amendegst != null ? String(d.Amendegst) : '',
                Amendtotalvalue: d.Amendtotalvalue != null ? String(d.Amendtotalvalue) : '',
            }),
            derive: (v) => ({ ...v, Amendtotalvalue: ((parseFloat(v.Amendpovalue) || 0) + (parseFloat(v.Amendegst) || 0)).toFixed(2) }),
            validate: (v) => [
                v.CompletionDate && v.CompletionDate < todayIso() && 'Completion Date cannot be in the past',
                !(Number(v.Amendtotalvalue) > 0) && 'Invalid Total Amend Value',
            ],
            route: 'Accounts/UpdateAmendPO',
            payload: (r, d, v, { user, roleId }) => ({
                oldPONO: d.oldPONO, amendpocompletiondate: v.CompletionDate, Amendpono: d.Amendpono,
                Amendpovalue: parseFloat(v.Amendpovalue) || 0, Amendtotalvalue: parseFloat(v.Amendtotalvalue) || 0, Amendegst: parseFloat(v.Amendegst) || 0,
                Action: 'Update', RoleId: roleId, Createdby: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /Accounts/VerifyWorkInProgress (+ grid / view; returned rows → EditWorkInProgress)
    WorkInProgress: {
        title: 'Work In Progress Verification',
        successLabel: 'Work Progress',
        noun: 'work progress entry',
        icon: Hammer,
        searchPlaceholder: 'Search by cost center, PO, client, date…',
        queue: { route: 'Accounts/GetVerificationWorkProgress', params: ({ roleId, userId }) => ({ UserId: userId, Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: {
            title: (r) => r.PONumber || `Entry ${r.Id}`,
            subtitle: (r) => r.CCName,
            meta: (r) => [r.Date, r.ClientName].filter(Boolean).join(' · '),
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.CCName} ${r.PONumber} ${r.ClientName} ${r.SubClientName} ${r.Date} ${r.Amount}`,
        detail: { route: 'Accounts/GetWorkProgressById', params: (r) => ({ Id: r.Id }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Id,
        // Legacy fills the status dropdown straight from GetApprovalstatus, Return included
        showReturn: 'Yes',
        isReturned: (r) => String(r.Status).trim() === '0',
        header: { title: (r, d) => d.PONumber || `Entry ${r.Id}`, subtitle: (r, d) => money(d.Amount), chips: (r, d) => [d.CCName, d.Date] },
        sections: (r, d) => [{
            fields: [
                ['Cost Center', d.CCName], ['Client', d.ClientName], ['Sub Client', d.SubClientName],
                ['PO Number', d.PONumber], ['Date', d.Date], ['Amount', money(d.Amount)],
                ['Description', d.Description, true],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveWorkProgress',
            payload: (r, d, { action, note, user, roleId }) => ({
                Id: d.Id, CCCode: d.CCCode, PONumber: d.PONumber, Action: action, ApprovalNote: note, Amount: d.Amount,
                Roleid: roleId, CreatedBy: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
        // Legacy UpdateWorkProgress → spUpdateWorkProgress. Cost center stays fixed; client / sub client / PO cascade
        resubmit: {
            fields: [
                { key: 'CCName', label: 'Cost Center', readOnly: true },
                { key: 'Date', label: 'Date', type: 'date', required: true },
                { key: 'Amount', label: 'Amount', required: true, filter: AMOUNT },
                { key: 'Description', label: 'Description', type: 'textarea', required: true },
                { key: 'Remarks', label: 'User Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => ({
                CCName: d.CCName || '', Clientcode: d.Clientcode || '', SubClientcode: d.SubClientcode || '', PONumber: d.PONumber || '',
                Date: isoDate(d.Date), Amount: d.Amount != null ? String(d.Amount) : '', Description: d.Description || '', Remarks: '',
            }),
            render: (r, d, { values, setValues }) => <WIPPartyEditor ccCode={d.CCCode} wpId={d.Id} values={values} setValues={setValues} />,
            validate: (v) => [
                !v.Clientcode && 'Select Client',
                !v.SubClientcode && 'Select Sub Client',
                !v.PONumber && 'Select PO Number',
                !(Number(v.Amount) > 0) && 'Enter Amount',
                v.Date && v.Date > todayIso() && 'Date cannot be in the future',
            ],
            route: 'Accounts/UpdateWorkProgress',
            payload: (r, d, v, { user, roleId }) => ({
                Id: d.Id, CCCode: d.CCCode, Clientcode: v.Clientcode, SubClientcode: v.SubClientcode, PONumber: v.PONumber,
                Date: displayDate(v.Date), Amount: parseFloat(v.Amount) || 0, Description: v.Description.trim(), Remarks: v.Remarks.trim(),
                Roleid: roleId, CreatedBy: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },
};
