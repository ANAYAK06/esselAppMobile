// src/slice/indent/indentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as indentAPI from '@/src/api/indent/indentAPI';
import type {
    IndentLevel,
    IndentItemDetail,
    IndentVerificationItem,
    IndentRemark,
    VerifyIndentPayload,
} from '@/src/api/indent/indentAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

export interface IndentState {
    // Indent Levels (object with level info, not array)
    indentLevels: IndentLevel | null;
    indentLevelsLoading: boolean;
    indentLevelsError: string | null;

    // Verification Grid (inbox)
    verificationItems: IndentVerificationItem[];
    verificationItemsLoading: boolean;
    verificationItemsError: string | null;

    // Current Indent Details
    currentIndentItems: IndentItemDetail[];
    currentIndentItemsLoading: boolean;
    currentIndentItemsError: string | null;

    // Current Indent Remarks
    currentIndentRemarks: IndentRemark[];
    currentIndentRemarksLoading: boolean;
    currentIndentRemarksError: string | null;

    // Verification/Approval action
    verificationLoading: boolean;
    verificationError: string | null;
    verificationSuccess: boolean;

    // Filters
    filterStatus: string | null;
    searchQuery: string;

    // Selected Indent
    selectedIndentNo: string | null;
}

const initialState: IndentState = {
    indentLevels: null,
    indentLevelsLoading: false,
    indentLevelsError: null,

    verificationItems: [],
    verificationItemsLoading: false,
    verificationItemsError: null,

    currentIndentItems: [],
    currentIndentItemsLoading: false,
    currentIndentItemsError: null,

    currentIndentRemarks: [],
    currentIndentRemarksLoading: false,
    currentIndentRemarksError: null,

    verificationLoading: false,
    verificationError: null,
    verificationSuccess: false,

    filterStatus: null,
    searchQuery: '',
    selectedIndentNo: null,
};

// ==============================================
// ASYNC THUNKS
// ==============================================

/**
 * Fetch Indent Levels
 */
export const fetchIndentLevels = createAsyncThunk(
    'indent/fetchLevels',
    async ({ moId, roleId }: { moId: string; roleId: string }, { rejectWithValue }) => {
        try {
            console.log('🔍 Thunk: Fetching Indent Levels:', { moId, roleId });

            const response = await indentAPI.getIndentLevels(moId, roleId);

            console.log('📦 Thunk: API Response:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataType: typeof response.Data,
            });

            // ✅ FIX: The API returns an object with level info, not an array
            if (response.Data) {
                console.log('✅ Data found, returning object with level info');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data || {};
            } else {
                return rejectWithValue(response.Message || 'No indent levels available');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch indent levels');
        }
    }
);

/**
 * Fetch Indent Verification Grid (Inbox)
 */
export const fetchVerificationGrid = createAsyncThunk(
    'indent/fetchVerificationGrid',
    async (
        { roleId, created, userId }: { roleId: string; created: string; userId: string },
        { rejectWithValue }
    ) => {
        try {
            console.log('🔍 Thunk: Fetching Verification Grid:', { roleId, created, userId });

            const response = await indentAPI.getIndentVerificationGrid(roleId, created, userId);

            console.log('📦 Thunk: API Response:', {
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
                return rejectWithValue(response.Message || 'No verification items available');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch verification grid');
        }
    }
);

/**
 * Fetch Indent Items Details
 */
export const fetchIndentItemsDetails = createAsyncThunk(
    'indent/fetchItemsDetails',
    async (indno: string, { rejectWithValue }) => {
        try {
            console.log('🔍 Thunk: Fetching Indent Items Details:', { indno });

            const response = await indentAPI.viewIndentItemsDetails(indno);

            console.log('📦 Thunk: API Response:', {
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
                return rejectWithValue(response.Message || 'No indent items found');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch indent items');
        }
    }
);

/**
 * Fetch Indent Remarks
 */
export const fetchIndentRemarks = createAsyncThunk(
    'indent/fetchRemarks',
    async (indno: string, { rejectWithValue }) => {
        try {
            console.log('🔍 Thunk: Fetching Indent Remarks:', { indno });

            const response = await indentAPI.viewIndentRemarks(indno);

            console.log('📦 Thunk: API Response:', {
                IsSuccessful: response.IsSuccessful,
                hasData: !!response.Data,
                dataLength: response.Data?.length,
            });

            // ✅ FIX: Check if data exists, ignore IsSuccessful flag
            if (response.Data && Array.isArray(response.Data) && response.Data.length >= 0) {
                console.log('✅ Data found, returning:', response.Data.length, 'remarks');
                return response.Data;
            } else if (response.IsSuccessful) {
                return response.Data || [];
            } else {
                return rejectWithValue(response.Message || 'No remarks found');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch indent remarks');
        }
    }
);

/**
 * Fetch Indent Full Details (Items + Remarks together)
 */
export const fetchIndentFullDetails = createAsyncThunk(
    'indent/fetchFullDetails',
    async (indno: string, { rejectWithValue }) => {
        try {
            console.log('🔍 Thunk: Fetching Full Indent Details:', { indno });

            const response = await indentAPI.getIndentFullDetails(indno);

            console.log('📦 Thunk: Full Details Response:', {
                hasItems: !!response.items.Data,
                itemsCount: response.items.Data?.length,
                hasRemarks: !!response.remarks.Data,
                remarksCount: response.remarks.Data?.length,
            });

            return {
                items: response.items.Data || [],
                remarks: response.remarks.Data || [],
            };
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch indent full details');
        }
    }
);

/**
 * Verify Indent (Approve/Reject/Return)
 */
export const verifyIndent = createAsyncThunk(
    'indent/verify',
    async (verificationData: VerifyIndentPayload, { rejectWithValue }) => {
        try {
            console.log('🎯 Thunk: Verifying Indent:', {
                Indent: verificationData.Indent,
                Appstatus: verificationData.Appstatus,
            });

            const response = await indentAPI.verifyIndent(verificationData);

            console.log('📦 Thunk: Verification Response:', {
                IsSuccessful: response.IsSuccessful,
                ResponseCode: response.ResponseCode,
                Message: response.Message,
                Data: response.Data,
            });

            // ✅ FIX: Backend returns ResponseCode 200 even when IsSuccessful is false
            // Check ResponseCode first, then IsSuccessful as fallback
            if (response.ResponseCode === 200 || response.IsSuccessful) {
                console.log('✅ Verification completed successfully');
                return response.Data;
            } else {
                console.error('❌ Verification failed:', response.Message);
                return rejectWithValue(response.Message || 'Verification failed');
            }
        } catch (error: any) {
            console.error('❌ Thunk error:', error);
            return rejectWithValue(error.message || 'Failed to verify indent');
        }
    }
);

// ==============================================
// SLICE
// ==============================================

const indentSlice = createSlice({
    name: 'indent',
    initialState,
    reducers: {
        // Reset verification state after successful action
        resetVerificationState: (state) => {
            state.verificationLoading = false;
            state.verificationError = null;
            state.verificationSuccess = false;
        },

        // Clear current indent details
        clearCurrentIndent: (state) => {
            state.currentIndentItems = [];
            state.currentIndentRemarks = [];
            state.currentIndentItemsLoading = false;
            state.currentIndentRemarksLoading = false;
            state.currentIndentItemsError = null;
            state.currentIndentRemarksError = null;
            state.selectedIndentNo = null;
        },

        // Set selected indent number
        setSelectedIndentNo: (state, action: PayloadAction<string | null>) => {
            state.selectedIndentNo = action.payload;
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
            state.indentLevelsError = null;
            state.verificationItemsError = null;
            state.currentIndentItemsError = null;
            state.currentIndentRemarksError = null;
            state.verificationError = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Indent Levels
        builder
            .addCase(fetchIndentLevels.pending, (state) => {
                state.indentLevelsLoading = true;
                state.indentLevelsError = null;
            })
            .addCase(fetchIndentLevels.fulfilled, (state, action) => {
                state.indentLevelsLoading = false;
                state.indentLevels = action.payload;
                state.indentLevelsError = null;
            })
            .addCase(fetchIndentLevels.rejected, (state, action) => {
                state.indentLevelsLoading = false;
                state.indentLevelsError = action.payload as string;
            });

        // Fetch Verification Grid
        builder
            .addCase(fetchVerificationGrid.pending, (state) => {
                state.verificationItemsLoading = true;
                state.verificationItemsError = null;
            })
            .addCase(fetchVerificationGrid.fulfilled, (state, action) => {
                state.verificationItemsLoading = false;
                state.verificationItems = action.payload;
                state.verificationItemsError = null;
            })
            .addCase(fetchVerificationGrid.rejected, (state, action) => {
                state.verificationItemsLoading = false;
                state.verificationItemsError = action.payload as string;
            });

        // Fetch Indent Items Details
        builder
            .addCase(fetchIndentItemsDetails.pending, (state) => {
                state.currentIndentItemsLoading = true;
                state.currentIndentItemsError = null;
            })
            .addCase(fetchIndentItemsDetails.fulfilled, (state, action) => {
                state.currentIndentItemsLoading = false;
                state.currentIndentItems = action.payload;
                state.currentIndentItemsError = null;
            })
            .addCase(fetchIndentItemsDetails.rejected, (state, action) => {
                state.currentIndentItemsLoading = false;
                state.currentIndentItemsError = action.payload as string;
            });

        // Fetch Indent Remarks
        builder
            .addCase(fetchIndentRemarks.pending, (state) => {
                state.currentIndentRemarksLoading = true;
                state.currentIndentRemarksError = null;
            })
            .addCase(fetchIndentRemarks.fulfilled, (state, action) => {
                state.currentIndentRemarksLoading = false;
                state.currentIndentRemarks = action.payload;
                state.currentIndentRemarksError = null;
            })
            .addCase(fetchIndentRemarks.rejected, (state, action) => {
                state.currentIndentRemarksLoading = false;
                state.currentIndentRemarksError = action.payload as string;
            });

        // Fetch Full Details (Items + Remarks)
        builder
            .addCase(fetchIndentFullDetails.pending, (state) => {
                state.currentIndentItemsLoading = true;
                state.currentIndentRemarksLoading = true;
                state.currentIndentItemsError = null;
                state.currentIndentRemarksError = null;
            })
            .addCase(fetchIndentFullDetails.fulfilled, (state, action) => {
                state.currentIndentItemsLoading = false;
                state.currentIndentRemarksLoading = false;
                state.currentIndentItems = action.payload.items;
                state.currentIndentRemarks = action.payload.remarks;
                state.currentIndentItemsError = null;
                state.currentIndentRemarksError = null;
            })
            .addCase(fetchIndentFullDetails.rejected, (state, action) => {
                state.currentIndentItemsLoading = false;
                state.currentIndentRemarksLoading = false;
                state.currentIndentItemsError = action.payload as string;
                state.currentIndentRemarksError = action.payload as string;
            });

        // Verify Indent
        builder
            .addCase(verifyIndent.pending, (state) => {
                state.verificationLoading = true;
                state.verificationError = null;
                state.verificationSuccess = false;
            })
            .addCase(verifyIndent.fulfilled, (state) => {
                state.verificationLoading = false;
                state.verificationSuccess = true;
                state.verificationError = null;
            })
            .addCase(verifyIndent.rejected, (state, action) => {
                state.verificationLoading = false;
                state.verificationError = action.payload as string;
                state.verificationSuccess = false;
            });
    },
});

// ==============================================
// EXPORTS
// ==============================================

export const {
    resetVerificationState,
    clearCurrentIndent,
    setSelectedIndentNo,
    setFilterStatus,
    setSearchQuery,
    clearErrors,
} = indentSlice.actions;

// Selectors
export const selectIndentLevels = (state: { indent: IndentState }) => state.indent.indentLevels;

export const selectIndentLevelsLoading = (state: { indent: IndentState }) =>
    state.indent.indentLevelsLoading;

export const selectVerificationItems = (state: { indent: IndentState }) =>
    state.indent.verificationItems;

export const selectVerificationItemsLoading = (state: { indent: IndentState }) =>
    state.indent.verificationItemsLoading;

export const selectCurrentIndentItems = (state: { indent: IndentState }) =>
    state.indent.currentIndentItems;

export const selectCurrentIndentItemsLoading = (state: { indent: IndentState }) =>
    state.indent.currentIndentItemsLoading;

export const selectCurrentIndentRemarks = (state: { indent: IndentState }) =>
    state.indent.currentIndentRemarks;

export const selectCurrentIndentRemarksLoading = (state: { indent: IndentState }) =>
    state.indent.currentIndentRemarksLoading;

export const selectVerificationLoading = (state: { indent: IndentState }) =>
    state.indent.verificationLoading;

export const selectVerificationSuccess = (state: { indent: IndentState }) =>
    state.indent.verificationSuccess;

export const selectSelectedIndentNo = (state: { indent: IndentState }) =>
    state.indent.selectedIndentNo;

// Filtered verification items selector (with search and status filter)
export const selectFilteredVerificationItems = (state: { indent: IndentState }) => {
    const { verificationItems, filterStatus, searchQuery } = state.indent;

    let filtered = verificationItems;

    // Filter by status
    if (filterStatus) {
        filtered = filtered.filter((item) => item.Status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
            (item) =>
                item.Indno?.toLowerCase().includes(query) ||
                item.CreatedBy?.toLowerCase().includes(query) ||
                item.Department?.toLowerCase().includes(query)
        );
    }

    return filtered;
};

// Combined selector for full indent details
export const selectFullIndentDetails = (state: { indent: IndentState }) => ({
    items: state.indent.currentIndentItems,
    remarks: state.indent.currentIndentRemarks,
    itemsLoading: state.indent.currentIndentItemsLoading,
    remarksLoading: state.indent.currentIndentRemarksLoading,
    itemsError: state.indent.currentIndentItemsError,
    remarksError: state.indent.currentIndentRemarksError,
});

export default indentSlice.reducer;