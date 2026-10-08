// Account masters — ported from the Corex web pages/Accounts/verificationConfigs.jsx (ShareIssuance,
// ESOPFaceValueReceipt, Client, SubClient, DCA, SubDCA, MasterGroups, SubGroups, ChildGroups, Ledger,
// TaxGeneral, ITCode, HSNCreation). Routes, params, payloads and success literals are the web's.
import React from 'react';
import {
    Barcode, BookMarked, BookOpen, Coins, FolderOpen, FolderTree, Folders, Hash, Library, Percent, ScrollText, UserSquare, Users,
} from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { TableBlock, displayDate, isoDate } from '../parts';
import type { Rec, VerificationConfig } from '../types';

const CREDIT_DEBIT = [{ value: 'Credit', label: 'Credit' }, { value: 'Debit', label: 'Debit' }];
const AMOUNT = /^-?\d*\.?\d{0,2}$/;
const returnedStatus = (r: Rec) => String(r.Status) === '0';

export const ACCOUNT_MASTER_CONFIGS: Record<string, VerificationConfig> = {
    // Legacy /AccountsApproval/VerifyShareIssuance
    ShareIssuance: {
        title: 'Share Issuance Verification',
        successLabel: 'Share Issuance',
        noun: 'share issuance',
        icon: ScrollText,
        searchPlaceholder: 'Search by transaction no, scheme, date…',
        queue: { route: 'Accounts/VerifyShareIssuanceGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => r.SchemeName, subtitle: (r) => `Transaction ${r.Refno}`, meta: (r) => r.Date, amount: (r) => (r.SharesAllocated ? `${r.SharesAllocated} shares` : null) },
        searchText: (r) => `${r.Refno} ${r.SchemeName} ${r.Date}`,
        detail: { route: 'Accounts/VerifyShareIssuanceView', params: (r) => ({ Refno: r.Refno }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.Refno,
        showReturn: 'No',
        header: {
            title: (r, d) => d.SchemeName || r.SchemeName,
            subtitle: (r, d) => `Transaction ${d.Refno}`,
            chips: (r, d) => [d.ShareIssuanceType, r.Date && `Date: ${r.Date}`],
        },
        sections: (r, d) => [{
            fields: [
                ['Share Issuance Type', d.ShareIssuanceType], ['Scheme Name', d.SchemeName], ['Start Date', d.StartDate],
                ['End Date', d.EndDate], ['Shares Allocated', d.SharesAllocated], ['Scheme Description', d.SchemeDescription, true],
            ],
        }],
        // spApproveShareIssuance reads the action from Status and the note from Remarks
        approve: {
            route: 'Accounts/ApproveShareIssuance',
            payload: (r, d, { action, note, user, roleId }) => ({ Refno: d.Refno, Status: action, Remarks: note, RoleId: roleId, CreatedBy: user }),
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyESOPFaceValueReceipt
    ESOPFaceValueReceipt: {
        title: 'ESOP Face Value Receipt Verification',
        successLabel: 'ESOP Face Value Receipt',
        noun: 'ESOP receipt',
        icon: Coins,
        searchPlaceholder: 'Search by transaction no, option ID, date…',
        queue: { route: 'Accounts/VerifyESOPFaceValueReceiptGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.ExerciseRefno,
        card: { title: (r) => `Option ${r.ExerciseOptionID}`, subtitle: (r) => `Transaction ${r.ExerciseRefno}`, meta: (r) => r.Date, amount: (r) => money(r.ExerciseAmount) },
        searchText: (r) => `${r.ExerciseRefno} ${r.ExerciseOptionID} ${r.Date} ${r.ExerciseAmount}`,
        detail: { route: 'Accounts/VerifyESOPFaceValueReceiptView', params: (r) => ({ Refno: r.ExerciseRefno }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.Refno,
        showReturn: 'No',
        header: {
            title: (r, d) => d.EmployeeName || `Option ${d.ExerciseOptionID}`,
            subtitle: (r, d) => money(d.ExerciseAmount),
            chips: (r, d) => [`Option ${d.ExerciseOptionID}`, d.Bank],
        },
        sections: (r, d) => [
            {
                title: 'Employee & exercise',
                fields: [
                    ['Option ID', d.ExerciseOptionID], ['Employee ID', d.EmployeeId], ['Employee Name', d.EmployeeName],
                    ['Department', d.Department], ['Position', d.Position], ['Exercise Date', d.ExerciseDate],
                    ['Shares Exercised', d.NumberofSharesExercised], ['Exercise Price', money(d.ExercisePrice)],
                ],
            },
            {
                title: 'Receipt',
                fields: [
                    ['Bank', d.Bank], ['Mode of Pay', d.ModeofPay], ['No', d.No], ['Date', d.Date],
                    ['Amount', money(d.ExerciseAmount)], d.Remarks && ['Remarks', d.Remarks, true],
                ],
            },
        ],
        // The data layer reads RoleID / Createdby on this entity
        approve: {
            route: 'Accounts/ApproveESOPFaceValueReceipt',
            payload: (r, d, { action, note, user, roleId }) => ({ Refno: d.Refno, Status: action, Remarks: note, RoleID: roleId, Createdby: user }),
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyClient (+ VerifyClientGrid / VerifyClientView)
    Client: {
        title: 'Client Verification',
        successLabel: 'Client',
        noun: 'client',
        icon: Users,
        searchPlaceholder: 'Search by client code, name, nature of group…',
        queue: { route: 'Accounts/GetVerifyClientDetails', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Client_Code,
        card: { title: (r) => r.Client_Name, subtitle: (r) => r.Client_Code, meta: (r) => r.NatureGroupName },
        searchText: (r) => `${r.Client_Code} ${r.Client_Name} ${r.NatureGroupName}`,
        detail: { route: 'Accounts/GetVerifyClientDetailsbyCode', params: (r) => ({ ClientCode: r.Client_Code }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.Client_Code,
        showReturn: 'Yes',
        // Legacy drops Return and Reject when the client is being closed
        excludeActions: (r, d) => (d.ClientStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedStatus,
        header: {
            title: (r, d) => d.Client_Name,
            subtitle: (r, d) => d.Client_Code,
            chips: (r, d) => [d.NatureGroupName, d.ClientStatus && `Client Status: ${d.ClientStatus}`],
        },
        sections: (r, d) => [
            {
                fields: [
                    ['Client Code', d.Client_Code], ['Client Name', d.Client_Name], ['Nature of Group', d.NatureGroupName],
                    ['Contact Person', d.Contact_Person_Name], ['Phone No', d.Person_PhoneNo],
                    ['TIN Number', d.TINNo], ['PAN Number', d.PANNo], ['TAN Number', d.TANNo],
                    ['Client Status', d.ClientStatus], ['Address', d.Address, true],
                ],
            },
            {
                title: 'Ledger',
                fields: [
                    ['Group Name', d.GroupName],
                    d.SubGroupId && d.SubGroupId !== '0' && ['Sub Group Name', d.SubGroupName],
                    d.LedgerId > 0 && ['Opening Balance', money(d.OpeningBalance)],
                    d.LedgerId > 0 && ['Balance As On Date', d.BalanceAsOnDate],
                    d.LedgerId > 0 && ['Ledger Value Type', d.LedgerValueType],
                ],
            },
        ],
        approve: {
            route: 'Accounts/ApproveClient',
            payload: (r, d, { action, note, user, roleId }) => ({
                Client_Code: d.Client_Code, VerificationType: action, ApprovalNote: note,
                RoleId: roleId, Createdby: user, ClientStatus: d.ClientStatus,
            }),
            ok: ['Submited', 'Submitted'],
        },
        // Legacy UpdateClientData → spInsertUpdateClient (Action 2, CheckUpdationType 'ReturnUpdate')
        resubmit: {
            fields: [
                { key: 'Client_Name', label: 'Client Name', required: true },
                { key: 'TINNo', label: 'TIN No', required: true },
                { key: 'PANNo', label: 'PAN No', required: true },
                { key: 'TANNo', label: 'TAN No', required: true },
                { key: 'Contact_Person_Name', label: 'Contact Person Name', required: true },
                { key: 'Person_PhoneNo', label: 'Contact Person No', required: true, filter: /^\d{0,10}$/, maxLength: 10 },
                { key: 'OpeningBalance', label: 'Opening Balance', required: true, filter: AMOUNT, show: (v) => v.hasLedger },
                { key: 'BalanceAsOnDate', label: 'Balance As On Date', required: true, readOnly: true, show: (v) => v.hasLedger },
                { key: 'LedgerValueType', label: 'Ledger Value Type', type: 'select', required: true, show: (v) => v.hasLedger, options: CREDIT_DEBIT },
                { key: 'Address', label: 'Address', type: 'textarea', required: true },
            ],
            initial: (r, d) => ({
                Client_Name: d.Client_Name || '', TINNo: d.TINNo || '', PANNo: d.PANNo || '', TANNo: d.TANNo || '',
                Contact_Person_Name: d.Contact_Person_Name || '', Person_PhoneNo: d.Person_PhoneNo || '', Address: d.Address || '',
                hasLedger: d.LedgerId > 0,
                OpeningBalance: d.OpeningBalance != null ? String(d.OpeningBalance) : '',
                BalanceAsOnDate: d.BalanceAsOnDate || '', LedgerValueType: d.LedgerValueType || '',
            }),
            validate: (v) => (v.Person_PhoneNo && v.Person_PhoneNo.length !== 10 ? ['Enter 10 digit Phone No'] : []),
            route: 'Accounts/UpdateClient',
            payload: (r, d, v, { user, roleId }) => ({
                ClientID: d.ClientID, Client_Code: d.Client_Code, Client_Name: v.Client_Name.trim(),
                TINNo: v.TINNo.trim(), PANNo: v.PANNo.trim(), TANNo: v.TANNo.trim(),
                Contact_Person_Name: v.Contact_Person_Name.trim(), Person_PhoneNo: v.Person_PhoneNo, Address: v.Address.trim(),
                Action: 2, Createdby: user, RoleId: roleId, CheckUpdationType: 'ReturnUpdate',
                LedgerValueType: v.hasLedger ? v.LedgerValueType : null,
                OpeningBalance: v.hasLedger ? parseFloat(v.OpeningBalance) || 0 : 0,
                BalanceAsOnDate: v.hasLedger ? v.BalanceAsOnDate : null,
            }),
            ok: ['Updated', 'Submited'],
        },
    },

    // Legacy /AccountsApproval/VerifySubClient (+ VerifySubClientGrid / VerifySubClientView)
    SubClient: {
        title: 'Sub Client Verification',
        successLabel: 'Sub Client',
        noun: 'sub client',
        icon: UserSquare,
        searchPlaceholder: 'Search by sub client, client, branch…',
        queue: { route: 'Accounts/GetVerificationSubClient', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.SubClientCode,
        card: { title: (r) => r.Branch || r.SubClientCode, subtitle: (r) => r.SubClientCode, meta: (r) => `${r.ClientCode} · ${r.ClientName}` },
        searchText: (r) => `${r.SubClientCode} ${r.ClientCode} ${r.ClientName} ${r.Branch}`,
        detail: { route: 'Accounts/GetVerificationSubClientbycode', params: (r) => ({ SubClientcode: r.SubClientCode }) },
        // Legacy loads the GST numbers only when GST applies (TaxFor = the sub client code)
        rowAux: [{
            name: 'subClientTaxes',
            route: 'Accounts/GetVerifyClientTaxes',
            params: (r) => ({ ClientCode: r.SubClientCode }),
            when: (r, d) => String(d.GST_Applicable || '').toUpperCase() === 'YES',
        }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.SubClientCode,
        showReturn: 'Yes',
        excludeActions: (r, d) => (d.SubClientStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedStatus,
        // The returned-row form edits a multi-row GST table — resubmitted from the Sub Client screen instead
        returnedNotice: 'Correct and resubmit it from the Sub Client screen — there is nothing to verify until it is resubmitted.',
        header: {
            title: (r, d) => d.Branch || d.SubClientCode,
            subtitle: (r, d) => d.SubClientCode,
            chips: (r, d) => [`Client ${d.ClientCode}`, d.SubClientStatus && `Status: ${d.SubClientStatus}`],
        },
        sections: (r, d) => [
            {
                fields: [
                    ['Client Code', d.ClientCode], ['Sub Client Code', d.SubClientCode], ['Nature of Group', d.NatureGroupName],
                    ['Branch Name', d.Branch], ['Contact Person', d.SC_Person_Name], ['Phone Number', d.SC_Phone_No],
                    ['TIN Number', d.SC_TINNo], ['PAN Number', d.SC_PANNo], ['TAN Number', d.SC_TANNo],
                    ['Sub Client Status', d.SubClientStatus], ['GST Applicable', d.GST_Applicable], ['Address', d.Address, true],
                ],
            },
            d.LedgerId > 0 && {
                title: 'Ledger',
                fields: [['Opening Balance', money(d.OpeningBalance)], ['Balance As On Date', d.BalanceAsOnDate], ['Ledger Value Type', d.LedgerValueType]],
            },
        ],
        extra: (r, d, { aux }) => {
            const taxes: Rec[] = Array.isArray(aux.subClientTaxes) ? aux.subClientTaxes : [];
            if (String(d.GST_Applicable || '').toUpperCase() !== 'YES' || !taxes.length) return null;
            return <TableBlock title="GST details" heads={['GST No', 'State']} rows={taxes.map((t) => [t.TaxNo, t.State])} />;
        },
        approve: {
            route: 'Accounts/ApproveSubClient',
            payload: (r, d, { action, note, user, roleId }) => ({
                SubClientCode: d.SubClientCode, ClientCode: d.ClientCode, Verificationtype: action, ApprovalNote: note,
                RoleId: roleId, Createdby: user, SubClientStatus: d.SubClientStatus,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyDCA (+ VerifyDcaGrid / VerifyDcaView)
    DCA: {
        title: 'Account Head Verification',
        successLabel: 'Account Head',
        noun: 'account head',
        icon: BookOpen,
        searchPlaceholder: 'Search by account head code, name, type…',
        queue: { route: 'Accounts/GetVerificationDCA', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.DCAID,
        card: { title: (r) => r.DCAName, subtitle: (r) => r.DCACode, meta: (r) => `${r.DCATypeName || ''}${r.DCAStatus ? ` · ${r.DCAStatus}` : ''}` },
        searchText: (r) => `${r.DCACode} ${r.DCAName} ${r.DCATypeName} ${r.DCAStatus}`,
        detail: { route: 'Accounts/GetDcabyId', params: (r) => ({ DcaId: r.DCAID, Dcatypeid: r.DCATypeID }) },
        moid: (r) => r.MOID,
        remarksKey: (r) => r.DCAID,
        showReturn: 'Yes',
        excludeActions: (r) => (r.DCAStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedStatus,
        // Legacy re-opens the full Tax / General account-head editor (CC types, taxes, payment types)
        returnedNotice: 'Correct and resubmit it from the Account Head screen — there is nothing to verify until it is resubmitted.',
        header: {
            title: (r, d) => (d.BasicDCAInfo || {}).DCAName || r.DCAName,
            subtitle: (r, d) => (d.BasicDCAInfo || {}).DCACode || r.DCACode,
            chips: (r, d) => [(d.BasicDCAInfo || {}).DCATypeName || r.DCATypeName, r.DCAStatus && `Status: ${r.DCAStatus}`],
        },
        sections: (r, d) => {
            const b = d.BasicDCAInfo || {};
            return [{
                fields: [
                    ['Account Head Code', b.DCACode], ['Account Head Name', b.DCAName], ['Type', b.DCATypeName],
                    b.ITCodeName && ['IT Code Name', b.ITCodeName],
                    ['Account Head Status', b.DCAStatus],
                    String(b.DCATypeID) === '2' && ['Type of Tax', b.TypeOfTaxName],
                    String(b.DCATypeID) === '2' && ['Nature of Tax', b.NatureOfTaxName],
                    ['Cost Center Types', (d.CCTypeNames || []).join(', '), true],
                ],
            }];
        },
        approve: {
            route: 'Accounts/ApproveDCA',
            payload: (r, d, { action, note, user, roleId }) => ({
                DCATypeID: r.DCATypeID, DCACodeID: r.DCAID, DCACode: r.DCACode, Action: action, RemarksNote: note,
                Createdby: user, RoleId: roleId, DCAStatus: r.DCAStatus,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifySubDCA (+ VerifySubDcaGrid / VerifySubDcaView) — the grid row is the record
    SubDCA: {
        title: 'Sub Account Head Verification',
        successLabel: 'Sub Account Head',
        noun: 'sub account head',
        icon: BookMarked,
        searchPlaceholder: 'Search by sub account head, account head, IT code…',
        queue: { route: 'Accounts/GetVerificationSubDCA', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.SubDCACodeID,
        card: { title: (r) => r.SubDCAName, subtitle: (r) => r.SubDCACode, meta: (r) => `${r.DCAName}${r.SubDcaStatus ? ` · ${r.SubDcaStatus}` : ''}` },
        searchText: (r) => `${r.SubDCACode} ${r.SubDCAName} ${r.DCAName} ${r.ITCodeDescription} ${r.SubDcaStatus}`,
        aux: [{ name: 'itCodes', route: 'Accounts/GetITCodes' }],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.SubDCACodeID,
        showReturn: 'Yes',
        excludeActions: (r) => (r.SubDcaStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedStatus,
        header: {
            title: (r) => r.SubDCAName,
            subtitle: (r) => r.SubDCACode,
            chips: (r) => [`Account Head ${r.DCAName}`, r.SubDcaStatus && `Status: ${r.SubDcaStatus}`],
        },
        sections: (r) => [{
            fields: [
                ['Account Head', r.DCAName], ['Sub Account Head Code', r.SubDCACode], ['Sub Account Head Name', r.SubDCAName],
                ['IT Code', r.ITCodeDescription], ['Sub Account Head Status', r.SubDcaStatus],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveSubDCA',
            payload: (r, d, { action, note, user, roleId }) => ({
                DCACodeID: r.DCACodeID, SubDCACodeID: r.SubDCACodeID, Action: action, RemarksNote: note,
                Createdby: user, ModifiedBy: user, RoleId: roleId, SubDcaStatus: r.SubDcaStatus,
            }),
            ok: ['Submited', 'Submitted'],
        },
        // Legacy UpdateSubDCA → SpUpdateSubDCA (CheckUpdationType 'ReturnUpdate')
        resubmit: {
            fields: [
                { key: 'SubDCACode', label: 'Sub Account Head Code', readOnly: true },
                { key: 'SubDCAName', label: 'Sub Account Head Name', required: true },
                {
                    key: 'ITCodeID', label: 'IT Code', type: 'select', required: true,
                    options: (aux) => (Array.isArray(aux.itCodes) ? aux.itCodes : []).map((c: Rec) => ({ value: String(c.ITCodeID), label: c.ITCodename })),
                },
            ],
            initial: (r) => ({ SubDCACode: r.SubDCACode || '', SubDCAName: r.SubDCAName || '', ITCodeID: r.ITCodeID != null ? String(r.ITCodeID) : '' }),
            route: 'Accounts/UpdateSubDCA',
            payload: (r, d, v, { user, roleId }) => ({
                SubDCACodeID: r.SubDCACodeID, DCACodeID: r.DCACodeID, SubDCACode: r.SubDCACode, SubDCAName: v.SubDCAName.trim(),
                ITCodeID: parseInt(v.ITCodeID, 10), RoleId: roleId, Createdby: user, ModifiedBy: user, CheckUpdationType: 'ReturnUpdate',
            }),
            ok: ['Updated'],
        },
    },

    // Legacy /AccountsApproval/VerifyMasterGroups (+ VerifyMasterGroupsGrid / VerifyMasterGroupView)
    MasterGroups: {
        title: 'Master Group Verification',
        successLabel: 'Master Group',
        noun: 'group',
        icon: FolderTree,
        searchPlaceholder: 'Search by group name, nature of group…',
        queue: { route: 'Accounts/GetVerificationMasterGroups', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.GroupId,
        card: { title: (r) => r.GroupName, subtitle: (r) => r.NatureGroupName, meta: (r) => `Gross Profit Calculation: ${r.GrossProfitCalc || '-'}` },
        searchText: (r) => `${r.GroupName} ${r.NatureGroupName} ${r.GroupId}`,
        detail: { route: 'Accounts/GetVerificationMasterGroupsbyid', params: (r) => ({ GroupId: r.GroupId }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.GroupId,
        showReturn: 'Yes',
        isReturned: returnedStatus,
        header: { title: (r, d) => d.GroupName, subtitle: (r, d) => d.NatureGroupName, chips: () => ['Master Group'] },
        sections: (r, d) => [{
            fields: [['Group Name', d.GroupName], ['Nature of Group', d.NatureGroupName], ['Gross Profit Calculation', d.GrossProfitCalc]],
        }],
        approve: {
            route: 'Accounts/ApproveMasterGroup',
            payload: (r, d, { action, note, user, roleId }) => ({
                GroupId: d.GroupId, GroupName: d.GroupName, Action: action, RoleId: roleId, ApprovalNote: note, Createdby: user,
            }),
            ok: ['Submitted'],
        },
        // Legacy UpdateApprMasterGroup → spAddUpdateGroups (Action 'Update')
        resubmit: {
            fields: [
                { key: 'NatureGroupName', label: 'Nature of Group', readOnly: true },
                { key: 'GroupName', label: 'Group Name', required: true },
            ],
            initial: (r, d) => ({ NatureGroupName: d.NatureGroupName || '', GroupName: d.GroupName || '' }),
            route: 'Accounts/UpdateMasterGroup',
            payload: (r, d, v, { user, roleId }) => ({
                GroupNameList: v.GroupName.trim(), GroupIdList: d.GroupId, Createdby: user, Action: 'Update', RoleId: roleId,
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifySubGroups (+ VerifySubGroupsGrid / VerifySubGroupsView)
    SubGroups: {
        title: 'Sub Group Verification',
        successLabel: 'Sub Group',
        noun: 'sub group',
        icon: FolderOpen,
        searchPlaceholder: 'Search by sub group, master group, nature…',
        queue: { route: 'Accounts/GetVerificationSubGroupDetials', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: { title: (r) => r.Name, subtitle: (r) => r.MasterGroupName, meta: (r) => r.NatureGroupName },
        searchText: (r) => `${r.Name} ${r.MasterGroupName} ${r.NatureGroupName}`,
        detail: { route: 'Accounts/GetVerificationSubGroupbyId', params: (r) => ({ Id: r.Id }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.Id,
        showReturn: 'Yes',
        isReturned: returnedStatus,
        header: { title: (r, d) => d.Name, subtitle: (r, d) => d.MasterGroupName, chips: (r, d) => [d.NatureGroupName, 'Sub Group'] },
        sections: (r, d) => [{
            fields: [['Sub Group Name', d.Name], ['Master Group', d.MasterGroupName], ['Nature of Group', d.NatureGroupName]],
        }],
        approve: {
            route: 'Accounts/ApproveSubGroup',
            payload: (r, d, { action, note, user, roleId }) => ({
                Id: d.Id, Name: d.Name, Action: action, RoleId: roleId, ApprovalNote: note, Createdby: user, Grouptype: 'Sub',
            }),
            ok: ['Submitted'],
        },
        // Legacy UpdateApprSubGroup → spInsertUpdateSubGroups (Action 'Update')
        resubmit: {
            fields: [
                { key: 'MasterGroupName', label: 'Master Group', readOnly: true },
                { key: 'NatureGroupName', label: 'Nature of Group', readOnly: true },
                { key: 'Name', label: 'Sub Group Name', required: true },
            ],
            initial: (r, d) => ({ MasterGroupName: d.MasterGroupName || '', NatureGroupName: d.NatureGroupName || '', Name: d.Name || '' }),
            route: 'Accounts/UpdateSubGroup',
            payload: (r, d, v, { user, roleId }) => ({
                SubGroupNameList: v.Name.trim(), MasterGroupId: 0, Createdby: user, Id: d.Id, RoleId: roleId, Action: 'Update',
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyChildGroups (+ VerifyChildGroupsGrid / VerifyChildGroupView)
    ChildGroups: {
        title: 'Child Group Verification',
        successLabel: 'Child Group',
        noun: 'child group',
        icon: Folders,
        searchPlaceholder: 'Search by child group, parent sub group, master group…',
        queue: { route: 'Accounts/GetVerificationChildGroups', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: { title: (r) => r.Name, subtitle: (r) => `${r.MasterGroupName} › ${r.ParentSubGroup}`, meta: (r) => r.NatureGroupName },
        searchText: (r) => `${r.Name} ${r.MasterGroupName} ${r.ParentSubGroup} ${r.NatureGroupName}`,
        detail: { route: 'Accounts/GetVerificationChildGroupbyId', params: (r) => ({ Id: r.Id }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.Id,
        showReturn: 'Yes',
        isReturned: returnedStatus,
        header: { title: (r, d) => d.Name, subtitle: (r, d) => `${d.MasterGroupName} › ${d.ParentSubGroup}`, chips: (r, d) => [d.NatureGroupName, 'Child Group'] },
        sections: (r, d) => [{
            fields: [
                ['Child Group Name', d.Name], ['Master Group', d.MasterGroupName], ['Parent Sub Group', d.ParentSubGroup],
                ['Nature of Group', d.NatureGroupName],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveSubGroup',
            payload: (r, d, { action, note, user, roleId }) => ({
                Id: d.Id, Name: d.Name, Action: action, RoleId: roleId, ApprovalNote: note, Createdby: user, Grouptype: 'Child',
            }),
            ok: ['Submitted'],
        },
        // Legacy UpdateChildGroup → spInsertUpdateChildGroups (Action 'Update'); the API route is HttpPost
        resubmit: {
            fields: [
                { key: 'MasterGroupName', label: 'Master Group', readOnly: true },
                { key: 'ParentSubGroup', label: 'Parent Sub Group', readOnly: true },
                { key: 'NatureGroupName', label: 'Nature of Group', readOnly: true },
                { key: 'Name', label: 'Child Group Name', required: true },
            ],
            initial: (r, d) => ({
                MasterGroupName: d.MasterGroupName || '', ParentSubGroup: d.ParentSubGroup || '', NatureGroupName: d.NatureGroupName || '', Name: d.Name || '',
            }),
            method: 'post',
            route: 'Accounts/UpdateChildGroup',
            payload: (r, d, v, { user, roleId }) => ({
                ChildGroupNameList: v.Name.trim(), ChildGroupid: d.Id, Createdby: user, RoleId: roleId, Action: 'Update',
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyLedger (+ VerifyLedgerGrid / VerifyLedgerView)
    Ledger: {
        title: 'Ledger Verification',
        successLabel: 'Ledger',
        noun: 'ledger',
        icon: Library,
        searchPlaceholder: 'Search by ledger, group, account head…',
        queue: { route: 'Accounts/GetVerificationLedgerDetails', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: { title: (r) => r.Name, subtitle: (r) => r.GroupName, meta: (r) => r.AccHead },
        searchText: (r) => `${r.Name} ${r.GroupName} ${r.AccHead}`,
        detail: { route: 'Accounts/GetVerificationLedgerbyId', params: (r) => ({ LedgerId: r.Id }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.Id,
        // Legacy drops Return from this screen's status list (the returned-row editor still exists)
        showReturn: 'No',
        excludeActions: () => ['return'],
        isReturned: (r) => String(r.LStatus) === '0',
        header: { title: (r, d) => d.Name, subtitle: (r, d) => d.GroupName, chips: (r, d) => [d.LedgerTypeName, d.GroupNature] },
        sections: (r, d) => [{
            fields: [
                ['Ledger Name', d.Name], ['Group Name', d.GroupName],
                d.SubGroup && d.SubGroup !== '0' && ['Sub Group', d.SubGroup],
                ['Nature of Group', d.GroupNature], ['Account Head', d.AccHead], ['Balance', money(d.Balance)],
                ['Date', displayDate(d.Date)], ['Value Type', d.ValueType], ['Ledger Type', d.LedgerTypeName],
                Number(d.LedgerTypeId) === 8 && ['IT Code', d.TaxItName],
            ],
        }],
        approve: {
            route: 'Accounts/ApproveLedger',
            payload: (r, d, { action, note, user, roleId }) => ({
                LedgerId: d.Id, LedgerName: d.Name, Action: action, RoleId: roleId, ApprovalNote: note, Createdby: user,
            }),
            ok: ['Submitted'],
        },
        // Legacy UpdateApprLedger → spInsertUpdateLedger (Action 'Update')
        resubmit: {
            fields: [
                { key: 'GroupName', label: 'Group', readOnly: true },
                { key: 'SubGroup', label: 'Sub Group', readOnly: true, show: (v) => !!v.SubGroup && v.SubGroup !== '0' },
                { key: 'AccHead', label: 'Account Head', readOnly: true },
                { key: 'LedgerName', label: 'Ledger Name', required: true },
                { key: 'OpeningBalance', label: 'Opening Balance', required: true, filter: AMOUNT },
                { key: 'BalanceAsOnDate', label: 'Balance As On Date', type: 'date' },
                { key: 'LedgerValueType', label: 'Ledger Value Type', type: 'select', required: true, options: CREDIT_DEBIT },
            ],
            initial: (r, d) => ({
                GroupName: d.GroupName || '', SubGroup: d.SubGroup || '', AccHead: d.AccHead || '',
                LedgerName: d.Name || '', OpeningBalance: d.Balance != null ? String(d.Balance) : '',
                BalanceAsOnDate: isoDate(d.Date), LedgerValueType: d.ValueType || '',
            }),
            validate: (v) => (v.OpeningBalance !== '' && Number(v.OpeningBalance) !== 0 && !v.BalanceAsOnDate ? ['Select Balance As on Date'] : []),
            route: 'Accounts/EditLedger',
            payload: (r, d, v, { user, roleId }) => ({
                LedgerValueType: v.LedgerValueType, LedgerName: v.LedgerName.trim(), OpeningBalance: parseFloat(v.OpeningBalance) || 0,
                ...(v.BalanceAsOnDate ? { BalanceAsOnDate: v.BalanceAsOnDate } : {}), Createdby: user, LedgerId: d.Id, RoleId: roleId, Action: 'Update',
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /AccountsApproval/VerifyTaxGeneral (+ Grid / VerifyTaxGeneralView / VerifyTaxGSTView): one queue,
    // TaxType 'GST' or 'General' picks the view and routes
    TaxGeneral: {
        title: 'Tax Verification',
        successLabel: 'Tax',
        noun: 'tax',
        icon: Percent,
        searchPlaceholder: 'Search by tax number, name, type…',
        queue: { route: 'Accounts/GetVerificationGeneralTaxes', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.TaxId,
        card: { title: (r) => r.TaxName, subtitle: (r) => r.TaxNo, meta: (r) => `${r.TaxType} · ${r.TaxFor}` },
        searchText: (r) => `${r.TaxNo} ${r.TaxName} ${r.TaxFor} ${r.TaxType}`,
        detail: {
            route: (r) => (r.TaxType === 'GST' ? 'Accounts/GetVerificationGstTaxebyid' : 'Accounts/GetVerificationGeneralTaxesbyid'),
            params: (r) => ({ Taxid: r.TaxId }),
        },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.TaxId,
        showReturn: 'Yes',
        isReturned: returnedStatus,
        header: { title: (r, d) => d.TaxName, subtitle: (r, d) => d.TaxNo, chips: (r, d) => [r.TaxType, d.State] },
        sections: (r, d) => {
            if (r.TaxType !== 'GST') {
                return [{
                    fields: [
                        ['Tax Number', d.TaxNo], ['Tax Name', d.TaxName], ['Tax For', d.TaxFor], ['Sub Account Head', d.SubDCA],
                        ['Applicable From', displayDate(d.ApplicableFrom)], d.Remarks && ['Remarks', d.Remarks, true],
                    ],
                }];
            }
            const l = d.Ledger || {};
            return [
                {
                    title: 'GST',
                    fields: [
                        ['GST Number', d.TaxNo], ['Tax Name', d.TaxName], ['GST For', d.TaxFor], ['State', d.State],
                        ['Applicable From', d.AppFrom], ['Wallet Name', d.WalletName], ['Address', d.Address, true],
                    ],
                },
                {
                    title: 'Ledger',
                    fields: [
                        ['IT Name', l.TaxItName], ['Nature of Group', l.GroupNature], ['Group Name', l.GroupName], ['Sub Group', l.SubGroup],
                        ['Ledger Name', l.Name], ['Opening Balance', money(l.Balance)], ['Balance As On Date', displayDate(l.Date)],
                        ['Ledger Value Type', l.ValueType],
                    ],
                },
                d.Remarks && { fields: [['Remarks', d.Remarks, true]] },
            ];
        },
        approve: {
            route: (r) => (r.TaxType === 'GST' ? 'Accounts/ApproveTaxGST' : 'Accounts/ApproveTaxGeneral'),
            payload: (r, d, { action, note, user, roleId }) => ({ TaxId: d.TaxId, RoleId: roleId, Action: action, ApprovalNote: note, CreatedBy: user }),
            ok: ['Submited', 'Submitted'],
        },
        // Legacy UpdateApprGeneralTaxes → spInsertUpdateGeneralTax / UpdateApprGstTaxes → spInsertUpdateGstTax (Action 'Update')
        resubmit: {
            fields: [
                { key: 'TaxNo', label: 'Tax Number', readOnly: true },
                { key: 'AppFromText', label: 'Applicable From', readOnly: true },
                { key: 'TaxFor', label: 'Account Head', readOnly: true },
                { key: 'SubDCA', label: 'Sub Account Head', readOnly: true, show: (v) => !v.gst },
                { key: 'State', label: 'State', readOnly: true, show: (v) => v.gst },
                { key: 'TaxName', label: 'Tax Name', required: true },
                { key: 'LedgerName', label: 'Ledger Name', required: true, show: (v) => v.gst },
                { key: 'OpeningBalance', label: 'Opening Balance', required: true, filter: AMOUNT, show: (v) => v.gst },
                { key: 'BalanceAsOnDate', label: 'Balance As On Date', type: 'date', required: true, show: (v) => v.gst },
                { key: 'Remarks', label: 'Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => {
                const l = d.Ledger || {};
                const gst = r.TaxType === 'GST';
                return {
                    gst, TaxNo: d.TaxNo || '', TaxFor: d.TaxFor || '', SubDCA: d.SubDCA || '', State: d.State || '',
                    AppFromText: gst ? d.AppFrom || '' : displayDate(d.ApplicableFrom) || '',
                    TaxName: d.TaxName || '', Remarks: d.Remarks || '',
                    LedgerName: l.Name || '', OpeningBalance: l.Balance != null ? String(l.Balance) : '', BalanceAsOnDate: isoDate(l.Date),
                };
            },
            route: (r) => (r.TaxType === 'GST' ? 'Accounts/UpdateGstTax' : 'Accounts/UpdateGeneralTax'),
            payload: (r, d, v, { user, roleId }) => {
                const base = {
                    TaxName: v.TaxName.trim(), TaxNo: d.TaxNo, TaxType: r.TaxType, TaxFor: d.TaxFor, Remarks: v.Remarks.trim(),
                    CreatedBy: user, Action: 'Update', TaxId: d.TaxId, DcaId: 0, RoleId: roleId,
                };
                if (!v.gst) return { ...base, SubDCA: d.SubDCA, ApplicableFrom: d.ApplicableFrom };
                return {
                    ...base, ApplicableFrom: isoDate(d.AppFrom) || undefined, WalletName: d.WalletName, Address: d.Address,
                    LedgerName: v.LedgerName.trim(), OpeningBalance: parseFloat(v.OpeningBalance) || 0, BalanceAsOnDate: displayDate(v.BalanceAsOnDate),
                };
            },
            ok: ['Submitted', 'Submited'],
        },
    },

    // Legacy /AccountsApproval/ApproveIT (+ ViewApproveITCodesGridView / ItApproval)
    ITCode: {
        title: 'IT Code Verification',
        successLabel: 'IT Code',
        noun: 'IT code',
        icon: Hash,
        searchPlaceholder: 'Search by IT code, name, nature of group…',
        queue: { route: 'Accounts/GetApprovalItCodes', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Itid,
        card: { title: (r) => r.ItName, subtitle: (r) => r.ItCode, meta: (r) => `${r.NatureGroupName}${r.ITStatus ? ` · ${r.ITStatus}` : ''}` },
        searchText: (r) => `${r.ItCode} ${r.ItName} ${r.NatureGroupName} ${r.ITStatus}`,
        detail: { route: 'Accounts/GetApprovalItCodeDetailsbyId', params: (r) => ({ id: r.Itid }) },
        moid: (r, d) => d.MOID,
        remarksKey: (r) => r.Itid,
        showReturn: 'Yes',
        excludeActions: (r) => (r.ITStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedStatus,
        header: { title: (r, d) => d.ItName, subtitle: (r, d) => d.ItCode, chips: (r, d) => [d.NatureGroupName, d.ITStatus && `Status: ${d.ITStatus}`] },
        sections: (r, d) => {
            const l = d.Ledger || {};
            return [
                {
                    fields: [
                        ['IT Code', d.ItCode], ['IT Name', d.ItName], ['Nature of Group', d.NatureGroupName], ['IT Status', d.ITStatus],
                        ['Group Name', d.GroupName], d.SubGroupId && d.SubGroupId !== '0' && ['Sub Group Name', d.SubGroupName],
                    ],
                },
                d.Ledger && {
                    title: 'Ledger',
                    fields: [
                        ['Ledger Name', l.Name], ['Opening Balance', money(l.Balance)], ['Balance As On Date', displayDate(l.Date)],
                        ['Ledger Value Type', l.ValueType],
                    ],
                },
            ];
        },
        approve: {
            route: 'Accounts/ApproveITCode',
            payload: (r, d, { action, note, user, roleId }) => ({
                RoleId: roleId, CreatedBy: user, Itid: d.Itid, Action: action, RemarksNote: note, ITStatus: d.ITStatus,
            }),
            ok: ['Submitted'],
        },
        // Legacy UpdateApprIT → spInsertUpdateITCode (Action 'Update', CheckUpdationType 'ReturnUpdate')
        resubmit: {
            fields: [
                { key: 'ItCode', label: 'IT Code', readOnly: true },
                { key: 'NatureGroupName', label: 'Nature of Group', readOnly: true },
                { key: 'ItName', label: 'IT Name', required: true },
                { key: 'OpeningBalance', label: 'Opening Balance', filter: AMOUNT },
                { key: 'BalanceAsOnDate', label: 'Balance As On Date', type: 'date' },
                { key: 'LedgerValueType', label: 'Ledger Value Type', type: 'select', options: CREDIT_DEBIT },
            ],
            initial: (r, d) => {
                const l = d.Ledger || {};
                return {
                    ItCode: d.ItCode || '', NatureGroupName: d.NatureGroupName || '', ItName: d.ItName || '',
                    OpeningBalance: l.Balance != null ? String(l.Balance) : '', BalanceAsOnDate: isoDate(l.Date), LedgerValueType: l.ValueType || '',
                };
            },
            route: 'Accounts/EditITCode',
            payload: (r, d, v, { user, roleId }) => ({
                Itid: d.Itid, ItName: v.ItName.trim(), Action: 'Update', CheckUpdationType: 'ReturnUpdate',
                GroupId: d.GroupId, SubGroupId: d.SubGroupId, LedgerValueType: v.LedgerValueType,
                OpeningBalance: parseFloat(v.OpeningBalance) || 0, BalanceAsOnDate: displayDate(v.BalanceAsOnDate) || '',
                CreatedBy: user, RoleId: roleId,
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyHSNCreation (+ VerifyHSNCreationGrid / VerifyhsnView; returned rows → UpdateHSNCreationView)
    HSNCreation: {
        title: 'HSN/SAC Code Verification',
        successLabel: 'HSN/SAC Code',
        noun: 'HSN/SAC code',
        icon: Barcode,
        searchPlaceholder: 'Search by code, type, category…',
        queue: { route: 'Purchase/Gethsndetails', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Rowid,
        card: { title: (r) => r.HSNCode, subtitle: (r) => r.HSNCategory, meta: (r) => [r.CodeType, r.Category].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.HSNCode} ${r.CodeType} ${r.HSNCategory} ${r.Category}`,
        detail: { route: 'Purchase/GethsnverificationbyId', params: (r) => ({ Rowid: r.Rowid }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Rowid,
        // Legacy keeps the full status list here, Return included
        showReturn: 'Yes',
        isReturned: (r) => String(r.Status).trim() === '0',
        header: { title: (r, d) => d.HSNCode || r.HSNCode, subtitle: (r, d) => d.HSNCategory, chips: (r, d) => [d.CodeType || r.CodeType, d.Category] },
        sections: (r, d) => [{
            fields: [
                ['Type Category', d.Category], ['HSN Category', d.HSNCategory], ['HSN/SAC Code', d.HSNCode],
                ['CGST Rate', d.Cgstrate], ['SGST Rate', d.Sgstrate], ['IGST Rate', d.Igstrate],
                ['Remarks', d.Remarks, true],
                String(r.Status).trim() === '0' && d.ReturnRemarks && ['Return Remarks', d.ReturnRemarks, true],
            ],
        }],
        approve: {
            route: 'Purchase/Verifyhsn',
            payload: (r, d, { action, note, user, roleId }) => ({
                Rowid: String(r.Rowid), Appstatus: action, Remarks: note, Createdby: user, RoleID: String(roleId),
            }),
            ok: ['Submitted'],
        },
        // Legacy UpdateHSNData → spUpdateHSNDetails: only the GST rates and remarks can change
        resubmit: {
            fields: [
                { key: 'Cgstrate', label: 'CGST Rate', required: true, filter: /^\d*\.?\d?$/ },
                { key: 'Sgstrate', label: 'SGST Rate', required: true, filter: /^\d*\.?\d?$/ },
                { key: 'Igstrate', label: 'IGST Rate', required: true, filter: /^\d*\.?\d?$/ },
                { key: 'Remarks', label: 'Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => ({
                Cgstrate: d.Cgstrate != null ? String(d.Cgstrate) : '', Sgstrate: d.Sgstrate != null ? String(d.Sgstrate) : '',
                Igstrate: d.Igstrate != null ? String(d.Igstrate) : '', Remarks: d.Remarks || '',
            }),
            validate: (v) => [
                !(Number(v.Cgstrate) > 0) && 'Please Enter CGST',
                !(Number(v.Sgstrate) > 0) && 'Please Enter SGST',
                !(Number(v.Igstrate) > 0) && 'Please Enter IGST',
            ],
            route: 'Purchase/UpdateHSNData',
            payload: (r, d, v, { user, roleId }) => ({
                Cgstrate: v.Cgstrate, Sgstrate: v.Sgstrate, Igstrate: v.Igstrate, Remarks: v.Remarks.trim(),
                Rowid: String(r.Rowid), RoleID: String(roleId), Createdby: user,
            }),
            ok: ['Successfull'],
        },
    },
};
