// src/slice/ccBudgetAmendment/ccBudgetAmendmentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as ccBudgetAPI from '@/src/api/budget/ccBudgetAmendmentAPI';
import type {
    CCBudgetAmendmentItem,
    CCBudgetAmendmentDetail,
    ApproveCCBudgetAmendmentPayload,
} from '@/src/api/budget/ccBudgetAmendmentAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

export interface CCBudgetAmendmentState {
    // List data (inbox)
    amendments: CCBudgetAmendmentItem[];
    amendmentsLoading: boolean;
    amendmentsError: string | null;

    // Detail data (verification screen)
    currentAmendment: CCBudgetAmendmentDetail | null;
    currentAmendmentLoading: boolean;
    currentAmendmentError: string | null;

    // Approval/verification action
    approvalLoading: boolean;
    approvalError: string | null;
    approvalSuccess: boolean;

    // Document check
    documentsExist: boolean;
    documentsLoading: boolean;
    documentsError: string | null;

    // Filters
    filterStatus: string | null;
    searchQuery: string;
}

const initialState: CCBudgetAmendmentState = {
    amendments: [],
    amendmentsLoading: false,
    amendmentsError: null,

    currentAmendment: null,
    currentAmendmentLoading: false,
    currentAmendmentError: null,

    approvalLoading: false,
    approvalError: null,
    approvalSuccess: false,

    documentsExist: false,
    documentsLoading: false,
    documentsError: null,

    filterStatus: null,
    searchQuery: '',
};

// ==============================================
// ASYNC THUNKS
// ==============================================

/**
 * Fetch list of budget amendments pending approval (Inbox)
 */
// UPDATE THIS THUNK:
export const fetchAmendmentsList = createAsyncThunk(
    'ccBudgetAmendment/fetchList',
    async ({ roleId, uid }: { roleId: string; uid: string }, { rejectWithValue }) => {
        try {
            const response = await ccBudgetAPI.getApprovalCCAmendBudgetDetails(roleId, uid);

            console.log('🔍 API Response Check:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataLength: response.Data?.length,
            });

            // ✅ FIX: Check if data exists, ignore IsSuccessful flag
            if (response.Data && Array.isArray(response.Data) && response.Data.length >= 0) {
                console.log('✅ Data found, returning:', response.Data.length, 'items');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data || [];
            } else {
                return rejectWithValue(response.Message || 'No data available');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch amendments list');
        }
    }
);

/**
 * Fetch single amendment details for verification
 */
// UPDATE THIS THUNK in ccBudgetAmendmentSlice.ts:

export const fetchAmendmentById = createAsyncThunk(
    'ccBudgetAmendment/fetchById',
    async ({ amendId, amendType }: { amendId: string; amendType: string }, { rejectWithValue }) => {
        try {
            console.log('🔍 Thunk: Fetching by ID:', { amendId, amendType });

            const response = await ccBudgetAPI.getApprovalCCAmendBudgetById(amendId, amendType);

            console.log('📦 Thunk: API Response:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataKeys: response.Data ? Object.keys(response.Data) : [],
            });

            // ✅ FIX: Check if data exists, ignore IsSuccessful flag
            if (response.Data) {
                console.log('✅ Thunk: Returning data');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data;
            } else {
                console.error('❌ Thunk: No data found');
                return rejectWithValue(response.Message || 'Amendment not found');
            }
        } catch (error: any) {
            console.error('❌ Thunk: Error:', error);
            return rejectWithValue(error.message || 'Failed to fetch amendment details');
        }
    }
);

/**
 * Check if documents are uploaded
 */
export const checkDocumentsExist = createAsyncThunk(
    'ccBudgetAmendment/checkDocuments',
    async ({ ccCode, uid }: { ccCode: string; uid: string }, { rejectWithValue }) => {
        try {
            const response = await ccBudgetAPI.getCCUploadDocsExists(ccCode, uid);

            if (response.IsSuccessful) {
                return response.Data;
            } else {
                return rejectWithValue(response.Message);
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to check documents');
        }
    }
);

/**
 * Approve/Reject/Return budget amendment (Main verification action)
 */
export const approveAmendment = createAsyncThunk(
    'ccBudgetAmendment/approve',
    async (approvalData: ApproveCCBudgetAmendmentPayload, { rejectWithValue }) => {
        try {
            const response = await ccBudgetAPI.approveCostCenterBudgetAmend(approvalData);

            if (response.IsSuccessful) {
                return response.Data;
            } else {
                return rejectWithValue(response.Message);
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to process approval');
        }
    }
);

// ==============================================
// SLICE
// ==============================================

const ccBudgetAmendmentSlice = createSlice({
    name: 'ccBudgetAmendment',
    initialState,
    reducers: {
        // Reset approval state after successful action
        resetApprovalState: (state) => {
            state.approvalLoading = false;
            state.approvalError = null;
            state.approvalSuccess = false;
        },

        // Clear current amendment details
        clearCurrentAmendment: (state) => {
            state.currentAmendment = null;
            state.currentAmendmentLoading = false;
            state.currentAmendmentError = null;
        },

        // Set filter status
        setFilterStatus: (state, action: PayloadAction<string | null>) => {
            state.filterStatus = action.payload;
        },

        // Set search query
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },

        // Clear all errors
        clearErrors: (state) => {
            state.amendmentsError = null;
            state.currentAmendmentError = null;
            state.approvalError = null;
            state.documentsError = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Amendments List
        builder
            .addCase(fetchAmendmentsList.pending, (state) => {
                state.amendmentsLoading = true;
                state.amendmentsError = null;
            })
            .addCase(fetchAmendmentsList.fulfilled, (state, action) => {
                state.amendmentsLoading = false;
                state.amendments = action.payload;
                state.amendmentsError = null;
            })
            .addCase(fetchAmendmentsList.rejected, (state, action) => {
                state.amendmentsLoading = false;
                state.amendmentsError = action.payload as string;
            });

        // Fetch Amendment By ID
        builder
            .addCase(fetchAmendmentById.pending, (state) => {
                state.currentAmendmentLoading = true;
                state.currentAmendmentError = null;
            })
            .addCase(fetchAmendmentById.fulfilled, (state, action) => {
                state.currentAmendmentLoading = false;
                state.currentAmendment = action.payload;
                state.currentAmendmentError = null;
            })
            .addCase(fetchAmendmentById.rejected, (state, action) => {
                state.currentAmendmentLoading = false;
                state.currentAmendmentError = action.payload as string;
            });

        // Check Documents
        builder
            .addCase(checkDocumentsExist.pending, (state) => {
                state.documentsLoading = true;
                state.documentsError = null;
            })
            .addCase(checkDocumentsExist.fulfilled, (state, action) => {
                state.documentsLoading = false;
                state.documentsExist = action.payload.exists;
                state.documentsError = null;
            })
            .addCase(checkDocumentsExist.rejected, (state, action) => {
                state.documentsLoading = false;
                state.documentsError = action.payload as string;
            });

        // Approve Amendment
        builder
            .addCase(approveAmendment.pending, (state) => {
                state.approvalLoading = true;
                state.approvalError = null;
                state.approvalSuccess = false;
            })
            .addCase(approveAmendment.fulfilled, (state) => {
                state.approvalLoading = false;
                state.approvalSuccess = true;
                state.approvalError = null;
            })
            .addCase(approveAmendment.rejected, (state, action) => {
                state.approvalLoading = false;
                state.approvalError = action.payload as string;
                state.approvalSuccess = false;
            });
    },
});

// ==============================================
// EXPORTS
// ==============================================

export const {
    resetApprovalState,
    clearCurrentAmendment,
    setFilterStatus,
    setSearchQuery,
    clearErrors,
} = ccBudgetAmendmentSlice.actions;

// Selectors
export const selectAmendments = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.amendments;

export const selectAmendmentsLoading = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.amendmentsLoading;

export const selectCurrentAmendment = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.currentAmendment;

export const selectCurrentAmendmentLoading = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.currentAmendmentLoading;

export const selectApprovalLoading = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.approvalLoading;

export const selectApprovalSuccess = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.approvalSuccess;

export const selectDocumentsExist = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) =>
    state.ccBudgetAmendment.documentsExist;

// Filtered amendments selector (with search and status filter)
export const selectFilteredAmendments = (state: { ccBudgetAmendment: CCBudgetAmendmentState }) => {
    const { amendments, filterStatus, searchQuery } = state.ccBudgetAmendment;

    let filtered = amendments;

    // Filter by status
    if (filterStatus) {
        filtered = filtered.filter(item => item.Status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            item.CCCode?.toLowerCase().includes(query) ||
            item.CCName?.toLowerCase().includes(query) ||
            item.AmendId?.toLowerCase().includes(query)
        );
    }

    return filtered;
};

export default ccBudgetAmendmentSlice.reducer;