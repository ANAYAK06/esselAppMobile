// app/(auth)/login.tsx - Login Screen (Corex brand: white brand panel + navy form panel,
// stacked version of the web login's two-column card)
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Redux hooks - Auth only
import { useAppDispatch, useAuth } from '@/src/store/hooks';
import {
    validateEmployee,
    clearErrors,
    clearSuccess,
    loadFromStorage,
    logout
} from '@/src/slice/auth/authSlice';

import BrandInput from '@/src/components/auth/BrandInput';
import BottomSheet from '@/src/components/auth/BottomSheet';
import LoginOptionsSheet from '@/src/components/auth/LoginOptionsSheet';
import QuickLoginPanel from '@/src/components/auth/QuickLoginPanel';
import QuickLoginSetupSheet from '@/src/components/auth/QuickLoginSetupSheet';
import * as quickLogin from '@/src/service/quickLogin';
import type { QuickLoginInfo } from '@/src/service/quickLogin';
import { brand } from '@/src/theme/colors';

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

    // Auth Redux state
    const {
        loading,
        success,
        isAuthenticated,
        employeeValidated,
        loginType,
        employeeId,
        employeeData,
        userData
    } = useAuth();

    // Quick login (PIN / biometric) saved on this phone: undefined while loading, null when none
    const [quick, setQuick] = useState<QuickLoginInfo | null | undefined>(undefined);
    const [usePassword, setUsePassword] = useState(false);
    // Credentials of a password login that may be turned into a quick login (setup sheet)
    const [pendingSetup, setPendingSetup] = useState<{ employeeId: string; password: string } | null>(null);
    // Portal chosen in the sheet: hide the sheet first and navigate once it is fully gone —
    // replacing the screen while the Modal is still up freezes iOS (invisible layer eats touches)
    const [leavingTo, setLeavingTo] = useState<Href | null>(null);
    const sheetShownRef = useRef(false);

    // Employee ID + password accepted, but no portal chosen yet → one bottom sheet showing the
    // quick-login setup first (after a password login only), then the Employee / Role options
    const awaitingPortalChoice = isAuthenticated && employeeValidated && !loginType;

    // Check for existing session on mount
    useEffect(() => {
        console.log('🔄 Login screen mounted - checking session');
        dispatch(loadFromStorage());
        quickLogin.getQuickLogin().then(setQuick);
    }, [dispatch]);

    const showLoginError = (message: unknown) => {
        Alert.alert('Login Error', typeof message === 'string' ? message : 'Employee validation failed');
        dispatch(clearErrors());
    };

    // Formik setup for login
    const formik = useFormik({
        initialValues: {
            employeeId: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            console.log('Login attempt:', values.employeeId);
            const credentials = {
                employeeId: values.employeeId.trim(),
                password: values.password
            };
            // Decide on the quick-login offer BEFORE validating, so the sheet opens straight on the
            // right content instead of switching from the options to the setup sheet.
            const hasQuickLogin = quick?.employeeId === credentials.employeeId;
            const offerSetup = !hasQuickLogin && !(await quickLogin.isDeclined(credentials.employeeId));
            if (offerSetup) setPendingSetup(credentials);

            const result = await dispatch(validateEmployee(credentials));
            if (!validateEmployee.fulfilled.match(result)) {
                setPendingSetup(null);
                showLoginError(result.payload);
                return;
            }

            // Keep an existing quick login's password current (e.g. after a password change)
            if (hasQuickLogin) {
                await quickLogin.updateSavedPassword(credentials.employeeId, credentials.password);
            }
        }
    });

    const switchToPassword = () => {
        setUsePassword(true);
        if (quick) formik.setFieldValue('employeeId', quick.employeeId);
    };

    // PIN / biometric unlocked the saved password → sign in exactly like a password login
    const signInWithQuickLogin = async (password: string) => {
        if (!quick) return;
        const result = await dispatch(validateEmployee({ employeeId: quick.employeeId, password }));
        if (!validateEmployee.fulfilled.match(result)) {
            dispatch(clearErrors());
            Alert.alert(
                'Could not sign in',
                `${typeof result.payload === 'string' ? result.payload : 'Sign in failed'}\n\n` +
                'If you changed your password recently, sign in with the new password — ' +
                'your PIN will keep working afterwards.'
            );
            switchToPassword();
        }
    };

    const forgetQuickLogin = async () => {
        await quickLogin.clearQuickLogin();
        setQuick(null);
        setUsePassword(false);
    };

    // Handle success states — a validated employee picks Employee / Role in the options sheet below
    useEffect(() => {
        if (success.validateEmployee) {
            console.log('✅ Employee validation successful');
            dispatch(clearSuccess());
        }
    }, [success.validateEmployee, dispatch]);

    // Portal chosen: remember the name for the quick-login "Welcome back" greeting
    // (navigation happens in the redirect effect below)
    useEffect(() => {
        if (success.getEmployeeDetails) {
            quickLogin.setDisplayName(employeeId, employeeData?.Firstname);
            dispatch(clearSuccess());
        }
    }, [success.getEmployeeDetails, dispatch, employeeId, employeeData]);

    useEffect(() => {
        if (success.getMenu) {
            quickLogin.setDisplayName(employeeId, userData?.firstName);
            dispatch(clearSuccess());
        }
    }, [success.getMenu, dispatch, employeeId, userData]);

    useEffect(() => {
        if (awaitingPortalChoice) sheetShownRef.current = true;
    }, [awaitingPortalChoice]);

    // Redirect once authenticated: straight away for a restored session, after the sheet has
    // closed when the portal was picked in it
    useEffect(() => {
        if (!isAuthenticated || !loginType) return;
        const target: Href = loginType === 'employee' ? '/employee-dashboard' : '/role-dashboard';
        if (sheetShownRef.current) {
            setLeavingTo(target);
        } else {
            console.log('✅ Valid session found - redirecting to dashboard');
            router.replace(target);
        }
    }, [isAuthenticated, loginType, router]);

    // Clear errors when user starts typing
    useEffect(() => {
        if (formik.touched.employeeId || formik.touched.password) {
            dispatch(clearErrors());
        }
    }, [formik.touched, dispatch]);

    const submitting = loading.validateEmployee;
    const submitDisabled = submitting || !formik.isValid || !formik.dirty;

    const portalLoading = loading.getEmployeeDetails || loading.validateUser || loading.getMenu;
    const showQuickLoginPanel = !!quick && !usePassword;

    // Cancelling the sheet drops the half-finished login (same as the old options screen's back button)
    const cancelLoginOptions = () => {
        dispatch(logout());
        dispatch(clearErrors());
        dispatch(clearSuccess());
        formik.setFieldValue('password', '');
        setPendingSetup(null);
        sheetShownRef.current = false;
        // A quick login set up just now should be used from the next sign-in on
        quickLogin.getQuickLogin().then(setQuick);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    className="flex-1 bg-brand-navy"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* ── Brand panel (web: right panel) ── */}
                    <View className="bg-white items-center px-6 pt-8 pb-12 overflow-hidden">
                        {/* Orange top accent stripe */}
                        <LinearGradient
                            colors={[brand.orangeDark, brand.orangeLight, brand.orangeDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6 }}
                        />

                        {/* Decorative shapes */}
                        <View pointerEvents="none" className="absolute top-6 right-6 w-16 h-16 rounded-full border-2 border-orange-400/30" />
                        <View pointerEvents="none" className="absolute bottom-10 left-6 w-12 h-12 border-2 border-brand-navy/15" style={{ transform: [{ rotate: '45deg' }] }} />

                        <Image
                            source={require('@/assets/images/essellogo.png')}
                            style={{ width: 110, height: 94 }}
                            resizeMode="contain"
                        />
                        <Text className="text-2xl font-bold text-brand-navy mt-5 text-center">
                            Essel Projects Pvt Ltd
                        </Text>
                        <Text className="text-sm mt-2 text-center tracking-wide">
                            <Text className="text-brand-navy">Built On Integrity. </Text>
                            <Text className="text-orange-500">Driven By Performance</Text>
                        </Text>
                    </View>

                    {/* ── Form panel (web: left panel) ── */}
                    <View className="flex-1 bg-brand-navy -mt-6 rounded-t-3xl px-6 pt-8 pb-6">
                        {quick === undefined ? (
                            <ActivityIndicator size="small" color={brand.orangeLight} style={{ marginTop: 40 }} />
                        ) : showQuickLoginPanel ? (
                            <QuickLoginPanel
                                info={quick}
                                busy={submitting}
                                onUnlocked={signInWithQuickLogin}
                                onUsePassword={switchToPassword}
                                onForget={forgetQuickLogin}
                            />
                        ) : (
                        <>
                        <View className="items-center mb-8">
                            <Text className="text-3xl font-bold text-white mb-2">Log In</Text>
                            <Text className="text-orange-200">Welcome back to your account</Text>
                        </View>

                        <View className="gap-6">
                            <BrandInput
                                label="Employee ID"
                                value={formik.values.employeeId}
                                onChangeText={formik.handleChange('employeeId')}
                                onBlur={() => formik.handleBlur('employeeId')}
                                error={formik.touched.employeeId && formik.errors.employeeId}
                                editable={!submitting}
                                returnKeyType="next"
                            />

                            <BrandInput
                                label="Password"
                                isPassword
                                value={formik.values.password}
                                onChangeText={formik.handleChange('password')}
                                onBlur={() => formik.handleBlur('password')}
                                error={formik.touched.password && formik.errors.password}
                                editable={!submitting}
                                returnKeyType="go"
                                onSubmitEditing={() => !submitDisabled && formik.handleSubmit()}
                            />

                            <View className="flex-row justify-between -mt-2">
                                {quick ? (
                                    <TouchableOpacity onPress={() => setUsePassword(false)} disabled={submitting}>
                                        <Text className="text-sm font-medium text-orange-400">Use PIN instead</Text>
                                    </TouchableOpacity>
                                ) : <View />}
                                <TouchableOpacity>
                                    <Text className="text-sm font-medium text-orange-400">Forgot password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Log In button — navy → orange gradient */}
                            <TouchableOpacity
                                onPress={() => formik.handleSubmit()}
                                disabled={submitDisabled}
                                activeOpacity={0.85}
                                style={{ opacity: submitDisabled && !submitting ? 0.5 : 1 }}
                            >
                                <LinearGradient
                                    colors={['#1e3a8a', brand.orange]} // Tailwind blue-900 → orange-500
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                                >
                                    {submitting ? (
                                        <View className="flex-row items-center">
                                            <ActivityIndicator size="small" color="#ffffff" />
                                            <Text className="text-white font-semibold text-base ml-2">Verifying...</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-white font-semibold text-base">Log In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text className="text-sm text-white/50 text-center">
                                Having trouble? Contact{' '}
                                <Text
                                    className="text-orange-400 font-medium"
                                    onPress={() => Linking.openURL('mailto:it-support@sltouch.in')}
                                >
                                    IT Support
                                </Text>
                            </Text>
                        </View>
                        </>
                        )}

                        {/* Copyright footer */}
                        <View className="mt-auto pt-8">
                            <View className="border-t border-white/10 pt-4 items-center">
                                <Text className="text-xs text-white/35 text-center">
                                    © {new Date().getFullYear()} SL Touch IT Solutions Pvt Ltd · Powered by
                                </Text>
                                <View className="bg-white rounded-lg px-2 py-1 mt-2">
                                    <Image
                                        source={require('@/assets/images/corex-wordmark.png')}
                                        style={{ width: 90, height: 36 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text className="text-xs text-white/35 mt-2">All rights reserved</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {(awaitingPortalChoice || leavingTo) && (
                <BottomSheet
                    visible={!leavingTo}
                    onDismissed={() => leavingTo && router.replace(leavingTo)}
                    onRequestClose={() => {
                        if (pendingSetup) setPendingSetup(null); // same as "Not now"
                        else if (!portalLoading) cancelLoginOptions();
                    }}
                >
                    {pendingSetup ? (
                        <QuickLoginSetupSheet
                            employeeId={pendingSetup.employeeId}
                            password={pendingSetup.password}
                            onDone={() => setPendingSetup(null)}
                        />
                    ) : (
                        <LoginOptionsSheet onClose={cancelLoginOptions} />
                    )}
                </BottomSheet>
            )}
        </SafeAreaView>
    );
}
