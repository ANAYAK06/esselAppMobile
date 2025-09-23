// app/(auth)/login-options.tsx - Clean Login Options (Password Only)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, User, Shield, Eye, EyeOff } from 'lucide-react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Redux hooks
import { useAppDispatch, useAuth } from '@/src/store/hooks';
import {
    validateUser,
    getEmployeeDetails,
    getMenu,
    clearErrors,
    clearSuccess,
    logout
} from '@/src/slice/auth/authSlice';

// Validation Schema
const roleValidationSchema = Yup.object({
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Role password is required')
});

export default function LoginOptionsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [showRoleLogin, setShowRoleLogin] = useState(false);
    const [showRolePassword, setShowRolePassword] = useState(false);
    const [isProcessingLogin, setIsProcessingLogin] = useState(false);

    const {
        employeeId,
        employeeValidated,
        loading,
        errors,
        success,
        isAuthenticated
    } = useAuth();

    // Check authentication
    useEffect(() => {
        if (!isAuthenticated || !employeeId) {
            console.log('❌ No authentication found - redirecting to login');
            router.replace('/login');
        }
    }, [isAuthenticated, employeeId, router]);

    // Handle success states
    useEffect(() => {
        if (success.getEmployeeDetails && !isProcessingLogin) {
            console.log('✅ Employee login successful');
            dispatch(clearSuccess());
            router.replace('/employee-dashboard');
        }
    }, [success.getEmployeeDetails, dispatch, router, isProcessingLogin]);

    useEffect(() => {
        if (success.getMenu && isProcessingLogin) {
            console.log('✅ Role login successful');
            dispatch(clearSuccess());
            setIsProcessingLogin(false);
            router.replace('/role-dashboard');
        }
    }, [success.getMenu, dispatch, router, isProcessingLogin]);

    // Role form
    const roleFormik = useFormik({
        initialValues: { password: '' },
        validationSchema: roleValidationSchema,
        onSubmit: async (values) => {
            setIsProcessingLogin(true);
            try {
                const credentials = { employeeId: employeeId || '', password: values.password };
                const userResult = await dispatch(validateUser(credentials)).unwrap();

                if (userResult.roleId) {
                    await dispatch(getMenu(userResult.roleId)).unwrap();
                } else {
                    Alert.alert('Error', 'Role ID not found');
                    setIsProcessingLogin(false);
                }
            } catch (error: any) {
                console.error('Role login error:', error);
                setIsProcessingLogin(false);
                Alert.alert('Login Error', error || 'Role login failed');
            }
        }
    });

    // Handle employee login
    const handleEmployeeLogin = async () => {
        setIsProcessingLogin(true);
        try {
            if (employeeId) {
                await dispatch(getEmployeeDetails(employeeId)).unwrap();
            }
        } catch (error: any) {
            console.error('Employee login error:', error);
            Alert.alert('Login Error', error || 'Employee login failed');
            setIsProcessingLogin(false);
        }
    };

    const handleBackToLogin = () => {
        dispatch(logout());
        dispatch(clearErrors());
        dispatch(clearSuccess());
        router.replace('/login');
    };

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="light" />

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

                {/* Header */}
                <View className="pt-12 pb-4 px-6 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBackToLogin}
                        disabled={isProcessingLogin}
                        className="mr-4 p-2 rounded-lg"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text
                            className="text-xl font-semibold"
                            style={{
                                color: 'white',
                                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            Choose Access Type
                        </Text>
                        <Text
                            className="text-sm"
                            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        >
                            Employee ID: {employeeId}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' }}
                    showsVerticalScrollIndicator={false}
                >
                    {!showRoleLogin ? (
                        // Access Level Selection
                        <View className="space-y-6">
                            {/* Employee Access Button */}
                            <TouchableOpacity
                                onPress={handleEmployeeLogin}
                                disabled={loading.getEmployeeDetails || isProcessingLogin}
                                className="rounded-3xl p-8 items-center"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderWidth: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <View
                                    className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                                    style={{ backgroundColor: 'rgba(79, 70, 229, 0.8)' }}
                                >
                                    <User size={40} color="white" />
                                </View>
                                <Text
                                    className="text-2xl font-bold mb-2"
                                    style={{ color: 'white' }}
                                >
                                    Employee Portal
                                </Text>
                                <Text
                                    className="text-sm text-center"
                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                >
                                    Access personal information & employee services
                                </Text>
                                {(loading.getEmployeeDetails || isProcessingLogin) && (
                                    <ActivityIndicator size="small" color="white" style={{ marginTop: 8 }} />
                                )}
                            </TouchableOpacity>

                            {/* Role Access Button */}
                            <TouchableOpacity
                                onPress={() => setShowRoleLogin(true)}
                                disabled={isProcessingLogin}
                                className="rounded-3xl p-8 items-center"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderWidth: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <View
                                    className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                                    style={{ backgroundColor: 'rgba(147, 51, 234, 0.8)' }}
                                >
                                    <Shield size={40} color="white" />
                                </View>
                                <Text
                                    className="text-2xl font-bold mb-2"
                                    style={{ color: 'white' }}
                                >
                                    Role Portal
                                </Text>
                                <Text
                                    className="text-sm text-center"
                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                >
                                    Advanced system features & management tools
                                </Text>
                            </TouchableOpacity>

                            {/* Error Display */}
                            {errors.getEmployeeDetails && (
                                <View
                                    className="rounded-lg p-4"
                                    style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(239, 68, 68, 0.4)',
                                    }}
                                >
                                    <Text
                                        className="text-center text-sm"
                                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                    >
                                        {errors.getEmployeeDetails}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        // Role Login Section
                        <View className="space-y-6">
                            {/* Back to selection */}
                            <TouchableOpacity
                                onPress={() => {
                                    setShowRoleLogin(false);
                                    roleFormik.resetForm();
                                }}
                                className="self-start"
                            >
                                <Text
                                    className="text-base font-medium"
                                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                    ← Back to selection
                                </Text>
                            </TouchableOpacity>

                            {/* Role Login Header */}
                            <View className="items-center mb-6">
                                <View
                                    className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                                    style={{ backgroundColor: 'rgba(147, 51, 234, 0.8)' }}
                                >
                                    <Shield size={32} color="white" />
                                </View>
                                <Text
                                    className="text-2xl font-bold mb-2"
                                    style={{ color: 'white' }}
                                >
                                    Role Authentication
                                </Text>
                                <Text
                                    className="text-center text-sm"
                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                >
                                    Enter your role password to access advanced features
                                </Text>
                            </View>

                            {/* Password Form */}
                            <View
                                className="rounded-2xl p-6"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <Text
                                    className="font-semibold mb-3 text-base"
                                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                    Role Password
                                </Text>
                                <View className="relative">
                                    <TextInput
                                        value={roleFormik.values.password}
                                        onChangeText={roleFormik.handleChange('password')}
                                        onBlur={roleFormik.handleBlur('password')}
                                        placeholder="Enter your role password"
                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        secureTextEntry={!showRolePassword}
                                        className="rounded-xl px-4 py-4 pr-12 mb-4 text-base"
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            borderWidth: 2,
                                            borderColor: roleFormik.touched.password && roleFormik.errors.password
                                                ? 'rgba(239, 68, 68, 0.6)'
                                                : 'rgba(255, 255, 255, 0.3)',
                                            color: 'white',
                                        }}
                                        editable={!loading.validateUser && !loading.getMenu && !isProcessingLogin}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowRolePassword(!showRolePassword)}
                                        className="absolute right-4 top-4"
                                        disabled={isProcessingLogin}
                                    >
                                        {showRolePassword ? (
                                            <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" />
                                        ) : (
                                            <Eye size={20} color="rgba(255, 255, 255, 0.7)" />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {roleFormik.touched.password && roleFormik.errors.password && (
                                    <Text
                                        className="text-sm mb-4"
                                        style={{ color: 'rgba(239, 68, 68, 0.9)' }}
                                    >
                                        {roleFormik.errors.password}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    onPress={() => roleFormik.handleSubmit()}
                                    disabled={loading.validateUser || loading.getMenu || !roleFormik.isValid || !roleFormik.dirty || isProcessingLogin}
                                    className="rounded-xl py-4 px-6"
                                    style={{
                                        backgroundColor: loading.validateUser || loading.getMenu || !roleFormik.isValid || !roleFormik.dirty || isProcessingLogin
                                            ? 'rgba(255, 255, 255, 0.3)'
                                            : 'rgba(255, 255, 255, 0.9)',
                                    }}
                                >
                                    {loading.validateUser || loading.getMenu || isProcessingLogin ? (
                                        <View className="flex-row items-center justify-center">
                                            <ActivityIndicator size="small" color="#4f46e5" />
                                            <Text
                                                className="font-semibold ml-2 text-lg"
                                                style={{ color: '#4f46e5' }}
                                            >
                                                Authenticating...
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text
                                            className="font-bold text-center text-lg"
                                            style={{ color: '#4f46e5' }}
                                        >
                                            Access Role Portal
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Error Display */}
                            {(errors.validateUser || errors.getMenu) && (
                                <View
                                    className="rounded-lg p-4"
                                    style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(239, 68, 68, 0.4)',
                                    }}
                                >
                                    <Text
                                        className="text-center text-sm"
                                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                    >
                                        {errors.validateUser || errors.getMenu}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>
        </View>
    );
}