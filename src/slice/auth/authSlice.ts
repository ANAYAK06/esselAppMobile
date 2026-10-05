// src/slices/auth/authSlice.ts - Complete Updated Version
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AuthCredentials,
    ApiResponse,
    EmployeeValidationData,
    UserValidationData,
    EmployeeDetailsData,
    MenuData,
    validateEmployee as validateEmployeeAPI,
    validateUser as validateUserAPI,
    getEmployeeDetails as getEmployeeDetailsAPI,
    getMenu as getMenuAPI
} from '../../api/auth/authAPI';

// Redux State Interface
export interface AuthState {
    // Authentication Status
    isAuthenticated: boolean;
    employeeValidated: boolean;
    loginType: 'employee' | 'role' | null;

    // User Data
    employeeId: string | null;
    employeeData: EmployeeDetailsData | null;
    userData: UserData | null;
    roleId: string | null;
    menuData: MenuData[] | null;

    // Loading States
    loading: {
        validateEmployee: boolean;
        validateUser: boolean;
        getEmployeeDetails: boolean;
        getMenu: boolean;
    };

    // Error States
    errors: {
        validateEmployee: string | null;
        validateUser: string | null;
        getEmployeeDetails: string | null;
        getMenu: string | null;
    };

    // Success Flags
    success: {
        validateEmployee: boolean;
        validateUser: boolean;
        getEmployeeDetails: boolean;
        getMenu: boolean;
    };
}

// Additional Types for Better Organization
export interface UserData {
    firstName: string;
    lastName: string;
    userName: string;
    mailId: string;
    roleCode: string;
    roleId: string;
    employeeId: string;
    ccCodes: string[];
    groupId?: number; // approval-chain group, used by the role dashboard's pending tracking
    isFirstTimeLogin: boolean;
    isExist: boolean;
    uid: string;
}

// Storage Helper Functions
const saveToStorage = async (key: string, value: any): Promise<void> => {
    try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
        console.warn(`Failed to save ${key} to storage:`, error);
    }
};

const removeFromStorage = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.warn(`Failed to remove ${key} from storage:`, error);
    }
};

// Async Thunks
// ============

// 1. Validate Employee
export const validateEmployee = createAsyncThunk<
    { success: boolean; data: EmployeeValidationData; message: string },
    AuthCredentials,
    { rejectValue: string }
>(
    'auth/validateEmployee',
    async (credentials, { rejectWithValue }) => {
        try {
            console.log('🔍 Calling validateEmployee API for:', credentials.employeeId);

            const response: ApiResponse<EmployeeValidationData> = await validateEmployeeAPI(credentials);

            console.log('🎯 API Response received:', response);
            console.log('🎯 Response.Data:', response.Data);
            console.log('🎯 Response.Data.isValidUser:', response.Data?.isValidUser);
            console.log('🎯 IsSuccessful:', response.IsSuccessful);

            // Check for isValidUser first
            if (response?.Data?.isValidUser) {
                console.log('✅ Employee validation successful');
                return {
                    success: true,
                    data: response.Data,
                    message: response.Message
                };
            }
            // Fallback to original pattern: check IsSuccessful
            else if (response?.IsSuccessful) {
                console.log('✅ Employee validation successful (Original pattern)');
                return {
                    success: true,
                    data: response.Data,
                    message: response.Message
                };
            }
            // Debug mode: show all available properties
            else if (response) {
                console.log('❓ Response structure debug:');
                console.log('❓ Available properties:', Object.keys(response));
                if (response.Data) {
                    console.log('❓ Data properties:', Object.keys(response.Data));
                }
                const errorMessage = response.Message || 'Invalid employee credentials';
                return rejectWithValue(errorMessage);
            } else {
                console.log('❌ No response received');
                return rejectWithValue('No response from server');
            }
        } catch (error: any) {
            console.error('🚨 API Error:', error);
            if (error.response?.data?.Message) {
                return rejectWithValue(error.response.data.Message);
            }
            return rejectWithValue(error.message || 'Failed to validate employee credentials');
        }
    }
);

// 2. Validate User/Role - Using Working Pattern
export const validateUser = createAsyncThunk<
    { success: boolean; data: UserValidationData; roleId: string; message: string; userData: UserData },
    AuthCredentials,
    { rejectValue: string }
>(
    'auth/validateUser',
    async (credentials, { rejectWithValue }) => {
        try {
            console.log('🔍 Calling validateUser API');

            const response: ApiResponse<UserValidationData> = await validateUserAPI(credentials);

            console.log('🎯 User API Response:', response);
            console.log('🎯 User Data.isValidUser:', response.Data?.isValidUser);
            console.log('🎯 User Data.UserRoleId:', response.Data?.UserRoleId);
            console.log('🎯 User Data.FirstName:', response.Data?.FirstName);
            console.log('🎯 User Data.UserRoleCode:', response.Data?.UserRoleCode);

            // Check if user validation succeeded
            if (response?.Data?.isValidUser) {
                console.log('✅ User validation successful - extracting complete user data');

                const roleId = response.Data.UserRoleId;

                if (roleId) {
                    console.log('✅ Found roleId:', roleId);
                    console.log('✅ Storing complete user data:', response.Data);

                    const userData: UserData = {
                        firstName: response.Data.FirstName,
                        lastName: response.Data.LastName,
                        userName: response.Data.userName || response.Data.UserName,
                        mailId: response.Data.MailId,
                        roleCode: response.Data.UserRoleCode,
                        roleId: roleId,
                        employeeId: credentials.employeeId,
                        ccCodes: response.Data.ccCodes,
                        groupId: Number(response.Data.GroupId) || 0,
                        isFirstTimeLogin: response.Data.IsFirstTimeLogin,
                        isExist: response.Data.IsExist,
                        uid: response.Data.UID,
                    };

                    // Save to storage
                    await saveToStorage('userData', userData);
                    await saveToStorage('roleId', roleId);

                    return {
                        success: true,
                        data: response.Data,
                        roleId: roleId,
                        message: response.Message,
                        userData: userData
                    };
                } else {
                    console.log('❌ No roleId found in response');
                    return rejectWithValue('Role ID not found in response');
                }
            }
            // Fallback to original pattern: check IsSuccessful
            else if (response?.IsSuccessful) {
                console.log('✅ User validation successful (Original pattern)');

                const roleId = response.Data?.UserRoleId;

                if (roleId) {
                    const userData: UserData = {
                        firstName: response.Data.FirstName || '',
                        lastName: response.Data.LastName || '',
                        userName: response.Data.userName || response.Data.UserName || '',
                        mailId: response.Data.MailId || '',
                        roleCode: response.Data.UserRoleCode || '',
                        roleId: roleId,
                        employeeId: credentials.employeeId,
                        ccCodes: response.Data.ccCodes || [],
                        groupId: Number(response.Data.GroupId) || 0,
                        isFirstTimeLogin: response.Data.IsFirstTimeLogin || false,
                        isExist: response.Data.IsExist || false,
                        uid: response.Data.UID || '',
                    };

                    await saveToStorage('userData', userData);
                    await saveToStorage('roleId', roleId);

                    return {
                        success: true,
                        data: response.Data,
                        roleId: roleId,
                        message: response.Message,
                        userData: userData
                    };
                } else {
                    console.log('❌ No roleId found in response');
                    return rejectWithValue('Role ID not found in response');
                }
            } else {
                console.log('❌ User validation failed or isValidUser not true');
                const errorMessage = response?.Message || 'Invalid role credentials';
                return rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            console.error('🚨 User API Error:', error);
            return rejectWithValue(error.message || 'Failed to validate user role credentials');
        }
    }
);

// 3. Get Employee Details
export const getEmployeeDetails = createAsyncThunk<
    EmployeeDetailsData,
    string,
    { rejectValue: string }
>(
    'auth/getEmployeeDetails',
    async (username, { rejectWithValue }) => {
        try {
            console.log('🔍 Getting employee details for:', username);

            const response: ApiResponse<EmployeeDetailsData> = await getEmployeeDetailsAPI(username);

            console.log('🎯 Employee Details Response:', response);

            // Accept data when present regardless of IsSuccessful — the API returns false even on
            // success (same rule as the Corex web app)
            if (response?.Data && (response.IsSuccessful === true || response.ResponseCode === 200)) {
                await saveToStorage('employeeData', response.Data);
                await saveToStorage('loginType', 'employee');

                return response.Data;
            } else {
                return rejectWithValue(response.Message || 'Failed to get employee details');
            }
        } catch (error: any) {
            console.error('Get Employee Details Error:', error);
            return rejectWithValue(error.message || 'Failed to fetch employee details');
        }
    }
);

// 4. Get Menu Data
export const getMenu = createAsyncThunk<
    MenuData[],
    string,
    { rejectValue: string }
>(
    'auth/getMenu',
    async (roleId, { rejectWithValue }) => {
        try {
            console.log('🔍 Getting menu for roleId:', roleId);

            const response: ApiResponse<MenuData[]> = await getMenuAPI(roleId);

            console.log('🎯 Menu Response:', response);

            // Check for data presence regardless of success flag
            if (response && response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
                console.log('✅ Menu data found - processing menu items');

                await saveToStorage('menuData', response.Data);
                await saveToStorage('loginType', 'role');

                return response.Data;
            }
            // Fallback: check traditional success pattern
            else if (response?.IsSuccessful) {
                console.log('✅ Menu retrieved via success flag');

                await saveToStorage('menuData', response.Data || []);
                await saveToStorage('loginType', 'role');

                return response.Data || [];
            } else {
                console.log('❌ No valid menu data found');
                return rejectWithValue(response?.Message || 'No menu data available for this role');
            }
        } catch (error: any) {
            console.error('Get Menu Error:', error);
            return rejectWithValue(error.message || 'Failed to fetch menu data');
        }
    }
);

// 5. Load from Storage (for app initialization)
export const loadFromStorage = createAsyncThunk<
    {
        employeeId: string | null;
        employeeData: EmployeeDetailsData | null;
        userData: UserData | null;
        roleId: string | null;
        menuData: MenuData[] | null;
        loginType: 'employee' | 'role' | null;
    },
    void,
    { rejectValue: string }
>(
    'auth/loadFromStorage',
    async (_, { rejectWithValue }) => {
        try {
            const [employeeId, employeeData, userData, roleId, menuData, loginType] = await Promise.all([
                AsyncStorage.getItem('employeeId'),
                AsyncStorage.getItem('employeeData'),
                AsyncStorage.getItem('userData'),
                AsyncStorage.getItem('roleId'),
                AsyncStorage.getItem('menuData'),
                AsyncStorage.getItem('loginType'),
            ]);

            return {
                employeeId,
                employeeData: employeeData ? JSON.parse(employeeData) : null,
                userData: userData ? JSON.parse(userData) : null,
                roleId,
                menuData: menuData ? JSON.parse(menuData) : null,
                loginType: loginType as 'employee' | 'role' | null,
            };
        } catch (error) {
            console.error('Load from storage error:', error);
            return rejectWithValue('Failed to load user data from storage');
        }
    }
);

// Initial State
export const initialState: AuthState = {
    isAuthenticated: false,
    employeeValidated: false,
    loginType: null,
    employeeId: null,
    employeeData: null,
    userData: null,
    roleId: null,
    menuData: null,
    loading: {
        validateEmployee: false,
        validateUser: false,
        getEmployeeDetails: false,
        getMenu: false,
    },
    errors: {
        validateEmployee: null,
        validateUser: null,
        getEmployeeDetails: null,
        getMenu: null,
    },
    success: {
        validateEmployee: false,
        validateUser: false,
        getEmployeeDetails: false,
        getMenu: false,
    },
};

// Auth Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Clear all errors
        clearErrors: (state) => {
            state.errors = initialState.errors;
        },

        // Clear all success flags
        clearSuccess: (state) => {
            state.success = initialState.success;
        },

        // Reset authentication state
        resetAuth: (state) => {
            // Clear storage async (fire and forget)
            Promise.all([
                removeFromStorage('employeeId'),
                removeFromStorage('employeeData'),
                removeFromStorage('userData'),
                removeFromStorage('roleId'),
                removeFromStorage('menuData'),
                removeFromStorage('loginType'),
            ]).catch(console.warn);

            return initialState;
        },

        // Logout user
        logout: (state) => {
            // Clear storage async (fire and forget)
            Promise.all([
                removeFromStorage('employeeData'),
                removeFromStorage('userData'),
                removeFromStorage('roleId'),
                removeFromStorage('menuData'),
                removeFromStorage('loginType'),
            ]).catch(console.warn);

            return {
                ...initialState,
                employeeId: state.employeeId, // Keep employee ID for re-login
            };
        },
    },

    extraReducers: (builder) => {
        builder
            // Validate Employee
            .addCase(validateEmployee.pending, (state) => {
                state.loading.validateEmployee = true;
                state.errors.validateEmployee = null;
                state.success.validateEmployee = false;
            })
            .addCase(validateEmployee.fulfilled, (state, action) => {
                state.loading.validateEmployee = false;
                state.success.validateEmployee = true;
                state.employeeValidated = true;
                state.isAuthenticated = true;
                state.employeeId = action.meta.arg.employeeId;

                // Save employeeId to storage
                saveToStorage('employeeId', action.meta.arg.employeeId);
            })
            .addCase(validateEmployee.rejected, (state, action) => {
                state.loading.validateEmployee = false;
                state.errors.validateEmployee = action.payload || 'Employee validation failed';
                state.employeeValidated = false;
            })

            // Validate User - Updated for new return type
            .addCase(validateUser.pending, (state) => {
                state.loading.validateUser = true;
                state.errors.validateUser = null;
                state.success.validateUser = false;
            })
            .addCase(validateUser.fulfilled, (state, action) => {
                state.loading.validateUser = false;
                state.success.validateUser = true;
                state.userData = action.payload.userData;
                state.roleId = String(action.payload.roleId);
            })
            .addCase(validateUser.rejected, (state, action) => {
                state.loading.validateUser = false;
                state.errors.validateUser = action.payload || 'User validation failed';
            })

            // Get Employee Details
            .addCase(getEmployeeDetails.pending, (state) => {
                state.loading.getEmployeeDetails = true;
                state.errors.getEmployeeDetails = null;
                state.success.getEmployeeDetails = false;
            })
            .addCase(getEmployeeDetails.fulfilled, (state, action) => {
                state.loading.getEmployeeDetails = false;
                state.success.getEmployeeDetails = true;
                state.employeeData = action.payload;
                state.loginType = 'employee';
                state.isAuthenticated = true;
            })
            .addCase(getEmployeeDetails.rejected, (state, action) => {
                state.loading.getEmployeeDetails = false;
                state.errors.getEmployeeDetails = action.payload || 'Failed to get employee details';
            })

            // Get Menu
            .addCase(getMenu.pending, (state) => {
                state.loading.getMenu = true;
                state.errors.getMenu = null;
                state.success.getMenu = false;
            })
            .addCase(getMenu.fulfilled, (state, action) => {
                state.loading.getMenu = false;
                state.success.getMenu = true;
                state.menuData = action.payload;
                state.loginType = 'role';
                state.isAuthenticated = true;
            })
            .addCase(getMenu.rejected, (state, action) => {
                state.loading.getMenu = false;
                state.errors.getMenu = action.payload || 'Failed to get menu data';
            })

            // Load from Storage
            .addCase(loadFromStorage.fulfilled, (state, action) => {
                const { employeeId, employeeData, userData, roleId, menuData, loginType } = action.payload;

                state.employeeId = employeeId;
                state.employeeData = employeeData;
                state.userData = userData;
                state.roleId = roleId;
                state.menuData = menuData;
                state.loginType = loginType;

                // Set authentication status based on available data
                state.isAuthenticated = !!(
                    (loginType === 'employee' && employeeData) ||
                    (loginType === 'role' && menuData && menuData.length > 0)
                );

                state.employeeValidated = !!employeeId;
            });
    },
});

// Export actions and reducer
export const { clearErrors, clearSuccess, resetAuth, logout } = authSlice.actions;
export default authSlice.reducer;