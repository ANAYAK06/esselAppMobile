// app/(auth)/login.tsx - Clean Login Screen (Password Only)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, User, Lock, Building2 } from 'lucide-react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Redux hooks - Auth only
import { useAppDispatch, useAuth } from '@/src/store/hooks';
import {
    validateEmployee,
    clearErrors,
    clearSuccess,
    loadFromStorage
} from '@/src/slice/auth/authSlice';

import NetworkDebug from "@/src/components/debug/NetworkDebug";

// Validation Schema
const validationSchema = Yup.object({
    employeeId: Yup.string()
        .min(3, 'Employee ID must be at least 3 characters')
        .required('Employee ID is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required')
});

export default function LoginScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');

    // Auth Redux state
    const {
        loading,
        errors,
        success,
        isAuthenticated,
        loginType
    } = useAuth();

    // Check for existing session on mount
    useEffect(() => {
        console.log('🔄 Login screen mounted - checking session');
        dispatch(loadFromStorage());
    }, [dispatch]);

    // Formik setup for login
    const formik = useFormik({
        initialValues: {
            employeeId: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            console.log('Login attempt:', values);
            const credentials = {
                employeeId: values.employeeId,
                password: values.password
            };
            dispatch(validateEmployee(credentials));
        }
    });

    // Handle success states
    useEffect(() => {
        if (success.validateEmployee) {
            console.log('✅ Employee validation successful');
            dispatch(clearSuccess());
            router.push('/login-options');
        }
    }, [success.validateEmployee, dispatch, router]);

    useEffect(() => {
        if (success.getEmployeeDetails) {
            dispatch(clearSuccess());
            router.replace('/employee-dashboard');
        }
    }, [success.getEmployeeDetails, dispatch, router]);

    useEffect(() => {
        if (success.getMenu) {
            dispatch(clearSuccess());
            router.replace('/role-dashboard');
        }
    }, [success.getMenu, dispatch, router]);

    // Handle error states
    useEffect(() => {
        if (errors.validateEmployee) {
            Alert.alert('Login Error', errors.validateEmployee);
            dispatch(clearErrors());
        }
    }, [errors.validateEmployee, dispatch]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && loginType) {
            console.log('✅ Valid session found - redirecting to dashboard');
            if (loginType === 'employee') {
                router.replace('/employee-dashboard');
            } else if (loginType === 'role') {
                router.replace('/role-dashboard');
            }
        }
    }, [isAuthenticated, loginType, router]);

    // Clear errors when user starts typing
    useEffect(() => {
        if (formik.touched.employeeId || formik.touched.password) {
            dispatch(clearErrors());
        }
    }, [formik.touched, dispatch]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <StatusBar style="light" />

            {/* Gradient Background */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#4f46e5']}
                style={{ flex: 1 }}
            >
                {/* Background Overlay */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    }}
                />

                {/* Background Pattern */}
                <View className="absolute inset-0 opacity-10">
                    <View
                        className="absolute top-20 right-10 w-32 h-32 border border-white rounded-full"
                        style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                    <View
                        className="absolute bottom-40 left-10 w-24 h-24 border border-white"
                        style={{
                            borderColor: 'rgba(255,255,255,0.15)',
                            transform: [{ rotate: '45deg' }]
                        }}
                    />
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingVertical: 60, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ paddingHorizontal: 24 }}>
                        {/* Header */}
                        <View className="items-center mb-10">
                            <View
                                className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderWidth: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <Building2 size={40} color="white" />
                            </View>
                            <Text
                                className="text-4xl font-bold mb-2"
                                style={{
                                    color: 'white',
                                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                    textShadowOffset: { width: 0, height: 2 },
                                    textShadowRadius: 4,
                                }}
                            >
                                Welcome Back
                            </Text>
                            <Text
                                className="text-center text-lg"
                                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                            >
                                Sign in to Essel Projects
                            </Text>
                        </View>

                        {/* Login Form */}
                        <View
                            className="rounded-2xl p-6"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            {/* Employee ID Input */}
                            <View className="mb-5">
                                <Text
                                    className="font-semibold mb-3 text-base"
                                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                    Employee ID
                                </Text>
                                <View className="relative">
                                    <TextInput
                                        value={formik.values.employeeId}
                                        onChangeText={formik.handleChange('employeeId')}
                                        onBlur={() => {
                                            formik.handleBlur('employeeId');
                                            setFocusedField('');
                                        }}
                                        onFocus={() => setFocusedField('employeeId')}
                                        placeholder="Enter your employee ID"
                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        className="rounded-xl px-4 py-4 pr-12 text-base"
                                        style={{
                                            backgroundColor: focusedField === 'employeeId'
                                                ? 'rgba(255, 255, 255, 0.25)'
                                                : 'rgba(255, 255, 255, 0.2)',
                                            borderWidth: 2,
                                            borderColor: focusedField === 'employeeId'
                                                ? 'rgba(255, 255, 255, 0.5)'
                                                : formik.touched.employeeId && formik.errors.employeeId
                                                    ? 'rgba(239, 68, 68, 0.6)'
                                                    : 'rgba(255, 255, 255, 0.3)',
                                            color: 'white',
                                        }}
                                        editable={!loading.validateEmployee}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <View className="absolute right-4 top-4">
                                        <User
                                            size={20}
                                            color={focusedField === 'employeeId' ? 'white' : 'rgba(255, 255, 255, 0.7)'}
                                        />
                                    </View>
                                </View>
                                {formik.touched.employeeId && formik.errors.employeeId && (
                                    <Text
                                        className="text-sm mt-2 ml-2"
                                        style={{ color: 'rgba(239, 68, 68, 0.9)' }}
                                    >
                                        {formik.errors.employeeId}
                                    </Text>
                                )}
                            </View>

                            {/* Password Input */}
                            <View className="mb-6">
                                <Text
                                    className="font-semibold mb-3 text-base"
                                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                    Password
                                </Text>
                                <View className="relative">
                                    <TextInput
                                        value={formik.values.password}
                                        onChangeText={formik.handleChange('password')}
                                        onBlur={() => {
                                            formik.handleBlur('password');
                                            setFocusedField('');
                                        }}
                                        onFocus={() => setFocusedField('password')}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        secureTextEntry={!showPassword}
                                        className="rounded-xl px-4 py-4 pr-20 text-base"
                                        style={{
                                            backgroundColor: focusedField === 'password'
                                                ? 'rgba(255, 255, 255, 0.25)'
                                                : 'rgba(255, 255, 255, 0.2)',
                                            borderWidth: 2,
                                            borderColor: focusedField === 'password'
                                                ? 'rgba(255, 255, 255, 0.5)'
                                                : formik.touched.password && formik.errors.password
                                                    ? 'rgba(239, 68, 68, 0.6)'
                                                    : 'rgba(255, 255, 255, 0.3)',
                                            color: 'white',
                                        }}
                                        editable={!loading.validateEmployee}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <View className="absolute right-4 top-4 flex-row items-center">
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            disabled={loading.validateEmployee}
                                            className="mr-3"
                                        >
                                            {showPassword ? (
                                                <EyeOff
                                                    size={20}
                                                    color={focusedField === 'password' ? 'white' : 'rgba(255, 255, 255, 0.7)'}
                                                />
                                            ) : (
                                                <Eye
                                                    size={20}
                                                    color={focusedField === 'password' ? 'white' : 'rgba(255, 255, 255, 0.7)'}
                                                />
                                            )}
                                        </TouchableOpacity>
                                        <Lock
                                            size={20}
                                            color={focusedField === 'password' ? 'white' : 'rgba(255, 255, 255, 0.7)'}
                                        />
                                    </View>
                                </View>
                                {formik.touched.password && formik.errors.password && (
                                    <Text
                                        className="text-sm mt-2 ml-2"
                                        style={{ color: 'rgba(239, 68, 68, 0.9)' }}
                                    >
                                        {formik.errors.password}
                                    </Text>
                                )}
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={() => formik.handleSubmit()}
                                disabled={loading.validateEmployee || !formik.isValid || !formik.dirty}
                                className="rounded-xl py-4 px-6"
                                style={{
                                    backgroundColor: loading.validateEmployee || !formik.isValid || !formik.dirty
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : 'rgba(255, 255, 255, 0.9)',
                                }}
                            >
                                {loading.validateEmployee ? (
                                    <View className="flex-row items-center justify-center">
                                        <ActivityIndicator size="small" color="#4f46e5" />
                                        <Text
                                            className="font-semibold ml-3 text-lg"
                                            style={{ color: '#4f46e5' }}
                                        >
                                            Signing in...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text
                                        className="font-bold text-center text-lg"
                                        style={{ color: '#4f46e5' }}
                                    >
                                        Sign In
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Forgot Password */}
                            <TouchableOpacity className="mt-6">
                                <Text
                                    className="text-center font-medium text-base underline"
                                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="mt-8">
                            <Text
                                className="text-center text-sm"
                                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                Having trouble? Contact{' '}
                                <Text
                                    className="font-medium"
                                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                    IT Support
                                </Text>
                            </Text>
                        </View>

                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}