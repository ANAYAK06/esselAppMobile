// Bottom-sheet content (rendered inside BottomSheet) shown on the login screen once the employee ID + password are validated:
// continue to the Employee Portal, or enter the role password for the Role Portal.
// Replaces the old app/(auth)/login-options.tsx screen. Navigation happens in login.tsx,
// which already routes on success.getEmployeeDetails / success.getMenu.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, Shield, User, X } from 'lucide-react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch, useAuth } from '@/src/store/hooks';
import { getEmployeeDetails, getMenu, validateUser } from '@/src/slice/auth/authSlice';
import BrandInput from '@/src/components/auth/BrandInput';
import { brand } from '@/src/theme/colors';

const roleValidationSchema = Yup.object({
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Role password is required')
});

type Props = {
    onClose: () => void;
};

export default function LoginOptionsSheet({ onClose }: Props) {
    const dispatch = useAppDispatch();
    const { employeeId, loading } = useAuth();

    const [showRoleLogin, setShowRoleLogin] = useState(false);
    const [processing, setProcessing] = useState<'employee' | 'role' | null>(null);

    const busy = processing !== null || loading.getEmployeeDetails || loading.validateUser || loading.getMenu;

    const roleFormik = useFormik({
        initialValues: { password: '' },
        validationSchema: roleValidationSchema,
        onSubmit: async (values) => {
            setProcessing('role');
            try {
                const credentials = { employeeId: employeeId || '', password: values.password };
                const userResult = await dispatch(validateUser(credentials)).unwrap();

                if (userResult.roleId) {
                    await dispatch(getMenu(userResult.roleId)).unwrap();
                } else {
                    Alert.alert('Error', 'Role ID not found');
                    setProcessing(null);
                }
            } catch (error: any) {
                console.error('Role login error:', error);
                setProcessing(null);
                Alert.alert('Login Error', error || 'Role login failed');
            }
        }
    });

    const handleEmployeeLogin = async () => {
        if (!employeeId) return;
        setProcessing('employee');
        try {
            await dispatch(getEmployeeDetails(employeeId)).unwrap();
        } catch (error: any) {
            console.error('Employee login error:', error);
            Alert.alert('Login Error', error || 'Employee login failed');
            setProcessing(null);
        }
    };

    const close = () => {
        if (!busy) onClose();
    };

    const roleSubmitDisabled = busy || !roleFormik.isValid || !roleFormik.dirty;

    return (
        <View>
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-5">
                        <View className="flex-row items-center flex-1 gap-3">
                            {showRoleLogin && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowRoleLogin(false);
                                        roleFormik.resetForm();
                                    }}
                                    disabled={busy}
                                    className="p-1.5 rounded-lg bg-gray-100"
                                >
                                    <ArrowLeft size={18} color={brand.navy} />
                                </TouchableOpacity>
                            )}
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-brand-navy">
                                    {showRoleLogin ? 'Role Login' : 'Choose how to continue'}
                                </Text>
                                <Text className="text-xs text-gray-500 mt-0.5">Employee ID: {employeeId}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={close} disabled={busy} className="p-1.5 rounded-lg bg-gray-100">
                            <X size={18} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {!showRoleLogin ? (
                        <View className="gap-3">
                            {/* Employee Portal */}
                            <TouchableOpacity
                                onPress={handleEmployeeLogin}
                                disabled={busy}
                                activeOpacity={0.8}
                                className="flex-row items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white"
                            >
                                <View className="w-12 h-12 rounded-xl bg-brand-navy items-center justify-center">
                                    <User size={24} color={brand.orangeLight} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-brand-navy">Employee Portal</Text>
                                    <Text className="text-xs text-gray-500 mt-0.5">
                                        Leave, attendance, payslips & your requests
                                    </Text>
                                </View>
                                {processing === 'employee'
                                    ? <ActivityIndicator size="small" color={brand.orange} />
                                    : <ChevronRight size={20} color="#9ca3af" />}
                            </TouchableOpacity>

                            {/* Role Portal */}
                            <TouchableOpacity
                                onPress={() => setShowRoleLogin(true)}
                                disabled={busy}
                                activeOpacity={0.8}
                                className="flex-row items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white"
                            >
                                <LinearGradient
                                    colors={[brand.orange, brand.orangeDark]}
                                    style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Shield size={24} color="#ffffff" />
                                </LinearGradient>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-brand-navy">Role Login</Text>
                                    <Text className="text-xs text-gray-500 mt-0.5">
                                        Approvals, verifications & management tools
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-5">
                            <Text className="text-sm text-gray-500">
                                Enter your role password to access approvals and management tools.
                            </Text>

                            <BrandInput
                                variant="light"
                                label="Role Password"
                                isPassword
                                autoFocus
                                value={roleFormik.values.password}
                                onChangeText={roleFormik.handleChange('password')}
                                onBlur={() => roleFormik.handleBlur('password')}
                                error={roleFormik.touched.password && roleFormik.errors.password}
                                editable={!busy}
                                returnKeyType="go"
                                onSubmitEditing={() => !roleSubmitDisabled && roleFormik.handleSubmit()}
                            />

                            <TouchableOpacity
                                onPress={() => roleFormik.handleSubmit()}
                                disabled={roleSubmitDisabled}
                                activeOpacity={0.85}
                                style={{ opacity: roleSubmitDisabled && processing !== 'role' ? 0.5 : 1 }}
                            >
                                <LinearGradient
                                    colors={['#1e3a8a', brand.orange]} // Tailwind blue-900 → orange-500
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                                >
                                    {processing === 'role' ? (
                                        <View className="flex-row items-center">
                                            <ActivityIndicator size="small" color="#ffffff" />
                                            <Text className="text-white font-semibold text-base ml-2">Authenticating...</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-white font-semibold text-base">Access Role Portal</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
        </View>
    );
}
