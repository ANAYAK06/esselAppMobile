// src/api/hr/employeePortalAPI.ts
// Employee Portal endpoints — same calls the Corex web app's Employee Portal makes.
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
    [key: string]: any;
}

export type PortalRequestStatus = 'Pending' | 'Verified' | 'Approved' | 'Rejected';

export interface PortalRequest {
    Id: number | string;
    RequestType: 'Leave' | 'Advance' | string;
    Status: PortalRequestStatus | string;
    SubmittedOn: string;
    // Leave requests
    LeaveName?: string;
    NoOfDays?: number;
    FromDate?: string;
    // Advance requests
    AdvanceType?: 'LTA' | 'SA' | string;
    Amount?: number;
    [key: string]: any;
}

// Pending approvals are portal requests raised by the reporting person's team
export interface PortalPendingApproval extends PortalRequest {
    EmployeeName?: string;
}

// ==============================================
// API CALLS
// ==============================================

const get = async <T>(path: string, params: Record<string, string>): Promise<ApiResponse<T>> => {
    const response = await axios.get<ApiResponse<T>>(`${API_BASE_URL}${path}`, {
        params,
        headers: { 'Content-Type': 'application/json' },
    });
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
