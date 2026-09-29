// src/api/hr/employeePortalAPI.ts
// Employee Portal endpoints — same calls the Corex web app's Employee Portal makes
// (RAPP-SLAPP frontend: src/api/HRAPI/employeePortalAPI.js).
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface ApiResponse<T> {
    IsSuccessful: boolean;
    Message: string;
    Data: T;
}

export interface LeaveBalance {
    LeaveTypeId: number | string;
    LeaveName: string;
    AssignedLeaves: number;
    BalanceLeaves: number;
    [key: string]: any;
}

export interface PayslipListItem {
    MonthName: string;
    Year: number | string;
    NetValue: number;
    [key: string]: any;
}

// One row per employee; day columns are keyed like "01#Mon" with values such as 'P' / 'A'
export interface AttendanceRecord {
    TotalMonthDays?: number;
    TotalPresentDays?: number;
    [key: string]: any;
}

export type PortalRequestStatus = 'Pending' | 'Verified' | 'Approved' | 'Rejected';

export interface PortalRequest {
    Id: number | string;
    RequestType: 'Leave' | 'Advance' | string;
    Status: PortalRequestStatus | string;
    SubmittedOn: string;
    Reason?: string;
    RejectRemarks?: string;
    TransactionRefNo?: string;
    // Leave requests
    LeaveName?: string;
    NoOfDays?: number;
    FromDate?: string;
    ToDate?: string;
    ContactNumber?: string;
    // Advance requests
    AdvanceType?: 'LTA' | 'SA' | string;
    Amount?: number;
    EMIAmount?: number;
    NoOfInstallments?: number;
    EMIStartDate?: string;
    [key: string]: any;
}

// Pending approvals are portal requests raised by the reporting person's team
export interface PortalPendingApproval extends PortalRequest {
    EmployeeName?: string;
    EmpRefNo?: string;
}

export interface LeaveType {
    LeaveId: number | string;
    LeaveName: string;
    [key: string]: any;
}

// From GetSingleEmpForLeaveRequest — the web portal shows Balanceleaves and PreviousLRDate
export interface LeaveApplicationContext {
    Balanceleaves?: number | string;
    PreviousLRDate?: string;
    [key: string]: any;
}

export interface ReportingPerson {
    EmployeeName?: string;
    [key: string]: any;
}

export interface PFESIHistoryRow {
    Type: 'PF' | 'ESI' | string;
    Month?: number;
    MonthName: string;
    Year: number | string;
    CCCode?: string;
    CCName?: string;
    EmployeeContAmt: number;
    EmployerContAmt: number;
    [key: string]: any;
}

export interface PFESIDetails {
    UANNumber?: string;
    PFNumber?: string;
    ESINumber?: string;
    History?: PFESIHistoryRow[];
    [key: string]: any;
}

export interface LoanDetail {
    TransactionRefNo: string;
    AdvanceType: 'LTA' | 'SA' | string;
    LTAValue: number;
    LTABalance: number;
    EMI: number;
    NoOfInstallments: number;
    NoOfBalanceInstallments: number;
    EMIStartDate?: string;
    LoanStatus: 'Running' | 'Closed' | string;
    [key: string]: any;
}

export interface LoanAdvanceStatus {
    RepaymentHistory?: {
        TransactionRefNo: string;
        PayRollRefno?: string;
        RepaymentMonth: string;
        AdvanceType: string;
        InstallmentNo: number;
        EMIPaid: number;
        BalanceAfterPayment: number;
        [key: string]: any;
    }[];
    SkippedMonths?: {
        TransactionRefNo: string;
        AdvanceType: string;
        SkippedOnDate: string;
        SkippedAmount: number;
        Status: string;
        [key: string]: any;
    }[];
    [key: string]: any;
}

export interface Reportee {
    EmpRefNo: string;
    EmployeeName: string;
    DesignationName?: string;
    DepartmentName?: string;
    StaffType: 'Site' | 'Office' | string;
    MappingType?: 'Default' | string;
    JoiningCostCenter?: string;
    CCName?: string;
    CCType?: string;
    EvaluationStatus: 'Submitted' | 'Draft' | 'Not Started' | string;
    OverallRating?: number | null;
    [key: string]: any;
}

export interface EvaluationLine {
    CategoryId: number | string;
    CategoryName: string;
    Description?: string;
    Rating?: number | null;
    Remarks?: string | null;
    [key: string]: any;
}

export interface ReporteeEvaluation {
    Context: {
        EmpRefNo: string;
        EmployeeName: string;
        PeriodYear: number;
        StaffType: 'Site' | 'Office' | string;
        DesignationName?: string;
        DepartmentName?: string;
        JoiningCostCenter?: string;
        CCName?: string;
        CCType?: string;
        EvaluationStatus?: string;
        OverallRating?: number | null;
        OverallRemarks?: string | null;
        SubmittedOn?: string;
        [key: string]: any;
    } | null;
    Lines: EvaluationLine[];
}

export interface EmployeeDocument {
    DocName: string;
    DocBinaryData?: string; // base64
    FileType?: string;
    [key: string]: any;
}

// Portal POSTs report the outcome as text in Data ("Submitted", "Approved…", "Error$<reason>")
export type PortalActionResult = ApiResponse<string>;

// ==============================================
// API CALLS
// ==============================================

const headers = { 'Content-Type': 'application/json' };

const get = async <T>(path: string, params: Record<string, string | number | null>): Promise<ApiResponse<T>> => {
    const response = await axios.get<ApiResponse<T>>(`${API_BASE_URL}${path}`, { params, headers });
    return response.data;
};

const post = async <T>(path: string, data: unknown): Promise<ApiResponse<T>> => {
    const response = await axios.post<ApiResponse<T>>(`${API_BASE_URL}${path}`, data, { headers });
    return response.data;
};

// Leave balance per leave type (current year)
export const getMyLeaveBalances = (empRefNo: string) =>
    get<LeaveBalance[]>('/HR/GetMyLeaveBalances', { EmpRefNo: empRefNo });

// Payslip periods, most recent first
export const getMyPayslipList = (empRefNo: string) =>
    get<PayslipListItem[]>('/HR/GetMyPayslipList', { EmpRefNo: empRefNo });

// Monthly attendance for one employee (ReportType 'ID'); month is the full month name
// Note: the backend expects a lowercase 'year' query parameter
export const getMyAttendance = (empRefNo: string, month: string, year: number) =>
    get<AttendanceRecord[]>('/HR/GetAttendanceData', {
        TypeValue: empRefNo.trim(),
        Month: month,
        year: String(year),
        ReportType: 'ID',
    });

// Requests this employee raised from the portal + their verification status
export const getMyPortalRequests = (empRefNo: string) =>
    get<PortalRequest[]>('/HR/GetMyPortalRequests', { EmpRefNo: empRefNo });

// Whether this employee is a reporting person (Data === true)
export const getIsPortalReportingPerson = (empRefNo: string) =>
    get<boolean>('/HR/GetIsPortalReportingPerson', { EmpRefNo: empRefNo });

// Team requests awaiting this reporting person's verification
export const getPortalPendingApprovals = (empRefNo: string) =>
    get<PortalPendingApproval[]>('/HR/GetPortalPendingApprovals', { EmpRefNo: empRefNo });

// Leave types this employee can apply for (gender-filtered); takes the login username
export const getLeaveTypesForPortal = (username: string) =>
    get<LeaveType[]>('/HR/GetLeaveTypes', { UID: username });

// Balance and last-leave return date, shared with the classic leave request screen
export const getLeaveApplicationContext = (empRefNo: string) =>
    get<LeaveApplicationContext>('/HR/GetSingleEmpForLeaveRequest', { EmpRefno: empRefNo.trim() });

// Who a portal request from this employee is routed to for verification
export const getMyReportingPerson = (empRefNo: string) =>
    get<ReportingPerson>('/HR/GetMyReportingPerson', { EmpRefNo: empRefNo });

// PF/ESI statutory numbers + approved contribution history
export const getMyPFESIHistory = (empRefNo: string) =>
    get<PFESIDetails>('/HR/GetMyPFESIHistory', { EmpRefNo: empRefNo });

// Repayment history + skipped months across this employee's advances
export const getMyLoanAdvanceStatus = (empRefNo: string) =>
    get<LoanAdvanceStatus>('/HR/GetMyLoanAdvanceStatus', { EmpRefNo: empRefNo });

// One row per approved Running/Closed loan or advance
export const getMyLoanDetails = (empRefNo: string) =>
    get<LoanDetail[]>('/HR/GetMyLoanDetails', { EmpRefNo: empRefNo });

// Uploaded documents (photo, ID proofs) — the profile only uses DocName === 'Photo'
export const getEmployeeDocuments = (empRefNo: string) =>
    get<EmployeeDocument[]>('/HR/GetEmployeeDocuments', { EmpRefno: empRefNo });

// Employees reporting to this reporting person, with this year's evaluation status
export const getMyReportees = (empRefNo: string, periodYear: number | null = null) =>
    get<Reportee[]>('/HR/GetMyReportees', { EmpRefNo: empRefNo, PeriodYear: periodYear });

// One reportee's evaluation for a year — every category with saved ratings pre-filled
export const getReporteeEvaluation = (empRefNo: string, reportingPersonEmpRefNo: string, periodYear: number | null = null) =>
    get<ReporteeEvaluation>('/HR/GetReporteeEvaluation', {
        EmpRefNo: empRefNo,
        ReportingPersonEmpRefNo: reportingPersonEmpRefNo,
        PeriodYear: periodYear,
    });

export const submitPortalLeaveRequest = (data: {
    EmpRefNo: string;
    LeaveTypeId: number | string;
    FromDate: string;
    ToDate: string;
    NoOfDays: number;
    ContactNumber: string;
    Reason: string;
    CreatedBy: string;
}) => post<string>('/HR/SubmitPortalLeaveRequest', data);

export const submitPortalAdvanceRequest = (data: {
    EmpRefNo: string;
    AdvanceType: 'LTA' | 'SA';
    LTAAmount: number;
    EmiAmount: number;
    EMIStartDate: string;
    Purpose: string;
    RequestDate: string | null;
    CreatedBy: string;
}) => post<string>('/HR/SubmitPortalAdvanceRequest', data);

// Reporting person's Accept / Reject — leave and advance requests use different endpoints
export const actionPortalRequest = (data: {
    Id: number | string;
    RequestType: string;
    Action: 'Approve' | 'Reject';
    ActionBy: string;
    RejectRemarks: string | null;
}) =>
    post<string>(
        data.RequestType === 'Advance' ? '/HR/ActionPortalAdvanceRequest' : '/HR/ActionPortalLeaveRequest',
        data
    );

export const saveReporteeEvaluation = (data: {
    EmpRefNo: string;
    ReportingPersonId: string;
    PeriodYear: number;
    OverallRemarks: string | null;
    Status: 'Draft' | 'Submitted';
    CreatedBy: string;
    Details: { CategoryId: number | string; Rating: number; Remarks: string | null }[];
}) => post<string>('/HR/SaveReporteeEvaluation', data);

// Same endpoint (a PUT) the web app's Change Password card uses
export const updatePassword = async (username: string, newPassword: string) => {
    const response = await axios.put<ApiResponse<unknown>>(
        `${API_BASE_URL}/Accounts/UpdatePassword`,
        { Username: username, Password: newPassword, Createdby: username, LoginType: '' },
        { headers }
    );
    return response.data;
};
