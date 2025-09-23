// src/api/securityAPI/authAPI.ts
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';

// Type definitions for API requests and responses
export interface AuthCredentials {
    employeeId: string;
    password: string;
}

export interface BackendAuthPayload {
    Username: string;
    Password: string;
}

export interface ApiResponse<T> {
    IsSuccessful: boolean;
    Message: string;
    Data: T;
}

export interface EmployeeValidationData {
    isValidUser: boolean;
}

export interface UserValidationData {
    isValidUser: boolean;
    UserRoleId: string;
    FirstName: string;
    LastName: string;
    userName: string;
    UserName: string;
    MailId: string;
    UserRoleCode: string;
    ccCodes: string[];
    IsFirstTimeLogin: boolean;
    IsExist: boolean;
    UID: string;
}

export interface EmployeeDetailsData {
    // Add specific employee details structure based on your API response
    [key: string]: any; // Temporary - replace with actual structure
}

export interface MenuData {
    // Add specific menu item structure based on your API response
    [key: string]: any; // Temporary - replace with actual structure
}

// Employee Authentication Operations
// ---------------------------------

export const validateEmployee = async (credentials: AuthCredentials): Promise<ApiResponse<EmployeeValidationData>> => {
    try {
        // Convert to backend expected format
        const backendPayload: BackendAuthPayload = {
            Username: credentials.employeeId,  // Convert employeeId to Username
            Password: credentials.password     // Convert password to Password (capital P)
        };

        console.log('🔍 Sending to backend:', backendPayload); // DEBUG
        console.log('🌐 API URL:', `${API_BASE_URL}/Security/GetValidEmployee`); // DEBUG

        const response = await axios.post<ApiResponse<EmployeeValidationData>>(
            `${API_BASE_URL}/Security/GetValidEmployee`,
            backendPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ API Success Response:', response.data); // DEBUG
        return response.data;
    } catch (error: any) {
        console.error('❌ API Error:', error.response || error);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error data:', error.response?.data);

        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// Role/User Authentication Operations
// ---------------------------------

export const validateUser = async (credentials: AuthCredentials): Promise<ApiResponse<UserValidationData>> => {
    try {
        // Convert to backend expected format
        const backendPayload: BackendAuthPayload = {
            Username: credentials.employeeId,  // Convert employeeId to Username
            Password: credentials.password     // Convert password to Password (capital P)
        };

        console.log('🔍 Sending user validation to backend:', backendPayload); // DEBUG

        const response = await axios.post<ApiResponse<UserValidationData>>(
            `${API_BASE_URL}/Security/GetValidUser`,
            backendPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Validated user data:', response.data);

        return response.data;
    } catch (error: any) {
        console.error('User Validation API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// Employee Details Operations
// -------------------------

export const getEmployeeDetails = async (username: string): Promise<ApiResponse<EmployeeDetailsData>> => {
    try {
        console.log('🔍 Getting employee details for:', username); // DEBUG

        const response = await axios.get<ApiResponse<EmployeeDetailsData>>(
            `${API_BASE_URL}/Accounts/GetEmployeeDetailsbyUser?UserName=${username}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ GET EmployeeDetails:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Employee Details API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// Menu/Role Operations
// ------------------

export const getMenu = async (roleId: string): Promise<ApiResponse<MenuData[]>> => {
    try {
        console.log('🔍 Getting menu for roleId:', roleId); // DEBUG

        const response = await axios.get<ApiResponse<MenuData[]>>(
            `${API_BASE_URL}/Accounts/GetMenu?roleId=${roleId}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Menu API Error:', error.response || error);
        if (error.response?.data) {
            throw error.response.data;
        }
        throw error;
    }
};

