// src/slice/common/statusSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as statusAPI from '@/src/api/common/statusAPI';
import type { StatusItem, StatusListParams } from '@/src/api/common/statusAPI';

// ==============================================
// STATE INTERFACE
// ==============================================

export interface StatusState {
    statusList: StatusItem[];
    statusLoading: boolean;
    statusError: string | null;
    hasActions: boolean;
}

const initialState: StatusState = {
    statusList: [],
    statusLoading: false,
    statusError: null,
    hasActions: false,
};

// ==============================================
// ASYNC THUNKS
// ==============================================

/**
 * Fetch available actions/status buttons
 */
export const fetchStatusList = createAsyncThunk(
    'status/fetchStatusList',
    async (params: StatusListParams, { rejectWithValue }) => {
        try {
            const response = await statusAPI.getStatusList(params);

            console.log('📋 Raw Status Response:', response);

            // ✅ IGNORE IsSuccessful - just check if Data exists and is an array
            if (response.Data && Array.isArray(response.Data)) {
                // Transform backend data to match our interface
                const transformedData = response.Data
                    .filter((item: any) => item.Type) // Only include items with Type
                    .map((item: any) => ({
                        type: item.Type || '',
                        text: item.Text || item.Type || '',  // Use Type if Text is null
                        value: item.Value || item.Type || '', // Use Type if Value is null
                        className: item.ClassName || '',
                        enabled: item.Enabled !== false, // Default to true if not specified
                    }));

                console.log('✅ Status list loaded:', transformedData.length, 'actions');
                console.log('📋 Transformed actions:', transformedData);

                return transformedData;
            } else {
                console.warn('⚠️ No valid data in response');
                return [];
            }
        } catch (error: any) {
            console.error('❌ Status list thunk error:', error);
            return rejectWithValue(error.message || 'Failed to fetch status list');
        }
    }
);

// ==============================================
// SLICE
// ==============================================

const statusSlice = createSlice({
    name: 'status',
    initialState,
    reducers: {
        // Clear status list
        clearStatusList: (state) => {
            state.statusList = [];
            state.statusError = null;
            state.hasActions = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStatusList.pending, (state) => {
                state.statusLoading = true;
                state.statusError = null;
            })
            .addCase(fetchStatusList.fulfilled, (state, action) => {
                state.statusLoading = false;
                state.statusList = action.payload;
                state.hasActions = action.payload.length > 0;
                state.statusError = null;
            })
            .addCase(fetchStatusList.rejected, (state, action) => {
                state.statusLoading = false;
                state.statusError = action.payload as string;
                state.hasActions = false;
            });
    },
});

// ==============================================
// EXPORTS
// ==============================================

export const { clearStatusList } = statusSlice.actions;

// Selectors
export const selectStatusList = (state: { status: StatusState }) => state.status.statusList;
export const selectStatusLoading = (state: { status: StatusState }) => state.status.statusLoading;
export const selectStatusError = (state: { status: StatusState }) => state.status.statusError;
export const selectHasActions = (state: { status: StatusState }) => state.status.hasActions;

// Selector for enabled actions only
export const selectEnabledActions = (state: { status: StatusState }) =>
    state.status.statusList.filter(action => action.enabled !== false);

export default statusSlice.reducer;