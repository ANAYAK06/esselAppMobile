// src/api/accounts/dcaBudgetAPI.ts
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface ApiResponse<T> {
    IsSuccessful: boolean;
    Message: string;
    Data: T;
    ResponseCode?: number;
}

// ==============================================
// ERROR HANDLER HELPER
// ==============================================

/**
 * Centralized error handler for API calls
 */
const handleApiError = (error: any, operation: string): never => {
    console.group(`❌ ${operation} API Error`);

    if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);

        if (error.response.status === 400) {
            console.error('🔍 Bad Request Details:', {
                url: error.config?.url,
                method: error.config?.method,
            });
        }
    } else if (error.request) {
        console.error('No Response Received');
    } else {
        console.error('Request Setup Error:', error.message);
    }

    console.groupEnd();

    if (error.response?.data) {
        throw error.response.data;
    } else if (error.response?.status === 400) {
        throw new Error('Bad Request: Invalid data or missing required fields');
    } else if (error.response?.status === 500) {
        throw new Error('Server Error: Please contact administrator');
    }

    throw error;
};

// ==============================================
// INTERFACES FOR VERIFICATION FLOW (Only used ones)
// ==============================================

// Verification DCA Amend Item (for inbox list)
export interface VerificationDCAAmendItem {
    AmendId: string;
    CCCode: string;
    CCName?: string;
    FYYear: string;
    Status: string;
    CreatedBy: string;
    CreatedDate: string;
    AmendedValue?: number;
    ApprovalStatus?: string;
    [key: string]: any;
}

// Verify DCA Budget Amend By ID (for detail view)
export interface VerifyDCABudgetAmendById {
    AmendId: string;
    CCCode: string;
    FYYear: string;
    Ctype: string;
    Status: string;
    AmendedValue?: number;
    CurrentValue?: number;
    Remarks?: string;
    [key: string]: any;
}

// Approve DCA Budget Amend Payload (Main approval format)
export interface ApproveDCABudgetAmendPayload {
    Action: string;
    AmendedValue: string;
    ApprovalNote: string;
    CCCode: string;
    CreatedBy: string;
    FYYear: string;
    RoleId: string;
    Status: string;
    AmendId?: string;
    ApprovalStatus?: string;
    ApprovalDate?: string;
    [key: string]: any;
}

// Update Approval DCA Budget Amend Payload (Return Handler)
export interface UpdateApprovalDCABudgetAmendPayload {
    AmendId: string;
    Action: string;
    Userid: string;
    Createdby: string;
    Remarks?: string;
    ReturnNote?: string;
    [key: string]: any;
}

// DCA Budget Amend Grid Item
export interface DCABudgetAmendGridItem {
    AmendId: string;
    CCCode: string;
    FYYear: string;
    Status: string;
    CreatedDate: string;
    AmendedValue?: number;
    [key: string]: any;
}

// ==============================================
// DCA BUDGET AMENDMENT VERIFICATION APIs
// ==============================================

/**
 * Get Verification DCA Amends
 * Retrieves list of DCA amendments for verification based on role and user
 */
export const getVerificationDCAAmends = async (
    roleId: string,
    userId: string
): Promise<ApiResponse<VerificationDCAAmendItem[]>> => {
    try {
        console.log('🔍 Getting Verification DCA Amends:', { roleId, userId });

        const response = await axios.get<ApiResponse<VerificationDCAAmendItem[]>>(
            `${API_BASE_URL}/Accounts/GetVerificationDCAAmends?Roleid=${roleId}&Userid=${userId}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Verification DCA Amends Response:', response.data);
        return response.data;
    } catch (error: any) {
        return handleApiError(error, 'Verification DCA Amends');
    }
};

/**
 * Get Verify DCA Budget Amend by ID
 * Retrieves detailed amendment information for verification
 */
export const getVerifyDCABudgetAmendById = async (
    ccCode: string,
    fyear: string,
    ctype: string,
    status: string
): Promise<ApiResponse<VerifyDCABudgetAmendById>> => {
    try {
        console.log('🔍 Getting Verify DCA Budget Amend by ID:', { ccCode, fyear, ctype, status });

        const response = await axios.get<ApiResponse<VerifyDCABudgetAmendById>>(
            `${API_BASE_URL}/Accounts/GetVerifyDCABudgetAmendbyId?CCCode=${ccCode}&Fyear=${fyear}&Ctype=${ctype}&Status=${status}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Verify DCA Budget Amend by ID Response:', response.data);
        return response.data;
    } catch (error: any) {
        return handleApiError(error, 'Verify DCA Budget Amend by ID');
    }
};

/**
 * Get DCA Budget Amend Grid
 * Retrieves grid data for budget amendments
 */
export const getDCABudgetAmendGrid = async (
    ccCode: string,
    fyear: string,
    status: string
): Promise<ApiResponse<DCABudgetAmendGridItem[]>> => {
    try {
        console.log('📋 Getting DCA Budget Amend Grid:', { ccCode, fyear, status });

        const response = await axios.get<ApiResponse<DCABudgetAmendGridItem[]>>(
            `${API_BASE_URL}/Accounts/GetDCABudgetAmendgrid?CCCode=${ccCode}&Fyear=${fyear}&Status=${status}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ DCA Budget Amend Grid Response:', response.data);
        return response.data;
    } catch (error: any) {
        return handleApiError(error, 'DCA Budget Amend Grid');
    }
};

/**
 * Update Approval DCA Budget Amend (Return Handler)
 * Updates approval status for DCA budget amendments (for returning amendments)
 */
export const updateApprovalDCABudgetAmend = async (
    updateData: UpdateApprovalDCABudgetAmendPayload
): Promise<ApiResponse<any>> => {
    try {
        console.log('🔄 Updating Approval DCA Budget Amend (Return)...');
        console.log('📊 Update Data Summary:', {
            AmendId: updateData.AmendId,
            Action: updateData.Action,
            Userid: updateData.Userid,
        });

        const response = await axios.put<ApiResponse<any>>(
            `${API_BASE_URL}/Accounts/UpdateApprovalDCABudgetAmend`,
            updateData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Update Approval Response:', response.data);
        return response.data;

    } catch (error: any) {
        return handleApiError(error, 'Update Approval DCA Budget Amend');
    }
};

/**
 * Approve DCA Budget Amend
 * Main verification/approval function - Approve, Reject, or Return a DCA budget amendment
 */
export const approveDCABudgetAmend = async (
    approvalData: ApproveDCABudgetAmendPayload
): Promise<ApiResponse<any>> => {
    try {
        console.log('🎯 Approving DCA Budget Amendment...');
        console.log('📊 Approval Payload Summary:', {
            Action: approvalData.Action,
            CCCode: approvalData.CCCode,
            FYYear: approvalData.FYYear,
            RoleId: approvalData.RoleId,
        });

        const response = await axios.put<ApiResponse<any>>(
            `${API_BASE_URL}/Accounts/ApproveDCABudgetAmend`,
            approvalData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ DCA Budget Amendment Approval Response:', response.data);
        return response.data;

    } catch (error: any) {
        return handleApiError(error, 'DCA Budget Amendment Approval');
    }
};