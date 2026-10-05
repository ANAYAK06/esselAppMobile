// Rejection alerts for the header bell — mirrors the web's rejectionAlertSlice. Read / dismiss
// update the list optimistically, then tell the backend.
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
    getRejectionAlerts,
    updateRejectionAlertStatus,
    type RejectionAlert,
} from '@/src/api/notifications/rejectionAlertAPI';

interface RejectionAlertsState {
    alerts: RejectionAlert[];
    loading: boolean;
    error: string | null;
}

const initialState: RejectionAlertsState = { alerts: [], loading: false, error: null };

export const fetchRejectionAlerts = createAsyncThunk<RejectionAlert[], string | number, { rejectValue: string }>(
    'rejectionAlerts/fetch',
    async (userId, { rejectWithValue }) => {
        try {
            return await getRejectionAlerts(userId);
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to fetch rejection alerts');
        }
    },
);

export const updateAlertStatus = createAsyncThunk<void, { RejectionAlertId: number; UserId: string | number; Status: 1 | 2 }, { rejectValue: string }>(
    'rejectionAlerts/updateStatus',
    async (payload, { rejectWithValue }) => {
        try {
            await updateRejectionAlertStatus(payload);
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to update rejection alert');
        }
    },
);

export const isAlertUnread = (a: RejectionAlert) => a.Status === 0 && !a.IsRead;

const rejectionAlertsSlice = createSlice({
    name: 'rejectionAlerts',
    initialState,
    reducers: {
        markAlertRead: (state, action: PayloadAction<number>) => {
            const alert = state.alerts.find((a) => a.RejectionAlertId === action.payload);
            if (alert) {
                alert.Status = 1;
                alert.IsRead = true;
            }
        },
        dismissAlert: (state, action: PayloadAction<number>) => {
            state.alerts = state.alerts.filter((a) => a.RejectionAlertId !== action.payload);
        },
        resetRejectionAlerts: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRejectionAlerts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRejectionAlerts.fulfilled, (state, action) => {
                state.loading = false;
                state.alerts = action.payload;
            })
            .addCase(fetchRejectionAlerts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch rejection alerts';
            })
            .addCase(updateAlertStatus.rejected, (state, action) => {
                state.error = action.payload || 'Failed to update rejection alert';
            });
    },
});

export const { markAlertRead, dismissAlert, resetRejectionAlerts } = rejectionAlertsSlice.actions;

export const selectRejectionAlerts = (state: any): RejectionAlert[] => state.rejectionAlerts.alerts;
export const selectRejectionAlertsLoading = (state: any): boolean => state.rejectionAlerts.loading;
export const selectUnreadRejectionCount = (state: any): number =>
    state.rejectionAlerts.alerts.filter(isAlertUnread).length;

export default rejectionAlertsSlice.reducer;
