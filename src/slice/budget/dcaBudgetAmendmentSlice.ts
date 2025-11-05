// src/slice/budget/dcaBudgetAmendmentSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as dcaBudgetAPI from '@/src/api/budget/dcaBudgetAmendmentAPI';
import type {
    VerificationDCAAmendItem,
    VerifyDCABudgetAmendById,
    ApproveDCABudgetAmendPayload,
} from '@/src/api/budget/dcaBudgetAmendmentAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

export interface DCABudgetAmendmentState {
    // List data (inbox)
    amendments: VerificationDCAAmendItem[];
    amendmentsLoading: boolean;
    amendmentsError: string | null;

    // Detail data (verification screen)
    currentAmendment: VerifyDCABudgetAmendById | null;
    currentAmendmentLoading: boolean;
    currentAmendmentError: string | null;

    // Approval/verification action
    approvalLoading: boolean;
    approvalError: string | null;
    approvalSuccess: boolean;

    // Grid data
    gridData: any[];
    gridLoading: boolean;
    gridError: string | null;

    // Filters
    filterStatus: string | null;
    searchQuery: string;
}

const initialState: DCABudgetAmendmentState = {
    amendments: [], // ✅ CRITICAL: Always initialize as empty array
    amendmentsLoading: false,
    amendmentsError: null,

    currentAmendment: null,
    currentAmendmentLoading: false,
    currentAmendmentError: null,

    approvalLoading: false,
    approvalError: null,
    approvalSuccess: false,

    gridData: [],
    gridLoading: false,
    gridError: null,

    filterStatus: null,
    searchQuery: '',
};

// ==============================================
// ASYNC THUNKS
// ==============================================

/**
 * Fetch list of DCA budget amendments pending approval (Inbox)
 */
export const fetchDCAAmendmentsList = createAsyncThunk(
    'dcaBudgetAmendment/fetchList',
    async ({ roleId, userId }: { roleId: string; userId: string }, { rejectWithValue }) => {
        try {
            console.log('🔍 Thunk: Fetching DCA Amendments List:', { roleId, userId });

            const response = await dcaBudgetAPI.getVerificationDCAAmends(roleId, userId);

            console.log('🔍 API Response Check:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataLength: response.Data?.length,
            });

            // ✅ FIX: Always return an array
            if (response.Data && Array.isArray(response.Data)) {
                console.log('✅ Data found, returning:', response.Data.length, 'items');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data || [];
            } else {
                return rejectWithValue(response.Message || 'No data available');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch DCA amendments list');
        }
    }
);

/**
 * Fetch single DCA amendment details for verification
 */
export const fetchDCAAmendmentById = createAsyncThunk(
    'dcaBudgetAmendment/fetchById',
    async (
        { ccCode, fyear, ctype, status }: { ccCode: string; fyear: string; ctype: string; status: string },
        { rejectWithValue }
    ) => {
        try {
            console.log('🔍 Thunk: Fetching DCA Amendment by ID:', { ccCode, fyear, ctype, status });

            const response = await dcaBudgetAPI.getVerifyDCABudgetAmendById(ccCode, fyear, ctype, status);

            console.log('📦 Thunk: API Response:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataKeys: response.Data ? Object.keys(response.Data) : [],
            });

            if (response.Data) {
                console.log('✅ Thunk: Returning data');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data;
            } else {
                console.error('❌ Thunk: No data found');
                return rejectWithValue(response.Message || 'DCA Amendment not found');
            }
        } catch (error: any) {
            console.error('❌ Thunk: Error:', error);
            return rejectWithValue(error.message || 'Failed to fetch DCA amendment details');
        }
    }
);

/**
 * Fetch DCA Budget Amendment Grid Data
 */
export const fetchDCABudgetAmendGrid = createAsyncThunk(
    'dcaBudgetAmendment/fetchGrid',
    async (
        { ccCode, fyear, status }: { ccCode: string; fyear: string; status: string },
        { rejectWithValue }
    ) => {
        try {
            console.log('🔍 Thunk: Fetching DCA Budget Amend Grid:', { ccCode, fyear, status });

            const response = await dcaBudgetAPI.getDCABudgetAmendGrid(ccCode, fyear, status);

            console.log('🔍 Grid API Response Check:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataLength: response.Data?.length,
            });

            if (response.Data && Array.isArray(response.Data)) {
                console.log('✅ Grid data found, returning:', response.Data.length, 'items');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data || [];
            } else {
                return rejectWithValue(response.Message || 'No grid data available');
            }
        } catch (error: any) {
            console.error('❌ Grid Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch grid data');
        }
    }
);

/**
 * Approve/Reject/Return DCA budget amendment (Main verification action)
 */
export const approveDCAAmendment = createAsyncThunk(
    'dcaBudgetAmendment/approve',
    async (approvalData: ApproveDCABudgetAmendPayload, { rejectWithValue }) => {
        try {
            console.log('🎯 Thunk: Approving DCA Amendment:', {
                Action: approvalData.Action,
                CCCode: approvalData.CCCode,
                FYYear: approvalData.FYYear,
            });

            const response = await dcaBudgetAPI.approveDCABudgetAmend(approvalData);

            console.log('📦 Approval Response:', {
                IsSuccessful: response.IsSuccessful,
                Message: response.Message,
            });

            if (response.IsSuccessful) {
                return response.Data;
            } else {
                return rejectWithValue(response.Message || 'Failed to process approval');
            }
        } catch (error: any) {
            console.error('❌ Approval Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to process DCA approval');
        }
    }
);

/**
 * Update Approval DCA Budget Amendment (Return Handler)
 */
export const updateApprovalDCAAmendment = createAsyncThunk(
    'dcaBudgetAmendment/updateApproval',
    async (
        updateData: {
            AmendId: string;
            Action: string;
            Userid: string;
            Createdby: string;
            Remarks?: string;
            ReturnNote?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            console.log('🔄 Thunk: Updating DCA Approval:', {
                AmendId: updateData.AmendId,
                Action: updateData.Action,
            });

            const response = await dcaBudgetAPI.updateApprovalDCABudgetAmend(updateData);

            console.log('📦 Update Response:', {
                IsSuccessful: response.IsSuccessful,
                Message: response.Message,
            });

            if (response.IsSuccessful) {
                return response.Data;
            } else {
                return rejectWithValue(response.Message || 'Failed to update approval');
            }
        } catch (error: any) {
            console.error('❌ Update Approval Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to update DCA approval');
        }
    }
);

// ==============================================
// SLICE
// ==============================================

const dcaBudgetAmendmentSlice = createSlice({
    name: 'dcaBudgetAmendment',
    initialState,
    reducers: {
        // Reset approval state after successful action
        resetApprovalState: (state) => {
            state.approvalLoading = false;
            state.approvalError = null;
            state.approvalSuccess = false;
        },
    },
    extraReducers: (builder) => {
        // Fetch DCA Amendments List
        builder
            .addCase(fetchDCAAmendmentsList.pending, (state) => {
                state.amendmentsLoading = true;
                state.amendmentsError = null;
            })
            .addCase(fetchDCAAmendmentsList.fulfilled, (state, action) => {
                state.amendmentsLoading = false;
                // ✅ CRITICAL: Always ensure it's an array
                state.amendments = Array.isArray(action.payload) ? action.payload : [];
                state.amendmentsError = null;
            })
            .addCase(fetchDCAAmendmentsList.rejected, (state, action) => {
                state.amendmentsLoading = false;
                state.amendmentsError = action.payload as string;
                // ✅ CRITICAL: Keep amendments as empty array on error
                state.amendments = [];
            });

        // Fetch DCA Amendment By ID
        builder
            .addCase(fetchDCAAmendmentById.pending, (state) => {
                state.currentAmendmentLoading = true;
                state.currentAmendmentError = null;
            })
            .addCase(fetchDCAAmendmentById.fulfilled, (state, action) => {
                state.currentAmendmentLoading = false;
                state.currentAmendment = action.payload;
                state.currentAmendmentError = null;
            })
            .addCase(fetchDCAAmendmentById.rejected, (state, action) => {
                state.currentAmendmentLoading = false;
                state.currentAmendmentError = action.payload as string;
            });

        // Fetch DCA Budget Amend Grid
        builder
            .addCase(fetchDCABudgetAmendGrid.pending, (state) => {
                state.gridLoading = true;
                state.gridError = null;
            })
            .addCase(fetchDCABudgetAmendGrid.fulfilled, (state, action) => {
                state.gridLoading = false;
                state.gridData = Array.isArray(action.payload) ? action.payload : [];
                state.gridError = null;
            })
            .addCase(fetchDCABudgetAmendGrid.rejected, (state, action) => {
                state.gridLoading = false;
                state.gridError = action.payload as string;
                state.gridData = [];
            });

        // Approve DCA Amendment
        builder
            .addCase(approveDCAAmendment.pending, (state) => {
                state.approvalLoading = true;
                state.approvalError = null;
                state.approvalSuccess = false;
            })
            .addCase(approveDCAAmendment.fulfilled, (state) => {
                state.approvalLoading = false;
                state.approvalSuccess = true;
                state.approvalError = null;
            })
            .addCase(approveDCAAmendment.rejected, (state, action) => {
                state.approvalLoading = false;
                state.approvalError = action.payload as string;
                state.approvalSuccess = false;
            });

        // Update Approval DCA Amendment (shares same loading/error/success states)
        builder
            .addCase(updateApprovalDCAAmendment.pending, (state) => {
                state.approvalLoading = true;
                state.approvalError = null;
                state.approvalSuccess = false;
            })
            .addCase(updateApprovalDCAAmendment.fulfilled, (state) => {
                state.approvalLoading = false;
                state.approvalSuccess = true;
                state.approvalError = null;
            })
            .addCase(updateApprovalDCAAmendment.rejected, (state, action) => {
                state.approvalLoading = false;
                state.approvalError = action.payload as string;
                state.approvalSuccess = false;
            });
    },
});

// ==============================================
// EXPORTS
// ==============================================

export const { resetApprovalState } = dcaBudgetAmendmentSlice.actions;

// ✅ CRITICAL FIX: Selectors that GUARANTEE array return
export const selectDCAAmendments = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) => {
    const amendments = state.dcaBudgetAmendment?.amendments;
    // Force return array even if undefined
    return Array.isArray(amendments) ? amendments : [];
};

export const selectDCAAmendmentsLoading = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) =>
    state.dcaBudgetAmendment?.amendmentsLoading || false;

export const selectCurrentDCAAmendment = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) =>
    state.dcaBudgetAmendment?.currentAmendment || null;

export const selectCurrentDCAAmendmentLoading = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) =>
    state.dcaBudgetAmendment?.currentAmendmentLoading || false;

export const selectDCAGridData = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) => {
    const gridData = state.dcaBudgetAmendment?.gridData;
    return Array.isArray(gridData) ? gridData : [];
};

export const selectDCAGridLoading = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) =>
    state.dcaBudgetAmendment?.gridLoading || false;

export const selectDCAApprovalLoading = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) =>
    state.dcaBudgetAmendment?.approvalLoading || false;

export const selectDCAApprovalSuccess = (state: { dcaBudgetAmendment: DCABudgetAmendmentState }) =>
    state.dcaBudgetAmendment?.approvalSuccess || false;

export default dcaBudgetAmendmentSlice.reducer;