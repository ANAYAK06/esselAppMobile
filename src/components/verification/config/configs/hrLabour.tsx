// HR — labour pages expressed as configs (same routes / payloads as each web page + slice / API):
//   BulkWorker        pages/HR/VerifyBulkWorker.jsx        (HRSlice/bulkWorkerVerificationSlice, api/HRAPI/bulkWorkerRegistrationAPI)
//   WorkerStaffReg    pages/HR/VerifyWorkerStaffReg.jsx    (same slice / API as Bulk Worker)
//   LabourBankChange  pages/HR/VerifyLabourBankChange.jsx  (HRSlice/labourBankChangeSlice)
//   LabourTypeChange  pages/HR/VerifyLabourTypeChange.jsx  (HRSlice/labourTypeChangeSlice — /LabourTypeChange/*)
//   LabourExit        pages/HR/VerifyLabourExit.jsx        (HRSlice/labourExitSlice)
//   LabourObjectivesGoals pages/HR/VerifyLabourObjectivesGoals.jsx (HRSlice/labourObjectivesGoalsSlice)
//   LabourPayroll     pages/HR/VerifyLabourPayRoll.jsx     (labourPayrollSlice — /LabourPayroll/*)
//   LabourCMSPay      pages/HR/VerifyLabourCMSPay.jsx      (HRSlice/labourCMSVerificationSlice — /LabourCMS/*)
//   LabourCTC         pages/HR/VerifyLabourCTC.jsx         (HRSlice/labourCTCSlice, api/HRAPI/labourCTCVerificationAPI)
//   LabourPayRevision pages/HR/VerifyLabourPayRevision.jsx (HRSlice/labourPayRevisionSlice, api/HRAPI/labourPayrevisionAPI)
import React from 'react';
import { ArrowLeftRight, Award, Building2, CreditCard, HardHat, LogOut, UserPlus, Users } from 'lucide-react-native';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { TableBlock, fmt } from '../parts';
import { appendApprovalComment } from '@/src/api/verification/verificationCommonAPI';
import type { Rec, VerificationConfig } from '../types';
import { ANY, list } from './shared';
import { CTCBreakdown, PayRevisionBreakdown, annualCTC } from './hrParts';

// The batch detail answers either the worker list or { lstWorker, MOID, … }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const workersOf = (batch: unknown): Rec[] => (Array.isArray(batch) ? batch : list((batch as Rec | null)?.lstWorker));
const batchOf = (aux: Rec): Rec => (Array.isArray(aux.batch) ? {} : aux.batch || {});

const WORKER_COLUMNS: [string, string][] = [
    ['FirstName', 'First Name'], ['LastName', 'Last Name'], ['SerialNo', 'S.No'], ['FatherName', 'Father'], ['Gender', 'Gender'], ['DOB', 'DOB'],
    ['MobileNo', 'Mobile'], ['Designation', 'Designation'], ['Department', 'Department'], ['CostCenter', 'Cost Center'], ['Group', 'Group'],
    ['ContractorCode', 'Contractor'], ['LabourType', 'Labour Type'], ['JobType', 'Job Type'], ['JoiningDate', 'Joining'], ['AadharNo', 'Aadhar'],
    ['BankName', 'Bank'], ['IFSCCode', 'IFSC'], ['BankAccountNo', 'Account No'], ['BankAddress', 'Bank Branch'], ['IsPFExist', 'PF'],
    ['IsESIExist', 'ESI'], ['ESINumber', 'ESI No'], ['UANNumber', 'UAN'],
];

// HR/ApproveBulkWorker — the worker list goes back with the decision (approveBulkWorker in the web API)
const workerPayload = (w: Rec) => ({
    SerialNo: parseInt(w.SerialNo, 10) || 0, FirstName: w.FirstName ?? '', LastName: w.LastName ?? '', CostCenter: w.CostCenter ?? '',
    LabourType: w.LabourType ?? '', ContractorCode: w.ContractorCode ?? '', Group: w.Group ?? '', FatherName: w.FatherName ?? '',
    DOB: w.DOB ?? '', JoiningDate: w.JoiningDate ?? '', BankName: w.BankName ?? '', IFSCCode: w.IFSCCode ?? '', BankAddress: w.BankAddress ?? '',
    BankAccountNo: w.BankAccountNo ?? '', Gender: w.Gender ?? '', MobileNo: w.MobileNo ?? '', JobType: w.JobType ?? '', Department: w.Department ?? '',
    AadharNo: w.AadharNo ?? '', ProbationDays: parseInt(w.ProbationDays, 10) || 0, IsPFExist: w.IsPFExist ?? '', IsESIExist: w.IsESIExist ?? '',
    UANNumber: w.UANNumber ?? '', ReportToRole: w.ReportToRole ?? '', ESINumber: w.ESINumber ?? '', Designation: w.Designation ?? '',
});

const workerBatch = (staffReg: boolean): VerificationConfig => ({
    title: staffReg ? 'Worker / Staff Registration Verification' : 'Bulk Worker Registration Verification',
    successLabel: 'Worker batch',
    noun: 'batch',
    icon: staffReg ? UserPlus : Users,
    searchPlaceholder: 'Search batch ref, created by…',
    queue: { route: 'HR/GetVerifyBulkWorker', params: ({ roleId }) => ({ RoleID: roleId }) },
    itemKey: (r) => `${r.TransactionRefNo}|${r.Id ?? 0}`,
    card: {
        title: (r) => r.TransactionRefNo || 'Unknown Batch',
        subtitle: (r) => `By ${r.CreatedBy || r.Createdby || '—'}`,
        meta: (r) => r.Status || 'Pending',
        amount: (r) => `${r.WorkerCount || 0} workers`,
    },
    searchText: (r) => `${r.TransactionRefNo} ${r.CreatedBy || r.Createdby}`,
    rowAux: [{ name: 'batch', route: 'HR/GetBulkWorkerDatabyId', params: (r) => ({ TransRefno: r.TransactionRefNo, Id: r.Id || 0 }) }],
    // Worker/Staff Reg reads the MOID off the batch detail; Bulk Worker off the queue row
    moid: (r) => r.MOID,
    remarksKey: staffReg ? (r) => String(r.TransactionRefNo || '') : undefined,
    showReturn: 'No',
    excludeActions: () => ['return'],
    confirmLabel: 'I have verified all worker registration details in this batch.',
    header: {
        title: (r) => r.TransactionRefNo,
        subtitle: () => 'Bulk worker registration batch',
        chips: (r) => [`${r.WorkerCount || 0} workers`, r.Status || 'Pending', `By ${r.CreatedBy || r.Createdby || '—'}`],
    },
    sections: (r) => [{ fields: [['Transaction Ref No', r.TransactionRefNo], ['Batch ID', r.Id], ['Created By', r.CreatedBy || r.Createdby], ['Status', r.Status || 'Pending']] }],
    extra: (r, d, { aux }) => {
        const workers = workersOf(aux.batch);
        return (
            <>
                {staffReg && workers.length ? (
                    <TableBlock
                        title="Worker summary"
                        heads={['', 'Count']}
                        rows={[
                            ['Total workers', workers.length], ['With ESI no', workers.filter((w) => w.ESINumber).length],
                            ['With UAN', workers.filter((w) => w.UANNumber).length], ['With bank account', workers.filter((w) => w.BankAccountNo).length],
                            ['With Aadhar', workers.filter((w) => w.AadharNo).length],
                        ]}
                    />
                ) : null}
                <TableBlock
                    title={`Workers (${workers.length})`}
                    heads={['Name', ...WORKER_COLUMNS.slice(2).map(([, l]) => l)]}
                    empty="No worker data available for this batch"
                    rows={workers.map((w) => [`${w.FirstName ?? ''} ${w.LastName ?? ''}`.trim(), ...WORKER_COLUMNS.slice(2).map(([k]) => w[k])])}
                />
            </>
        );
    },
    approve: {
        route: 'HR/ApproveBulkWorker',
        payload: (r, d, { value, note, user, roleId, aux }) => {
            const workers = workersOf(aux.batch);
            const b = batchOf(aux);
            return {
                SheetData: '', lstWorker: workers.map(workerPayload), Createdby: user, RoleId: parseInt(roleId, 10) || 0,
                MOID: parseInt(r.MOID || b.MOID, 10) || 0, Action: value, TransactionRefNo: String(r.TransactionRefNo || b.TransactionRefNo || ''),
                Id: parseInt(r.Id || b.Id, 10) || 0, WorkerCount: workers.length, Note: note,
            };
        },
        ok: ANY,
    },
});

export const HR_LABOUR_CONFIGS: Record<string, VerificationConfig> = {
    BulkWorker: workerBatch(false),
    WorkerStaffReg: workerBatch(true),

    LabourBankChange: {
        title: 'Labour Bank Change Verification',
        successLabel: 'Bank change',
        noun: 'bank change',
        icon: CreditCard,
        searchPlaceholder: 'Search labour, ID, transaction ref…',
        queue: { route: 'HR/GetVerifyLBBankChange', params: ({ roleId }) => ({ RoleID: roleId }) },
        itemKey: (r) => `${r.LabourId}|${r.Id || r.BankChangeId || r.RequestId}`,
        card: {
            title: (r) => r.LabourName || r.EmpName,
            subtitle: (r) => [r.LabourId, r.TransactionRefNo || r.TransactionRefno].filter(Boolean).join(' · '),
            meta: (r) => [r.LabourType, r.RequestDate].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.LabourName} ${r.LabourId} ${r.TransactionRefNo || r.TransactionRefno}`,
        detail: { route: 'HR/GetLBBankChangebyId', params: (r) => ({ LabourId: r.LabourId, Id: r.Id || r.BankChangeId || r.RequestId }) },
        moid: (r, d) => d.MOID || 680,
        remarksKey: (r, d) => d.Id || d.TransactionRefno || '',
        showReturn: 'Yes',
        confirmLabel: 'I have verified the bank change details.',
        header: {
            title: (r, d) => d.LabourName || r.LabourName || r.EmpName,
            subtitle: (r, d) => [d.LabourId || r.LabourId, d.TransactionRefNo || r.TransactionRefNo || r.TransactionRefno].filter(Boolean).join(' · '),
            chips: (r, d) => [d.LabourType || r.LabourType, d.ContractorName || r.ContractorName, d.RequestDate || r.RequestDate],
        },
        sections: (r, d) => [
            {
                title: 'Current / old bank',
                fields: [
                    ['Bank', d.OldBankName], ['Account No', d.OldAccountNo || d.OldBankAccountNo], ['IFSC', d.OldIFSC || d.OldIFSCcode],
                    ['Address', d.OldBankAddress || d.OldAddress, true], ['Applicable From', d.OldApplicableFrom],
                ],
            },
            {
                title: 'Requested change',
                fields: [
                    ['Bank', d.NewBankName || d.BankName], ['Account No', d.NewAccountNo || d.NewBankAccountNo || d.BankAccountNo],
                    ['IFSC', d.NewIFSC || d.NewIFSCcode || d.IFSCcode], ['Address', d.NewBankAddress || d.NewAddress || d.BankAddress, true],
                    ['Applicable From', d.NewApplicableFrom || d.BankApplicableFrom],
                ],
            },
        ],
        approve: {
            route: 'HR/ApproveLBBankChange',
            payload: (r, d, { value, note, user, roleCode, roleId }) => ({
                Id: d.Id || r.Id || r.BankChangeId || 0,
                LabourId: d.LabourId || r.LabourId || '',
                TransactionRefNo: d.TransactionRefNo || d.TransactionRefno || r.TransactionRefNo || r.TransactionRefno || '',
                NewBankId: d.NewBankId || d.NewBankid || d.Bankid || d.BankId || 0,
                NewBank: d.NewBank || d.NewBankName || d.BankName || '',
                NewAccountNo: d.NewAccountNo || d.NewBankAccountNo || d.BankAccountNo || '',
                NewIFSC: d.NewIFSC || d.NewIFSCcode || d.IFSCcode || '',
                NewAddress: d.NewAddress || d.NewBankAddress || d.BankAddress || '',
                OldBankid: d.OldBankId || d.OldBankid || 0,
                BankApplicableFrom: d.BankApplicableFrom || d.NewApplicableFrom || d.ApplicableFrom || '',
                RoleId: roleId, Createdby: user, Action: value, ApprovalNote: note,
                Remarks: appendApprovalComment(d.Remarks, roleCode || 'Bank Change Verifier', user, note),
            }),
            ok: ANY,
        },
    },

    // Fixed MOID 696; the decision posts Approve or Reject only (a "Verify" maps to Approve, as on the web)
    LabourTypeChange: {
        title: 'Labour Type Change Verification',
        successLabel: 'Labour type change',
        noun: 'request',
        icon: ArrowLeftRight,
        searchPlaceholder: 'Search labour, ID, requested by, type…',
        queue: { route: 'LabourTypeChange/GetInbox', params: ({ roleId }) => ({ roleId }) },
        itemKey: (r) => r.RequestId,
        card: {
            title: (r) => r.LabourName,
            subtitle: (r) => `${r.LabourId} · ${r.CurrentType} → ${r.NewType}`,
            meta: (r) => [r.WithEffectFrom && `w.e.f. ${r.WithEffectFrom}`, r.NewContractorName].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.LabourName} ${r.LabourId} ${r.RequestedBy} ${r.CurrentType} ${r.NewType}`,
        detail: { route: 'LabourTypeChange/GetById', params: (r) => ({ requestId: r.RequestId }) },
        rowAux: [{ name: 'history', route: 'LabourTypeChange/GetWorkHistory', params: (r) => ({ labourId: r.LabourId }) }],
        moid: () => 696,
        remarksKey: (r, d) => d.NotifRefNo || r.NotifRefNo || r.TransactionRefNo || String(r.RequestId || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have reviewed this labour type change request.',
        header: {
            title: (r, d) => d.LabourName || r.LabourName,
            subtitle: (r, d) => [d.LabourId || r.LabourId, (d.NotifRefNo || r.NotifRefNo) && `Ref ${d.NotifRefNo || r.NotifRefNo}`].filter(Boolean).join(' · '),
            chips: (r, d) => [d.Status || r.Status || 'Pending', d.RequestedBy || r.RequestedBy, d.RequestedOn || r.RequestedOn],
        },
        sections: (r, d) => {
            const cur = d.CurrentType || r.CurrentType;
            const next = d.NewType || r.NewType;
            return [
                { title: 'Before change', fields: [['Type', cur], ['Contractor', cur === 'Own Labour' ? '— No contractor —' : d.CurrentContractorName || r.CurrentContractorName]] },
                {
                    title: 'Requested change',
                    fields: [
                        ['Type', next], ['Contractor', next === 'Own Labour' ? '— No contractor —' : d.NewContractorName || r.NewContractorName],
                        ['With Effect From', d.WithEffectFrom || r.WithEffectFrom],
                    ],
                },
            ];
        },
        extra: (r, d, { aux }) => (
            <TableBlock
                title="Work history"
                heads={['Labour Type', 'Contractor', 'From', 'To']}
                empty="No work history found."
                rows={list(aux.history).map((h) => [h.LabourType, h.ContractorName, h.FromDate, h.ToDate === 'Present' ? 'Present (active)' : h.ToDate])}
            />
        ),
        approve: {
            route: 'LabourTypeChange/Verify',
            method: 'post',
            payload: (r, d, { value, note, user, roleId }) => ({
                RequestId: r.RequestId, Action: String(value).toLowerCase().includes('reject') ? 'Reject' : 'Approve', Note: note, RoleId: roleId, ReviewedBy: user,
            }),
            ok: ANY,
        },
    },

    LabourExit: {
        title: 'Labour Exit Verification',
        successLabel: 'Labour exit',
        noun: 'exit',
        icon: LogOut,
        searchPlaceholder: 'Search labour, ID, ref…',
        queue: { route: 'HR/GetVerifyLBExit', params: ({ roleId }) => ({ RoleID: roleId }) },
        itemKey: (r) => r.Id,
        card: {
            title: (r) => r.LabourName || r.EmployeeName || 'Unknown',
            subtitle: (r) => [r.LabourId, `Ref ${r.Id}`, r.LabourType].filter(Boolean).join(' · '),
            meta: (r) => [r.CCName, r.ContractorName?.trim(), r.ResignationDate && `Resignation ${r.ResignationDate}`].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.LabourName} ${r.LabourId} ${r.Id}`,
        detail: { route: 'HR/GetLBExitbyId', params: (r, { roleId }) => ({ LabourId: r.LabourId, Id: r.Id, RoleId: roleId }) },
        moid: (r, d) => Number(d.MOID) || null,
        remarksKey: (r, d) => String(d.Id || r.Id || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the labour exit details, dates and supporting documents.',
        header: {
            title: (r, d) => d.LabourName || d.EmployeeName || r.LabourName || 'Labour',
            subtitle: (r, d) => `${d.LabourId || r.LabourId} · Ref ${d.Id || r.Id}`,
            chips: (r, d) => ['Labour Exit', d.LabourType, d.Category, d.ContractorName?.trim(), d.Status && `Status: ${d.Status}`],
        },
        sections: (r, d) => [
            {
                fields: [
                    ['Labour ID', d.LabourId], ['Designation', d.DesignationName], ['Labour Type', d.LabourType], ['Category', d.Category],
                    ['Contractor', d.ContractorName?.trim()], ['Cost Center', d.CostCenter || d.CCCode], ['Cost Center Name', d.CCName],
                ],
            },
            {
                title: 'Exit details',
                fields: [
                    ['Resignation Date', d.ResignationDate || r.ResignationDate], ['Relieving Date', d.RelievingDate || r.RelievingDate],
                    d.NoticePereiodDays != null && ['Notice Period', `${d.NoticePereiodDays} ${d.NoticePereiodDays === 1 ? 'day' : 'days'}`],
                    (d.DocType || d.DocName) && ['Document', [d.DocName, d.DocType].filter(Boolean).join(' · '), true],
                    d.Remarks?.trim() && ['Remarks', d.Remarks, true], d.ReturnNotes?.trim() && ['Return Notes', d.ReturnNotes, true],
                    d.ErrorStatus?.trim() && ['Error Status', d.ErrorStatus, true],
                ],
            },
        ],
        approve: {
            route: 'HR/ApproveLBExit',
            payload: (r, d, { value, note, user, roleId }) => ({
                Id: parseInt(d.Id || r.Id, 10) || 0, CostCenter: String(d.CostCenter || d.CCCode || ''), LabourId: String(d.LabourId || r.LabourId || ''),
                GroupId: parseInt(d.GroupId || r.GroupId, 10) || 0, ResignationDate: String(d.ResignationDate || r.ResignationDate || ''),
                RelievingDate: String(d.RelievingDate || r.RelievingDate || ''), RoleId: parseInt(roleId, 10) || 0, Createdby: user, Action: value, Note: note,
            }),
            ok: (s) => String(s || '').toLowerCase() === 'submited',
        },
    },

    // The web falls back to MOID 670 when the record carries none
    LabourObjectivesGoals: {
        title: 'Labour Objectives & Goals Verification',
        successLabel: 'Objectives & goals',
        noun: 'appraisal',
        icon: Award,
        searchPlaceholder: 'Search name, ID, cost center…',
        queue: { route: 'HR/GetVerifyLBObjectGoals', params: ({ roleId }) => ({ RoleId: roleId }) },
        itemKey: (r) => `${r.Id}|${r.LabourId}`,
        card: {
            title: (r) => r.Name,
            subtitle: (r) => `ID ${r.Id} · ${r.LabourId}`,
            meta: (r) => [r.JoiningCCName, r.EffectiveDate, r.GroupName, r.ContractorName].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.Id} ${r.Name} ${r.LabourId} ${r.JoiningCCName}`,
        detail: { route: 'HR/GetLBAppraisalbyId', params: (r) => ({ Id: r.Id, LabourId: r.LabourId }) },
        moid: (r, d) => d.MOID || 670,
        remarksKey: (r, d) => String(d.Id ?? r.Id ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all appraisal and objectives details.',
        header: {
            title: (r, d) => d.Name || r.Name,
            subtitle: (r, d) => `${d.LabourId || r.LabourId} · ID ${d.Id || r.Id}`,
            chips: (r, d) => ['Labour Appraisal', (d.GroupName || r.GroupName) && `Group ${d.GroupName || r.GroupName}`, d.JoiningType, d.NewDesignation && `New: ${d.NewDesignation}`],
        },
        sections: (r, d) => [{
            fields: [
                ['Employee Reference', d.EmpRefNo], ['Designated As', d.DesignatedAs], ['Department', d.Department], ['Joining Type', d.JoiningType],
                ['Joining Date', d.JoiningDate], ['Group', d.GroupName], ['Cost Center', d.JoiningCostCenter || r.JoiningCCName],
                ['Last Appraisal', d.LastAppraisalDate], ['Effective Date', d.EffectiveDate], ['Labour Type', d.LabourType], ['New Designation', d.NewDesignation],
                ['Year', d.Year], ['Month', d.Month], ['Contractor Code', d.ContractorCode], ['Contractor Name', d.ContractorName],
            ],
        }],
        approve: {
            route: 'HR/ApproveLBObjects',
            payload: (r, d, { action, note, user, roleCode, roleId }) => ({
                LabourId: String(d.LabourId || r.LabourId || '').trim(), Id: parseInt(d.Id || r.Id, 10),
                Remarks: appendApprovalComment(d.Remarks, roleCode || 'Appraisal Verifier', user, note),
                Year: d.Year ? parseInt(d.Year, 10) : 0, Month: d.Month ? parseInt(d.Month, 10) : 0,
                CCCode: d.JoiningCostCenter || d.CostCenter || r.JoiningCostCenter || '', RoleId: parseInt(roleId, 10), Createdby: user, Action: action, Note: note,
            }),
            ok: ANY,
        },
    },

    // Detail = { Header, CategoryBreakdown, Workers | Details }; the web falls back to MOID 648
    LabourPayroll: {
        title: 'Labour Payroll Verification',
        successLabel: 'Payroll',
        noun: 'payroll',
        icon: HardHat,
        searchPlaceholder: 'Search cost center, ref, workers…',
        queue: { route: 'LabourPayroll/GetInbox', params: ({ roleId }) => ({ roleId }) },
        itemKey: (r) => r.PayrollId,
        card: {
            title: (r) => r.CCName || 'Cost Center',
            subtitle: (r) => r.TransactionRefNo,
            meta: (r) => [r.MonthYear || `${MONTHS[(r.PayrollMonth || 1) - 1]} ${r.PayrollYear}`, `${r.TotalWorkers} workers`].join(' · '),
            amount: (r) => money(r.TotalGrossAmount),
        },
        searchText: (r) => `${r.CCName} ${r.TransactionRefNo} ${r.TotalWorkers}`,
        detail: { route: 'LabourPayroll/GetDetailForVerification', params: (r) => ({ payrollId: r.PayrollId }) },
        moid: (r, d) => (d.Header || {}).MOID || d.MOID || 648,
        remarksKey: (r, d) => (d.Header || {}).NotifRefno || r.NotifRefno || '',
        showReturn: 'Yes',
        confirmLabel: 'I have reviewed the payroll and confirm its accuracy.',
        header: {
            title: (r, d) => (d.Header || {}).CCName || r.CCName,
            subtitle: (r, d) => money((d.Header || {}).TotalNetPayable),
            chips: (r, d) => {
                const h = d.Header || {};
                return [h.TransactionRefNo, h.ConslidateTransNo, `${MONTHS[(h.PayrollMonth || 1) - 1]} ${h.PayrollYear}`, `${h.TotalWorkers} workers`, h.WorkingDays && `${h.WorkingDays} working days`];
            },
        },
        sections: (r, d) => {
            const h = d.Header || {};
            const ded = ['TotalPFEmployee', 'TotalESIEmployee', 'TotalPTAmount', 'TotalLWFEmployee', 'TotalAdvance'].reduce((a, k) => a + (Number(h[k]) || 0), 0);
            return [{
                fields: [
                    ['Gross Payable', money(h.TotalGrossAmount)], ['Basic Payable', money(h.TotalBasicPayable)], ['Total Deductions', money(ded)],
                    ['Net Payable', money(h.TotalNetPayable)], ['Generated By', h.GeneratedBy],
                    h.PFEmpPct != null && ['PF (Emp / Empr)', `${h.PFEmpPct}% / ${h.PFEmprPct ?? '—'}%`],
                    h.ESIEmpPct != null && ['ESI (Emp / Empr)', `${h.ESIEmpPct}% / ${h.ESIEmprPct ?? '—'}%`],
                ],
            }];
        },
        extra: (r, d) => {
            const h = d.Header || {};
            const cats = list(d.CategoryBreakdown);
            const workers = list(d.Workers || d.Details);
            const pt = !!h.PTApply;
            const lwf = !!h.LWFApply;
            const deductionCells = (x: Rec) => [fmt(x.PFEmployee), fmt(x.ESIEmployee), ...(pt ? [fmt(x.PTAmount)] : []), ...(lwf ? [fmt(x.LWFEmployee)] : []), fmt(x.Advance)];
            const deductionHeads = ['PF (Emp)', 'ESI (Emp)', ...(pt ? ['PT (Emp)'] : []), ...(lwf ? ['LWF (Emp)'] : []), 'Advance'];
            return (
                <>
                    {cats.length ? (
                        <TableBlock
                            title="Category-wise breakdown"
                            heads={['Category', 'Workers', 'Basic', 'Allowance', ...deductionHeads, 'Net Pay']}
                            rows={cats.map((c) => [c.Category, c.WorkerCount, fmt(c.BasicPayable), fmt(c.AllowancePayable), ...deductionCells(c), fmt(c.NetPayable)])}
                        />
                    ) : null}
                    {workers.length ? (
                        <TableBlock
                            title={`Workers (${workers.length})`}
                            heads={['Name', 'Labour ID', 'Contractor', 'Category', 'Days', 'Basic', 'Allowance', ...deductionHeads, 'Net Pay']}
                            rows={workers.map((w) => [
                                w.LabourName, w.LabourId, !w.LabourType || w.LabourType === 'Own Labour' ? 'Own Labour' : w.ContractorName || 'Unknown',
                                w.Category, w.DaysWorked, fmt(w.BasicPayable), fmt(w.AllowancePayable), ...deductionCells(w), fmt(w.NetPayable),
                            ])}
                        />
                    ) : null}
                </>
            );
        },
        approve: {
            route: 'LabourPayroll/Approve',
            method: 'post',
            payload: (r, d, { value, note, user, roleId }) => {
                const h = d.Header || {};
                return {
                    PayrollId: h.PayrollId || r.PayrollId, TransactionRefNo: h.TransactionRefNo || r.TransactionRefNo || '',
                    ConslidateTransNo: h.ConslidateTransNo || 0, Note: note, Action: value, RoleId: roleId, CreatedBy: user,
                };
            },
            ok: (s, r, d, body) => body?.IsSuccessful !== false,
        },
    },

    // Detail = { Header, Details }; fixed MOID 658. On Approve the web downloads the bank-transfer Excel.
    LabourCMSPay: {
        title: 'Labour CMS Pay Verification',
        successLabel: 'Labour CMS payment',
        noun: 'CMS payment',
        icon: Building2,
        searchPlaceholder: 'Search CMS no, contractor, cost center…',
        queue: { route: 'LabourCMS/GetInbox', params: ({ roleId }) => ({ roleId }) },
        itemKey: (r) => r.CMSTransactionNo || r.TransactionNo,
        card: {
            title: (r) => r.CMSTransactionNo || r.TransactionNo,
            subtitle: (r) => [r.ContractorCode, r.CCCode].filter(Boolean).join(' · ') || '—',
            meta: (r) => `${r.Month || r.PayrollMonth || ''} ${r.Year || r.PayrollYear || ''}`.trim(),
            amount: (r) => money(r.TotalAmount || r.Total || 0),
        },
        searchText: (r) => `${r.CMSTransactionNo} ${r.ContractorCode} ${r.CCCode}`,
        detail: { route: 'LabourCMS/GetDetail', params: (r) => ({ cmsTransactionNo: r.CMSTransactionNo || r.TransactionNo }) },
        moid: () => 658,
        chkAmt: (r, d) => (d.Header || {}).TotalNetPaid || (d.Header || {}).TotalAmount || (d.Header || {}).Total,
        remarksKey: (r, d) => String((d.Header || {}).NotiRefNo || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all Labour CMS payment details and worker information.',
        header: {
            title: () => 'Labour CMS Payment',
            subtitle: (r, d) => money((d.Header || {}).TotalNetPaid || (d.Header || {}).TotalAmount || r.TotalAmount || r.Total),
            chips: (r, d) => {
                const h = d.Header || {};
                return [h.CMSTransactionNo || r.CMSTransactionNo, `${h.Month || r.Month || r.PayrollMonth || ''} ${h.Year || r.Year || r.PayrollYear || ''}`.trim(), h.ContractorCode, h.CCCode];
            },
        },
        sections: (r, d) => {
            const h = d.Header || {};
            return [{ fields: [['PO Number', h.PONo], ['Labour Type', h.LabourType], ['CC Code', h.CCCode], ['Workers', h.WorkerCount || list(d.Details).length]] }];
        },
        extra: (r, d) => {
            const workers = list(d.Details);
            const basic = (w: Rec) => parseFloat(w.BasicAmount || w.BasicPayNow || w.BasicBalance || 0);
            const allow = (w: Rec) => parseFloat(w.AllowanceAmount || w.AllowancePayNow || w.AllowanceBalance || 0);
            const net = (w: Rec) => parseFloat(w.NetAmount || w.Amount || 0) || basic(w) + allow(w);
            return (
                <TableBlock
                    title={`Worker payments (${workers.length})`}
                    heads={['Name', 'Labour ID', 'Bank', 'Account No', 'IFSC', 'Basic', 'Allowance', 'Net']}
                    rows={workers.map((w) => [
                        w.LabourName || w.WorkerName || w.Name, w.LabourId || w.WorkerCode || w.EmpRefNo, w.BankName, w.BankAccountNo || w.AccountNo,
                        w.IFSCCode || w.IFSC, fmt(basic(w)), fmt(allow(w)), fmt(net(w)),
                    ])}
                    foot={workers.length ? [`Total net ${fmt(workers.reduce((a, w) => a + net(w), 0))}`] : undefined}
                />
            );
        },
        approve: {
            route: 'LabourCMS/Approve',
            method: 'post',
            payload: (r, d, { value, note, user, roleId }) => ({
                CMSTransactionNo: (d.Header || {}).CMSTransactionNo || r.CMSTransactionNo || '', RoleId: roleId, Action: value, Note: note, CreatedBy: user,
            }),
            ok: ANY,
            afterOk: async (s, r, d, { action }) => (String(action).toLowerCase() === 'approve'
                ? 'Download the bank-transfer Excel for this CMS payment from the Corex web — the phone app cannot create it.'
                : undefined),
        },
    },

    // The web falls back to MOID 642; daily-wage labour shows daily instead of monthly amounts
    LabourCTC: {
        title: 'Labour CTC Verification',
        successLabel: 'CTC',
        noun: 'CTC',
        icon: HardHat,
        searchPlaceholder: 'Search transaction, labour, labour type…',
        queue: { route: 'HR/GetVerifyNewLabourCTC', params: ({ roleId }) => ({ RoleId: String(roleId).trim() }) },
        itemKey: (r) => r.TransactionRefno,
        card: {
            title: (r) => r.EmpName, subtitle: (r) => r.LabourId,
            meta: (r) => [r.TransactionRefno, `${r.MonthName || ''} ${r.Year || ''}`.trim(), r.LabourType, r.DailyWageSalary === 'Yes' ? 'Daily' : 'Monthly'].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.TransactionRefno} ${r.EmpName} ${r.LabourId} ${r.LabourType}`,
        detail: { route: 'HR/GetNewLabourCTCbyRefno', params: (r) => ({ TransactionRefno: String(r.TransactionRefno).trim() }) },
        moid: (r, d) => d.MOID || 642,
        remarksKey: (r, d) => d.TransactionRefno || r.TransactionRefno || '',
        showReturn: 'Yes',
        excludeActions: () => ['send back'],
        confirmLabel: 'I have verified all CTC components and calculations.',
        header: {
            title: (r, d) => d.EmpName || r.EmpName,
            subtitle: (r, d) => `${d.LabourId || r.LabourId} · ${d.TransactionRefno || r.TransactionRefno}`,
            chips: (r, d) => [`${d.MonthName || r.MonthName || ''} ${d.Year || r.Year || ''}`.trim(), d.LabourType || r.LabourType, d.GroupName && `Group ${d.GroupName}`, d.DailyWageSalary === 'Yes' && 'Daily Wage'],
        },
        sections: (r, d) => [{
            fields: [
                ['Annual CTC', money(annualCTC(d))], ['Location', d.State || 'N/A'], ['Labour Type', d.LabourType],
                ['Joining On', `${d.MonthName || ''}-${d.Year || ''}`],
                ['Salary Format', `${d.DailyWageSalary === 'Yes' ? 'Daily Wage' : 'Monthly'}${d.GroupName ? ` - Group ${d.GroupName}` : ''}`],
                Number(d.Earningcount) > 0 && ['Components', `${d.Earningcount} Earnings, ${d.Deductioncount} Deductions`],
                d.EmpRuleStatus?.ESIExist && ['ESI', `${d.EmpRuleStatus.ESIExist} (${d.EmpRuleStatus.ESIPercent}%)`],
                d.EmpRuleStatus?.GratuityRuleExist && ['Gratuity', d.EmpRuleStatus.GratuityRuleExist],
                d.EmpRuleStatus?.PaidLeaveExist && ['Paid Leave', d.EmpRuleStatus.PaidLeaveExist],
                d.ContractorName && String(d.ContractorName).trim() && ['Contractor', d.ContractorName],
            ],
        }],
        extra: (r, d) => <CTCBreakdown d={d} daily={d.DailyWageSalary === 'Yes'} />,
        approve: {
            route: 'HR/ApproveNewLabourCTC',
            payload: (r, d, { action, note, user, roleId }) => ({
                LabourId: String(d.LabourId || r.LabourId || '').trim(), Month: parseInt(d.Month || r.Month, 10) || 0, Year: parseInt(d.Year || r.Year, 10) || 0,
                TransactionRefno: String(d.TransactionRefno || r.TransactionRefno || '').trim(), HeadsJsonString: String(d.HeadsJsonString || '').trim(),
                Roleid: parseInt(roleId, 10), CreatedBy: user, Action: action, Note: note,
            }),
            ok: ANY,
        },
    },

    // The web falls back to MOID 672 (same module as staff pay revision); any returned status is success
    LabourPayRevision: {
        title: 'Labour Pay Revision Verification',
        successLabel: 'Pay revision',
        noun: 'pay revision',
        icon: HardHat,
        searchPlaceholder: 'Search transaction, labour, labour type…',
        queue: { route: 'HR/GetVerifyLBPayRevision', params: ({ roleId }) => ({ RoleId: String(roleId).trim() }) },
        itemKey: (r) => r.TransactionRefno,
        card: { title: (r) => r.EmpName, subtitle: (r) => r.LabourId, meta: (r) => [r.TransactionRefno, `${r.MonthName || ''} ${r.Year || ''}`.trim(), r.LabourType].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.TransactionRefno} ${r.EmpName} ${r.LabourId} ${r.LabourType}`,
        detail: { route: 'HR/GetLBPayRevisionbyRefno', params: (r) => ({ TransactionRefno: String(r.TransactionRefno).trim() }) },
        moid: (r, d) => d.MOID || 672,
        remarksKey: (r, d) => d.TransactionRefNo || r.TransactionRefno || '',
        showReturn: 'Yes',
        excludeActions: () => ['send back'],
        confirmLabel: 'I have verified all pay revision details and calculations.',
        header: {
            title: (r, d) => d.EmployeeName || r.EmpName,
            subtitle: (r, d) => `${d.LabourId || r.LabourId} · ${d.TransactionRefNo || r.TransactionRefno}`,
            chips: (r, d) => [`${d.MonthName || r.MonthName || ''} ${d.Year || r.Year || ''}`.trim(), d.LabourType || r.LabourType, d.RevisionNo && `Revision ${d.RevisionNo}`, d.AppraisalDate],
        },
        sections: (r, d) => {
            const ctc = list(d.PayRevisionHeadData?.lstAllHeads).find((h) => h.HeadType === 'CTCTOTAL');
            return [{
                fields: [
                    ctc && ['Revised CTC (Annual)', `${money(ctc.YearlyAmount || 0)}${Number(ctc.YearlyDiff) ? ` (+${fmt(ctc.YearlyDiff)})` : ''}`],
                    ['Location', d.State || 'N/A'], ['Labour Type', d.LabourType], ['Revision Date', d.AppraisalDate],
                    ['Revision No', `Rev ${d.RevisionNo ?? ''}${Number(d.PreviousRevisionNo) > 0 ? ` (Prev: ${d.PreviousRevisionNo})` : ''}`],
                    ['Previous Group', d.GroupName || 'N/A'], ['New Group', d.NewGroupName || 'N/A'],
                    d.ContractorName && String(d.ContractorName).trim() && ['Contractor', d.ContractorName],
                ],
            }];
        },
        extra: (r, d) => <PayRevisionBreakdown d={d} />,
        approve: {
            route: 'HR/ApproveLBPayRevision',
            payload: (r, d, { action, note, user, roleId }) => ({
                LabourId: String(d.LabourId || r.LabourId || '').trim(), Month: parseInt(d.Month || r.Month, 10) || 0, Year: parseInt(d.Year || r.Year, 10) || 0,
                TransactionRefNo: String(d.TransactionRefNo || r.TransactionRefno || '').trim(), RevisionNo: parseInt(d.RevisionNo, 10) || 0,
                HeadsJsonString: String(d.HeadsJsonString || '').trim(), Roleid: parseInt(roleId, 10), CreatedBy: user, Action: action, Note: note,
            }),
            ok: ANY,
        },
    },
};
