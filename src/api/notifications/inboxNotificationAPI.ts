// src/api/NotificationAPI/inboxNotificationAPI.ts
import axios from "axios";
import { API_BASE_URL } from '../../service/apiConfig';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface GetUserInboxNotificationsParams {
    userId: string;
    roleId: string;
}

export interface NotificationItem {
    MasterId: string;
    RoleId: string;
    CCCode: string;
    HasCCRestriction: boolean;
    ModuleDisplayName: string;
    PendingCount: number;
    ModuleCategory: string;
    NavigationPath: string;
    ActionButtonText: string;
    Priority: string;
    Status: number;
    AssignedUserId: string;
    // Add other properties as needed based on your API response
    [key: string]: any;
}

export interface ApiResponse<T> {
    IsSuccessful: boolean;
    Message: string;
    Data: T;
}

export type UserInboxNotificationsResponse = ApiResponse<NotificationItem[]>;

// ==============================================
// USER INBOX NOTIFICATIONS API
// ==============================================

/**
 * Get User Inbox Notifications
 * @param params - Object containing userId and roleId
 * @returns Promise with API response containing notifications array
 */
export const getUserInboxNotifications = async (
    params: GetUserInboxNotificationsParams
): Promise<UserInboxNotificationsResponse> => {
    try {
        const { userId, roleId } = params;
        console.log('📬 Getting User Inbox Notifications for:', { userId, roleId }); // DEBUG

        const response = await axios.get<UserInboxNotificationsResponse>(
            `${API_BASE_URL}/Accounts/GetUserInboxNotifications?userId=${userId}&roleId=${roleId}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ User Inbox Notifications Response:', response.data); // DEBUG
        return response.data;
    } catch (error: any) {
        console.error('❌ User Inbox Notifications API Error:', error.response || error);

        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};