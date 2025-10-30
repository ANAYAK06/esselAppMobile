// src/api/common/remarksAPI.ts
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface ApiResponse<T> {
    IsSuccessful: boolean;
    Message: string;
    Data: T;
}

export interface RemarkItem {
    ActionBy: string;          // Employee who took action
    ActionRole: string;        // Role of the employee (e.g., "Finance Control", "Manager")
    Action: string;            // Action taken (e.g., "Approved", "Verified", "Rejected")
    ActionRemarks: string;     // Comments/remarks
    ActionDate: string;        // Date/time of action
    [key: string]: any;        // Additional fields
}

// ==============================================
// API FUNCTIONS
// ==============================================

/**
 * Get Remarks/Approval History for a Transaction
 * @param trno - Transaction Number (e.g., CCBudgetAmendmentid, POId, etc.)
 * @param moid - Module Object ID (identifies which module/type)
 * @returns Array of remarks/approval history
 */
export const getRemarks = async (
    trno: string | number,
    moid: string | number
): Promise<ApiResponse<RemarkItem[]>> => {
    try {
        console.log('💬 Getting Remarks for Transaction:', {
            trno,
            moid,
            trno_type: typeof trno,
            moid_type: typeof moid
        });

        const response = await axios.get<ApiResponse<RemarkItem[]>>(
            `${API_BASE_URL}/Purchase/Remarks?Trno=${trno}&MOID=${moid}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Remarks Response:', {
            IsSuccessful: response.data.IsSuccessful,
            remarksCount: response.data.Data?.length || 0,
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ Remarks API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};