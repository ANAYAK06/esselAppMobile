// Purchase — the Corex web's dedicated pages expressed as configs:
//   VendorCreation        pages/Purchase/VerifyVendor.jsx                       (purchaseSlice/verifyVendorSlice)
//   NewStockReceived      pages/Purchase/VerifyNewStockReceived.jsx             (purchaseSlice/verifyNewStockReceivedSlice)
//   TransferReceiptOthers pages/Purchase/TransferRecieptOthersVerification.jsx  (purchaseSlice/transferRecieptOthersVerificationSlice)
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FileUp, PackageCheck, Store, Truck } from 'lucide-react-native';
import { uploadFileToS3 } from '@/src/api/verification/verificationCommonAPI';
import { SecondaryButton } from '@/src/components/employee/PortalUI';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { S3_FOLDERS, buildMRRUrl, buildVendorDetailsUrl } from '@/src/service/s3Config';
import { CheckedItems, DocButton, TableBlock, TotalLine, allItemsChecked } from '../parts';
import type { Rec, VerificationConfig } from '../types';
import { list } from './shared';

const num = (v: unknown) => parseFloat(String(v ?? '')) || 0;
const qty = (v: unknown) => num(v).toFixed(4);
const amt = (v: unknown) => num(v).toFixed(2);

// Yes / No question as a promise (Alert buttons)
const ask = (title: string, message: string, yes: string, no: string) =>
    new Promise<boolean>((resolve) => Alert.alert(title, message, [
        { text: no, style: 'cancel', onPress: () => resolve(false) },
        { text: yes, onPress: () => resolve(true) },
    ], { cancelable: false }));

const SERVICE_PROVIDER = 'Service Provider';
const SP_OPTIONAL_FIELDS: [string, string][] = [
    ['VehicleEquipmentRCInsurance', 'Vehicle / Equipment RC & Insurance'], ['ESIRegistration', 'ESI Registration'],
    ['LabourLicense', 'Labour License'], ['ElectricalContractorLicense', 'Electrical Contractor License'],
    ['InsuranceWCLiability', 'Insurance (WC / Liability)'], ['PastExperienceProof', 'Past Experience Proof'],
    ['ManpowerListCertifications', 'Manpower List & Certifications'], ['ToolsEquipmentList', 'Tools & Equipment List'],
    ['QAQCProcedures', 'QA/QC Procedures'], ['HSEPolicySafetyPlan', 'HSE Policy / Safety Plan'],
    ['FinancialStatementsITR', 'Financial Statements / ITR'], ['BankStatementWCProof', 'Bank Statement / WC Proof'],
    ['PerformanceBGSecurity', 'Performance BG / Security'], ['ClientAlignedB2BDocs', 'Client-Aligned B2B Docs'],
    ['ApprovalValidity', 'Approval Validity'],
];

// The MRR's QMQ certificate: open it, or re-upload it under the same file name when the link is broken
function MrrCertificate({ fileName }: { fileName: string }) {
    const [busy, setBusy] = useState(false);
    const replace = async () => {
        const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
        if (res.canceled || !res.assets?.[0]) return;
        const a = res.assets[0];
        setBusy(true);
        try {
            await uploadFileToS3({ uri: a.uri, name: a.name, mimeType: a.mimeType }, S3_FOLDERS.MRR, fileName);
            Alert.alert('Uploaded', 'The certificate was replaced.');
        } catch (e: any) {
            Alert.alert('Upload failed', e?.response?.data?.Message || e?.message || 'Unknown error');
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <DocButton label="View QMQ certificate" url={buildMRRUrl(fileName)} />
            <View className="-mt-2 mb-4">
                <SecondaryButton label={busy ? 'Uploading…' : 'Replace certificate (PDF)'} icon={FileUp} onPress={replace} disabled={busy} />
            </View>
        </>
    );
}

const fromVendor = (r: Rec) => r.Type === 'From Vendor';
const mrrTotals = (items: Rec[]) => items.reduce((t, x) => ({
    RaisedQty: t.RaisedQty + num(x.RaisedQty), RecievedQty: t.RecievedQty + num(x.RecievedQty),
    PreviousRecievedQty: t.PreviousRecievedQty + num(x.PreviousRecievedQty), PendingVerificationQty: t.PendingVerificationQty + num(x.PendingVerificationQty),
    IssuedQty: t.IssuedQty + num(x.IssuedQty), LostQty: t.LostQty + num(x.LostQty), DamagedQty: t.DamagedQty + num(x.DamagedQty),
}), { RaisedQty: 0, RecievedQty: 0, PreviousRecievedQty: 0, PendingVerificationQty: 0, IssuedQty: 0, LostQty: 0, DamagedQty: 0 });
const csvNums = (items: Rec[], k: string) => `${items.map((x) => num(x[k])).join(',')},`;

export const PURCHASE_CONFIGS: Record<string, VerificationConfig> = {
    VendorCreation: {
        title: 'Vendor Verification',
        successLabel: 'Vendor',
        noun: 'vendor',
        icon: Store,
        searchPlaceholder: 'Search vendor name, code, type, address…',
        queue: { route: 'Purchase/GetVerificationVendor', params: ({ roleId }) => ({ RoleId: roleId }) },
        itemKey: (r) => r.VendorCode,
        card: { title: (r) => r.VendorName, subtitle: (r) => r.VendorCode, meta: (r) => [r.Type, r.Address].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.VendorName} ${r.VendorCode} ${r.Type} ${r.Address}`,
        detail: { route: 'Purchase/GetVerificationVendorbyCode', params: (r, { roleId }) => ({ VendorCode: r.VendorCode, RoleId: roleId }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.VendorCode,
        showReturn: 'Yes',
        // Returned vendors are corrected on the vendor entry screen (legacy /Purchase/EditVendor)
        isReturned: (r) => r.Status === '0',
        returnedNotice: 'This vendor was returned for update — there is nothing to verify until it is resubmitted from the Vendor screen.',
        header: { title: (r, d) => d.VendorName, subtitle: (r, d) => d.VendorCode, chips: (r, d) => [d.Type, d.VendorStatus && `Vendor Status: ${d.VendorStatus}`] },
        sections: (r, d) => {
            const sp = d.Type === SERVICE_PROVIDER;
            const l = d.Ledger;
            return [
                {
                    fields: [
                        ['Type', d.Type], ['Vendor Code', d.VendorCode], ['Vendor Name', d.VendorName], ['Phone No', d.Phoneno], ['Mobile No', d.MobileNo],
                        ['Email', d.EmailId], ['PAN No', d.PanNo], !sp && ['CST No', d.CstNo], sp && ['PF Reg No', d.PFRegNo],
                        sp && ['TDS Applicable', d.TDSApplicable], sp && d.TDSApplicable === 'Yes' && ['TDS Code', d.TDSCode],
                        ['GST Applicable', d.GstApplicable], ['MSME Applicable', d.MSMEApplicable], ['Address', d.Address, true],
                    ],
                },
                { title: 'Bank', fields: [['Bank Name', d.BankName], ['Account No', d.AccountNo], ['IFSC Code', d.IFSCode]] },
                {
                    title: 'Group',
                    fields: [['Nature Group', d.NatureGroupName], ['Master Group', d.MasterGroup], d.SubGroupId !== 0 && ['Sub Group', d.SubGroup]],
                },
                d.MSMEApplicable === 'Yes' && {
                    title: 'MSME',
                    fields: [
                        ['Udyam Registration No', d.UdyamRegistrationNumber], ['Enterprise Type', d.Enterprisetype], ['Major Activity', d.MajorActivity],
                        ['Classification Effective', d.ClassificationEffectiveDate], ['Commencement of Business', d.DateofcommencementofBusinessorProduction],
                    ],
                },
                l && { title: 'Ledger', fields: [['Opening Balance', money(l.Balance)], ['Balance As On Date', l.Date], ['Ledger Value Type', l.ValueType]] },
                sp && {
                    title: 'Service provider',
                    fields: [
                        ['SP Category', d.SPCategory], ['System Credential Flag', d.SystemCredentialFlag], ['Risk Level', d.RiskLevel], ['Owner ID / KYC', d.OwnerIDKYC],
                        ...SP_OPTIONAL_FIELDS.filter(([k]) => d[k] != null).map(([k, label]) => [label, d[k]] as [string, unknown]),
                    ],
                },
            ];
        },
        extra: (r, d) => (
            <>
                <DocButton label="View uploaded document" url={d.uploaddoc ? buildVendorDetailsUrl(d.uploaddoc) : null} />
                {d.GstApplicable === 'YES' && list(d.VendorGSTData).length ? (
                    <TableBlock title="GST details" heads={['State', 'Tax No']} rows={list(d.VendorGSTData).map((g) => [g.StateName, g.TaxNo])} />
                ) : null}
            </>
        ),
        approve: {
            route: 'Purchase/ApproveVendor',
            payload: (r, d, { action, note, user, roleId }) => ({
                VendorCode: d.VendorCode, Action: action, ApprovalNote: note, VendorStatus: d.VendorStatus, VendorName: d.VendorName, RoleId: roleId, CreatedBy: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    NewStockReceived: {
        title: 'New Stock Received Verification',
        successLabel: 'New Stock Received',
        noun: 'receipt',
        icon: PackageCheck,
        searchPlaceholder: 'Search ref no, indent, cost center…',
        queue: { route: 'Purchase/GetVerfiyNewStockReceivedGrid', params: ({ roleId, userId }) => ({ RoleId: roleId, Userid: userId }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => r.Refno, subtitle: (r) => `${r.FromCC} → ${r.ToCC}`, meta: (r) => [r.Indentno && `Indent ${r.Indentno}`, r.Date].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.Refno} ${r.Indentno} ${r.FromCC} ${r.ToCC}`,
        rowAux: [{ name: 'items', route: 'Purchase/ViewNewStockReceivedGrid', params: (r) => ({ Trno: r.Refno }) }],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: {
            title: (r) => r.Refno,
            subtitle: (r) => `${r.FromCC} → ${r.ToCC}`,
            chips: (r) => [r.Indentno && `Indent ${r.Indentno}`, r.Date && `Received ${r.Date}`, r.Expdate && `Expected ${r.Expdate}`],
        },
        extra: (r, d, { aux, ext, setExt }) => {
            const items = list(aux.items);
            return (
                <CheckedItems
                    title="Item details"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    columns={[
                        { label: 'Item Code', render: (x) => x.Itemcode },
                        { label: 'Item Name', render: (x) => x.Itemname, align: 'left' },
                        { label: 'Specification', render: (x) => x.Specification, align: 'left' },
                        { label: 'Qty', render: (x) => qty(x.Quantity) },
                        { label: 'Amount', render: (x) => amt(x.Amount) },
                    ]}
                    footer={(
                        <>
                            <TotalLine label="Total quantity" value={qty(items.reduce((a, x) => a + num(x.Quantity), 0))} />
                            <TotalLine label="Total amount" value={amt(items.reduce((a, x) => a + num(x.Amount), 0))} />
                        </>
                    )}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => {
            const items = list(aux.items);
            if (!items.length) return ['Invalid Submission'];
            return allItemsChecked(items, ext) ? [] : ['Please Verify Item Codes'];
        },
        approve: {
            route: 'Purchase/ApproveNewStockIssueRecieved',
            payload: (r, d, { value, note, user, roleId }) => ({ Refno: r.Refno, ActionRemarks: note, Appstatus: value, RoleID: roleId, Createdby: user }),
            // The web treats an empty answer as success too
            ok: (s) => !s || s === 'Submitted',
        },
    },

    // Two flavours by row Type: "From Vendor" (raised / received quantities, may close a multi MRR) and
    // "From Other Store" (issued / lost / damaged quantities)
    TransferReceiptOthers: {
        title: 'Transfer Receipt (Others) Verification',
        successLabel: 'MRR',
        noun: 'MRR',
        icon: Truck,
        searchPlaceholder: 'Search MRR, vendor, PO, cost center…',
        queue: { route: 'Purchase/GetTransferRecieptOthersDetails', params: ({ roleId, userId }) => ({ Roleid: roleId, UID: userId }) },
        itemKey: (r) => `${r.Mrrno}|${r.Type}`,
        card: { title: (r) => `MRR ${r.Mrrno}`, subtitle: (r) => r.VendorName || r.CCCode, meta: (r) => [r.MrrType, r.Date].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.Mrrno} ${r.VendorName} ${r.PoNo} ${r.CCCode}`,
        rowAux: [{ name: 'items', route: 'Purchase/GetTransferRecieptDataGridOthers', params: (r) => ({ Mrrno: r.Mrrno, Type: r.Type }) }],
        moid: (r) => r.Moid,
        remarksKey: (r) => r.Mrrno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: {
            title: (r) => `MRR ${r.Mrrno}`,
            subtitle: (r) => r.VendorName,
            chips: (r) => [r.Type, r.MrrType && `${r.MrrType} MRR`, r.CCCode && `CC ${r.CCCode}`, r.PoNo && `PO ${r.PoNo}`],
        },
        extra: (r, d, { aux, ext, setExt }) => {
            const items = list(aux.items);
            const vendor = fromVendor(r);
            const t = mrrTotals(items);
            const fileItem = items.find((x) => x.FileName);
            return (
                <>
                    {fileItem ? <MrrCertificate fileName={fileItem.FileName} /> : null}
                    <CheckedItems
                        title="Item details"
                        items={items}
                        ext={ext}
                        setExt={setExt}
                        columns={[
                            { label: 'Item Code', render: (x) => x.ItemCode },
                            { label: 'Item Name', render: (x) => x.ItemName, align: 'left' },
                            { label: 'Specification', render: (x) => x.Specification, align: 'left' },
                            ...(vendor ? [
                                { label: 'Units', render: (x: Rec) => x.Units }, { label: 'Basic', render: (x: Rec) => amt(x.Basic) },
                                { label: 'Raised', render: (x: Rec) => qty(x.RaisedQty) }, { label: 'Received', render: (x: Rec) => qty(x.RecievedQty) },
                                { label: 'Prev Approved', render: (x: Rec) => qty(x.PreviousRecievedQty) },
                                { label: 'Pending Verif.', render: (x: Rec) => qty(x.PendingVerificationQty) },
                            ] : [
                                { label: 'Sending CC', render: (x: Rec) => x.CCCode }, { label: 'Units', render: (x: Rec) => x.Units },
                                { label: 'Amount', render: (x: Rec) => amt(x.Amount) }, { label: 'Issued', render: (x: Rec) => qty(x.IssuedQty) },
                                { label: 'Lost', render: (x: Rec) => qty(x.LostQty) }, { label: 'Damaged', render: (x: Rec) => qty(x.DamagedQty) },
                            ]),
                        ]}
                        footer={vendor ? (
                            <>
                                <TotalLine label="Raised" value={qty(t.RaisedQty)} />
                                <TotalLine label="Received" value={qty(t.RecievedQty)} />
                                <TotalLine label="Previously approved" value={qty(t.PreviousRecievedQty)} />
                                <TotalLine label="Pending verification" value={qty(t.PendingVerificationQty)} />
                            </>
                        ) : (
                            <>
                                <TotalLine label="Issued" value={qty(t.IssuedQty)} />
                                <TotalLine label="Lost" value={qty(t.LostQty)} />
                                <TotalLine label="Damaged" value={qty(t.DamagedQty)} />
                            </>
                        )}
                    />
                </>
            );
        },
        beforeAction: async (action, r, d, { aux, ext }) => {
            const items = list(aux.items);
            if (!items.length) return ['Invalid Submission'];
            if (!allItemsChecked(items, ext)) return ['Please Verify Item Codes'];
            const t = mrrTotals(items);
            if (!fromVendor(r)) {
                if (action === 'Approve' && t.LostQty + t.DamagedQty > 0) {
                    const ok = await ask('Confirm approval', `This MRR has Lost/Damaged quantity (Total: ${(t.LostQty + t.DamagedQty).toFixed(4)}). Do you want to proceed with Approve?`, 'OK', 'Cancel');
                    if (!ok) return null;
                }
                return [];
            }
            // A multi MRR received short of the raised quantity: the verifier decides whether it closes
            const current = String(items[0]?.CurrentMrrStatus || '').trim();
            const short = t.RaisedQty !== t.RecievedQty + t.PreviousRecievedQty;
            if (action === 'Approve' && r.MrrType === 'Multi' && short && (current === 'Open' || current === '')) {
                const close = await ask('Do you want to close the MRR?', `Received quantity does not match raised quantity for Multi MRR ${r.Mrrno}. Do you really want to close it?`, 'Yes', 'No');
                return { data: { mrrStatus: close ? 'Close' : 'Open' } };
            }
            return { data: { mrrStatus: 'Close' } };
        },
        approve: {
            route: (r) => (fromVendor(r) ? 'Purchase/verifyitemtransferVendorothers' : 'Purchase/VerifyTransferRecieptother'),
            payload: (r, d, { value, note, user, roleId, aux, pre }) => {
                const items = list(aux.items);
                const t = mrrTotals(items);
                if (!fromVendor(r)) {
                    return { Mrrno: r.Mrrno, Remarks: note, Appstatus: value, SumLostQty: t.LostQty, SumDamagedQty: t.DamagedQty, Roleid: roleId, CreatedBy: user };
                }
                return {
                    Mrrno: r.Mrrno, Remarks: note, Appstatus: value, SumRaisedQty: t.RaisedQty, SumRecievedQty: t.RecievedQty + t.PreviousRecievedQty,
                    ItemCodes: `${items.map((x) => x.ItemCode).join(',')},`, RecievedQty: csvNums(items, 'RecievedQty'),
                    PreviousRecievedQty: csvNums(items, 'PreviousRecievedQty'), RaisedQty: csvNums(items, 'RaisedQty'), Basic: csvNums(items, 'Basic'),
                    Type: r.MrrType, MrrStatus: pre.mrrStatus, CurrentMrrStatus: String(items[0]?.CurrentMrrStatus || '').trim(), Roleid: roleId, CreatedBy: user,
                };
            },
            ok: (s) => !s || s === 'Submitted',
        },
    },
};
