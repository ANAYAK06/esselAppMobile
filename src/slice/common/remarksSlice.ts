// src/slice/common/remarksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as remarksAPI from '@/src/api/common/remarksAPI';
import type { RemarkItem } from '@/src/api/common/remarksAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

export interface RemarksState {
    remarks: RemarkItem[];
    remarksLoading: boolean;
    remarksError: string | null;
    currentTrno: string | null;
    currentMoid: string | null;
}

const initialState: RemarksState = {
    remarks: [],
    remarksLoading: false,
    remarksError: null,
    currentTrno: null,
    currentMoid: null,
};

// ==============================================
// ASYNC THUNKS
// ==============================================

/**
 * Fetch remarks/approval history for a transaction
 */
export const fetchRemarks = createAsyncThunk(
    'remarks/fetchRemarks',
    async ({ trno, moid }: { trno: string | number; moid: string | number }, { rejectWithValue }) => {
        try {
            const response = await remarksAPI.getRemarks(trno, moid);

            // Handle backend returning Data even with IsSuccessful: false
            if (response.Data && Array.isArray(response.Data)) {
                console.log('✅ Remarks loaded:', response.Data.length, 'items');
                return {
                    remarks: response.Data,
                    trno: String(trno),
                    moid: String(moid),
                };
            } else if (response.IsSuccessful) {
                return {
                    remarks: response.Data || [],
                    trno: String(trno),
                    moid: String(moid),
                };
            } else {
                return rejectWithValue(response.Message || 'Failed to fetch remarks');
            }

        } catch (error: any) {
            console.error('❌ Remarks thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch remarks');
        }
    }
);

// ==============================================
// SLICE
// ==============================================

const remarksSlice = createSlice({
    name: 'remarks',
    initialState,
    reducers: {
        // Clear remarks when switching to a different item
        clearRemarks: (state) => {
            state.remarks = [];
            state.remarksError = null;
            state.currentTrno = null;
            state.currentMoid = null;
        },

        // Set current transaction identifiers
        setCurrentTransaction: (state, action: PayloadAction<{ trno: string; moid: string }>) => {
            state.currentTrno = action.payload.trno;
            state.currentMoid = action.payload.moid;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRemarks.pending, (state) => {
                state.remarksLoading = true;
                state.remarksError = null;
            })
            .addCase(fetchRemarks.fulfilled, (state, action) => {
                state.remarksLoading = false;
                state.remarks = action.payload.remarks;
                state.currentTrno = action.payload.trno;
                state.currentMoid = action.payload.moid;
                state.remarksError = null;
            })
            .addCase(fetchRemarks.rejected, (state, action) => {
                state.remarksLoading = false;
                state.remarksError = action.payload as string;
            });
    },
});

// ==============================================
// EXPORTS
// ==============================================

export const { clearRemarks, setCurrentTransaction } = remarksSlice.actions;

// Selectors
export const selectRemarks = (state: { remarks: RemarksState }) => state.remarks.remarks;
export const selectRemarksLoading = (state: { remarks: RemarksState }) => state.remarks.remarksLoading;
export const selectRemarksError = (state: { remarks: RemarksState }) => state.remarks.remarksError;
export const selectCurrentTransaction = (state: { remarks: RemarksState }) => ({
    trno: state.remarks.currentTrno,
    moid: state.remarks.currentMoid,
});

export default remarksSlice.reducer;