// src/slice/hr/employeePortalSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as employeePortalAPI from '@/src/api/hr/employeePortalAPI';
import type {
    ApiResponse,
    AttendanceRecord,
    LeaveApplicationContext,
    LeaveBalance,
    LeaveType,
    LoanAdvanceStatus,
    LoanDetail,
    PayslipListItem,
    PFESIDetails,
    PortalPendingApproval,
    PortalRequest,
    Reportee,
    ReporteeEvaluation,
    ReportingPerson,
} from '@/src/api/hr/employeePortalAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

export interface EmployeePhoto {
    base64: string | null;
    fileType: string | null;
}

type PortalKey =
    | 'leaveBalances'
    | 'payslipList'
    | 'attendance'
    | 'myPortalRequests'
    | 'isPortalReportingPerson'
    | 'portalPendingApprovals'
    | 'leaveTypes'
    | 'leaveApplicationContext'
    | 'reportingPerson'
    | 'pfEsiHistory'
    | 'loanDetails'
    | 'loanAdvanceStatus'
    | 'myReportees'
    | 'reporteeEvaluation'
    | 'myPhoto';

export interface EmployeePortalState {
    leaveBalances: LeaveBalance[];
    payslipList: PayslipListItem[];
    attendance: AttendanceRecord | null; // current month, for the dashboard
    myPortalRequests: PortalRequest[];
    isPortalReportingPerson: boolean;
    portalPendingApprovals: PortalPendingApproval[];
    leaveTypes: LeaveType[];
    leaveApplicationContext: LeaveApplicationContext | null;
    reportingPerson: ReportingPerson | null;
    pfEsiHistory: PFESIDetails | null;
    loanDetails: LoanDetail[];
    loanAdvanceStatus: LoanAdvanceStatus | null;
    myReportees: Reportee[];
    reporteeEvaluation: ReporteeEvaluation | null;
    myPhoto: EmployeePhoto | null;

    // Attendance screen: any month, keyed "September-2026" (null = no record that month)
    attendanceByPeriod: Record<string, AttendanceRecord | null>;
    attendancePeriodLoading: Record<string, boolean>;

    // Reportee photos cached per EmpRefNo (base64 null = no photo, still cached)
    reporteePhotos: Record<string, EmployeePhoto>;
    reporteePhotoLoading: Record<string, boolean>;

    loading: Record<PortalKey, boolean>;
    errors: Record<PortalKey, string | null>;
}

const keys: PortalKey[] = [
    'leaveBalances',
    'payslipList',
    'attendance',
    'myPortalRequests',
    'isPortalReportingPerson',
    'portalPendingApprovals',
    'leaveTypes',
    'leaveApplicationContext',
    'reportingPerson',
    'pfEsiHistory',
    'loanDetails',
    'loanAdvanceStatus',
    'myReportees',
    'reporteeEvaluation',
    'myPhoto',
];

const initialState: EmployeePortalState = {
    leaveBalances: [],
    payslipList: [],
    attendance: null,
    myPortalRequests: [],
    isPortalReportingPerson: false,
    portalPendingApprovals: [],
    leaveTypes: [],
    leaveApplicationContext: null,
    reportingPerson: null,
    pfEsiHistory: null,
    loanDetails: [],
    loanAdvanceStatus: null,
    myReportees: [],
    reporteeEvaluation: null,
    myPhoto: null,

    attendanceByPeriod: {},
    attendancePeriodLoading: {},
    reporteePhotos: {},
    reporteePhotoLoading: {},

    loading: Object.fromEntries(keys.map((k) => [k, false])) as Record<PortalKey, boolean>,
    errors: Object.fromEntries(keys.map((k) => [k, null])) as Record<PortalKey, string | null>,
};

// The backend returns lists either wrapped in Data or as a bare array
const asArray = <T>(payload: ApiResponse<T[]> | T[] | undefined): T[] =>
    Array.isArray((payload as ApiResponse<T[]>)?.Data)
        ? (payload as ApiResponse<T[]>).Data
        : Array.isArray(payload) ? payload : [];

// Objects come back in Data; IsSuccessful is unreliable on this backend, so only Data is checked
const asObject = <T>(payload: ApiResponse<T> | undefined): T | null =>
    payload?.Data && typeof payload.Data === 'object' ? payload.Data : null;

const errorMessage = (error: any, fallback: string) => error?.message || fallback;

// Every read thunk has the same try/catch shape
const portalThunk = <Result, Arg>(name: string, fallback: string, run: (arg: Arg) => Promise<Result>) =>
    createAsyncThunk<Result, Arg, { rejectValue: string }>(
        `employeePortal/${name}`,
        async (arg, { rejectWithValue }) => {
            try {
                return await run(arg);
            } catch (error) {
                return rejectWithValue(errorMessage(error, fallback));
            }
        }
    );

const photoOf = (docs: ApiResponse<employeePortalAPI.EmployeeDocument[]>): EmployeePhoto => {
    const photo = asArray(docs).find((d) => d.DocName === 'Photo');
    return { base64: photo?.DocBinaryData || null, fileType: photo?.FileType || null };
};

// ==============================================
// ASYNC THUNKS
// ==============================================

export const fetchMyLeaveBalances = portalThunk('fetchMyLeaveBalances', 'Failed to fetch leave balances',
    async (empRefNo: string) => asArray(await employeePortalAPI.getMyLeaveBalances(empRefNo)));

export const fetchMyPayslipList = portalThunk('fetchMyPayslipList', 'Failed to fetch payslip list',
    async (empRefNo: string) => asArray(await employeePortalAPI.getMyPayslipList(empRefNo)));

export const fetchMyAttendance = portalThunk('fetchMyAttendance', 'Failed to fetch attendance',
    async ({ empRefNo, month, year }: { empRefNo: string; month: string; year: number }) =>
        asArray(await employeePortalAPI.getMyAttendance(empRefNo, month, year))[0] ?? null);

export const fetchMyPortalRequests = portalThunk('fetchMyPortalRequests', 'Failed to fetch your requests',
    async (empRefNo: string) => asArray(await employeePortalAPI.getMyPortalRequests(empRefNo)));

export const fetchIsPortalReportingPerson = portalThunk('fetchIsPortalReportingPerson', 'Failed to resolve reporting-person status',
    async (empRefNo: string) => (await employeePortalAPI.getIsPortalReportingPerson(empRefNo))?.Data === true);

export const fetchPortalPendingApprovals = portalThunk('fetchPortalPendingApprovals', 'Failed to fetch pending approvals',
    async (empRefNo: string) => asArray(await employeePortalAPI.getPortalPendingApprovals(empRefNo)));

export const fetchLeaveTypesForPortal = portalThunk('fetchLeaveTypesForPortal', 'Failed to fetch leave types',
    async (username: string) => asArray(await employeePortalAPI.getLeaveTypesForPortal(username)));

export const fetchLeaveApplicationContext = portalThunk('fetchLeaveApplicationContext', 'Failed to fetch leave balance',
    async (empRefNo: string) => asObject(await employeePortalAPI.getLeaveApplicationContext(empRefNo)));

export const fetchMyReportingPerson = portalThunk('fetchMyReportingPerson', 'Failed to fetch reporting person',
    async (empRefNo: string) => asObject(await employeePortalAPI.getMyReportingPerson(empRefNo)));

export const fetchMyPFESIHistory = portalThunk('fetchMyPFESIHistory', 'Failed to fetch PF/ESI details',
    async (empRefNo: string) => asObject(await employeePortalAPI.getMyPFESIHistory(empRefNo)));

export const fetchMyLoanDetails = portalThunk('fetchMyLoanDetails', 'Failed to fetch loan details',
    async (empRefNo: string) => asArray(await employeePortalAPI.getMyLoanDetails(empRefNo)));

export const fetchMyLoanAdvanceStatus = portalThunk('fetchMyLoanAdvanceStatus', 'Failed to fetch loan/advance status',
    async (empRefNo: string) => asObject(await employeePortalAPI.getMyLoanAdvanceStatus(empRefNo)));

export const fetchMyReportees = portalThunk('fetchMyReportees', 'Failed to fetch reportees',
    async ({ empRefNo, periodYear }: { empRefNo: string; periodYear: number }) =>
        asArray(await employeePortalAPI.getMyReportees(empRefNo, periodYear)));

export const fetchReporteeEvaluation = portalThunk('fetchReporteeEvaluation', 'Failed to load evaluation',
    async ({ empRefNo, reportingPersonEmpRefNo, periodYear }: { empRefNo: string; reportingPersonEmpRefNo: string; periodYear: number }) =>
        asObject(await employeePortalAPI.getReporteeEvaluation(empRefNo, reportingPersonEmpRefNo, periodYear)));

export const fetchMyPhoto = portalThunk('fetchMyPhoto', 'Failed to fetch photo',
    async (empRefNo: string) => photoOf(await employeePortalAPI.getEmployeeDocuments(empRefNo)));

// Attendance screen months are cached separately so they never overwrite the dashboard's month
export const fetchAttendancePeriod = createAsyncThunk<
    AttendanceRecord | null,
    { empRefNo: string; month: string; year: number },
    { rejectValue: string }
>('employeePortal/fetchAttendancePeriod', async ({ empRefNo, month, year }, { rejectWithValue }) => {
    try {
        return asArray(await employeePortalAPI.getMyAttendance(empRefNo, month, year))[0] ?? null;
    } catch (error) {
        return rejectWithValue(errorMessage(error, 'Failed to fetch attendance'));
    }
});

export const fetchReporteePhoto = createAsyncThunk<EmployeePhoto, string, { rejectValue: string }>(
    'employeePortal/fetchReporteePhoto',
    async (empRefNo, { rejectWithValue }) => {
        try {
            return photoOf(await employeePortalAPI.getEmployeeDocuments(empRefNo));
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to fetch photo'));
        }
    }
);

export const periodKey = (month: string, year: number) => `${month}-${year}`;

// ==============================================
// SLICE
// ==============================================

const employeePortalSlice = createSlice({
    name: 'employeePortal',
    initialState,
    reducers: {
        resetEmployeePortal: () => initialState,
        clearReporteeEvaluation: (state) => {
            state.reporteeEvaluation = null;
            state.errors.reporteeEvaluation = null;
        },
    },
    extraReducers: (builder) => {
        // Every thunk follows the same pending / fulfilled / rejected shape;
        // on failure the value falls back to its empty initial value.
        const track = <K extends PortalKey>(thunk: any, key: K) => {
            builder
                .addCase(thunk.pending, (state: EmployeePortalState) => {
                    state.loading[key] = true;
                    state.errors[key] = null;
                })
                .addCase(thunk.fulfilled, (state: EmployeePortalState, action: any) => {
                    state.loading[key] = false;
                    (state as any)[key] = action.payload;
                })
                .addCase(thunk.rejected, (state: EmployeePortalState, action: any) => {
                    state.loading[key] = false;
                    state.errors[key] = action.payload ?? 'Request failed';
                    (state as any)[key] = initialState[key];
                });
        };

        track(fetchMyLeaveBalances, 'leaveBalances');
        track(fetchMyPayslipList, 'payslipList');
        track(fetchMyAttendance, 'attendance');
        track(fetchMyPortalRequests, 'myPortalRequests');
        track(fetchIsPortalReportingPerson, 'isPortalReportingPerson');
        track(fetchPortalPendingApprovals, 'portalPendingApprovals');
        track(fetchLeaveTypesForPortal, 'leaveTypes');
        track(fetchLeaveApplicationContext, 'leaveApplicationContext');
        track(fetchMyReportingPerson, 'reportingPerson');
        track(fetchMyPFESIHistory, 'pfEsiHistory');
        track(fetchMyLoanDetails, 'loanDetails');
        track(fetchMyLoanAdvanceStatus, 'loanAdvanceStatus');
        track(fetchMyReportees, 'myReportees');
        track(fetchReporteeEvaluation, 'reporteeEvaluation');
        track(fetchMyPhoto, 'myPhoto');

        builder
            .addCase(fetchAttendancePeriod.pending, (state, action) => {
                const { month, year } = action.meta.arg;
                state.attendancePeriodLoading[periodKey(month, year)] = true;
            })
            .addCase(fetchAttendancePeriod.fulfilled, (state, action) => {
                const key = periodKey(action.meta.arg.month, action.meta.arg.year);
                state.attendancePeriodLoading[key] = false;
                state.attendanceByPeriod[key] = action.payload;
            })
            .addCase(fetchAttendancePeriod.rejected, (state, action) => {
                const key = periodKey(action.meta.arg.month, action.meta.arg.year);
                state.attendancePeriodLoading[key] = false;
                state.attendanceByPeriod[key] = null;
            })
            .addCase(fetchReporteePhoto.pending, (state, action) => {
                state.reporteePhotoLoading[action.meta.arg] = true;
            })
            .addCase(fetchReporteePhoto.fulfilled, (state, action) => {
                state.reporteePhotoLoading[action.meta.arg] = false;
                state.reporteePhotos[action.meta.arg] = action.payload;
            })
            .addCase(fetchReporteePhoto.rejected, (state, action) => {
                state.reporteePhotoLoading[action.meta.arg] = false;
                state.reporteePhotos[action.meta.arg] = { base64: null, fileType: null };
            });
    },
});

export const { resetEmployeePortal, clearReporteeEvaluation } = employeePortalSlice.actions;
export default employeePortalSlice.reducer;
