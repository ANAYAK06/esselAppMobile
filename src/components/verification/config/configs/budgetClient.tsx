// Cost center, client PO & general invoice — the Corex web's dedicated pages expressed as configs:
//   CostCenterApproval  pages/CostCenter/CostCenterApproval.jsx         (costCenterSlice/costCenterAppprovalSlice)
//   ClientPO            pages/ClientPO/VerifyClientPO.jsx               (clientPOSlice/clientPOVerificationSlice)
//   GeneralInvoice      pages/GeneralInvoice/GeneralInvoiceApproval.jsx (generalInvoice slice, api/GeneralInvoiceAPI)
// These pages accept whatever the approve route answers (only an HTTP error fails) and append the
// verifier's note to the record's "Role : User : Note||…" trail like the web.
import React from 'react';
import { Building, FileSignature, ReceiptIndianRupee } from 'lucide-react-native';
import { appendApprovalComment } from '@/src/api/verification/verificationCommonAPI';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { buildCostCenterDocUrl } from '@/src/service/s3Config';
import { DocButton } from '../parts';
import type { VerificationConfig } from '../types';
import { ANY } from './shared';

const firstCode = (v: unknown) => String(v ?? '').split(',')[0] || null;
const realDate = (v: unknown) => (v && v !== '0001-01-01T00:00:00' ? new Date(String(v)).toLocaleDateString('en-IN') : null);

export const BUDGET_CLIENT_CONFIGS: Record<string, VerificationConfig> = {
    CostCenterApproval: {
        title: 'Cost Center Approval',
        successLabel: 'Cost Center',
        noun: 'cost center',
        icon: Building,
        searchPlaceholder: 'Search name, code, incharge, state…',
        queue: { route: 'Accounts/GetApprovalCostCenterDetails', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => r.CCCode,
        card: {
            title: (r) => r.CCName,
            subtitle: (r) => [r.CCCode, r.CCInchargeName].filter(Boolean).join(' · '),
            meta: (r) => [r.CCType, r.State].filter(Boolean).join(' · '),
            amount: (r) => money(r.DayLimit || 0),
        },
        searchText: (r) => `${r.CCName} ${r.CCCode} ${r.CCInchargeName} ${r.State}`,
        detail: { route: 'Accounts/GetApprovalCCbyCC', params: (r, { userId }) => ({ CCCode: r.CCCode, userid: userId }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.DayLimit,
        remarksKey: (r) => r.CCCode,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r, d) => d.CCName, subtitle: (r, d) => `Day limit ${money(d.DayLimit || 0)}`, chips: (r, d) => [`CC ${d.CCCode}`, d.CCType && `${d.CCType} Cost Center`, d.CC_Status && `Status: ${d.CC_Status}`] },
        sections: (r, d) => [
            { fields: [['CC ID', d.CC_Id], ['Sub Type', d.SubType], ['State', d.State], ['Store Type', d.StoreType], ['Store Applicable', d.IsStoreApplicable], ['Group', d.Group || 'Not Assigned']] },
            { title: 'Incharge', fields: [['Name', d.CCInchargeName], ['Phone', d.InchargePhNo], ['CC Phone', d.PhoneNo], ['Site Address', d.SiteAddress, true]] },
            { title: 'Financial limits', fields: [['Day Limit', money(d.DayLimit)], ['Voucher Limit', money(d.VoucherLimit)]] },
            (d.EPPLFinalOfferNo || d.ClientAcceptanceReferenceNo) && {
                title: 'Contract & offer',
                fields: [
                    d.EPPLFinalOfferNo && ['Final Offer No', d.EPPLFinalOfferNo], d.EPPLFinalOfferNo && ['Offer Date', d.UpFinalOfferDate],
                    d.ClientAcceptanceReferenceNo && ['Client Ref No', d.ClientAcceptanceReferenceNo], d.ClientAcceptanceReferenceNo && ['Acceptance Date', d.UpClientAcceptanceDate],
                ],
            },
            (d.ClientInchargeName || d.ClientInchargePhNo || d.ClientInchargemailid) && {
                title: 'Client',
                fields: [['Name', d.ClientInchargeName], ['Phone', d.ClientInchargePhNo], ['Email', d.ClientInchargemailid, true]],
            },
        ],
        extra: (r, d) => (
            <>
                <DocButton label="Scope check list (approved by contracts)" url={d.contractscope ? buildCostCenterDocUrl(d.contractscope) : null} />
                <DocButton label="Client work order (T&C approved by contracts)" url={d.contractpretenderBudget ? buildCostCenterDocUrl(d.contractpretenderBudget) : null} />
            </>
        ),
        approve: {
            route: 'Accounts/ApproveCostCenter',
            payload: (r, d, { action, note, user, roleCode, roleId, userId }) => ({
                CCCode: r.CCCode, ApprovalNote: note, Remarks: appendApprovalComment(d.RemarksNote, roleCode || 'CC Approver', user, note),
                Action: action, RoleId: roleId, Userid: userId, Createdby: user, ApprovalStatus: action,
                ...(d.MOID ? { MOID: d.MOID } : {}), ...(d.CC_Id ? { CC_Id: d.CC_Id } : {}),
            }),
            ok: ANY,
        },
    },

    ClientPO: {
        title: 'Client PO Verification',
        successLabel: 'Client PO',
        noun: 'client PO',
        icon: FileSignature,
        searchPlaceholder: 'Search client, PO no, cost center…',
        queue: { route: 'Accounts/GetVerificationClientPO', params: ({ roleId, userId }) => ({ Roleid: roleId, Userid: userId }) },
        itemKey: (r) => r.pono,
        card: { title: (r) => r.clientid || r.pono, subtitle: (r) => `PO ${r.pono}`, meta: (r) => [r.CostCenter, r.postartdate].filter(Boolean).join(' · '), amount: (r) => money(r.povalue || 0) },
        searchText: (r) => `${r.clientid} ${r.pono} ${r.CostCenter}`,
        detail: { route: 'Accounts/GetVerificationClientPObyNo', params: (r) => ({ PoNumber: r.pono }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.povalue || d.total,
        remarksKey: (r, d) => d.pono || r.pono,
        showReturn: 'Yes',
        confirmLabel: 'I have verified all Client PO details.',
        header: {
            title: (r, d) => d.clientid || d.pono,
            subtitle: (r, d) => money(parseFloat(d.total || 0)),
            chips: (r, d) => [`PO ${d.pono}`, d.CostCenter && `CC ${d.CostCenter}`],
        },
        sections: (r, d) => [{
            fields: [
                ['PO Number', d.pono], ['Client ID', d.clientid], ['Sub Client ID', d.subclientid], ['Cost Center', d.CostCenter],
                ['RA Bill', d.rabill], ['RA Bill Dues', d.rabilldues], ['PO Value (excl. GST)', money(parseFloat(d.povalue || 0))],
                ['GST Amount', money(parseFloat(d.gst || 0))], ['Total (incl. GST)', money(parseFloat(d.total || 0))],
                ['PO Start Date', d.postartdate], ['PO Completion Date', d.pocompletiondate],
                ['Mobilize Advance', d.Mobilizeadvance || (d.Madvance ? 'Yes' : 'No')], d.BGApplicable && ['BG Applicable', d.BGApplicable],
                realDate(d.CreatedDate) && ['Created Date', realDate(d.CreatedDate)],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveClientPO',
            payload: (r, d, { value, note, user, roleCode, roleId }) => ({
                Action: value, total: d.total?.toString() || '', povalue: d.povalue?.toString() || '', gst: d.gst?.toString() || '',
                ApprovalNote: note, Remarks: appendApprovalComment(d.Remarks, roleCode || 'PO Verifier', user, note), pono: r.pono || '',
                CreatedBy: user, RoleId: String(roleId), clientid: d.clientid || r.clientid || '', subclientid: d.subclientid || r.subclientid || '',
                postartdate: d.postartdate || r.postartdate || '', pocompletiondate: d.pocompletiondate || r.pocompletiondate || '',
                CostCenter: d.CostCenter || r.CostCenter || '', Status: r.Status || '1',
            }),
            ok: ANY,
        },
    },

    GeneralInvoice: {
        title: 'General Invoice Approval',
        successLabel: 'General Invoice',
        noun: 'invoice',
        icon: ReceiptIndianRupee,
        searchPlaceholder: 'Search invoice no, name, cost center…',
        queue: { route: 'Accounts/GetVerificationGeneralInvoice', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.InvoiceNo,
        card: { title: (r) => `Invoice #${r.InvoiceNo}`, subtitle: (r) => r.Name, meta: (r) => [firstCode(r.CostCenter), r.InvoiceDate].filter(Boolean).join(' · '), amount: (r) => money(r.InvoiceAmount || 0) },
        searchText: (r) => `${r.InvoiceNo} ${r.Name} ${r.CostCenter}`,
        detail: { route: 'Accounts/GetGeneralInvoicebyNo', params: (r) => ({ InvNo: r.InvoiceNo }) },
        moid: (r, d) => d.MOID,
        chkAmt: (r, d) => d.InvoiceAmount,
        remarksKey: (r) => String(r.InvoiceNo),
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r, d) => `Invoice #${d.InvoiceNo}`, subtitle: (r, d) => money(d.InvoiceAmount || 0), chips: (r, d) => [d.Name, d.Status && `Status: ${d.Status}`] },
        sections: (r, d) => [
            { fields: [['Name', d.Name], ['Invoice Date', d.InvoiceDate], ['Balance', money(d.Balance)]] },
            { title: 'Cost center', fields: [['Code', firstCode(d.CostCenter)], ['Name', d.CCName]] },
            { title: 'Account head', fields: [['DCA Code', d.DCACode], ['DCA Name', d.DCAName]] },
            { title: 'Credit sub account head', fields: [['Code', d.CreditSubDca], ['Name', d.CreditSubDCACodeName]] },
            { title: 'Debit sub account head', fields: [['Code', d.DebitSubDca], ['Name', d.DebitSubDCACodeName]] },
        ],
        approve: {
            route: 'Accounts/ApproveGeneralInvoice',
            // The backend reads a nested InvData plus the same fields flattened
            payload: (r, d, { action, note, user, roleCode, roleId, userId }) => ({
                InvData: {
                    InvoiceNo: r.InvoiceNo, CostCenter: d.CostCenter || '', DCACode: d.DCACode || '', InvoiceAmount: d.InvoiceAmount || 0,
                    InvoiceDate: d.InvoiceDate || '', Name: d.Name || '', CreditSubDca: d.CreditSubDca || '', DebitSubDca: d.DebitSubDca || '',
                    Balance: d.Balance || 0, Id: d.Id || 0, MOID: d.MOID || 0,
                },
                Action: action, ApprovalNote: note, CostCenter: d.CostCenter || '', DCACode: d.DCACode || '', InvoiceAmount: d.InvoiceAmount || 0,
                InvoiceDate: d.InvoiceDate || '', InvoiceNo: r.InvoiceNo, RoleId: roleId, Userid: userId, Createdby: user,
                Remarks: appendApprovalComment(d.ApprovalNote, roleCode || 'Invoice Approver', user, note),
            }),
            ok: ANY,
        },
    },
};
