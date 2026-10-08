// Navy brand header for the employee dashboard — mirrors the Corex web portal's
// sidebar brand block (Essel logo, "Employee Portal", orange sub-title) plus its top-bar actions.
import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Bell, LogOut, Menu } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAppDispatch } from '@/src/store/hooks';
import { logout } from '@/src/slice/auth/authSlice';
import { resetEmployeePortal } from '@/src/slice/hr/employeePortalSlice';

type Props = {
    initials: string;
    pendingCount: number;
    onBellPress: () => void;
    onMenuPress: () => void;
    onAvatarPress: () => void;
};

export default function EmployeeHeader({ initials, pendingCount, onBellPress, onMenuPress, onAvatarPress }: Props) {
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    dispatch(resetEmployeePortal());
                    dispatch(logout());
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    return (
        <View className="bg-brand-navy px-4 pt-2 pb-4">
            <View className="flex-row items-center justify-between">
                {/* Brand */}
                <View className="flex-row items-center gap-2.5 flex-1">
                    <TouchableOpacity onPress={onMenuPress} className="p-2 -ml-1 rounded-lg bg-white/10" hitSlop={6}>
                        <Menu size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <View className="w-10 h-10 rounded-lg bg-white items-center justify-center">
                        <Image
                            source={require('@/assets/images/essellogo.png')}
                            style={{ width: 30, height: 30 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-sm font-bold" numberOfLines={1}>Employee Portal</Text>
                        <Text className="text-orange-300 text-[11px]" numberOfLines={1}>Essel Projects</Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={onBellPress} className="p-2 rounded-lg bg-white/10">
                        <Bell size={20} color="#ffffff" />
                        {pendingCount > 0 && (
                            <View className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 items-center justify-center">
                                <Text className="text-[10px] font-bold text-white">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onAvatarPress}
                        className="w-9 h-9 rounded-full bg-white/10 border border-orange-400/40 items-center justify-center"
                    >
                        <Text className="text-xs font-bold text-orange-400">{initials || '--'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogout} className="p-2 rounded-lg bg-white/10">
                        <LogOut size={20} color="#fca5a5" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
