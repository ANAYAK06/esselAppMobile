// Bank masters & movements — the Corex web's dedicated pages expressed as configs:
//   BankAccounts    pages/Accounts/VerifyBankAccounts.jsx    (accountsSlice/verifyBankAccountsSlice)
//   BankDeposit     pages/Accounts/VerifyBankDeposit.jsx     (accountsSlice/verifyBankDepositSlice)
//   BankTransfer    pages/Accounts/VerifyBankTransfer.jsx    (accountsSlice/verifyBankTransferSlice)
//   BankWithdrawal  pages/Accounts/VerifyBankWithdrawal.jsx  (accountsSlice/verifyBankWithdrawalSlice)
//   Cheque          pages/Accounts/VerifyCheque.jsx          (accountsSlice/verifyChequeSlice)
//   Close<Type>     pages/Accounts/VerifyCloseMaster.jsx     (accountsSlice/verifyCloseMasterSlice) — one per close type
// Returned rows are corrected and resubmitted inline, as on the web.
import React, { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import {
    ArrowLeftRight, BookMarked, BookOpenCheck, Building, CheckCircle, Handshake, Hash, Landmark, NotebookTabs, PiggyBank,
    Send, ShieldCheck, UserSquare, Users, WalletMinimal, XCircle,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { getRoute, listOf, putRoute, statusOf } from '@/src/api/verification/configVerificationAPI';
import { DateField, FormField, SelectField, TextField } from '@/src/components/employee/FormControls';
import { PrimaryButton } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import { Notice, money } from '@/src/components/verification/kit/VerificationKit';
import { brand } from '@/src/theme/colors';
import { Block, TableBlock, displayDate, isoDate, todayIso } from '../parts';
import type { Rec, VerificationConfig } from '../types';
import { list } from './shared';

const AMOUNT = /^\d*\.?\d{0,2}$/;
const OK_VERIFY = ['Submitted', 'Submited'];
const OK_UPDATE = ['Successfull', 'Submitted'];
const returnedBy = (key: string) => (r: Rec) => String(r[key]) === '0';
const bankOptions = (aux: Rec, name = 'banks') => list(aux[name]).map((b) => ({ value: String(b.Bank_Id), label: String(b.Bank_Name) }));

// ---- Bank withdrawal resubmit: name / bank / mode / cheque-or-number / date / amount / remarks ------------
const PAY_MODES = ['Cheque', 'Cash', 'RTGS/E-Trans', 'DD'];
const CHEQUE = 'Cheque';
const KEEP_CURRENT_CHEQUE = '0';

function WithdrawalEditor({ d, aux, values: v, setValues }: { d: Rec; aux: Rec; values: Rec; setValues: (u: (p: Rec) => Rec) => void }) {
    const banks = list(aux.banks);
    const bankName = banks.find((b) => String(b.Bank_Id) === String(v.bankId))?.Bank_Name;
    const isOriginalBank = String(d.From) === String(v.bankId);
    // Unused cheque numbers of the chosen bank (by bank name), for Cheque mode
    const loadCheques = useCallback(() => getRoute('Accounts/GetChequeNos', { bankname: bankName }).then(listOf), [bankName]);
    const cheques = useApiData(v.mode === CHEQUE && bankName ? loadCheques : null).data ?? [];
    const set = (k: string) => (val: string) => setValues((p) => ({ ...p, [k]: val }));
    const chequeOptions = [
        ...(isOriginalBank && d.Mode_of_Pay === CHEQUE && d.No ? [{ value: KEEP_CURRENT_CHEQUE, label: `${d.No} (current)` }] : []),
        ...cheques.map((c) => ({ value: String(c.Cheque_Id), label: String(c.Cheque_No) })),
    ];
    return (
        <View>
            <FormField label="Name" required><TextField value={v.name} onChangeText={set('name')} /></FormField>
            <FormField label="Withdrawal From" required>
                <SelectField
                    title="Withdrawal From"
                    value={v.bankId}
                    options={bankOptions(aux)}
                    onChange={(val) => setValues((p) => ({ ...p, bankId: val, chequeId: p.mode === CHEQUE && String(d.From) === val ? KEEP_CURRENT_CHEQUE : '' }))}
                />
            </FormField>
            <FormField label="Mode of Pay" required>
                <SelectField
                    title="Mode of Pay"
                    value={v.mode}
                    options={PAY_MODES.map((m) => ({ value: m, label: m }))}
                    onChange={(val) => setValues((p) => ({
                        ...p,
                        mode: val,
                        chequeId: val === CHEQUE && String(d.From) === String(p.bankId) && d.Mode_of_Pay === CHEQUE ? KEEP_CURRENT_CHEQUE : '',
                        no: val === CHEQUE ? p.no : (d.Mode_of_Pay === CHEQUE ? '' : p.no),
                    }))}
                />
            </FormField>
            {v.mode === CHEQUE ? (
                <FormField label="Cheque No" required>
                    <SelectField title="Cheque No" value={v.chequeId} options={chequeOptions} onChange={set('chequeId')} />
                </FormField>
            ) : (
                <FormField label="No" required><TextField value={v.no} onChangeText={set('no')} /></FormField>
            )}
            <FormField label="Date" required><DateField title="Date" value={v.date} onChange={set('date')} /></FormField>
            <FormField label="Amount" required>
                <TextField value={v.amount} onChangeText={(val) => (val === '' || AMOUNT.test(val)) && set('amount')(val)} keyboardType="decimal-pad" />
            </FormField>
            <FormField label="Remarks" required><TextField value={v.remarks} onChangeText={set('remarks')} multiline /></FormField>
        </View>
    );
}

// ---- Close master (Bank / IT / Cost Center / Account Head / … closing requests) --------------------------
type CloseType = {
    label: string;
    icon: LucideIcon;
    queueRoute: string;
    queueParams: (x: { roleId: string; userId: string }) => Rec;
    key: (r: Rec) => unknown;
    title: (r: Rec) => unknown;
    subtitle: (r: Rec) => unknown;
    fields: (r: Rec) => [string, unknown][];
    detailRoute: string;
    detailParams: (r: Rec, x: { roleId: string }) => Rec;
    pendingLists: [string, string][];
    openHeadsList?: [string, string];
    saveRoute: string;
    payload: (r: Rec, f: Rec) => Rec;
};

const CLOSE_TYPES: Record<string, CloseType> = {
    Bank: {
        label: 'Bank Account', icon: Landmark,
        queueRoute: 'GetCloseBankDetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'Bank' }),
        key: (r) => r.Bankid, title: (r) => r.BankName, subtitle: (r) => r.Accountno,
        fields: (r) => [['Bank Id', r.Bankid], ['Bank Name', r.BankName], ['Account Number', r.Accountno], ['Nature of Group', r.NatureGroupName]],
        detailRoute: 'GetBankCloseVerificationPendings', detailParams: (r, { roleId }) => ({ BankId: r.Bankid, Roleid: roleId }),
        pendingLists: [['BankPendingList', 'Verifications pending for this bank']],
        saveRoute: 'SaveBankCloseNotifications',
        payload: (r, f) => ({ Action: f.access, Bankid: r.Bankid, CloseRemarks: f.remarks, ClosingDate: f.closingDate, CloseStatus: f.status, Createdby: f.user, RoleId: f.roleId }),
    },
    IT: {
        label: 'IT Code', icon: Hash,
        queueRoute: 'GetCloseITDetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'IT' }),
        key: (r) => r.Itid, title: (r) => r.ItName, subtitle: (r) => r.ItCode,
        fields: (r) => [['IT Code', r.ItCode], ['IT Name', r.ItName], ['Nature of Group', r.NatureGroupName]],
        detailRoute: 'GetITCloseVerificationPendings', detailParams: (r, { roleId }) => ({ itId: r.Itid, Roleid: roleId, ITCode: r.ItCode }),
        pendingLists: [['lstITPending', 'Verifications pending for this IT code']],
        openHeadsList: ['lstITDcaSubdca', 'Open account heads under this IT code'],
        saveRoute: 'CloseITNotifications',
        payload: (r, f) => ({ Action: f.access, Itid: r.Itid, CloseRemarks: f.remarks, ClosingDate: f.closingDate, CloseStatus: f.status, CreatedBy: f.user, RoleId: f.roleId }),
    },
    CostCenter: {
        label: 'Cost Center', icon: Building,
        queueRoute: 'GetCloseCCDetailsbyRoleid', queueParams: ({ roleId, userId }) => ({ Roleid: roleId, Type: 'CostCenter', UID: userId }),
        key: (r) => r.CCCode, title: (r) => r.CCName, subtitle: (r) => r.CCCode,
        fields: (r) => [['CC Code', r.CCCode], ['CC Name', r.CCName], ['CC Type', r.CCType]],
        detailRoute: 'GetCCCloseVerificationPendings', detailParams: (r, { roleId }) => ({ CCCode: r.CCCode, Roleid: roleId, CCType: r.CCType }),
        pendingLists: [['lstCCPending', 'Verifications pending for this cost center']],
        saveRoute: 'SaveCCCloseNotifications',
        payload: (r, f) => ({ Action: f.access, CCCode: r.CCCode, CloseRemarks: f.remarks, ClosingDate: f.closingDate, CloseStatus: f.status, UID: f.userId, Createdby: f.user, RoleId: f.roleId }),
    },
    DCA: {
        label: 'Account Head', icon: BookMarked,
        queueRoute: 'GetCloseDCADetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'DCA' }),
        key: (r) => r.DCAID, title: (r) => r.DCAName, subtitle: (r) => r.DCACode,
        fields: (r) => [['Account Head Code', r.DCACode], ['Account Head Name', r.DCAName], ['Type', r.DCATypeName]],
        detailRoute: 'GetDCACloseVerificationPendings', detailParams: (r, { roleId }) => ({ Dcaid: r.DCAID, DCACode: r.DCACode, Roleid: roleId }),
        pendingLists: [['lstDCAPending', 'Verifications pending for this account head']],
        saveRoute: 'CloseDcaNotifications',
        payload: (r, f) => ({ Action: f.access, DCACode: r.DCACode, Remarks: f.remarks, CloseDate: f.closingDate, Status: f.status, Createdby: f.user, RoleId: f.roleId }),
    },
    SubDCA: {
        label: 'Sub Account Head', icon: BookOpenCheck,
        queueRoute: 'GetCloseSubDCADetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'SubDCA' }),
        key: (r) => r.SubDCACodeID, title: (r) => r.SubDCAName, subtitle: (r) => r.SubDCACode,
        fields: (r) => [['Account Head', r.DCAName], ['Sub Account Head Code', r.SubDCACode], ['Sub Account Head Name', r.SubDCAName], ['IT Code', r.ITCodeDescription]],
        detailRoute: 'GetSubDCACloseVerificationPendings', detailParams: (r, { roleId }) => ({ SDCACode: r.SubDCACode, Roleid: roleId }),
        pendingLists: [['lstsubDCAPending', 'Verifications pending for this sub account head']],
        saveRoute: 'CloseSubDcaNotifications',
        payload: (r, f) => ({ Action: f.access, SubDCACode: r.SubDCACode, CloseRemarks: f.remarks, ClosingDate: f.closingDate, Status: f.status, Createdby: f.user, RoleId: f.roleId }),
    },
    Client: {
        label: 'Client', icon: Users,
        queueRoute: 'GetCloseClientDetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'Client' }),
        key: (r) => r.Client_Code, title: (r) => r.Client_Name, subtitle: (r) => r.Client_Code,
        fields: (r) => [['Client Code', r.Client_Code], ['Client Name', r.Client_Name], ['Nature of Group', r.NatureGroupName]],
        detailRoute: 'GetClientCloseVerificationPendings', detailParams: (r, { roleId }) => ({ ClientCode: r.Client_Code, Roleid: roleId }),
        pendingLists: [['lstClientPending', 'Verifications pending for this client'], ['lstSubclientpending', 'Verifications pending for its sub clients']],
        saveRoute: 'CloseClientNotifications',
        payload: (r, f) => ({ CloseAction: f.access, Client_Code: r.Client_Code, CloseRemarks: f.remarks, ClosingDate: f.closingDate, CloseStatus: f.status, Createdby: f.user, RoleId: f.roleId }),
    },
    SubClient: {
        label: 'Sub Client', icon: UserSquare,
        queueRoute: 'GetCloseSubClientDetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'SubClient' }),
        key: (r) => r.SubClientCode, title: (r) => r.Branch || r.SubClientCode, subtitle: (r) => r.SubClientCode,
        fields: (r) => [['Client Code', r.ClientCode], ['Sub Client Code', r.SubClientCode], ['Branch', r.Branch], ['Nature of Group', r.NatureGroupName]],
        detailRoute: 'GetSubClientCloseVerificationPendings', detailParams: (r, { roleId }) => ({ SubClientCode: r.SubClientCode, Roleid: roleId }),
        pendingLists: [['lstSubclientpending', 'Verifications pending for this sub client']],
        saveRoute: 'CloseSubClientNotifications',
        payload: (r, f) => ({ CloseAction: f.access, SubClientCode: r.SubClientCode, CloseRemarks: f.remarks, ClosingDate: f.closingDate, CloseStatus: f.status, Createdby: f.user, RoleId: f.roleId }),
    },
    TermLoanAgency: {
        label: 'Term Loan Agency', icon: Handshake,
        queueRoute: 'GetCloseTLAgemcyDetailsbyRoleid', queueParams: ({ roleId }) => ({ Roleid: roleId, Type: 'TermLoanAgency' }),
        key: (r) => r.ID, title: (r) => r.AgencyName, subtitle: (r) => r.AgencyId,
        fields: (r) => [['Agency Code', r.AgencyId], ['Agency Name', r.AgencyName], ['Nature of Group', r.NatureGroupName]],
        detailRoute: 'GetAgencyCloseVerificationPendings', detailParams: (r, { roleId }) => ({ AgencyId: r.ID, Roleid: roleId, AgencyCode: r.AgencyId }),
        pendingLists: [['lstAgencyPending', 'Verifications pending for this agency']],
        saveRoute: 'CloseAgencyNotifications',
        payload: (r, f) => ({ Action: f.access, AgencyId: r.AgencyId, CloseRemarks: f.remarks, ClosingDate: f.closingDate, CloseStatus: f.status, Createdby: f.user, RoleId: f.roleId }),
    },
};

// Who may act on a closing request, and how (web resolveCloseAction)
const TERMINAL = ['Approved', 'Rejected'];
const resolveCloseAction = (d: Rec): { canAct: boolean; reason?: string; options?: string[]; dateEditable?: boolean } => {
    const access = d.CloseLevelAccess;
    const status = String(d.CloseStatus ?? '');
    const current = Number(d.CurrentRoleLevel);
    const min = Number(d.CloseMinRoleLevel);
    const max = Number(d.CloseMaxRoleLevel);
    const inProgress = Number(d.CloseNotificationExist) === 1 && status !== 'Rejected';
    if (!inProgress) return { canAct: false, reason: 'The closing request has not been initiated (or was rejected).' };
    if (access !== 'ApproveLevel' && access !== 'VerificationLevel') {
        return { canAct: false, reason: 'Your role is not a verification / approval level for this closing.' };
    }
    if (TERMINAL.includes(status)) return { canAct: false, reason: `This closing request is already ${status.toLowerCase()}.` };
    const numStatus = Number(status);
    if (access === 'VerificationLevel') {
        if (numStatus === current) return { canAct: false, reason: 'You have already verified this closing request.' };
        return { canAct: true, options: ['Verify'], dateEditable: false };
    }
    const finalLevel = max === current;
    const firstApproval = finalLevel && numStatus === min && min + 1 === current;
    const laterApproval = finalLevel && numStatus > min && numStatus < max;
    if (numStatus === min && min + 1 !== current) return { canAct: false, reason: 'Waiting for the verification level before approval.' };
    return { canAct: true, options: ['Approve', 'Reject'], dateEditable: firstApproval || laterApproval };
};

const OPTION_STYLE: Record<string, { icon: LucideIcon; on: string; off: string; text: string }> = {
    Verify: { icon: ShieldCheck, on: 'bg-blue-600 border-blue-600', off: 'border-blue-300', text: 'text-blue-700' },
    Approve: { icon: CheckCircle, on: 'bg-green-600 border-green-600', off: 'border-green-300', text: 'text-green-700' },
    Reject: { icon: XCircle, on: 'bg-red-600 border-red-600', off: 'border-red-300', text: 'text-red-700' },
};

function CloseDecision({ t, r, d, roleId, userId, user, done }: {
    t: CloseType; r: Rec; d: Rec; roleId: string; userId: string; user: string; done: (m: string) => void;
}) {
    const decision = resolveCloseAction(d);
    const [status, setStatus] = useState('');
    const [closingDate, setClosingDate] = useState(() => isoDate(d.ClosingDate));
    const [remarks, setRemarks] = useState(d.CloseRemarks || '');
    const [busy, setBusy] = useState(false);

    if (!decision.canAct) return <Notice tone="blue" title="No action for you here" text={decision.reason || ''} />;

    const submit = async () => {
        const errors = [
            !status && 'Select Status',
            (status === 'Approve' || status === 'Reject') && !closingDate && 'Select Closing As On Date',
            !remarks.trim() && 'Enter Remarks',
        ].filter(Boolean);
        if (errors.length) return Alert.alert('Check before you continue', errors.join('\n'));
        setBusy(true);
        try {
            const result = statusOf(await putRoute(`Accounts/${t.saveRoute}`, t.payload(r, {
                access: d.CloseLevelAccess, remarks: remarks.trim(), closingDate: closingDate ? displayDate(closingDate) : '',
                status, user, roleId, userId,
            })));
            if (result === 'Notified') done(`Close ${t.label} ${status === 'Verify' ? 'verified' : status === 'Reject' ? 'rejected' : 'approved'} successfully`);
            else Alert.alert('Not applied', result || 'Error occurred while sending the notification.');
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Error occurred while sending the notification.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Block title="Your action">
            <FormField label="Status" required>
                <View className="flex-row gap-2">
                    {decision.options!.map((opt) => {
                        const st = OPTION_STYLE[opt];
                        const Icon = st.icon;
                        const active = status === opt;
                        return (
                            <TouchableOpacity key={opt} onPress={() => setStatus(opt)} activeOpacity={0.8}
                                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border ${active ? st.on : `bg-white ${st.off}`}`}>
                                <Icon size={15} color={active ? '#fff' : brand.navy} />
                                <Text className={`text-sm font-semibold ${active ? 'text-white' : st.text}`}>{opt}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </FormField>
            <FormField label="Closing As On Date" required={status === 'Approve' || status === 'Reject'}>
                {decision.dateEditable
                    ? <DateField title="Closing As On Date" value={closingDate} onChange={setClosingDate} minDate={todayIso()} />
                    : <Text className="text-sm font-semibold text-gray-800">{closingDate ? displayDate(closingDate) : '—'}</Text>}
            </FormField>
            <FormField label="Remarks" required><TextField value={remarks} onChangeText={setRemarks} multiline /></FormField>
            <PrimaryButton label="Submit" icon={Send} onPress={submit} loading={busy} disabled={busy} />
        </Block>
    );
}

const closeConfig = (type: string): VerificationConfig => {
    const t = CLOSE_TYPES[type];
    return {
        title: `Close ${t.label} Verification`,
        successLabel: `Close ${t.label}`,
        noun: 'closing request',
        icon: t.icon,
        searchPlaceholder: 'Search…',
        queue: { route: `Accounts/${t.queueRoute}`, params: ({ roleId, userId }) => t.queueParams({ roleId, userId }) },
        itemKey: (r) => String(t.key(r)),
        card: { title: t.title, subtitle: t.subtitle, meta: (r) => r.NatureGroupName || r.CCType || r.DCATypeName || t.label },
        searchText: (r) => t.fields(r).map(([, v]) => v ?? '').join(' '),
        detail: { route: `Accounts/${t.detailRoute}`, params: (r, { roleId }) => t.detailParams(r, { roleId }) },
        moid: () => null,                       // the web page shows no status list / history
        showReturn: 'No',
        header: {
            title: (r) => t.title(r),
            subtitle: (r) => t.subtitle(r),
            chips: (r, d) => [`Close ${t.label}`, d.CloseLevelAccess && `Your access: ${String(d.CloseLevelAccess).replace(/([a-z])([A-Z])/g, '$1 $2')}`],
        },
        sections: (r, d) => [{
            fields: [...t.fields(r), ['Closing As On', d.ClosingDate ? displayDate(isoDate(d.ClosingDate)) : null]],
        }],
        extra: (r, d) => {
            const heads = d[t.openHeadsList?.[0] ?? ''] as Rec[] | undefined;
            return (
                <>
                    {t.pendingLists.map(([prop, heading]) => (
                        <TableBlock key={prop} title={heading} heads={['Operation', 'Pending']} empty="Nothing pending"
                            rows={list(d[prop]).map((p) => [p.PaymentTypeName || `Workflow ${p.WorkFlowLevelId}`, p.NoofPendings])} />
                    ))}
                    {t.openHeadsList ? (
                        <TableBlock title={t.openHeadsList[1]} heads={['Account head']} empty="None open"
                            rows={list(heads).map((h) => [`${h.Code} · ${h.Name}`])} />
                    ) : null}
                </>
            );
        },
        actions: (r, d, { roleId, userId, user, done }) => <CloseDecision t={t} r={r} d={d} roleId={roleId} userId={userId} user={user} done={done} />,
        approve: { route: '', payload: () => ({}) },
    };
};

export const ACCOUNTS_BANK_CONFIGS: Record<string, VerificationConfig> = {
    BankAccounts: {
        title: 'Bank Account Verification',
        successLabel: 'Bank Account',
        noun: 'bank account',
        icon: Landmark,
        searchPlaceholder: 'Search bank, account no, type, location…',
        queue: { route: 'Accounts/GetVerificationBankAccounts', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Bankid,
        card: { title: (r) => r.BankName, subtitle: (r) => r.Accountno, meta: (r) => [r.BankType || r.NatureGroupName, r.Banklocation].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.BankName} ${r.Accountno} ${r.BankType} ${r.Banklocation} ${r.NatureGroupName}`,
        detail: { route: 'Accounts/GetVerificationBankbyid', params: (r) => ({ Bankid: r.Bankid }) },
        moid: (r, d) => r.MOID || d.MOID,
        remarksKey: (r, d) => d.BankName,
        showReturn: 'Yes',
        excludeActions: (r, d) => (d.BankStatus === 'Closed' ? ['return', 'reject'] : []),
        isReturned: returnedBy('Status'),
        header: { title: (r, d) => d.BankName, subtitle: (r, d) => d.Accountno, chips: (r, d) => [r.BankType, d.AccountType, d.BankStatus && `Bank Status: ${d.BankStatus}`] },
        sections: (r, d) => {
            const returned = String(r.Status) === '0';
            return [{
                fields: [
                    ['Bank Name', d.BankName], ['Account Number', d.Accountno], !returned && ['Location', d.Banklocation],
                    ['Nature of Group', d.NatureGroupName], ['Account Type', d.AccountType], ['Account Holder', d.AccountHolderName],
                    ['Opening Balance', money(d.OpeningBalance)], ['Opening Date', d.AccOpeningDate], ['Balance As On Date', d.BalanceAsOn],
                    !returned && ['Minimum Balance', money(d.MinimumBalance)], !returned && ['Bank Status', d.BankStatus],
                    ['Group Name', d.GroupName], d.SubGroupId && d.SubGroupId !== '0' && ['Sub Group Name', d.SubGroupName],
                    ['Ledger Value Type', d.LedgerValueType],
                ],
            }];
        },
        approve: {
            route: 'Accounts/ApproveBankAccounts',
            payload: (r, d, { action, note, user, roleId }) => ({
                Bankid: d.Bankid, Accountno: d.Accountno, Action: action, ApprovalNote: note, BankStatus: d.BankStatus, Createdby: user, RoleId: roleId,
            }),
            ok: ['Submited', 'Submitted'],
        },
        // SpUpdateReturnedbankAcc: only the location and minimum balance can change
        resubmit: {
            fields: [
                { key: 'Banklocation', label: 'Location', required: true },
                { key: 'MinimumBalance', label: 'Minimum Balance', required: true, filter: /^-?\d*\.?\d{0,2}$/ },
            ],
            initial: (r, d) => ({ Banklocation: d.Banklocation || '', MinimumBalance: d.MinimumBalance != null ? String(d.MinimumBalance) : '', overDraft: d.AccountType === 'Over Draft' }),
            validate: (v, r, d) => {
                const minBal = parseFloat(v.MinimumBalance);
                return [
                    !v.overDraft && String(v.MinimumBalance).startsWith('-') && 'Minimum Balance cannot be negative',
                    (Number.isNaN(minBal) || minBal === 0) && 'Enter Minimum Balance',
                    !Number.isNaN(minBal) && parseFloat(d.OpeningBalance) <= minBal && 'Minimum Balance should not be greater than Opening Balance',
                ];
            },
            route: 'Accounts/UpdateReturnedbankAcc',
            payload: (r, d, v, { user, roleId, roleCode }) => ({
                Bankid: d.Bankid, Banklocation: v.Banklocation.trim(), Status: '1', MinimumBalance: parseFloat(v.MinimumBalance),
                Createdby: user, RoleId: roleId, Role: roleCode,
            }),
            ok: ['Submitted', 'Submited'],
        },
    },

    BankDeposit: {
        title: 'Bank Deposit Verification',
        successLabel: 'Deposit',
        noun: 'deposit',
        icon: PiggyBank,
        searchPlaceholder: 'Search bank, cost center, date, amount…',
        queue: { route: 'Accounts/GetDeposit', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: { title: (r) => r.TransferCostCenter, subtitle: (r) => r.Bank, meta: (r) => r.Date, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Bank} ${r.TransferCostCenter} ${r.Date} ${r.Amount}`,
        detail: {
            route: (r) => (String(r.TranStatus) === '0' ? 'Accounts/GetReturndepositbyId' : 'Accounts/GetVerificationdepositbyId'),
            params: (r) => ({ BankTranid: r.Id }),
        },
        aux: [{ name: 'banks', route: 'Accounts/GetBankDetailsfordeposit' }],
        moid: (r, d) => d.MOID,
        showReturn: 'No',
        isReturned: returnedBy('TranStatus'),
        header: { title: (r) => r.TransferCostCenter, subtitle: (r) => money(r.Amount), chips: (r) => [r.Bank, r.Date && `Date: ${r.Date}`] },
        sections: (r, d) => (String(r.TranStatus) === '0'
            ? [{ fields: [['Cost / Job Center', d.Transfer_Cost_Center], ['Cost Center Cash Available', money(d.CCAmount)]] }]
            : [{ fields: [['Date', d.Date], ['Bank Name', d.Bank], ['Cost / Job Center', d.TransferCostCenter], ['Amount', money(d.Amount)], ['Remarks', d.Remarks, true]] }]),
        approve: {
            route: 'Accounts/Verifydeposit',
            payload: (r, d, { action, note, user, roleId }) => ({ Id: d.Id, Approvalstatus: action, ApprovalRemarks: note, Createdby: user, RoleID: roleId }),
            ok: OK_VERIFY,
        },
        resubmit: {
            fields: [
                { key: 'bank', label: 'Bank Name', type: 'select', required: true, options: (aux) => bankOptions(aux) },
                { key: 'date', label: 'Date', type: 'date', required: true },
                { key: 'amount', label: 'Amount', required: true, filter: AMOUNT },
                { key: 'description', label: 'Description', type: 'textarea', required: true },
            ],
            initial: (r, d, aux) => ({
                bank: String(list(aux.banks).find((b) => b.Bank_Name === d.Transfer_Bank)?.Bank_Id ?? ''),
                date: d.Transfer_Date ? String(d.Transfer_Date).slice(0, 10) : '',
                amount: d.Transfer_Amount != null ? String(d.Transfer_Amount) : '',
                description: d.Description || '',
            }),
            validate: (v, r, d) => {
                const available = parseFloat(d.CCAmount) || 0;
                return [
                    !(parseFloat(v.amount) > 0) && 'Enter Amount',
                    (available === 0 || parseFloat(v.amount) > available) && 'Invalid Attempt — amount exceeds the cost center cash available',
                    v.date && v.date > todayIso() && 'Date cannot be in the future',
                ];
            },
            route: 'Accounts/Updatedeposit',
            payload: (r, d, v, { user, roleId }) => ({
                Id: d.Id, CC_Amount: d.CCAmount, Transfer_Cost_Center: d.Transfer_Cost_Center, Transfer_Bank: v.bank, Transfer_Date: v.date,
                Transfer_Amount: parseFloat(v.amount), Description: v.description.trim(), Createdby: user, RoleID: roleId,
            }),
            ok: OK_UPDATE,
        },
    },

    BankTransfer: {
        title: 'Bank to Bank Transfer Verification',
        successLabel: 'Bank Transfer',
        noun: 'bank transfer',
        icon: ArrowLeftRight,
        searchPlaceholder: 'Search ref no, bank, date, amount…',
        queue: { route: 'Accounts/GetBankDeposit', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Refno,
        card: { title: (r) => `Ref #${r.Refno}`, subtitle: (r) => `${r.FromBank || ''} → ${r.ToBank || ''}`, meta: (r) => r.Date, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Refno} ${r.FromBank} ${r.ToBank} ${r.Date} ${r.Amount}`,
        detail: {
            route: (r) => (String(r.Approvalstatus) === '0' ? 'Accounts/GetReturnbanktransferbyId' : 'Accounts/GetBankVerificationdepositbyId'),
            params: (r) => (String(r.Approvalstatus) === '0' ? { BankTranrefno: r.Refno } : { RefNo: r.Refno }),
        },
        aux: [{ name: 'banks', route: 'Accounts/GetBankDetails' }],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'Yes',
        isReturned: returnedBy('Approvalstatus'),
        header: { title: (r) => `${r.FromBank || ''} → ${r.ToBank || ''}`, subtitle: (r) => money(r.Amount), chips: (r) => [`Ref ${r.Refno}`, r.Date && `Date: ${r.Date}`] },
        sections: (r, d) => (String(r.Approvalstatus) === '0'
            ? [{ fields: [['From Bank', d.From], ['Mode of Pay', d.Mode_of_Pay], ['No', d.No]] }]
            : [{
                fields: [
                    ['Date', d.Date], ['From Bank', d.FromBank], ['Mode of Pay', d.ModeofPay], ['No', d.No], ['To Bank', d.ToBank],
                    ['Amount', money(d.Amount)], ['Amount in Words', d.AmountInWords, true], ['Remarks', d.Remarks, true],
                ],
            }]),
        approve: {
            route: 'Accounts/Verifybankdeposit',
            payload: (r, d, { action, note, user, roleId }) => ({ Refno: d.Refno, Approvalstatus: action, ApprovalRemarks: note, Createdby: user, RoleID: roleId }),
            ok: OK_VERIFY,
        },
        resubmit: {
            fields: [
                { key: 'to', label: 'To Bank', type: 'select', required: true, options: (aux) => bankOptions(aux) },
                { key: 'date', label: 'Date', type: 'date', required: true },
                { key: 'amount', label: 'Amount', required: true, filter: AMOUNT },
                { key: 'remarks', label: 'Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => ({
                to: d.ToId ? String(d.ToId) : '', date: isoDate(d.Date), remarks: d.Remarks || '', amount: d.Amount != null ? String(d.Amount) : '',
            }),
            validate: (v, r, d) => [
                v.to && d.FromId && String(d.FromId) === String(v.to) && 'From Bank and To Bank should not be the same',
                !(parseFloat(v.amount) > 0) && 'Enter Amount',
                v.date && v.date > todayIso() && 'Date cannot be in the future',
            ],
            route: 'Accounts/UpdateTransfer',
            payload: (r, d, v, { user, roleId }) => ({
                Refno: d.Refno, From: d.FromId, To: v.to, Date: displayDate(v.date), Remarks: v.remarks.trim(), Amount: parseFloat(v.amount),
                Createdby: user, RoleID: roleId,
            }),
            ok: OK_UPDATE,
        },
    },

    BankWithdrawal: {
        title: 'Bank Withdrawal Verification',
        successLabel: 'Withdrawal',
        noun: 'withdrawal',
        icon: WalletMinimal,
        searchPlaceholder: 'Search name, bank, mode, no, amount…',
        queue: { route: 'Accounts/GetWithdrawns', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: { title: (r) => r.Name, subtitle: (r) => [r.BankName, r.Modeofpay].filter(Boolean).join(' · '), meta: (r) => displayDate(r.Date), amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.Name} ${r.BankName} ${r.Modeofpay} ${r.No} ${r.Amount}`,
        detail: {
            route: (r) => (String(r.Approvalstatus) === '0' ? 'Accounts/GetReturnwithdrawbyId' : 'Accounts/GetVerificationwithdrawnbyId'),
            params: (r) => ({ BankTranid: r.Id }),
        },
        aux: [{ name: 'banks', route: 'Accounts/GetBankDetails' }],
        moid: (r) => r.MOID,
        chkAmt: (r) => r.Amount,
        showReturn: 'Yes',
        isReturned: returnedBy('Approvalstatus'),
        header: { title: (r) => r.Name, subtitle: (r) => money(r.Amount), chips: (r) => [r.BankName, r.Modeofpay, r.Date && `Date: ${displayDate(r.Date)}`] },
        sections: (r, d) => (String(r.Approvalstatus) === '0' ? [] : [{
            fields: [
                ['Name', d.Name], ['Bank', d.BankName], ['Payment Mode', d.Modeofpay], ['Cheque / Ref No', d.No], ['Payment Date', d.Date],
                ['Amount', money(d.Amount)], ['Amount in Words', d.AmountInWords, true], ['Remarks', d.Remarks, true],
            ],
        }]),
        approve: {
            route: 'Accounts/Verifywithdraw',
            payload: (r, d, { action, note, user, roleId }) => ({ Id: d.Id, Approvalstatus: action, ApprovalRemarks: note, Createdby: user, RoleId: roleId }),
            ok: OK_VERIFY,
        },
        resubmit: {
            fields: [],
            initial: (r, d) => ({
                name: d.Name || '', bankId: d.From ? String(d.From) : '', mode: d.Mode_of_Pay || '', no: d.No || '',
                chequeId: d.Mode_of_Pay === CHEQUE ? KEEP_CURRENT_CHEQUE : '',
                date: isoDate(d.Date) || String(d.Date || '').slice(0, 10), remarks: d.Remarks || '', amount: d.Amount != null ? String(d.Amount) : '',
            }),
            render: (r, d, { aux, values, setValues }) => <WithdrawalEditor d={d} aux={aux} values={values} setValues={setValues} />,
            validate: (v) => [
                !String(v.name).trim() && 'Enter Name',
                !v.bankId && 'Select Withdrawal From',
                !v.mode && 'Select Mode of Pay',
                v.mode === CHEQUE && v.chequeId === '' && 'Select Cheque No',
                v.mode && v.mode !== CHEQUE && !String(v.no).trim() && 'Enter No',
                !(parseFloat(v.amount) > 0) && 'Enter Amount',
                !String(v.remarks).trim() && 'Enter Remarks',
                !v.date && 'Select Date',
                v.date && v.date > todayIso() && 'Date cannot be in the future',
            ],
            route: 'Accounts/Updatewithdraw',
            payload: (r, d, v, { user, roleId }) => {
                const keepingCurrent = v.mode === CHEQUE && v.chequeId === KEEP_CURRENT_CHEQUE;
                return {
                    Id: d.Id, Name: v.name.trim(), From: v.bankId, Mode_of_Pay: v.mode,
                    No: v.mode === CHEQUE ? (keepingCurrent ? d.No : '') : v.no.trim(),
                    Chequeid: v.mode === CHEQUE ? v.chequeId : '0',
                    Date: v.date, Remarks: v.remarks.trim(), Amount: parseFloat(v.amount), Createdby: user, RoleID: roleId,
                };
            },
            ok: OK_UPDATE,
        },
    },

    Cheque: {
        title: 'Cheque Book Verification',
        successLabel: 'Cheque Book',
        noun: 'cheque book',
        icon: NotebookTabs,
        searchPlaceholder: 'Search bank, date, remarks…',
        queue: { route: 'Accounts/GetCheque', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.chequeid,
        card: { title: (r) => r.BankName, subtitle: (r) => `Issued ${r.CreationDate}`, meta: (r) => r.Remarks },
        searchText: (r) => `${r.BankName} ${r.CreationDate} ${r.Remarks}`,
        detail: {
            route: (r) => (String(r.Approvalstatus) === '0' ? 'Accounts/GetReturnchequebyId' : 'Accounts/GetchqverificationbyId'),
            params: (r) => (String(r.Approvalstatus) === '0' ? { chequeid: r.chequeid } : { chqid: r.chequeid }),
        },
        aux: [{ name: 'banks', route: 'Accounts/GetBankDetails' }],
        moid: (r, d) => d.MOID,
        remarksKey: (r, d) => d.chequeid,
        showReturn: 'Yes',
        isReturned: returnedBy('Approvalstatus'),
        header: { title: (r, d) => d.BankName || r.BankName, subtitle: (r, d) => `Cheques ${d.FirstChequeno ?? ''} – ${d.LastChequeno ?? ''}` },
        sections: (r, d) => (String(r.Approvalstatus) === '0' ? [] : [{
            fields: [['Bank', d.BankName], ['Issue Date', d.CreationDate], ['Cheque No From', d.FirstChequeno], ['Cheque No To', d.LastChequeno], ['Remarks', d.Remarks, true]],
        }]),
        approve: {
            route: 'Accounts/VerifyCheque',
            payload: (r, d, { action, note, user, roleId }) => ({ chequeid: d.chequeid, Apprstatus: action, ApprovalRemarks: note, CreatedBy: user, RoleID: roleId }),
            ok: OK_VERIFY,
        },
        resubmit: {
            fields: [
                { key: 'bank', label: 'Bank Name', type: 'select', required: true, options: (aux) => bankOptions(aux) },
                { key: 'date', label: 'Issue Date', type: 'date', required: true },
                { key: 'from', label: 'First Cheque No', required: true, filter: /^\d{0,6}$/, maxLength: 6 },
                { key: 'to', label: 'Last Cheque No', required: true, filter: /^\d{0,6}$/, maxLength: 6 },
                { key: 'remarks', label: 'Remarks', type: 'textarea', required: true },
            ],
            initial: (r, d) => ({ bank: d.BankId ? String(d.BankId) : '', date: isoDate(d.CreationDate), from: d.FirstChequeno || '', to: d.LastChequeno || '', remarks: '' }),
            validate: (v) => [
                (String(v.from).length !== 6 || String(v.to).length !== 6) && 'Please enter six digits in From and To',
                v.from && v.to && Number(v.from) >= Number(v.to) && 'Please enter valid cheque nos',
                v.date && v.date > todayIso() && 'Date cannot be in the future',
            ],
            route: 'Accounts/Updatecheque',
            payload: (r, d, v, { user, roleId }) => ({
                chequeid: d.chequeid, BankName: v.bank, ChqOpeningDate: displayDate(v.date), FirstChequeno: v.from, LastChequeno: v.to,
                Remarks: v.remarks.trim(), CreatedBy: user, RoleID: roleId,
            }),
            ok: OK_UPDATE,
        },
    },

    ...Object.fromEntries(Object.keys(CLOSE_TYPES).map((type) => [`Close${type}`, closeConfig(type)])),
};
