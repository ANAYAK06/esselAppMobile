// src/slices/notifications/inboxNotificationsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationAPI from '../../api/notifications/inboxNotificationAPI';
import {
    NotificationItem,
    GetUserInboxNotificationsParams,
    UserInboxNotificationsResponse
} from '../../api/notifications/inboxNotificationAPI';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface NotificationsSummaryItem {
    MasterId: string;
    RoleId: string;
    ModuleDisplayName: string;
    ModuleCategory: string;
    NavigationPath: string;
    ActionButtonText: string;
    Priority: string;
    Status: number;
    TotalPendingCount: number;
    NotificationCount: number;
    InboxTitle: string;
    Items: NotificationItem[];
    CCCodes: string[];
}

export interface NotificationFilters {
    userId: string | null;
    roleId: string | null;
}

export interface NotificationLoadingState {
    notifications: boolean;
}

export interface NotificationErrorState {
    notifications: string | null;
}

export interface InboxNotificationsState {
    // Data from API
    notifications: NotificationItem[];
    notificationsSummary: NotificationsSummaryItem[];

    // Loading states
    loading: NotificationLoadingState;

    // Error states
    errors: NotificationErrorState;

    // UI State
    filters: NotificationFilters;
}

// ==============================================
// ASYNC THUNKS
// ==============================================

// Fetch User Inbox Notifications
export const fetchUserInboxNotifications = createAsyncThunk<
    NotificationItem[],
    GetUserInboxNotificationsParams,
    { rejectValue: string }
>(
    'inboxnotifications/fetchUserInboxNotifications',
    async (params, { rejectWithValue }) => {
        try {
            console.log('🔍 Fetching User Inbox Notifications with params:', params);

            const response: UserInboxNotificationsResponse = await notificationAPI.getUserInboxNotifications(params);

            console.log('📬 API Response received:', response);
            console.log('📬 Response.Data:', response.Data);
            console.log('📬 IsSuccessful:', response.IsSuccessful);

            // Accept the list whenever Data is an array — this backend sometimes answers
            // IsSuccessful:false alongside valid data (see the web's userInboxNotificationSlice)
            if (Array.isArray(response?.Data)) {
                console.log('✅ Notifications fetch successful');
                return response.Data;
            } else {
                console.log('❌ API returned unsuccessful response');
                const errorMessage = response.Message || 'Failed to fetch notifications';
                return rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            console.error('🚨 Notifications API Error:', error);

            if (error.response?.data?.Message) {
                return rejectWithValue(error.response.data.Message);
            }
            return rejectWithValue(error.message || 'Failed to fetch User Inbox Notifications');
        }
    }
);

// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Helper function to create notifications summary
const createNotificationsSummary = (notifications: NotificationItem[]): NotificationsSummaryItem[] => {
    if (!notifications || !Array.isArray(notifications)) return [];

    // Group by MasterId + ModuleDisplayName, same as the web. MasterId alone is not unique per
    // feature: the backend reuses the same WorkFlowLevelId as MasterId across unrelated features
    // (e.g. MRR and Multi MRR), so grouping by it merged different modules into one row.
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const {
            MasterId,
            RoleId,
            CCCode,
            HasCCRestriction,
            ModuleDisplayName,
            PendingCount,
            ModuleCategory,
            NavigationPath,
            ActionButtonText,
            Priority,
            Status,
            AssignedUserId
        } = notification;

        const groupKey = `${MasterId}_${ModuleDisplayName}`;

        if (!acc[groupKey]) {
            acc[groupKey] = {
                MasterId,
                RoleId,
                ModuleDisplayName,
                ModuleCategory,
                NavigationPath,
                ActionButtonText,
                Priority,
                Status,
                TotalPendingCount: 0,
                NotificationCount: 0,
                InboxTitle: '',
                Items: [],
                CCCodes: [] // Track all CC codes for this master
            };
        }

        acc[groupKey].TotalPendingCount += PendingCount || 0;
        acc[groupKey].NotificationCount += 1;
        acc[groupKey].Items.push(notification);

        // Collect unique CC codes
        if (CCCode && !acc[groupKey].CCCodes.includes(CCCode)) {
            acc[groupKey].CCCodes.push(CCCode);
        }

        // Create InboxTitle with total count
        acc[groupKey].InboxTitle = `${ModuleDisplayName} (${acc[groupKey].TotalPendingCount})`;

        return acc;
    }, {} as Record<string, NotificationsSummaryItem>);

    // Convert grouped object to array and sort by priority/status
    return Object.values(groupedNotifications).sort((a, b) => {
        // Sort by Status first (lower status = higher priority)
        if (a.Status !== b.Status) {
            return a.Status - b.Status;
        }
        // Then by TotalPendingCount (higher count = higher priority)
        return b.TotalPendingCount - a.TotalPendingCount;
    });
};

// ==============================================
// INITIAL STATE
// ==============================================

const initialState: InboxNotificationsState = {
    // Data from API
    notifications: [],
    notificationsSummary: [],

    // Loading states
    loading: {
        notifications: false,
    },

    // Error states
    errors: {
        notifications: null,
    },

    // UI State
    filters: {
        userId: null,
        roleId: null
    }
};

// ==============================================
// INBOX NOTIFICATIONS SLICE
// ==============================================

const inboxNotificationsSlice = createSlice({
    name: 'inboxnotifications',
    initialState,
    reducers: {
        // Action to set filters
        setNotificationFilters: (state, action: PayloadAction<Partial<NotificationFilters>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        // Action to clear filters
        clearNotificationFilters: (state) => {
            state.filters = {
                userId: null,
                roleId: null
            };
        },

        // Action to reset notifications data
        resetNotificationsData: (state) => {
            state.notifications = [];
            state.notificationsSummary = [];
        },

        // Action to clear specific errors
        clearNotificationError: (state, action: PayloadAction<{ errorType: keyof NotificationErrorState }>) => {
            const { errorType } = action.payload;
            if (state.errors[errorType]) {
                state.errors[errorType] = null;
            }
        },

        // Action to refresh summary manually (if needed)
        refreshNotificationsSummary: (state) => {
            state.notificationsSummary = createNotificationsSummary(state.notifications);
        }
    },

    extraReducers: (builder) => {
        builder
            // User Inbox Notifications
            .addCase(fetchUserInboxNotifications.pending, (state) => {
                state.loading.notifications = true;
                state.errors.notifications = null;
            })
            .addCase(fetchUserInboxNotifications.fulfilled, (state, action) => {
                state.loading.notifications = false;
                state.notifications = action.payload;
                // Create summary automatically when data is loaded
                state.notificationsSummary = createNotificationsSummary(action.payload);
            })
            .addCase(fetchUserInboxNotifications.rejected, (state, action) => {
                state.loading.notifications = false;
                state.errors.notifications = action.payload || 'Failed to fetch notifications';
                state.notifications = [];
                state.notificationsSummary = [];
            });
    },
});

// ==============================================
// EXPORT ACTIONS
// ==============================================

export const {
    setNotificationFilters,
    clearNotificationFilters,
    resetNotificationsData,
    clearNotificationError,
    refreshNotificationsSummary
} = inboxNotificationsSlice.actions;

// ==============================================
// SELECTORS
// ==============================================

// Data selectors
export const selectNotifications = (state: any) => state.inboxnotifications.notifications;
export const selectNotificationsSummary = (state: any) => state.inboxnotifications.notificationsSummary;

// Loading selectors
export const selectNotificationsLoading = (state: any) => state.inboxnotifications.loading.notifications;

// Error selectors
export const selectNotificationsError = (state: any) => state.inboxnotifications.errors.notifications;

// Filter selectors
export const selectNotificationFilters = (state: any) => state.inboxnotifications.filters;
export const selectSelectedUserId = (state: any) => state.inboxnotifications.filters.userId;
export const selectSelectedRoleId = (state: any) => state.inboxnotifications.filters.roleId;

// Combined selectors
export const selectIsNotificationsLoading = (state: any) => state.inboxnotifications.loading.notifications;
export const selectHasNotificationsError = (state: any) => state.inboxnotifications.errors.notifications !== null;

// Specific summary selectors
export const selectNotificationsByCategory = (state: any) => {
    const notifications = state.inboxnotifications.notificationsSummary;
    return notifications.reduce((acc: any, notification: NotificationsSummaryItem) => {
        const category = notification.ModuleCategory || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(notification);
        return acc;
    }, {});
};

export const selectTotalPendingCount = (state: any) => {
    return state.inboxnotifications.notificationsSummary.reduce((total: number, notification: NotificationsSummaryItem) => {
        return total + (notification.TotalPendingCount || 0);
    }, 0);
};

export const selectHighPriorityNotifications = (state: any) => {
    return state.inboxnotifications.notificationsSummary.filter((notification: NotificationsSummaryItem) =>
        notification.Status === 1 || notification.Priority === 'High'
    );
};

// ==============================================
// EXPORT REDUCER
// ==============================================

export default inboxNotificationsSlice.reducer;