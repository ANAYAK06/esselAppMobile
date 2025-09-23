import React from 'react';
import { View, TouchableOpacity, Alert, Text } from 'react-native';
import { Bell, LogOut, UserRoundIcon } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import SearchBar from './SearchBar';
import { logout } from "@/src/slice/auth/authSlice";
import { router } from "expo-router";
import { RootState } from '@/src/store/store';

export default function DashboardHeader() {
    const dispatch = useDispatch();

    // Get user data from Redux state
    const userData = useSelector((state: RootState) => state.auth.userData);
    const loginType = useSelector((state: RootState) => state.auth.loginType);
    const employeeData = useSelector((state: RootState) => state.auth.employeeData);

    const handleNotifications = () => {
        // Navigate to notifications
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        // Dispatch logout action (clears storage and resets state)
                        dispatch(logout());

                        // Navigate to login screen
                        router.replace('/(auth)/login'); // Adjust path as needed

                        console.log('User logged out successfully');
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // Get display name and role based on login type
    const getDisplayInfo = () => {
        if (loginType === 'role' && userData) {
            return {
                name: userData.firstName || 'User',
                role: userData.roleCode || 'Role'
            };
        } else if (loginType === 'employee' && employeeData) {
            return {
                name: employeeData.FirstName || employeeData.firstName || 'Employee',
                role: 'Employee'
            };
        }
        return {
            name: 'User',
            role: 'Guest'
        };
    };

    const { name, role } = getDisplayInfo();

    return (
        <View className="bg-white px-4 py-3 border-b border-gray-200">
            {/* Top Row - Icons */}
            <View className="flex-row justify-between items-center mb-3">
                <View className="p-2 rounded-full bg-blue-200">
                    <UserRoundIcon color="white" size={20} />
                </View>

                {/* User Info Section */}
                <View className="flex-1 mx-4">
                    <Text className="text-sm font-semibold text-indigo-600">
                        {name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                        {role}
                    </Text>
                </View>

                <View className="flex-row gap-4">
                    <TouchableOpacity
                        onPress={handleNotifications}
                        className="p-2 rounded-lg bg-gray-100"
                    >
                        <Bell size={20} color="#374151" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogout}
                        className="p-2 rounded-lg bg-red-50"
                    >
                        <LogOut size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <SearchBar />
        </View>
    );
}