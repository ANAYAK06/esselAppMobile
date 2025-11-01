// src/api/purchase/indentAPI.ts
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface ApiResponse<T> {
    IsSuccessful: boolean;
    Message: string;
    Data: T;
    ResponseCode?: number; // Backend includes this field
}

// Indent Level Item
export interface IndentLevel {
    LevelId?: string;
    LevelName?: string;
    LevelOrder?: number;
    IndentPresentLevel?: number;
    IndentDefineLevel?: number;
    NewItemDefineLevel?: number;
    [key: string]: any;
}

// Indent Item Detail
export interface IndentItemDetail {
    ItemId: string;
    ItemCode: string;
    ItemName: string;
    Quantity: number;
    UOM: string;
    Rate?: number;
    Amount?: number;
    Description?: string;
    Status?: string;
    [key: string]: any;
}

// Indent Verification Grid Item
export interface IndentVerificationItem {
    Indno: string;
    IndentDate: string;
    CreatedBy: string;
    CreatedDate: string;
    Department?: string;
    Status: string;
    ApprovalStatus?: string;
    TotalItems?: number;
    [key: string]: any;
}

// Indent Remark
export interface IndentRemark {
    Remarks: string;
}
// Verify Indent Payload (Web Application Format)
export interface VerifyIndentPayload {
    Rowid: string;
    Appstatus: string;
    AprovalRemarks: string;
    Remarks: string;
    Crtdby: string;
    Createdby: string;
    Indent: string;
    IndentNo: string;
    Roleid: string;
    RoleId: string;
    [key: string]: any;
}
// ==============================================
// API FUNCTIONS
// ==============================================

/**
 * Get Indent Levels
 * Retrieves available indent levels for a given MO and Role
 */
export const getIndentLevels = async (
    moId: string,
    roleId: string
): Promise<ApiResponse<IndentLevel>> => {
    try {
        console.log('📊 Getting Indent Levels:', { moId, roleId });

        const response = await axios.get<ApiResponse<IndentLevel>>(
            `${API_BASE_URL}/Purchase/GetIndentLevels?MOID=${moId}&Roleid=${roleId}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Indent Levels Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Indent Levels API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

/**
 * View Indent Items Details
 * Retrieves detailed item information for a specific indent
 */
export const viewIndentItemsDetails = async (
    indno: string
): Promise<ApiResponse<IndentItemDetail[]>> => {
    try {
        console.log('🔍 Getting Indent Items Details:', { indno });

        const response = await axios.get<ApiResponse<IndentItemDetail[]>>(
            `${API_BASE_URL}/Purchase/ViewIndentItemsDetails?Indno=${indno}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Indent Items Details Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Indent Items Details API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

/**
 * Get Indent Verification Grid
 * Retrieves list of indents for verification based on role and user
 */
export const getIndentVerificationGrid = async (
    roleId: string,
    created: string,
    userId: string
): Promise<ApiResponse<IndentVerificationItem[]>> => {
    try {
        console.log('📋 Getting Indent Verification Grid:', { roleId, created, userId });

        const response = await axios.get<ApiResponse<IndentVerificationItem[]>>(
            `${API_BASE_URL}/Purchase/VerifyIndentCreationGrid?Roleid=${roleId}&Created=${created}&Userid=${userId}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Indent Verification Grid Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Indent Verification Grid API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

/**
 * Verify Indent
 * Main verification/approval function - Approve, Reject, or Return an indent
 */
export const verifyIndent = async (
    verificationData: VerifyIndentPayload
): Promise<ApiResponse<any>> => {
    try {
        console.log('🎯 Verifying Indent...');

        console.log('📊 Verification Payload Summary:', {
            Indent: verificationData.Indent,
            Rowid: verificationData.Rowid,
            Appstatus: verificationData.Appstatus,
            Crtdby: verificationData.Crtdby,
            hasRemarks: !!verificationData.Remarks,
            totalParameters: Object.keys(verificationData).length
        });

        // Log full payload for debugging
        console.log('📤 Full Verification Payload:', JSON.stringify(verificationData, null, 2));

        // Log full payload for debugging
        console.log('📤 Full Verification Payload:', JSON.stringify(verificationData, null, 2));

        // Create the request config
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        };

        console.log('🔍 Request Configuration:', {
            method: 'PUT',
            url: `${API_BASE_URL}/Purchase/VerifyIndent`,
            hasAuthHeaders: !!axios.defaults.headers.common['Authorization'],
            headers: requestConfig.headers
        });

        const response = await axios.put<ApiResponse<any>>(
            `${API_BASE_URL}/Purchase/VerifyIndent`,
            verificationData,
            requestConfig
        );

        console.log('✅ Indent Verification Response:', {
            status: response.status,
            data: response.data
        });

        return response.data;

    } catch (error: any) {
        console.group('❌ Indent Verification API Error');

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
            throw new Error('Bad Request: Invalid verification data or missing required fields');
        } else if (error.response?.status === 500) {
            throw new Error('Server Error: Please contact administrator');
        }

        throw error;
    }
};

/**
 * View Indent Remarks
 * Retrieves all remarks/comments for a specific indent
 */
export const viewIndentRemarks = async (
    indno: string
): Promise<ApiResponse<IndentRemark[]>> => {
    try {
        console.log('💬 Getting Indent Remarks:', { indno });

        const response = await axios.get<ApiResponse<IndentRemark[]>>(
            `${API_BASE_URL}/Purchase/ViewIndentRemarks?Indno=${indno}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Indent Remarks Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Indent Remarks API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// ==============================================
// UTILITY FUNCTIONS (Optional)
// ==============================================

/**
 * Get Indent Full Details
 * Convenience function to fetch both items and remarks in one call
 */
export const getIndentFullDetails = async (
    indno: string
): Promise<{
    items: ApiResponse<IndentItemDetail[]>;
    remarks: ApiResponse<IndentRemark[]>;
}> => {
    try {
        console.log('📦 Getting Full Indent Details:', { indno });

        const [itemsResponse, remarksResponse] = await Promise.all([
            viewIndentItemsDetails(indno),
            viewIndentRemarks(indno)
        ]);

        console.log('✅ Full Indent Details Retrieved Successfully');

        return {
            items: itemsResponse,
            remarks: remarksResponse
        };
    } catch (error: any) {
        console.error('❌ Get Indent Full Details Error:', error);
        throw error;
    }
};