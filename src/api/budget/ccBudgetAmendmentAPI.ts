// src/api/accounts/ccBudgetAmendmentAPI.ts
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

// CC Budget Amendment List Item (for grid/inbox)
export interface CCBudgetAmendmentItem {
    AmendId: string;
    AmendType: string;
    CCCode: string;
    CCName: string;
    Status: string;
    CreatedDate: string;
    CreatedBy: string;
    ApprovalStatus: string;
    [key: string]: any;
}

// CC Budget Amendment Detail (for detail view)
export interface CCBudgetAmendmentDetail {
    AmendId: string;
    AmendType: string;
    CCCode: string;
    CCName: string;
    BudgetAmount: number;
    AmendedAmount: number;
    Reason: string;
    Status: string;
    CreatedDate: string;
    CreatedBy: string;
    ApprovalStatus: string;
    ApprovalDate?: string;
    ApprovedBy?: string;
    Remarks?: string;
    [key: string]: any;
}

// Document Upload Check Response
export interface CCUploadDocsExistsData {
    exists: boolean;
    documentCount: number;
    documents?: any[];
    [key: string]: any;
}

// ✅ UPDATED Approval Request Payload (matches web app)
export interface ApproveCCBudgetAmendmentPayload {
    AmendedValue: string;
    AmendmentType: string;
    ApprovalNote: string;
    BudgetId: string;
    CCBudgetAmendmentid: string;
    CCCode: string;
    CreatedBy: string;
    Roleid: string;
    VerificationType: string;
}

// Save CC Amend Budget Payload
export interface SaveCCAmendBudgetPayload {
    CCCode: string;
    AmendType: string;
    Userid: string;
    Createdby: string;
    BudgetAmount?: number;
    AmendedAmount?: number;
    Reason?: string;
    [key: string]: any;
}

// Update CC Amend Budget Payload
export interface UpdateCCAmendBudgetPayload {
    AmendId: string;
    AmendType: string;
    Action: string;
    Userid: string;
    Createdby: string;
    [key: string]: any;
}

// ==============================================
// API FUNCTIONS
// ==============================================

/**
 * Get Approval CC Amend Budget Details (Main Grid/Inbox List)
 */
export const getApprovalCCAmendBudgetDetails = async (
    roleId: string,
    uid: string
): Promise<ApiResponse<CCBudgetAmendmentItem[]>> => {
    try {
        console.log('📋 Getting Approval CC Amend Budget Details:', { roleId, uid });

        const response = await axios.get<ApiResponse<CCBudgetAmendmentItem[]>>(
            `${API_BASE_URL}/Accounts/GetApprovalCCAmendBudgetCDetails?Roleid=${roleId}&UID=${uid}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Approval CC Amend Budget Details Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Approval CC Amend Budget Details API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

/**
 * Get Approval CC Amend Budget by ID (Detail View)
 */
export const getApprovalCCAmendBudgetById = async (
    amendId: string,
    amendType: string
): Promise<ApiResponse<CCBudgetAmendmentDetail>> => {
    try {
        console.log('🔍 Getting Approval CC Amend Budget by ID:', { amendId, amendType });

        const response = await axios.get<ApiResponse<CCBudgetAmendmentDetail>>(
            `${API_BASE_URL}/Accounts/GetApprovalCCAmendBudgetById?AmendId=${amendId}&AmendType=${amendType}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Approval CC Amend Budget by ID Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Approval CC Amend Budget by ID API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

/**
 * Get CC Upload Documents Exists
 */
export const getCCUploadDocsExists = async (
    ccCode: string,
    uid: string
): Promise<ApiResponse<CCUploadDocsExistsData>> => {
    try {
        console.log('📄 Checking CC Upload Documents Exists:', { ccCode, uid });

        const response = await axios.get<ApiResponse<CCUploadDocsExistsData>>(
            `${API_BASE_URL}/Accounts/Getccuploadocsexists?CCCode=${ccCode}&UID=${uid}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ CC Upload Documents Exists Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ CC Upload Documents Exists API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

/**
 * ✅ UPDATED: Approve Cost Center Budget Amendment
 * Main verification/approval function - Approve, Reject, or Return
 * Matches web app payload structure
 */
export const approveCostCenterBudgetAmend = async (
    approvalData: ApproveCCBudgetAmendmentPayload
): Promise<ApiResponse<any>> => {
    try {
        console.log('🎯 Approving Cost Center Budget Amendment...');

        // ✅ Updated to use correct field names
        console.log('📊 Payload Summary:', {
            CCBudgetAmendmentid: approvalData.CCBudgetAmendmentid,
            AmendmentType: approvalData.AmendmentType,
            CCCode: approvalData.CCCode,
            AmendedValue: approvalData.AmendedValue,
            BudgetId: approvalData.BudgetId,
            VerificationType: approvalData.VerificationType,
            Roleid: approvalData.Roleid,
            CreatedBy: approvalData.CreatedBy,
            totalParameters: Object.keys(approvalData).length
        });

        // ✅ Log full payload for debugging
        console.log('📤 Full Approval Payload:', JSON.stringify(approvalData, null, 2));

        const response = await axios.put<ApiResponse<any>>(
            `${API_BASE_URL}/Accounts/ApproveCostCenterBudgetAmend`,
            approvalData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Cost Center Budget Amendment Approval Response:', {
            status: response.status,
            data: response.data
        });

        return response.data;

    } catch (error: any) {
        console.group('❌ Cost Center Budget Amendment Approval API Error');

        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
            console.error('Response Data:', error.response.data);

            if (error.response.status === 400) {
                console.error('🔍 400 Bad Request Details:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    sentData: error.config?.data,
                    contentType: error.config?.headers['Content-Type']
                });
            }
        } else if (error.request) {
            console.error('No Response Received:', error.request);
        } else {
            console.error('Request Setup Error:', error.message);
        }

        console.error('Full Error Config:', error.config);
        console.groupEnd();

        if (error.response?.data) {
            throw error.response.data;
        } else if (error.response?.status === 400) {
            throw new Error('Bad Request: Invalid data format or missing required fields');
        } else if (error.response?.status === 500) {
            throw new Error('Server Error: Please contact administrator');
        }

        throw error;
    }
};

/**
 * Save CC Amend Budget (Creation)
 */
export const saveCCAmendBudget = async (
    budgetData: SaveCCAmendBudgetPayload
): Promise<ApiResponse<any>> => {
    try {
        console.log('💾 Saving CC Amend Budget...');
        console.log('📊 Budget Data Summary:', {
            CCCode: budgetData.CCCode,
            AmendType: budgetData.AmendType,
            Userid: budgetData.Userid,
            Createdby: budgetData.Createdby,
            totalParameters: Object.keys(budgetData).length
        });

        const response = await axios.post<ApiResponse<any>>(
            `${API_BASE_URL}/Accounts/SaveCCAmendBudget`,
            budgetData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Save CC Amend Budget Response:', {
            status: response.status,
            data: response.data
        });

        return response.data;

    } catch (error: any) {
        console.group('❌ Save CC Amend Budget API Error');

        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        } else if (error.request) {
            console.error('No Response Received:', error.request);
        } else {
            console.error('Request Setup Error:', error.message);
        }

        console.groupEnd();

        if (error.response?.data) {
            throw error.response.data;
        } else if (error.response?.status === 400) {
            throw new Error('Bad Request: Invalid budget data or missing required fields');
        } else if (error.response?.status === 500) {
            throw new Error('Server Error: Please contact administrator');
        }

        throw error;
    }
};

/**
 * Update CC Amend Budget (Return/Update/Correction Submission)
 */
export const updateCCAmendBudget = async (
    updateData: UpdateCCAmendBudgetPayload
): Promise<ApiResponse<any>> => {
    try {
        console.log('🔄 Updating CC Amend Budget...');
        console.log('📊 Update Data Summary:', {
            AmendId: updateData.AmendId,
            AmendType: updateData.AmendType,
            Action: updateData.Action,
            Userid: updateData.Userid,
            Createdby: updateData.Createdby,
            totalParameters: Object.keys(updateData).length
        });

        console.log('🔍 Data Validation Check:', {
            hasAmendId: !!updateData.AmendId,
            hasAmendType: !!updateData.AmendType,
            hasAction: !!updateData.Action,
            hasUserid: !!updateData.Userid,
            hasCreatedby: !!updateData.Createdby,
            actionType: typeof updateData.Action
        });

        const response = await axios.put<ApiResponse<any>>(
            `${API_BASE_URL}/Accounts/UpdateCCAmendBudget`,
            updateData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Update CC Amend Budget Response:', {
            status: response.status,
            data: response.data
        });

        return response.data;

    } catch (error: any) {
        console.group('❌ Update CC Amend Budget API Error');

        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
            console.error('Response Data:', error.response.data);

            if (error.response.status === 400) {
                console.error('🔍 400 Bad Request Details:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    dataSize: error.config?.data ? error.config.data.length : 0,
                    contentType: error.config?.headers['Content-Type']
                });
            }
        } else if (error.request) {
            console.error('No Response Received:', error.request);
        } else {
            console.error('Request Setup Error:', error.message);
        }

        console.error('Full Error Config:', error.config);
        console.groupEnd();

        if (error.response?.data) {
            throw error.response.data;
        } else if (error.response?.status === 400) {
            throw new Error('Bad Request: Invalid update data or missing required fields');
        } else if (error.response?.status === 500) {
            throw new Error('Server Error: Please contact administrator');
        }

        throw error;
    }
};