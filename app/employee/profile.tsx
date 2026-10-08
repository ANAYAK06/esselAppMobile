// app/employee/profile.tsx
// Mirrors the Corex web portal's MyProfile page (pages/EmployeePortal/pages/MyProfile.jsx):
// identity card, personal / contact / nominee details and an inline Change Password card.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { Heart, KeyRound, Phone, ShieldCheck, User } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyPhoto } from '@/src/slice/hr/employeePortalSlice';
import { updatePassword } from '@/src/api/hr/employeePortalAPI';
import { updateSavedPassword } from '@/src/service/quickLogin';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { Badge, InfoRow, PrimaryButton, SectionCard } from '@/src/components/employee/PortalUI';
import BrandInput from '@/src/components/auth/BrandInput';
import { photoUri } from '@/src/components/employee/portalFormat';

function ChangePasswordCard({ username }: { username: string }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (newPassword.length < 6) return setError('Password must be at least 6 characters');
        if (newPassword !== confirmPassword) return setError('Passwords do not match');

        setLoading(true);
        setError('');
        try {
            const response = await updatePassword(username, newPassword);
            if (!response?.IsSuccessful) throw new Error(response?.Message || 'Failed to update password');

            // Keep PIN / Face ID sign-in working with the new password (no-op for another user's quick login)
            await updateSavedPassword(username, newPassword);

            setNewPassword('');
            setConfirmPassword('');
            Alert.alert('Password updated', 'Use your new password the next time you sign in.');
        } catch (err: any) {
            setError(err?.response?.data?.Message || err?.message || 'Unable to update password. Please contact IT Support.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SectionCard title="Change Password" icon={KeyRound}>
            <Text className="text-xs text-gray-500 mb-4">New password for your login. Minimum 6 characters.</Text>
            <View className="gap-5 mb-4">
                <BrandInput
                    variant="light"
                    label="New Password"
                    value={newPassword}
                    onChangeText={(t) => {
                        setNewPassword(t);
                        setError('');
                    }}
                    isPassword
                    editable={!loading}
                    autoComplete="new-password"
                    textContentType="newPassword"
                />
                <BrandInput
                    variant="light"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(t) => {
                        setConfirmPassword(t);
                        setError('');
                    }}
                    isPassword
                    editable={!loading}
                    error={error}
                    autoComplete="new-password"
                    textContentType="newPassword"
                />
            </View>
            <PrimaryButton
                label={loading ? 'Updating…' : 'Update Password'}
                icon={ShieldCheck}
                loading={loading}
                disabled={!newPassword || !confirmPassword}
                onPress={handleSubmit}
            />
        </SectionCard>
    );
}

export default function MyProfile() {
    const dispatch = useAppDispatch();
    const { employeeData: d, empRefNo, employeeId, fullName, initials } = useEmployee();
    const myPhoto = useAppSelector((s) => s.employeePortal.myPhoto);

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchMyPhoto(empRefNo)) : Promise.resolve()),
        [dispatch, empRefNo]
    );

    useEffect(() => {
        load();
    }, [load]);

    const uri = photoUri(myPhoto?.base64, myPhoto?.fileType);
    const married = d.MartialStatus === 'Married';

    return (
        <PortalScreen title="My Profile" subtitle="Your personal details and login security" icon={User} onRefresh={load}>
            {/* Identity card */}
            <View className="bg-brand-navy rounded-xl p-4 mb-4 overflow-hidden">
                <View className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-orange-500/10" />
                <View className="flex-row items-center gap-3">
                    <View className="w-14 h-14 rounded-full bg-white/10 border-2 border-orange-400/60 items-center justify-center overflow-hidden">
                        {uri ? (
                            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : initials ? (
                            <Text className="text-white text-lg font-bold">{initials}</Text>
                        ) : (
                            <User size={24} color="#ffffff" />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-base font-bold" numberOfLines={1}>{fullName || 'Employee'}</Text>
                        <Text className="text-white/50 text-[11px] mt-0.5" numberOfLines={1}>{d.DepartmentName || '—'}</Text>
                    </View>
                    <View className="items-end gap-1">
                        <Badge
                            label={d.Status || 'Unknown'}
                            tone={
                                d.Status === 'Active'
                                    ? { bg: 'bg-emerald-400/20', text: 'text-emerald-100' }
                                    : { bg: 'bg-amber-400/20', text: 'text-amber-100' }
                            }
                        />
                        <Badge label={empRefNo || employeeId} tone={{ bg: 'bg-white/10', text: 'text-orange-100' }} />
                    </View>
                </View>
            </View>

            <SectionCard title="Personal Information" icon={User}>
                <InfoRow label="Full Name" value={fullName} />
                <InfoRow label="Date of Birth" value={d.UpDob} />
                <InfoRow label="Age" value={d.Age ? `${d.Age} years` : null} />
                <InfoRow label="Gender" value={d.Gender} />
                <InfoRow label="Marital Status" value={d.MartialStatus} last={!married} />
                {married && <InfoRow label="Date of Marriage" value={d.UpDateofMarriage} last />}
            </SectionCard>

            <SectionCard title="Contact & Address" icon={Phone}>
                <InfoRow label="Mobile" value={d.Mobile} />
                <InfoRow label="Work Email" value={d.workemail} />
                <InfoRow label="Permanent Address" value={d.PermanentAddress} last />
            </SectionCard>

            <SectionCard title="Family & Nominee" icon={Heart}>
                {married && <InfoRow label="Spouse Name" value={d.SpouseName} />}
                <InfoRow label="Nominee Name" value={d.NomineeName} />
                <InfoRow label="Relation" value={d.Relation} />
                <InfoRow label="Nominee Gender" value={d.NomineeGender} last />
            </SectionCard>

            <ChangePasswordCard username={employeeId} />
        </PortalScreen>
    );
}
