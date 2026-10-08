// Navy brand header for the role dashboard — same look as the employee portal's EmployeeHeader.
// The bell is for rejection alerts, as on the web; approvals live in the dashboard's inbox card.
import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Bell, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAppDispatch } from '@/src/store/hooks';
import { logout } from '@/src/slice/auth/authSlice';
import { resetRejectionAlerts } from '@/src/slice/notifications/rejectionAlertsSlice';

type Props = {
    roleCode?: string;
    rejectionCount: number; // unread rejection alerts
    onBellPress: () => void;
};

export default function RoleHeader({ roleCode, rejectionCount, onBellPress }: Props) {
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    dispatch(resetRejectionAlerts());
                    dispatch(logout());
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    return (
        <View className="bg-brand-navy px-4 pt-2 pb-4">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5 flex-1">
                    <View className="w-10 h-10 rounded-lg bg-white items-center justify-center">
                        <Image
                            source={require('@/assets/images/essellogo.png')}
                            style={{ width: 30, height: 30 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-sm font-bold" numberOfLines={1}>Role Portal</Text>
                        <Text className="text-orange-300 text-[11px]" numberOfLines={1}>
                            {roleCode ? `${roleCode} · Essel Projects` : 'Essel Projects'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                        onPress={onBellPress}
                        className={`p-2 rounded-lg ${rejectionCount > 0 ? 'bg-red-500/25' : 'bg-white/10'}`}
                    >
                        <Bell size={20} color={rejectionCount > 0 ? '#fecaca' : '#ffffff'} />
                        {rejectionCount > 0 && (
                            <View className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 items-center justify-center">
                                <Text className="text-[10px] font-bold text-white">{rejectionCount > 9 ? '9+' : rejectionCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} className="p-2 rounded-lg bg-white/10">
                        <LogOut size={20} color="#fca5a5" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
