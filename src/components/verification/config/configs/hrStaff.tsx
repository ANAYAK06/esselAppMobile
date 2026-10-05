// HR — staff pages expressed as configs (same routes / payloads as each web page + slice / API):
//   EmpBankChange     pages/HR/VerifyEmpBankChange.jsx      (HRSlice/empBankChangeSlice)
//   HRAdvancePayment  pages/HR/VerifyHRAdvancePayment.jsx   (HRSlice/hrAdvancePayVerifySlice)
//   EmployeeTransfer  pages/HR/VerifyEmployeeTransfer.jsx   (HRSlice/employeeTransferSlice, api/HRAPI/staffTransferAPI)
//   StaffFullFinal    pages/HR/VerifyStaffFullFinal.jsx     (HRSlice/staffFullFinalSlice, api/HRAPI/staffFullFinalAPI)
//   EmployeeExit      pages/HR/VerifyEmployeeExit.jsx       (HRSlice/employeeExitSlice, api/HRAPI/staffExitAPI)
//   StaffAdvance      pages/HR/VerifyStaffAdvance.jsx       (HRSlice/staffAdvanceSlice — LTA / salary advance requests)
//   LeaveRequest      pages/HR/VerifyEmployeeLeaveRequest.jsx (HRSlice/employeeLeaveSlice, api/HRAPI/employeeLeaveAPI)
//   StaffAppraisal    pages/HR/VerifyStaffAppraisal.jsx     (HRSlice/staffAppraisalSlice — same queue / approve routes as below)
//   StaffObjectivesGoals pages/HR/VerifyStaffObjectivesGoals.jsx (HRSlice/staffObjectivesandGoalsSlice)
//   StaffPayroll      pages/HR/VerifyStaffPayroll.jsx       (HRSlice/staffPayrollVerificationSlice, api/HRAPI/staffPayrollVerificationAPI)
//   StaffCMSPay       pages/HR/VerifyStaffCMSPay.jsx        (HRSlice/staffCMSPayVerificationSlice, api/HRAPI/staffCMSPayVerificationAPI)
//   StaffAttendance   pages/HR/VerifyStaffDailyAttendance.jsx (HRSlice/staffDailyAttendanceSlice, api/HRAPI/staffDailyAttendanceAPI)
//   ExcelAttendance   pages/HR/VerifyExcelAttendance.jsx    (HRSlice/monthlyAttendanceSlice, api/HRAPI/monthlyAttendanceAPI)
//   EmployeeCTC       pages/HR/VerifyEmployeeCTC.jsx        (HRSlice/employeeCTCSlice, api/HRAPI/employeeCTCAPI)
//   SalaryDeductionArear pages/HR/VerifySalaryDeductionArear.jsx (HRSlice/salaryDeductionArearVerificationSlice, api/HRAPI/SalaryDeductionandArearVerification)
//   StaffPayRevision  pages/HR/VerifyStaffPayRevision.jsx   (HRSlice/staffPayRevisionSlice, api/HRAPI/staffPayRevisionAPI)
//   StaffRegistration pages/HR/VerifyStaffRegistration.jsx  (HRSlice/staffRegistrationVerifySlice, api/HRAPI/StaffRegistrationVerificationAPI)
import React from 'react';
import { Text } from 'react-native';
import { ArrowRightLeft, Award, BadgeIndianRupee, Building2, CalendarCheck, CalendarDays, CreditCard, FileSpreadsheet, HandCoins, LogOut, ReceiptIndianRupee, Target, TrendingUp, UserPlus, Wallet } from 'lucide-react-native';
import { AttendanceEditor, CTCBreakdown, PayRevisionBreakdown, PayrollEmployees, annualCTC, attendanceOf, staffName, staffRegistrationPayload } from './hrParts';
import { appendApprovalComment } from '@/src/api/verification/verificationCommonAPI';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { TableBlock, fmt } from '../parts';
import type { Rec, SectionSpec, VerificationConfig } from '../types';
import { ANY, codeName, list } from './shared';

const num = (v: unknown) => parseFloat(String(v ?? '')) || 0;
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (m: unknown) => MONTH_NAMES[parseInt(String(m), 10)] || String(m ?? '—');

export const HR_STAFF_CONFIGS: Record<string, VerificationConfig> = {
    EmpBankChange: {
        title: 'Employee Bank Change Verification',
        successLabel: 'Bank change',
        noun: 'bank change',
        icon: CreditCard,
        searchPlaceholder: 'Search name, employee no, cost center…',
        queue: { route: 'HR/GetVerifyEmpBankChange', params: ({ roleId }) => ({ RoleID: roleId }) },
        itemKey: (r) => `${r.EmpRefNo}|${r.Id}`,
        card: { title: (r) => r.Name, subtitle: (r) => r.EmpRefNo, meta: (r) => [r.DesignationName, r.CCName].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.Name} ${r.EmpRefNo} ${r.CCName}`,
        detail: { route: 'HR/GetEmpBankChangebyId', params: (r) => ({ EmpRefNo: r.EmpRefNo, Id: r.Id }) },
        moid: (r, d) => d.MOID || 0,
        remarksKey: (r, d) => d.Id || r.Id || '',
        showReturn: 'Yes',
        confirmLabel: 'I have verified the bank change details.',
        header: {
            title: (r, d) => d.Name || r.Name,
            subtitle: (r, d) => d.EmpRefNo || r.EmpRefNo,
            chips: (r, d) => [d.DesignationName || r.DesignationName, d.CCName || r.CCName, d.BankApplicableFrom && `From ${d.BankApplicableFrom}`],
        },
        sections: (r, d) => [
            { title: 'Current / old bank', fields: [['Bank', d.Bank], ['Account No', d.AccountNo], ['IFSC', d.IFSC], ['Address', d.Address, true]] },
            {
                title: 'Requested change',
                fields: [['Bank', d.NewBank], ['Account No', d.NewAccountNo], ['IFSC', d.NewIFSC], ['Address', d.NewAddress, true], ['Applicable From', d.BankApplicableFrom]],
            },
        ],
        approve: {
            route: 'HR/ApproveEmpBankChange',
            payload: (r, d, { value, note, user, roleId }) => ({
                Id: d.Id || r.Id || 0, EmpRefNo: d.EmpRefNo || r.EmpRefNo || '', NewBankId: d.NewBankId || 0, NewBank: d.NewBank || '',
                NewAccountNo: d.NewAccountNo || '', NewIFSC: d.NewIFSC || '', NewAddress: d.NewAddress || '', OldBankid: d.BankId || 0,
                BankApplicableFrom: d.BankApplicableFrom || '', RoleId: roleId, Createdby: user, Action: value, ApprovalNote: note,
            }),
            ok: ANY,
        },
    },

    // Fixed MOID 364; posts Approve or Reject only (a "Verify" maps to Approve, as on the web)
    HRAdvancePayment: {
        title: 'HR Advance Payment Verification',
        successLabel: 'Advance payment',
        noun: 'advance payment',
        icon: HandCoins,
        searchPlaceholder: 'Search employee, type, remarks, ref…',
        queue: { route: 'HR/GetHRAdvancePayForVerify', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => `${r.TransactionRefNo}|${r.EmployeeID}`,
        card: {
            title: (r) => r.EmployeName,
            subtitle: (r) => [r.EmployeeID, r.AdvanceType || 'Advance'].filter(Boolean).join(' · '),
            meta: (r) => [`${money(r.EMIAmount) || '—'} × ${r.NoOfInstallments ?? '—'} installments`, r.RequestedDate].filter(Boolean).join(' · '),
            amount: (r) => money(r.LTAAmount),
        },
        searchText: (r) => `${r.EmployeName} ${r.EmployeeID} ${r.AdvanceType} ${r.EmpRemarks} ${r.TransactionRefNo}`,
        detail: { route: 'HR/GetHRAdvancePayData', params: (r) => ({ TransNo: r.TransactionRefNo, Emprefno: r.EmployeeID }) },
        moid: () => 364,
        remarksKey: (r) => r.TransactionRefNo || String(r.LTAId || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have reviewed this advance payment request.',
        header: {
            title: (r, d) => d.EmployeName || r.EmployeName,
            subtitle: (r, d) => money(d.LTAAmount || r.LTAAmount),
            chips: (r, d) => [d.EmpRefno || r.EmployeeID, d.AdvanceType || r.AdvanceType, 'Pending approval', d.CCName || r.CCCode],
        },
        sections: (r, d) => [
            {
                title: 'Advance details',
                fields: [
                    ['Advance Type', d.AdvanceType || r.AdvanceType], ['Advance Amount', money(d.LTAAmount || r.LTAAmount)], ['Balance', money(d.LTABalance ?? r.LTABalance)],
                    ['EMI Amount', money(d.EMIAmount || r.EMIAmount)], ['Installments', d.NoOfInstallments ?? r.NoOfInstallments],
                    ['Balance EMIs', d.NoOfBalanceInstallments ?? r.NoOfBalanceInstallments], ['Requested Date', d.RequestedDate || r.RequestedDate],
                    d.EMIStartDate && ['EMI Start', d.EMIStartDate], d.SADeductMonth && ['Deduct Month', d.SADeductMonth],
                    (d.Purpose || r.EmpRemarks) && ['Purpose', d.Purpose || r.EmpRemarks, true],
                ],
            },
            {
                title: 'Payment details',
                fields: [
                    ['Trans Amount', money(d.TransactionAmount)], ['Trans Date', d.TransactionDate], ['Bank', d.Bank], ['Mode of Pay', d.Modeofpay],
                    ['Pay Trans No', d.PayTransNo], ['Adv Trans No', d.AdvanceTransNo || r.TransactionRefNo],
                    d.CCCode && ['Cost Center', `${d.CCCode} · ${d.CCName || ''}`, true],
                ],
            },
            r.ReportingMgrRemarks && { title: 'Reporting manager remarks', fields: [['Remarks', r.ReportingMgrRemarks, true]] },
        ],
        approve: {
            route: 'HR/ApproveHRAdvancePayment',
            payload: (r, d, { value, note, user, roleId }) => ({
                EmpRefno: d.EmpRefno || r.EmployeeID, TransactionRefNo: d.TransactionRefNo, TransactionAmount: d.TransactionAmount,
                Action: String(value).toLowerCase().includes('reject') ? 'Reject' : 'Approve', RoleID: roleId, BankId: d.BankId || 0,
                Createdby: user, ApprovalNote: note, AdvanceTransNo: d.AdvanceTransNo || r.TransactionRefNo,
            }),
            ok: ANY,
        },
    },

    EmployeeTransfer: {
        title: 'Employee Transfer Verification',
        successLabel: 'Transfer',
        noun: 'transfer',
        icon: ArrowRightLeft,
        searchPlaceholder: 'Search employee, code, ref…',
        queue: { route: 'HR/VerifyEmployeeTransferGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.lid,
        card: {
            title: (r) => r.EmployeeName,
            subtitle: (r) => `${r.EmployeeId} · Ref ${r.lid}`,
            meta: (r) => [r.RelievingDate && `Relieving ${r.RelievingDate}`, r.JoiningDate && `Joining ${r.JoiningDate}`].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.EmployeeName} ${r.EmployeeId} ${r.lid}`,
        detail: { route: 'HR/VerifyEmployeeTransferView', params: (r) => ({ Lvid: r.lid }) },
        moid: (r, d) => Number(d.MOID) || null,
        remarksKey: (r, d) => String(d.lid || r.lid || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the transfer details, cost centers and dates.',
        header: {
            title: (r, d) => d.EmployeeName || r.EmployeeName,
            subtitle: (r, d) => `${d.EmployeeId || r.EmployeeId} · Ref ${d.lid || r.lid}`,
            chips: (r, d) => ['CC Transfer', d.Status && `Status: ${d.Status}`],
        },
        sections: (r, d) => [
            { title: 'Transfer route', fields: [['From Cost Center', codeName(d.FromCC) || 'Not available', true], ['To Cost Center', codeName(d.ToCC) || 'Not available', true]] },
            {
                title: 'Timeline',
                fields: [
                    ['Last Working Date (Relieving)', d.RelievingDate || r.RelievingDate], ['Joining Date (New CC)', d.JoiningDate || r.JoiningDate],
                    d.Remarks?.trim() && ['Reason / Remarks', d.Remarks, true], d.ReturnNotes?.trim() && ['Return Notes', d.ReturnNotes, true],
                    d.ErrorStatus?.trim() && ['Error Status', d.ErrorStatus, true],
                ],
            },
        ],
        approve: {
            route: 'HR/ApproveEmployeeTransfer',
            // staffTransferAPI maps the page's payload to { lid, Status, ReturnNotes, Createdby, RoleID }
            payload: (r, d, { value, note, user, roleId }) => ({ lid: String(d.lid || r.lid || ''), Status: value, ReturnNotes: note, Createdby: user, RoleID: String(roleId) }),
            ok: (s, r, d, body) => body?.IsSuccessful !== false,
        },
    },

    StaffFullFinal: {
        title: 'Staff Full & Final Verification',
        successLabel: 'Full & Final',
        noun: 'settlement',
        icon: BadgeIndianRupee,
        searchPlaceholder: 'Search employee, code, ID, ref…',
        queue: { route: 'HR/GetVerifyFinalSalary', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Id,
        card: {
            title: (r) => r.EmployeeName,
            subtitle: (r) => `${r.EmpRefNo} · ID ${r.Id}`,
            meta: (r) => [r.CCCode && `CC ${r.CCCode}`, r.TransactionRefNo && `Ref ${r.TransactionRefNo}`, r.Status].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.EmployeeName} ${r.EmpRefNo} ${r.Id} ${r.TransactionRefNo}`,
        detail: { route: 'HR/GetFinalSalarybyId', params: (r) => ({ TransNo: r.TransactionRefNo || r.TransNo || '', Id: r.Id, EmpRefNo: r.EmpRefNo }) },
        moid: (r, d) => Number(d.MOID) || null,
        remarksKey: (r, d) => String(d.TransactionRefNo || r.TransactionRefNo || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the Full & Final settlement amounts, gratuity calculations and supporting documents.',
        header: {
            title: (r, d) => d.EmployeeName || r.EmployeeName,
            subtitle: (r, d) => money(d.FinalNet),
            chips: (r, d) => ['Full & Final Settlement', d.CCCode && `CC ${d.CCCode}`, d.Status],
        },
        sections: (r, d) => {
            const ms = d.MonthSalary || {};
            const grat = num(d.Gratuity);
            const encash = num(d.LeaveEncashment) > 0;
            return [
                {
                    title: 'Employee',
                    fields: [
                        ['Employee ID', d.EmpRefNo], ['Cost Center', d.CCCode], ['Group', d.GroupName || (d.GroupId ? `Group ${d.GroupId}` : null)],
                        ['Transaction Ref', d.TransactionRefNo], ['Joining Date', d.JoiningDate], ['Resignation Date', d.ResignationDate], ['Relieving Date', d.RelievingDate],
                    ],
                },
                {
                    title: 'Settlement',
                    fields: [
                        ['Salary For', ms.PayRollFortheDate], ['Paid Days', ms.TotalSalaryDays ?? ms.NoofPresentDays],
                        ['Gross', money(ms.Gross ?? d.FinalGross)], ['Deduction', money(ms.TotalDeduction ?? d.FinalDeduction)],
                        num(d.BonusBasic) > 0 && ['Bonus Basic (8.33%)', money(d.BonusBasic)],
                        encash && ['Leave Encashment', money(d.LeaveEncashment)],
                        encash && ['Encashment Basis', `Last drawn ${money(d.LastDrawnSalary)}${ms.BalanceLeaves != null ? ` × ${ms.BalanceLeaves} days` : ''} @ ${money(d.LastDrawnSalaryPerDay)}/day`, true],
                        ['Total Earnings', money(d.FinalGross)], ['Total Deductions', money(d.FinalDeduction)], ['Net Due', money(d.FinalNet)],
                    ],
                },
                {
                    title: 'Gratuity',
                    fields: grat <= 0
                        ? [['Gratuity', `Not eligible${d.TotalExperiencedays ? ` — ${d.TotalExperiencedays} days of service` : ''}`, true]]
                        : [
                            ['Total Service Days', d.TotalExperiencedays], ['Gratuity Years', d.GratuityYears], ['Gratuity Days', d.Gratuitydays],
                            ['Per Day', money(d.GratuityPerday)], ['Gratuity Amount', money(d.Gratuity)],
                        ],
                },
            ];
        },
        extra: (r, d) => {
            const heads = list(d.lstMonthSalaryHeads);
            const rows = (type: string) => heads.filter((h) => h.HeadType === type).map((h) => [h.SalaryHead || h.HeadName, fmt(h.HeadAmount)]);
            return (
                <>
                    <TableBlock title="Earnings" heads={['Head', 'Amount']} empty="No earnings heads" rows={rows('Earning')} />
                    <TableBlock title="Deductions" heads={['Head', 'Amount']} empty="No deduction heads" rows={rows('Deduction')} />
                </>
            );
        },
        approve: {
            route: 'HR/ApproveFinalSalary',
            payload: (r, d, { value, note, user, roleId }) => ({
                TransactionRefNo: String(d.TransactionRefNo || r.TransactionRefNo || ''), Id: parseInt(d.Id || r.Id, 10), EmpRefNo: String(d.EmpRefNo || r.EmpRefNo || ''),
                CCCode: String(d.CCCode || r.CCCode || ''), GroupId: parseInt(d.GroupId || r.GroupId, 10) || 0, Note: note, RoleId: parseInt(roleId, 10),
                Createdby: user, Action: value,
            }),
            // Only "Submited" counts (the web shows any other answer as an error)
            ok: (s) => String(s || '').toLowerCase() === 'submited',
        },
    },

    // The resignation letter comes inline (DocBaseString); the phone shows its type only
    EmployeeExit: {
        title: 'Employee Exit Verification',
        successLabel: 'Exit',
        noun: 'exit',
        icon: LogOut,
        searchPlaceholder: 'Search employee, code, ref…',
        queue: { route: 'HR/GetVerifyEmpExit', params: ({ roleId }) => ({ RoleID: roleId }) },
        itemKey: (r) => r.Id,
        card: {
            title: (r) => r.EmployeeName,
            subtitle: (r) => `${r.EmpRefNo} · Ref ${r.Id}`,
            meta: (r) => [r.CCName, r.ResignationDate && `Resignation ${r.ResignationDate}`, `Relieving ${r.RelievingDate || '—'}`].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.EmployeeName} ${r.EmpRefNo} ${r.Id}`,
        detail: { route: 'HR/GetEmpExitbyId', params: (r, { roleId }) => ({ Emprefno: r.EmpRefNo, Id: r.Id, RoleId: roleId }) },
        moid: (r, d) => Number(d.MOID) || null,
        remarksKey: (r, d) => String(d.Id || r.Id || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the exit details, dates and supporting documents.',
        header: {
            title: (r, d) => d.EmployeeName || d.EmpName || r.EmployeeName,
            subtitle: (r, d) => `${d.EmpRefNo || r.EmpRefNo} · Ref ${d.Id || r.Id}`,
            chips: (r, d) => ['Employee Exit', d.DesignationName, d.Status && `Status: ${d.Status}`],
        },
        sections: (r, d) => [
            {
                fields: [
                    ['Employee Code', d.EmpRefNo], ['Designation', d.DesignationName], ['Cost Center', d.CostCenter || d.CCCode], ['Cost Center Name', d.CCName],
                ],
            },
            {
                title: 'Exit details',
                fields: [
                    ['Resignation Date', d.ResignationDate || r.ResignationDate], ['Relieving Date', d.RelievingDate || r.RelievingDate],
                    d.NoticePereiodDays != null && ['Notice Period (Days)', d.NoticePereiodDays],
                    d.DocType && ['Document', `${d.DocType}${d.DocBaseString ? ' attached (open it on the Corex web)' : ''}`, true],
                    d.Remarks?.trim() && ['Remarks', d.Remarks, true], d.ReturnNotes?.trim() && ['Return Notes', d.ReturnNotes, true],
                    d.ErrorStatus?.trim() && ['Error Status', d.ErrorStatus, true],
                ],
            },
        ],
        approve: {
            route: 'HR/ApproveEmpExit',
            payload: (r, d, { value, note, user, roleId }) => ({
                Id: parseInt(d.Id || r.Id, 10), CostCenter: String(d.CostCenter || d.CCCode || ''), EmpRefNo: String(d.EmpRefNo || r.EmpRefNo || ''),
                GroupId: parseInt(d.GroupId || r.GroupId, 10) || 0, ResignationDate: String(d.ResignationDate || r.ResignationDate || ''),
                RelievingDate: String(d.RelievingDate || r.RelievingDate || ''), RoleId: parseInt(roleId, 10), Createdby: user, Action: value, Note: note,
            }),
            ok: (s) => String(s || '').toLowerCase() === 'submited',
        },
    },

    StaffAdvance: {
        title: 'Staff Advance Verification',
        successLabel: 'Advance request',
        noun: 'advance request',
        icon: Wallet,
        searchPlaceholder: 'Search employee, ID, amount, ref…',
        queue: { route: 'HR/GetHRAdvanceRequestDataForVerify', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.TransactionRefNo,
        card: {
            title: (r) => r.EmployeName,
            subtitle: (r) => [r.EmployeeID, String(r.AdvanceType || r.AdvType || 'LTA').toUpperCase()].filter(Boolean).join(' · '),
            meta: (r) => [r.TransactionRefNo && `Ref ${r.TransactionRefNo}`, r.RequestedDate, r.Status].filter(Boolean).join(' · '),
            amount: (r) => money(r.LTAAmount),
        },
        searchText: (r) => `${r.EmployeName} ${r.EmployeeID} ${r.LTAAmount} ${r.TransactionRefNo}`,
        detail: { route: 'HR/GetHRAdvanceRequestData', params: (r) => ({ TransNo: r.TransactionRefNo, Emprefno: r.EmployeeID || r.EmpRefno || '' }) },
        moid: (r, d) => Number(d.MOID || r.MOID) || null,
        remarksKey: (r, d) => String(d.TransactionRefNo || r.TransactionRefNo || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the advance request details, eligibility and supporting documents.',
        header: {
            title: (r, d) => d.EmployeName || d.EmployeeName || r.EmployeName,
            subtitle: (r, d) => money(d.LTAAmount ?? r.LTAAmount),
            chips: (r, d) => [`${String(d.AdvanceType || r.AdvanceType || 'LTA').toUpperCase()} Advance`, d.CCCode && `CC ${d.CCCode}`, d.Status],
        },
        sections: (r, d) => {
            const rules = d.EmpLTARuleData;
            const pass = (v: unknown) => (['pass', 'noneed', 'ctcexist', 'exist'].includes(String(v || '').toLowerCase()) ? `✓ ${v}` : `✗ ${v || 'N/A'}`);
            return [
                {
                    title: 'Advance summary',
                    fields: [
                        ['Advance Amount', money(d.LTAAmount)], ['EMI Amount', money(d.EMIAmount)], ['Instalments', d.NoOfInstallments || 0],
                        ['Balance EMIs', d.NoOfBalanceInstallments || 0],
                    ],
                },
                { title: 'Employee & cost center', fields: [['Employee', d.EmployeName || d.EmployeeName], ['Employee ID', d.EmpRefno || d.EmployeeID], ['CC Code', d.CCCode], ['CC Name', d.CCName]] },
                {
                    title: 'Advance details',
                    fields: [
                        ['Advance Type', d.AdvanceType], ['Requested Date', d.RequestedDate], ['EMI Start Date', d.EMIStartDate], ['Transaction Ref', d.TransactionRefNo],
                        ['SA Deduct Month', d.SADeductMonth], (d.EmpRemarks || d.Purpose) && ['Purpose', d.EmpRemarks || d.Purpose, true],
                    ],
                },
                rules && {
                    title: 'Eligibility check',
                    fields: [
                        ['Experience Rule', pass(rules.ExperienceRule)], ['Amount Limit Rule', pass(rules.AmountLimitRule)],
                        ['Notice Period Rule', pass(rules.NoticePeriodRule)], ['CTC Status', pass(rules.CTCStatus)], ['LTA Credit CC Status', pass(rules.LTACreditCCStatus)],
                    ],
                },
            ];
        },
        approve: {
            route: 'HR/ApproveHRAdvanceRequest',
            payload: (r, d, { value, note, user, roleId }) => ({
                EmpRefno: d.EmpRefno || r.EmployeeID || r.EmpRefno || '', TransactionRefNo: d.TransactionRefNo || r.TransactionRefNo || '',
                Action: value, RoleID: roleId, Createdby: user, ApprovalNote: note,
            }),
            ok: (s) => /submit/i.test(String(s || '')),
        },
    },

    // The detail is a POST; the web falls back to MOID 363 when the record carries none
    LeaveRequest: {
        title: 'Employee Leave Request Verification',
        successLabel: 'Leave request',
        noun: 'leave request',
        icon: CalendarDays,
        searchPlaceholder: 'Search employee, code, ref, cost center…',
        queue: { route: 'HR/GetVerifyLeaveRequests', params: ({ roleId }) => ({ RoleId: roleId }) },
        itemKey: (r) => `${r.EmpRefNo}|${r.TransactionRefNo}`,
        card: {
            title: (r) => r.EmployeeName,
            subtitle: (r) => [r.EmpRefNo, r.CCName].filter(Boolean).join(' · '),
            meta: (r) => [r.FromDate && `From ${r.FromDate}`, r.JoiningCostCenter, r.TransactionRefNo].filter(Boolean).join(' · '),
            amount: (r) => (r.Noofleaves != null ? `${r.Noofleaves} days` : null),
        },
        searchText: (r) => `${r.TransactionRefNo} ${r.EmployeeName} ${r.EmpRefNo} ${r.CCName}`,
        detail: {
            route: 'HR/GetLeaveRequestbyRefno',
            method: 'post',
            params: (r) => ({
                LeaveTypeId: r.LeaveTypeId || 0, EmpRefNo: r.EmpRefNo, UserName: r.UserName || '', TransactionRefNo: r.TransactionRefNo || '',
                JoiningCostCenter: r.JoiningCostCenter || '',
            }),
        },
        moid: (r, d) => d.MOID || 363,
        remarksKey: (r, d) => d.TransactionRefNo || r.TransactionRefNo || '',
        showReturn: 'Yes',
        confirmLabel: 'I have verified all leave request details.',
        header: {
            title: (r, d) => d.EmployeeName || r.EmployeeName,
            subtitle: (r, d) => `${d.Noofleaves ?? r.Noofleaves} days leave`,
            chips: (r, d) => [`${d.EmpRefNo || r.EmpRefNo} · ${d.Category || 'Employee'}`, d.JoiningCostCenter || r.JoiningCostCenter, d.LeaveAssignStatus],
        },
        sections: (r, d) => [
            {
                title: 'Leave',
                fields: [
                    ['From Date', d.FromDate || r.FromDate], ['To Date', d.ToDate || r.ToDate], ['Number of Leaves', `${d.Noofleaves ?? r.Noofleaves} days`],
                    ['Balance Leaves', `${d.Balanceleaves || '0'} days`], ['Leave Type ID', d.LeaveTypeId], ['Transaction No', d.TransactionRefNo || r.TransactionRefNo],
                    d.Remarks && ['Reason / Remarks', d.Remarks, true],
                ],
            },
            {
                title: 'Employee',
                fields: [
                    ['Employee ID', d.EmpRefNo], ['Category', d.Category], ['State', d.State], ['Mobile', d.MobileNo], ['Cost Center', d.CCName],
                    ['Joining Date', d.JoiningDate], ['Previous Leave', d.PreviousLRDate], ['Year End', d.YearEndDate], ['User Name', d.UserName],
                    d.PermanentAddress && ['Permanent Address', d.PermanentAddress, true],
                ],
            },
            (d.Mindate || d.MaxDate) && { title: 'Leave eligibility period', fields: [['Eligible From', d.Mindate], ['Eligible Until', d.MaxDate]] },
        ],
        approve: {
            route: 'HR/ApproveHRLeaveRequest',
            payload: (r, d, { action, note, user, roleCode, roleId }) => ({
                EmpRefNo: String(r.EmpRefNo || '').trim(), TransactionRefNo: String(d.TransactionRefNo || r.TransactionRefNo || '').trim(),
                Roleid: parseInt(roleId, 10), Action: action,
                // Note carries the approval trail; Remarks the verifier's own comment
                Note: appendApprovalComment(d.Note || r.Note, roleCode || 'Leave Verifier', user, note),
                CreatedBy: user, UserName: d.UserName || r.UserName || user, Noofleaves: parseInt(d.Noofleaves || r.Noofleaves || 0, 10),
                LeaveTypeId: parseInt(d.LeaveTypeId || r.LeaveTypeId || 0, 10), JoiningCostCenter: d.JoiningCostCenter || r.JoiningCostCenter || '',
                FromDate: d.FromDate || r.FromDate || '', ToDate: d.ToDate || r.ToDate || '', Remarks: note, SubmitAction: 'CheckLeaves',
            }),
            ok: ANY,
        },
    },

    // Both pages read HR/GetVerifyObjectsAndGoals and post HR/ApproveEmpObjects; Appraisal sends the note as
    // Remarks and treats "…submit…" as success, Objectives & Goals sends the approval trail and accepts any answer
    StaffAppraisal: {
        title: 'Staff Appraisal Verification',
        successLabel: 'Appraisal',
        noun: 'appraisal',
        icon: Target,
        searchPlaceholder: 'Search employee, ID, year, month…',
        queue: { route: 'HR/GetVerifyObjectsAndGoals', params: ({ roleId }) => ({ RoleId: roleId }) },
        itemKey: (r) => r.Id || r.ID || r.id,
        card: {
            title: (r) => r.EmployeName || r.EmployeeName || r.Name || '—',
            subtitle: (r) => [r.EmpRefNo || r.EmployeeID, r.DesignatedAs || r.Designation].filter(Boolean).join(' · '),
            meta: (r) => [r.Year && r.Month ? `${monthName(r.Month)} ${r.Year}` : null, r.Status].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.EmployeName || r.EmployeeName} ${r.EmpRefNo || r.EmployeeID} ${r.Year} ${r.Month}`,
        detail: { route: 'HR/GetAppraisalbyId', params: (r) => ({ Id: r.Id || r.ID || r.id, EmpRefNo: r.EmpRefNo || r.EmployeeID || r.EmpRefno || '' }) },
        moid: (r, d) => Number(d.MOID || r.MOID) || null,
        remarksKey: (r, d) => String(d.Id || r.Id || ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the appraisal objectives, employee details and the appraisal period.',
        header: {
            title: (r, d) => d.EmployeName || d.EmployeeName || d.Name || '—',
            subtitle: (r, d) => [d.EmpRefNo || d.EmpRefno || d.EmployeeID, d.DesignatedAs || d.Designation].filter(Boolean).join(' · '),
            chips: (r, d) => [d.Year && d.Month && `${monthName(d.Month)} ${d.Year}`, d.CCCode && `CC ${d.CCCode}`, d.Status],
        },
        sections: (r, d) => [
            { title: 'Employee', fields: [['Category', d.Category], ['Designated As', d.DesignatedAs || d.Designation], ['Department', d.Department]] },
            {
                title: 'Appraisal period',
                fields: [
                    ['Year', d.Year], ['Month', d.Month ? monthName(d.Month) : null], ['Cost Center', d.JoiningCostCenter || d.CCCode],
                    d.LastAppraisalDate && ['Last Appraisal Date', d.LastAppraisalDate],
                ],
            },
            (d.Remarks || d.EmpRemarks || d.Goals || d.Objectives) && { title: 'Objectives & remarks', fields: [['', d.Remarks || d.EmpRemarks || d.Goals || d.Objectives, true]] },
        ],
        approve: {
            route: 'HR/ApproveEmpObjects',
            payload: (r, d, { value, note, user, roleId }) => ({
                EmpRefNo: String(d.EmpRefNo || d.EmpRefno || r.EmpRefNo || r.EmployeeID || '').trim(), Id: parseInt(d.Id || r.Id || r.ID || 0, 10),
                Remarks: note, Year: parseInt(d.Year || r.Year, 10) || 0, Month: parseInt(d.Month || r.Month, 10) || 0,
                CCCode: d.JoiningCostCenter || d.CCCode || r.CCCode || '', RoleId: parseInt(roleId, 10), Createdby: user, Action: value, Note: note,
            }),
            ok: (s) => /submit/i.test(String(s || '')),
        },
    },

    StaffObjectivesGoals: {
        title: 'Staff Objectives & Goals Verification',
        successLabel: 'Objectives & goals',
        noun: 'appraisal',
        icon: Award,
        searchPlaceholder: 'Search name, ID, cost center, department…',
        queue: { route: 'HR/GetVerifyObjectsAndGoals', params: ({ roleId }) => ({ RoleId: roleId }) },
        itemKey: (r) => `${r.Id}|${r.EmpRefNo}`,
        card: {
            title: (r) => r.Name,
            subtitle: (r) => `ID ${r.Id} · ${r.EmpRefNo}`,
            meta: (r) => [r.JoiningCCName, r.EffectiveDate, r.GroupName, r.Department].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.Id} ${r.Name} ${r.EmpRefNo} ${r.JoiningCCName} ${r.Department}`,
        detail: { route: 'HR/GetAppraisalbyId', params: (r) => ({ Id: r.Id, EmpRefNo: r.EmpRefNo }) },
        moid: (r, d) => d.MOID || 571,
        remarksKey: (r, d) => String(d.Id ?? r.Id ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all appraisal and objectives details.',
        header: {
            title: (r, d) => d.Name || r.Name,
            subtitle: (r, d) => `${d.EmpRefNo || r.EmpRefNo} · ID ${d.Id || r.Id}`,
            chips: (r, d) => ['Staff Appraisal', (d.GroupName || r.GroupName) && `Group ${d.GroupName || r.GroupName}`, d.JoiningType, d.NewDesignation && `New: ${d.NewDesignation}`],
        },
        sections: (r, d) => [{
            fields: [
                ['Employee Reference', d.EmpRefNo], ['Designated As', d.DesignatedAs], ['Department', d.Department], ['Joining Type', d.JoiningType],
                ['Joining Date', d.JoiningDate], ['Group', d.GroupName], ['Cost Center', d.JoiningCostCenter || r.JoiningCCName],
                ['Last Appraisal', d.LastAppraisalDate], ['Effective Date', d.EffectiveDate], ['New Designation', d.NewDesignation],
                ['Year', d.Year], ['Month', d.Month], d.Category && ['Category', d.Category],
            ],
        }],
        approve: {
            route: 'HR/ApproveEmpObjects',
            payload: (r, d, { action, note, user, roleCode, roleId }) => ({
                EmpRefNo: String(d.EmpRefNo || r.EmpRefNo || '').trim(), Id: parseInt(d.Id || r.Id, 10),
                Remarks: appendApprovalComment(d.Remarks, roleCode || 'Appraisal Verifier', user, note),
                Year: d.Year ? parseInt(d.Year, 10) : 0, Month: d.Month ? parseInt(d.Month, 10) : 0,
                CCCode: d.JoiningCostCenter || d.CostCenter || r.JoiningCostCenter || '', RoleId: parseInt(roleId, 10), Createdby: user, Action: action, Note: note,
            }),
            ok: ANY,
        },
    },

    // The verifier ticks the employees to process; Approve / Verify goes out for the ticked ones together
    // (HR/ApprovePayRollMulti). Single employees can be rejected with a reason from the list.
    StaffPayroll: {
        title: 'Staff Payroll Verification',
        successLabel: 'Payroll',
        noun: 'payroll',
        icon: ReceiptIndianRupee,
        searchPlaceholder: 'Search ref, consolidate no, cost center…',
        queue: { route: 'HR/GetVerificationCCPayroll', params: ({ roleId }) => ({ RoleID: roleId }) },
        itemKey: (r) => `${r.TransactionRefno}|${r.Refno}`,
        card: {
            title: (r) => `Ref ${r.TransactionRefno}`,
            subtitle: (r) => `CC ${r.CCCodes}`,
            meta: (r) => [`Consolidate ${r.ConslidateTransNo}`, `${r.Month}/${r.Year}`, r.PayRoleDate].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.TransactionRefno} ${r.ConslidateTransNo} ${r.CCCodes} ${r.Refno}`,
        detail: {
            route: 'HR/GETVerificationCCPayRollbyRefno',
            method: 'post',
            params: (r, { roleId }) => ({
                TransactionRefno: parseInt(r.TransactionRefno, 10), ConslidateTransNo: parseInt(r.ConslidateTransNo, 10), Refno: String(r.Refno),
                CCCodes: String(r.CCCodes), PayRoleDate: r.PayRoleDate, Month: parseInt(r.Month, 10), Year: parseInt(r.Year, 10), Roleid: parseInt(roleId, 10),
            }),
        },
        moid: (r, d) => list(d.MainGridData)[0]?.MOID || 378,
        remarksKey: (r) => String(r.TransactionRefno ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified the payroll details and employee salary information.',
        header: {
            title: () => 'Payroll Verification',
            subtitle: (r, d) => money(list(d.MainGridData).reduce((s, e) => s + (Number(e.NetValue) || 0), 0)),
            chips: (r, d) => [`Ref ${r.TransactionRefno}`, `CC ${r.CCCodes}`, r.PayRoleDate, `${list(d.MainGridData).length} employees`],
        },
        extra: (r, d, { ext, setExt, openSheet, reload, roleId, user }) => (
            <PayrollEmployees row={r} d={d} ext={ext} setExt={setExt} openSheet={openSheet} reload={reload} roleId={roleId} user={user} />
        ),
        beforeAction: (action, r, d, { ext }) => (Object.values(ext.selected || {}).some(Boolean) ? [] : ['Select at least one employee to process']),
        approve: {
            route: 'HR/ApprovePayRollMulti',
            payload: (r, d, { value, note, ext }) => {
                const picked = list(d.MainGridData).filter((e) => (ext.selected || {})[e.SalaryId]);
                return {
                    TransactionRefno: parseInt(r.TransactionRefno, 10), PayRoleDate: r.PayRoleDate, Action: value, Note: note,
                    ConslidateTransNo: parseInt(r.ConslidateTransNo, 10), Refno: parseInt(r.Refno, 10),
                    Emprefnos: `${picked.map((e) => e.EmpRefNo).join('|')}|`, SalaryIds: `${picked.map((e) => e.SalaryId).join('|')}|`, CCCode: String(r.CCCodes),
                };
            },
            ok: ANY,
        },
    },

    // Detail is a POST; the web falls back to MOID 528. On Approve the web downloads the bank-transfer Excel.
    StaffCMSPay: {
        title: 'Staff CMS Pay Verification',
        successLabel: 'CMS payment',
        noun: 'CMS payment',
        icon: Building2,
        searchPlaceholder: 'Search CMS no, transaction, consolidate no, month…',
        queue: { route: 'HR/GetVerifyCMSPay', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.CMSTransactionNo,
        card: {
            title: (r) => `CMS ${r.CMSTransactionNo}`,
            subtitle: (r) => `Consolidate ${r.ConsolidateNo}`,
            meta: (r) => [r.TransactionRefno, `${r.Month || ''} ${r.Year || ''}`.trim()].filter(Boolean).join(' · '),
            amount: (r) => money(r.Total || 0),
        },
        searchText: (r) => `${r.CMSTransactionNo} ${r.TransactionRefno} ${r.ConsolidateNo} ${r.Month}`,
        detail: {
            route: 'HR/GetCMSDatatbyTransNo',
            method: 'post',
            params: (r) => ({
                CMSTransactionNo: String(r.CMSTransactionNo).trim(), ConsolidateNo: String(r.ConsolidateNo ?? '').trim(),
                TransactionRefno: String(r.TransactionRefno ?? '').trim(), Month: r.EffectiveMonth ? parseInt(r.EffectiveMonth, 10) : 0, Year: r.Year ? parseInt(r.Year, 10) : 0,
            }),
        },
        moid: (r, d) => d.MOID || 528,
        chkAmt: (r, d) => d.Total,
        remarksKey: (r, d) => String(d.CMSTransactionNo ?? r.CMSTransactionNo ?? ''),
        showReturn: 'Yes',
        confirmLabel: 'I have verified all CMS payment details and beneficiary information.',
        header: {
            title: () => 'CMS Payment Verification',
            subtitle: (r, d) => money(d.Total ?? r.Total),
            chips: (r, d) => [`CMS ${d.CMSTransactionNo || r.CMSTransactionNo}`, `Consolidate ${d.ConsolidateNo || r.ConsolidateNo}`, `${d.Month || r.Month || ''} ${d.Year || r.Year || ''}`.trim(), d.EffectiveMonth && `Effective ${d.EffectiveMonth}`],
        },
        sections: (r, d) => [{ fields: [['Transaction', d.TransactionRefno || r.TransactionRefno], ['CMS ID', d.CMSId], ['Beneficiaries', list(d.CMSReportData).length]] }],
        extra: (r, d) => {
            const rows = list(d.CMSReportData);
            return (
                <TableBlock
                    title={`Beneficiaries (${rows.length})`}
                    heads={['Beneficiary', 'Emp Ref No', 'Account No', 'IFSC', 'Bank', 'Amount', 'Date']}
                    rows={rows.map((b) => [
                        b.BeneficiaryName, b.Emprefno, b.BeneficiaryAcNo, b.IFSC, b.BeneficiaryBank || b.BeneficiaryBankName || b.BankName || b.Bank,
                        fmt(b.Amount), b.Date,
                    ])}
                    foot={rows.length ? [`Total ${fmt(rows.reduce((a, b) => a + (parseFloat(b.Amount) || 0), 0))}`] : undefined}
                />
            );
        },
        approve: {
            route: 'HR/ApproveCMSPay',
            payload: (r, d, { action, note, user, roleId }) => ({
                CMSTransactionNo: String(d.CMSTransactionNo || r.CMSTransactionNo || '').trim(), TransactionRefno: String(d.TransactionRefno || r.TransactionRefno || '').trim(),
                ConsolidateNo: String(d.ConsolidateNo || r.ConsolidateNo || '').trim(), Roleid: parseInt(roleId, 10), Action: action, Note: note, CreatedBy: user,
            }),
            ok: ANY,
            afterOk: async (s, r, d, { action }) => (String(action).toLowerCase() === 'approve'
                ? 'Download the bank-transfer Excel for this CMS payment from the Corex web — the phone app cannot create it.'
                : undefined),
        },
    },

    // The verifier may correct individual attendance; the web falls back to MOID 362 and only "Submited" is success
    StaffAttendance: {
        title: 'Staff Daily Attendance Verification',
        successLabel: 'Attendance',
        noun: 'attendance',
        icon: CalendarCheck,
        searchPlaceholder: 'Search transaction, cost center, date…',
        queue: { route: 'HR/GetVerificationAttendance', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.TransactionNo,
        card: { title: (r) => r.CCName || r.CostCenter, subtitle: (r) => r.TransactionNo, meta: (r) => [r.CostCenter, r.AttendanceDate, `ID ${r.AttendanceId}`].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.TransactionNo} ${r.CostCenter} ${r.CCName} ${r.AttendanceDate}`,
        detail: { route: 'HR/GetAttendancebyTransactionNo', params: (r) => ({ TransNo: String(r.TransactionNo).trim() }) },
        moid: (r, d) => d.MOID || 362,
        remarksKey: (r, d) => d.TransactionNo || r.TransactionNo || '',
        showReturn: 'Yes',
        confirmLabel: 'I have verified all attendance details.',
        header: {
            title: (r, d) => d.CCName || d.CostCenter || r.CCName || r.CostCenter,
            subtitle: (r, d) => `${d.AttendanceDate || r.AttendanceDate} · ID ${d.AttendanceId || r.AttendanceId}`,
            chips: (r, d) => ['Daily Attendance', d.Status, d.WeekDayName, d.IsHoliday === 'Yes' && 'Holiday'],
        },
        sections: (r, d) => [{
            fields: [
                ['Transaction No', d.TransactionNo || r.TransactionNo], ['Cost Center', d.CostCenter || r.CostCenter],
                ['Total Employees', list(d.CCEmplistforDate).length], d.IsHoliday && ['Day', d.IsHoliday === 'Yes' ? 'Holiday' : 'Working day'],
            ],
        }],
        extra: (r, d, { ext, setExt }) => <AttendanceEditor d={d} ext={ext} setExt={setExt} />,
        approve: {
            route: 'HR/ApproveStaffAttendance',
            payload: (r, d, { action, note, user, roleCode, roleId, ext }) => {
                const emps = list(d.CCEmplistforDate);
                return {
                    TransactionNo: String(d.TransactionNo || r.TransactionNo || '').trim(), CostCenter: String(d.CostCenter || r.CostCenter || '').trim(),
                    AttendanceDate: String(d.AttendanceDate || r.AttendanceDate || '').trim(),
                    EmployeeIds: `${emps.map((e) => e.EmpId).join(',')},`, Attendancetypes: `${emps.map((e) => attendanceOf(e, ext)).join(',')},`,
                    RoleId: parseInt(roleId, 10), Createdby: user, Action: action,
                    ApprovalNote: appendApprovalComment(d.ApprovalNote, roleCode || 'Attendance Verifier', user, note),
                };
            },
            ok: (s) => String(s || '').split('$')[0].trim().toLowerCase() === 'submited',
        },
    },

    // Detail is a POST; the web falls back to MOID 183. NB the web posts no Action for this approval (the SP decides);
    // the phone adds the chosen Action so a Reject is not sent as a plain submit.
    ExcelAttendance: {
        title: 'Excel Attendance Verification',
        successLabel: 'Attendance',
        noun: 'attendance sheet',
        icon: FileSpreadsheet,
        searchPlaceholder: 'Search transaction, excel ref, cost center, month…',
        queue: { route: 'HR/GetVerifyExcelAttendance', params: ({ roleId }) => ({ RoleID: roleId }) },
        itemKey: (r) => r.AttendanceId,
        card: {
            title: (r) => r.CCName || r.CostCenter,
            subtitle: (r) => r.TransactionNo,
            meta: (r) => [r.AttendanceDate, `ID ${r.AttendanceId}`, r.GenerateFor || 'Month', r.LabourType].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.TransactionNo} ${r.ExcelRefno} ${r.CostCenter} ${r.CCName} ${r.AttendanceDate}`,
        detail: {
            route: 'HR/GetExcelAttendance',
            method: 'post',
            params: (r, { roleId }) => {
                const [monthName = '', year = ''] = String(r.AttendanceDate || '').split('-');
                return {
                    CostCenter: r.CostCenter || '', GenerateFor: r.GenerateFor || 'Month', AttendanceDate: r.AttendanceDate || '', MonthName: monthName, Year: year,
                    ExcelRefno: r.ExcelRefno || '', AttendanceId: String(r.AttendanceId ?? ''), TransactionNo: r.TransactionNo || '', CCName: r.CCName || '',
                    LabourType: r.LabourType || '', ContractorCode: r.ContractorCode || '', ContractorName: r.ContractorName || '', RoleId: String(roleId),
                };
            },
        },
        moid: (r, d) => d.MOID || 183,
        remarksKey: (r, d) => d.ExcelRefno || r.TransactionNo || '',
        showReturn: 'Yes',
        confirmLabel: 'I have verified all attendance details.',
        header: {
            title: (r, d) => d.CCName || d.CostCenter || r.CCName || r.CostCenter,
            subtitle: (r, d) => `${d.AttendanceDate || r.AttendanceDate} · ID ${d.AttendanceId || r.AttendanceId}`,
            chips: (r, d) => ['Excel Attendance', d.GenerateFor || r.GenerateFor || 'Month', d.LabourType || r.LabourType, d.DataStatus, (d.ExcelRefno || r.ExcelRefno) && `Ref ${d.ExcelRefno || r.ExcelRefno}`],
        },
        sections: (r, d) => [{
            fields: [
                ['Transaction No', d.TransactionNo || r.TransactionNo], ['Cost Center', d.CostCenter || r.CostCenter], ['Excel Ref', d.ExcelRefno || r.ExcelRefno],
                ['Total Employees', list(d.lstAttendanceData).length], (d.ContractorCode || r.ContractorCode) && ['Contractor Code', d.ContractorCode || r.ContractorCode],
                (d.ContractorName || r.ContractorName) && ['Contractor', d.ContractorName || r.ContractorName],
            ],
        }],
        extra: (r, d) => {
            const rows = list(d.lstAttendanceData);
            const days = Array.from({ length: 29 }, (_, i) => String(i + 2));
            const count = (e: Rec, s: string) => days.filter((day) => e[day] === s).length;
            return (
                <TableBlock
                    title={`Monthly attendance (${rows.length})`}
                    heads={['Employee', 'ID', 'Group', 'Present', 'Absent', 'Sunday / Off', 'Days']}
                    rows={rows.map((e) => [e.Name, e.LabourId, e.GroupName, count(e, 'P'), count(e, 'A'), count(e, 'S'), days.map((day) => `${day}:${e[day] || '-'}`).join(' ')])}
                />
            );
        },
        approve: {
            route: 'HR/ApproveExcelMonthAttendance',
            payload: (r, d, { action, note, user, roleCode, roleId }) => ({
                AttendanceJson: JSON.stringify(list(d.lstAttendanceData)), CostCenter: String(d.CostCenter || r.CostCenter || '').trim(),
                GenerateFor: String(d.GenerateFor || r.GenerateFor || 'Month').trim(), RoleId: parseInt(roleId, 10), Createdby: user,
                Remarks: appendApprovalComment(d.Remarks, roleCode || 'Attendance Verifier', user, note), ExcelRefno: String(d.ExcelRefno || r.ExcelRefno || '').trim(),
                LabourType: String(d.LabourType || r.LabourType || '').trim(), ContractorCode: String(d.ContractorCode || r.ContractorCode || '').trim(), Action: action,
            }),
            ok: ANY,
        },
    },

    // The web falls back to MOID 510; any returned status is treated as success
    EmployeeCTC: {
        title: 'Employee CTC Verification',
        successLabel: 'CTC',
        noun: 'CTC',
        icon: BadgeIndianRupee,
        searchPlaceholder: 'Search transaction, employee, category…',
        queue: { route: 'HR/GetVerifyNewEmpCTC', params: ({ roleId }) => ({ RoleId: String(roleId).trim() }) },
        itemKey: (r) => r.TransactionRefno,
        card: { title: (r) => r.EmpName, subtitle: (r) => r.Emprefno, meta: (r) => [r.TransactionRefno, `${r.MonthName || ''} ${r.Year || ''}`.trim(), r.Category].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.TransactionRefno} ${r.EmpName} ${r.Emprefno} ${r.Category}`,
        detail: { route: 'HR/GetNewEmpCTCbyRefno', params: (r) => ({ TransactionRefno: String(r.TransactionRefno).trim() }) },
        moid: (r, d) => d.MOID || 510,
        remarksKey: (r, d) => d.TransactionRefno || r.TransactionRefno || '',
        showReturn: 'Yes',
        excludeActions: () => ['send back'],
        confirmLabel: 'I have verified all CTC components and calculations.',
        header: {
            title: (r, d) => d.EmpName || r.EmpName,
            subtitle: (r, d) => `${d.Emprefno || r.Emprefno} · ${d.TransactionRefno || r.TransactionRefno}`,
            chips: (r, d) => [`${d.MonthName || r.MonthName || ''} ${d.Year || r.Year || ''}`.trim(), d.Category || r.Category, d.GroupName && `Group ${d.GroupName}`, d.State],
        },
        sections: (r, d) => [{
            fields: [
                ['Annual CTC', money(annualCTC(d))], ['Location', d.State || 'N/A'], ['Appointment Category', d.Category],
                ['Joining On', `${d.MonthName || ''}-${d.Year || ''}`], ['Salary Format', d.GroupName ? `Group ${d.GroupName}` : 'Standard'],
                Number(d.Earningcount) > 0 && ['Components', `${d.Earningcount} Earnings, ${d.Deductioncount} Deductions`],
                d.EmpRuleStatus?.PFExist && ['PF', `${d.EmpRuleStatus.PFExist} (${d.EmpRuleStatus.PFPercent}%)`],
                d.EmpRuleStatus?.ESIExist && ['ESI', `${d.EmpRuleStatus.ESIExist} (${d.EmpRuleStatus.ESIPercent}%)`],
                d.EmpRuleStatus?.GratuityRuleExist && ['Gratuity', d.EmpRuleStatus.GratuityRuleExist],
                d.EmpRuleStatus?.PaidLeaveExist && ['Paid Leave', d.EmpRuleStatus.PaidLeaveExist],
            ],
        }],
        extra: (r, d) => <CTCBreakdown d={d} />,
        approve: {
            route: 'HR/ApproveNewEmpCTC',
            payload: (r, d, { action, note, user, roleId }) => ({
                Emprefno: String(d.Emprefno || r.Emprefno || '').trim(), Month: parseInt(d.Month || r.Month, 10) || 0, Year: parseInt(d.Year || r.Year, 10) || 0,
                TransactionRefno: String(d.TransactionRefno || r.TransactionRefno || '').trim(), HeadsJsonString: String(d.HeadsJsonString || '').trim(),
                Roleid: parseInt(roleId, 10), CreatedBy: user, Action: action, Note: note,
            }),
            ok: ANY,
        },
    },

    // Two queues in one list (deductions + arears, tagged _type); each kind has its own lookup and approve route.
    // Both fall back to MOID 564; any returned status is success.
    SalaryDeductionArear: {
        title: 'Salary Deduction / Arear Verification',
        successLabel: 'Salary record',
        noun: 'record',
        icon: ReceiptIndianRupee,
        searchPlaceholder: 'Search employee, transaction, CC code…',
        queue: {
            route: 'HR/GetVerifySalaryDeductions', params: ({ roleId }) => ({ RoleId: roleId }), tag: 'deduction',
            more: [{ route: 'HR/GetVerifySalaryArear', params: ({ roleId }) => ({ Roleid: roleId }), tag: 'arear' }],
        },
        itemKey: (r) => `${r._type}-${r.Id ?? r.TransactionRefno}`,
        card: {
            title: (r) => r.EmpName,
            subtitle: (r) => `${r._type === 'deduction' ? 'Deduction' : 'Arear'} · ${r.EmpRefno}`,
            meta: (r) => [r.CCCode, `${r.Month}/${r.Year}`, r.PayRollForTheDate, r._type === 'arear' && r.SalaryHead, `#${r.Id}`].filter(Boolean).join(' · '),
            amount: (r) => (r._type === 'arear' && r.TotalAmount ? money(r.TotalAmount) : null),
        },
        searchText: (r) => `${r.EmpRefno} ${r.EmpName} ${r.TransactionRefno} ${r.CCCode}`,
        rowAux: [
            {
                name: 'heads', route: 'HR/GETMonthDeductionForVerify', when: (r) => r._type === 'deduction',
                params: (r) => ({ EmpTransactionRefNo: r.EmpTransactionRefNo, EmpRefNo: r.EmpRefno }),
            },
            {
                name: 'cc', route: 'HR/GetArearCCAmount', when: (r) => r._type === 'arear',
                params: (r) => ({ Emprefno: r.EmpRefno, EmpTransno: r.EmpTransactionRefNo, Head: r.SalaryHead }),
            },
        ],
        moid: (r) => r.MOID || 564,
        remarksKey: (r) => String((r._type === 'deduction' ? r.EmpTransactionRefNo : r.TransactionRefno) ?? ''),
        showReturn: 'Yes',
        excludeActions: () => ['send back'],
        confirmLabel: 'I have verified the salary details for this employee.',
        header: {
            title: (r) => r.EmpName,
            subtitle: (r) => `${r.EmpRefno} · Ref ${r.TransactionRefno}`,
            chips: (r) => [r._type === 'deduction' ? 'Salary Deduction' : 'Salary Arear', `${r.Month}/${r.Year}`, r.PayRollForTheDate, r.CCName],
        },
        sections: (r) => [{
            fields: r._type === 'arear'
                ? [['Salary Head', r.SalaryHead], ['Group', `${r.GroupName || ''} (${r.GroupId ?? ''})`], ['EmpTrans Ref', r.EmpTransactionRefNo], ['CC Code', r.CCCode]]
                : [['EmpTrans Ref', r.EmpTransactionRefNo], ['CC Code', r.CCCode], ['Cost Center', r.CCName]],
        }],
        extra: (r, d, { aux }) => {
            if (r._type === 'deduction') {
                const heads = list(aux.heads);
                const total = heads.reduce((a, h) => a + (Number(h.Amount) || 0), 0);
                return (
                    <TableBlock
                        title={`Deduction heads (${heads.length})`}
                        heads={['Deduction Head', 'Amount', 'Status']}
                        rows={heads.map((h) => [h.HeadName, fmt(h.Amount || 0), Number(h.Amount) > 0 ? 'Active' : 'Nil'])}
                        foot={heads.length ? [`Total deduction ${fmt(total)}`] : undefined}
                    />
                );
            }
            const cc = list(aux.cc);
            const total = cc.reduce((a, c) => a + (Number(c.Amount) || 0), 0);
            return (
                <TableBlock
                    title={`CC-wise amount distribution (${cc.length})`}
                    heads={['CC Code', 'CC Name', 'Amount', 'Share %']}
                    rows={cc.map((c) => [c.CCCode, c.CCName, fmt(c.Amount || 0), total > 0 ? `${((Number(c.Amount) / total) * 100).toFixed(1)}%` : '0%'])}
                    foot={cc.length ? [`Total ${fmt(total)}`] : undefined}
                />
            );
        },
        approve: {
            route: (r) => (r._type === 'deduction' ? 'HR/ApproveSingleSalaryDeduction' : 'HR/ApproveSalaryArear'),
            payload: (r, d, { action, note, user, roleId, aux }) => {
                const base = {
                    EmpRefno: String(r.EmpRefno ?? ''), EmpTransactionRefNo: String(r.EmpTransactionRefNo ?? ''), CCCode: String(r.CCCode ?? ''),
                    RoleId: parseInt(roleId, 10), CreatedBy: user, Action: action, Note: note || '', TransactionRefno: String(r.TransactionRefno ?? ''),
                };
                if (r._type === 'deduction') {
                    const heads = list(aux.heads);
                    return {
                        ...base,
                        DeductionHeads: `${heads.map((h) => h.HeadName).join('|')}|`, DeductionAmounts: `${heads.map((h) => h.Amount).join('|')}|`,
                        DeductionHeadIds: `${heads.map((h) => h.Id).join('|')}|`,
                    };
                }
                const cc = list(aux.cc);
                return {
                    ...base, TotalAmount: String(cc.reduce((a, c) => a + (Number(c.Amount) || 0), 0)), CCJsonstring: JSON.stringify(cc), Id: String(r.Id ?? ''),
                };
            },
            ok: ANY,
        },
    },

    // The web falls back to MOID 672; a reply naming one of these business errors is a failure, anything else is success
    StaffPayRevision: {
        title: 'Staff Pay Revision Verification',
        successLabel: 'Pay revision',
        noun: 'pay revision',
        icon: TrendingUp,
        searchPlaceholder: 'Search transaction, employee…',
        queue: { route: 'HR/GetVerifyPayRevision', params: ({ roleId }) => ({ RoleId: String(roleId).trim() }) },
        itemKey: (r) => r.TransactionRefno,
        card: { title: (r) => r.EmpName, subtitle: (r) => r.Emprefno, meta: (r) => [r.TransactionRefno, `${r.MonthName || ''} ${r.Year || ''}`.trim(), r.Category].filter(Boolean).join(' · ') },
        searchText: (r) => `${r.TransactionRefno} ${r.EmpName} ${r.Emprefno}`,
        detail: { route: 'HR/GetPayRevisionbyRefno', params: (r) => ({ TransactionRefno: String(r.TransactionRefno).trim() }) },
        moid: (r, d) => d.MOID || 672,
        remarksKey: (r, d) => d.TransactionRefNo || r.TransactionRefno || '',
        showReturn: 'Yes',
        excludeActions: () => ['send back'],
        confirmLabel: 'I have verified all pay revision details and calculations.',
        header: {
            title: (r, d) => d.EmployeeName || r.EmpName,
            subtitle: (r, d) => `${d.EmpRefNo || r.Emprefno} · ${d.TransactionRefNo || r.TransactionRefno}`,
            chips: (r, d) => [`${d.MonthName || r.MonthName || ''} ${d.Year || r.Year || ''}`.trim(), d.Category || r.Category, d.RevisionNo && `Revision ${d.RevisionNo}`, d.AppraisalDate],
        },
        sections: (r, d) => {
            const ctc = list(d.PayRevisionHeadData?.lstAllHeads).find((h) => h.HeadType === 'CTCTOTAL');
            const rules = d.PayRevisionHeadData?.EmpRuleStatus;
            return [{
                fields: [
                    ctc && ['Revised CTC (Annual)', `${money(ctc.YearlyAmount || 0)}${Number(ctc.YearlyDiff) ? ` (+${fmt(ctc.YearlyDiff)})` : ''}`],
                    ['Location', d.State || 'N/A'], ['Category', d.Category || 'N/A'], ['Group', d.GroupName || 'N/A'], ['Changed To Group', d.NewGroupName || 'N/A'],
                    ['Effective Month', `${d.MonthName || ''} ${d.Year || ''}${d.AppraisalDate ? ` (${d.AppraisalDate})` : ''}`],
                    ['Revision No', `Rev ${d.RevisionNo ?? ''}${Number(d.PreviousRevisionNo) > 0 ? ` (Prev: ${d.PreviousRevisionNo})` : ''}`],
                    rules?.PFExist && ['PF', `${rules.PFExist} (${rules.PFPercent}%)`],
                    rules?.ESIExist && ['ESI', `${rules.ESIExist} (${rules.ESIPercent}%)`],
                    rules?.GratuityRuleExist && ['Gratuity', rules.GratuityRuleExist],
                    rules?.PaidLeaveExist && ['Paid Leave', rules.PaidLeaveExist],
                ],
            }];
        },
        extra: (r, d) => <PayRevisionBreakdown d={d} yearly />,
        approve: {
            route: 'HR/ApprovePayRevision',
            payload: (r, d, { action, note, user, roleId }) => ({
                EmpRefNo: String(d.EmpRefNo || r.Emprefno || '').trim(), Month: parseInt(d.Month || r.Month, 10) || 0, Year: parseInt(d.Year || r.Year, 10) || 0,
                TransactionRefNo: String(d.TransactionRefNo || r.TransactionRefno || '').trim(), RevisionNo: parseInt(d.RevisionNo, 10) || 0,
                HeadsJsonString: String(d.HeadsJsonString || '').trim(), Roleid: parseInt(roleId, 10), CreatedBy: user, Action: action, Note: note,
            }),
            ok: (s) => !['salary rules does not exist for this group', 'access denied', 'alreadyexistandpending', 'alreadyrevised']
                .some((e) => String(s || '').toLowerCase().includes(e)),
        },
    },

    // The approve PUT re-sends the whole registration (the SP rewrites it); list columns go as "a,b," strings.
    // On Approve the web generates a random 8-char login password (base64) — mirrored here. No Return, no remarks history.
    StaffRegistration: {
        title: 'Staff Registration Verification',
        successLabel: 'Staff registration',
        noun: 'registration',
        icon: UserPlus,
        searchPlaceholder: 'Search name, emp ref, department, designation…',
        queue: { route: 'HR/GetVerificationStaff', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.EmpRefNo,
        card: { title: (r) => staffName(r), subtitle: (r) => r.DesignatedAs, meta: (r) => [r.EmpRefNo, r.Department, r.Category].filter(Boolean).join(' · ') },
        searchText: (r) => `${staffName(r)} ${r.EmpRefNo} ${r.Department} ${r.DesignatedAs}`,
        detail: { route: 'HR/GetStaffMainDatabyId', params: (r, { roleId }) => ({ EmpRefNo: r.EmpRefNo, RoleId: roleId }) },
        rowAux: [{ name: 'docs', route: 'HR/GetEmployeeDocuments', params: (r) => ({ EmpRefno: r.EmpRefNo }) }],
        moid: (r, d) => d.MOID,
        showReturn: 'No',
        excludeActions: () => ['send back', 'return'],
        confirmLabel: 'I have verified all staff registration details, contact numbers, compliance fields and documents.',
        header: {
            title: (r, d) => staffName(d.FirstName ? d : r),
            subtitle: (r, d) => [d.DesignatedAs || r.DesignatedAs, d.Department || r.Department].filter(Boolean).join(' · '),
            chips: (r, d) => [d.EmpRefNo || r.EmpRefNo, d.Category || r.Category, d.JobType],
        },
        sections: (r, d) => {
            const marriage = d.MartialStatus !== 'Single' && d.DateofMarriage && !String(d.DateofMarriage).includes('1900');
            return [
                {
                    title: 'Personal',
                    fields: [
                        ['Full Name', staffName(d)], ['Age', d.EmpAge && `${d.EmpAge} years`], ['Date of Birth', d.DateofBirth], ['Gender', d.Gender],
                        ['Marital Status', d.MartialStatus], marriage && ['Marriage Date', d.DateofMarriage], ['Place of Birth', d.PlaceofBirth],
                        ['Mobile', d.ContactMobile], d.ContactWorkPhone && ['Work Phone', d.ContactWorkPhone], d.WorkEmail && ['Email', d.WorkEmail],
                        d.PermanentAddress && ['Permanent Address', d.PermanentAddress], d.PresentAddress && ['Present Address', d.PresentAddress],
                    ],
                },
                {
                    title: 'Government IDs',
                    fields: [
                        d.AdharNo && ['Aadhar', d.AdharNo], d.PanNo && ['PAN', d.PanNo], d.PFNumber && ['PF Number', d.PFNumber],
                        d.ESINumber && ['ESI Number', d.ESINumber], d.UANNumber && ['UAN Number', d.UANNumber],
                        ['PF', d.PFExist === 'Yes' ? 'Eligible' : 'Not eligible'], ['ESI', d.ESIExist === 'Yes' ? 'Eligible' : 'Not eligible'],
                    ],
                },
                {
                    title: 'Employment',
                    fields: [
                        ['Joining Type', d.JoiningType], ['Appointment Type', d.Appointmenttype], ['Joining Date', d.JoiningDate], ['Job Type', d.JobType],
                        ['Experience', d.Experience], ['Transit Days', d.TransitDay || 0], d.JoiningCCName && ['Cost Center', d.JoiningCCName],
                        d.GroupName && ['Group', d.GroupName], d.ReportToName && ['Reports To', d.ReportToName], d.ReportToRole && ['Reporting Role', d.ReportToRole],
                        d.Category === 'Contract Management Staff' && (d.ContractStartDate || d.ContractEndDate) && ['Contract Period', `${d.ContractStartDate || ''} to ${d.ContractEndDate || ''}`],
                        Number(d.Probationdays) > 0 && ['Probation', `${d.Probationdays} days`],
                        ['Joining Category', d.joiningcategory], ['Salary Access', d.SalaryAccess], ['Username Access', d.UsernameAccess],
                    ],
                },
                {
                    title: 'Bank',
                    fields: [d.BankAccountNo && ['Account No', d.BankAccountNo], d.BankName && ['Bank', d.BankName], d.IFSCcode && ['IFSC', d.IFSCcode], d.BankAddress && ['Bank Address', d.BankAddress]],
                },
                (d.NomineeName || d.NomineeRelation) && {
                    title: 'Nominee',
                    fields: [['Name', d.NomineeName], ['Relation', d.NomineeRelation], ['Date of Birth', d.NomineeDateofBirth], d.NomineeAge && ['Age', `${d.NomineeAge} years`]],
                },
                {
                    title: 'Compliance',
                    fields: [
                        ['Police Verification', d.PoliceVerification ? (d.PoliceVerification === 'Yes' ? 'Verified' : 'Not yet verified') : 'Not provided'],
                        ['No Police Case', d.UndertakingNoPoliceCaseAck === 'Yes' ? 'Confirmed' : 'Not confirmed'],
                        ['All Documents Authentic', d.UndertakingAuthenticDocsAck === 'Yes' ? 'Confirmed' : 'Not confirmed'],
                        ['Medically Fit', d.UndertakingMedicallyFitAck === 'Yes' ? 'Confirmed' : 'Not confirmed'],
                        d.ExpRemarks && ['Experience Remarks', d.ExpRemarks], d.ExpContactNames && ['Experience Contacts', d.ExpContactNames],
                        d.ApprovalNote && ['Previous Approval Notes', d.ApprovalNote],
                    ],
                },
            ].filter(Boolean) as SectionSpec[];
        },
        extra: (r, d, { aux }) => {
            const docs = list(aux.docs);
            const refs = list(d.EmpReferenceData);
            const hasDoc = (name: string) => docs.some((x) => x.DocName === name);
            return (
                <>
                    <TableBlock title={`Family members (${list(d.FamilyMemberData).length})`} heads={['Name', 'Relation', 'DOB', 'Age', 'Gender', 'Mobile']}
                        rows={list(d.FamilyMemberData).map((m) => [m.FMName, m.FMRelation, m.FMDateofBirth, m.FMAge, m.FMGender, m.FMMobileNo])} />
                    {list(d.ChildrensData).length ? (
                        <TableBlock title={`Children (${list(d.ChildrensData).length})`} heads={['Name', 'DOB', 'Age', 'Gender', 'Marital Status']}
                            rows={list(d.ChildrensData).map((c) => [c.ChildName, c.ChildDateofBirth, c.ChildAge, c.ChildGender, c.ChildMaritalStatus])} />
                    ) : null}
                    <TableBlock title={`Academic qualifications (${list(d.AcademicQualificationData).length})`} heads={['Qualification', 'University / Board', 'Duration', 'Percentage']}
                        rows={list(d.AcademicQualificationData).map((a) => [a.AcademicClass, a.NameofUniversity, `${a.FromYear} - ${a.ToYear}`, a.Percentage])} />
                    {list(d.TechnicalData).length ? (
                        <TableBlock title={`Technical skills (${list(d.TechnicalData).length})`} heads={['Skill', 'Institution', 'Duration', 'Score']}
                            rows={list(d.TechnicalData).map((t) => [t.TechnicalSkill, t.TechInstitutionName || t.InstitutionName, `${t.TechFromYear || t.FromYear} - ${t.TechToYear || t.ToYear}`, t.TechPercentage || t.Percentage])} />
                    ) : null}
                    {list(d.ExperienceData).length ? (
                        <TableBlock title={`Work experience (${list(d.ExperienceData).length})`} heads={['Organisation', 'Role', 'Duration', 'Contact']}
                            rows={list(d.ExperienceData).map((e) => [e.OrganisationName, e.Role, `${e.ExpFromYear || e.FromYear} - ${e.ExpToYear || e.ToYear}`, [e.HistoryContactName, e.HistoryReferenceNo || e.Mobilenos].filter(Boolean).join(' · ')])} />
                    ) : null}
                    <TableBlock title={`References (${refs.length}${refs.length >= 5 ? ' — 5 present' : ` — only ${refs.length} / 5`})`} heads={['Name', 'Relation', 'Mobile', 'Remarks']}
                        rows={refs.map((x) => [x.RefName, x.RefRelation || x.Relation, x.RefMobileNo, x.RefRemarks || x.FresherRefRemark])} />
                    <TableBlock
                        title={`Documents (${docs.length})`}
                        heads={['Document', 'Type', 'Status']}
                        rows={[
                            ...docs.map((x) => [x.DocName, x.FileType, (x.PDFBaseData || x.DocBinaryData || x.Path) ? 'Available' : 'Missing']),
                            ['Background verification', '', hasDoc('BackgroundVerification') ? 'Uploaded' : 'Missing'],
                            ['Signed personal undertaking', '', hasDoc('PersonalUndertaking') ? 'Uploaded' : 'Missing'],
                        ]}
                    />
                    <Text className="text-[11px] text-gray-500 px-1 mb-3">Open the documents themselves on the Corex web.</Text>
                </>
            );
        },
        approve: {
            route: 'HR/ApproveStaffRegistration',
            payload: (r, d, { action, note, user, roleId, aux }) => staffRegistrationPayload(r, d, list(aux.docs), { action, note, user, roleId }),
            ok: ANY,
        },
    },
};
