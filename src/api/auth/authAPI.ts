// src/api/securityAPI/authAPI.ts
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';
import { CLIENT_HEADER, setTokenInfo, TokenInfo } from '@/src/service/authToken';

// Without a timeout a hung request keeps the login sheet's buttons disabled indefinitely
const AUTH_TIMEOUT_MS = 30000;

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
    ResponseCode?: number;
}

// Login responses also carry Token (access + refresh token) when the API has token login enabled
export interface LoginResponse<T> extends ApiResponse<T> {
    Token?: TokenInfo;
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
    GroupId?: number;
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

        console.log('🔍 Sending to backend for:', backendPayload.Username); // DEBUG (never log the password)
        console.log('🌐 API URL:', `${API_BASE_URL}/Security/GetValidEmployee`); // DEBUG

        const response = await axios.post<LoginResponse<EmployeeValidationData>>(
            `${API_BASE_URL}/Security/GetValidEmployee`,
            backendPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...CLIENT_HEADER,
                },
                timeout: AUTH_TIMEOUT_MS,
            }
        );

        // Keep the tokens (absent on servers without token login); never log the response - it holds them
        await setTokenInfo(response.data?.Token);
        console.log('✅ Employee login response, valid:', response.data?.Data?.isValidUser); // DEBUG
        return response.data;
    } catch (error: any) {
        // Status + server message only: the error's request config contains the password
        console.error('❌ Employee login failed:', error.response?.status, error.response?.data?.Message ?? error.message);

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

        console.log('🔍 Sending user validation to backend for:', backendPayload.Username); // DEBUG (never log the password)

        const response = await axios.post<LoginResponse<UserValidationData>>(
            `${API_BASE_URL}/Security/GetValidUser`,
            backendPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...CLIENT_HEADER,
                },
                timeout: AUTH_TIMEOUT_MS,
            }
        );

        // Role login returns a role token (UID / RoleId) that replaces the employee token
        await setTokenInfo(response.data?.Token);
        console.log('✅ Role login response, valid:', response.data?.Data?.isValidUser); // DEBUG

        return response.data;
    } catch (error: any) {
        // Status + server message only: the error's request config contains the password
        console.error('User Validation API Error:', error.response?.status, error.response?.data?.Message ?? error.message);
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
                },
                timeout: AUTH_TIMEOUT_MS,
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
                },
                timeout: AUTH_TIMEOUT_MS,
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

