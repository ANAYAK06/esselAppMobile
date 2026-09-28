// src/slice/hr/employeePortalSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as employeePortalAPI from '@/src/api/hr/employeePortalAPI';
import type {
    ApiResponse,
    AttendanceRecord,
    LeaveBalance,
    PayslipListItem,
    PortalPendingApproval,
    PortalRequest,
} from '@/src/api/hr/employeePortalAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

type PortalKey =
    | 'leaveBalances'
    | 'payslipList'
    | 'attendance'
    | 'myPortalRequests'
    | 'isPortalReportingPerson'
    | 'portalPendingApprovals';

export interface EmployeePortalState {
    leaveBalances: LeaveBalance[];
    payslipList: PayslipListItem[];
    attendance: AttendanceRecord | null;
    myPortalRequests: PortalRequest[];
    isPortalReportingPerson: boolean;
    portalPendingApprovals: PortalPendingApproval[];

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
];

const initialState: EmployeePortalState = {
    leaveBalances: [],
    payslipList: [],
    attendance: null,
    myPortalRequests: [],
    isPortalReportingPerson: false,
    portalPendingApprovals: [],

    loading: Object.fromEntries(keys.map((k) => [k, false])) as Record<PortalKey, boolean>,
    errors: Object.fromEntries(keys.map((k) => [k, null])) as Record<PortalKey, string | null>,
};

// The backend returns lists either wrapped in Data or as a bare array
const asArray = <T>(payload: ApiResponse<T[]> | T[] | undefined): T[] =>
    Array.isArray((payload as ApiResponse<T[]>)?.Data)
        ? (payload as ApiResponse<T[]>).Data
        : Array.isArray(payload) ? payload : [];

const errorMessage = (error: any, fallback: string) => error?.message || fallback;

// ==============================================
// ASYNC THUNKS
// ==============================================

export const fetchMyLeaveBalances = createAsyncThunk<LeaveBalance[], string, { rejectValue: string }>(
    'employeePortal/fetchMyLeaveBalances',
    async (empRefNo, { rejectWithValue }) => {
        try {
            return asArray(await employeePortalAPI.getMyLeaveBalances(empRefNo));
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to fetch leave balances'));
        }
    }
);

export const fetchMyPayslipList = createAsyncThunk<PayslipListItem[], string, { rejectValue: string }>(
    'employeePortal/fetchMyPayslipList',
    async (empRefNo, { rejectWithValue }) => {
        try {
            return asArray(await employeePortalAPI.getMyPayslipList(empRefNo));
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to fetch payslip list'));
        }
    }
);

export const fetchMyAttendance = createAsyncThunk<
    AttendanceRecord | null,
    { empRefNo: string; month: string; year: number },
    { rejectValue: string }
>(
    'employeePortal/fetchMyAttendance',
    async ({ empRefNo, month, year }, { rejectWithValue }) => {
        try {
            const response = await employeePortalAPI.getMyAttendance(empRefNo, month, year);
            return asArray(response)[0] ?? null;
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to fetch attendance'));
        }
    }
);

export const fetchMyPortalRequests = createAsyncThunk<PortalRequest[], string, { rejectValue: string }>(
    'employeePortal/fetchMyPortalRequests',
    async (empRefNo, { rejectWithValue }) => {
        try {
            return asArray(await employeePortalAPI.getMyPortalRequests(empRefNo));
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to fetch your requests'));
        }
    }
);

export const fetchIsPortalReportingPerson = createAsyncThunk<boolean, string, { rejectValue: string }>(
    'employeePortal/fetchIsPortalReportingPerson',
    async (empRefNo, { rejectWithValue }) => {
        try {
            const response = await employeePortalAPI.getIsPortalReportingPerson(empRefNo);
            return response?.Data === true;
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to resolve reporting-person status'));
        }
    }
);

export const fetchPortalPendingApprovals = createAsyncThunk<PortalPendingApproval[], string, { rejectValue: string }>(
    'employeePortal/fetchPortalPendingApprovals',
    async (empRefNo, { rejectWithValue }) => {
        try {
            return asArray(await employeePortalAPI.getPortalPendingApprovals(empRefNo));
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Failed to fetch pending approvals'));
        }
    }
);

// ==============================================
// SLICE
// ==============================================

const employeePortalSlice = createSlice({
    name: 'employeePortal',
    initialState,
    reducers: {
        resetEmployeePortal: () => initialState,
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
    },
});

export const { resetEmployeePortal } = employeePortalSlice.actions;
export default employeePortalSlice.reducer;
