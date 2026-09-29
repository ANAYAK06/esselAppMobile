// Slide-out navy sidebar with every Employee Portal page — the mobile version of the
// Corex web portal's Sidebar (pages/EmployeePortal/components/Sidebar.jsx).
import React, { useEffect, useState } from 'react';
import {
    View, Text, Image, Modal, Pressable, ScrollView, TouchableOpacity, Animated, Easing, Alert, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { X } from 'lucide-react-native';
import { useAppSelector } from '@/src/store/hooks';
import { useEmployee } from '@/src/hooks/useEmployee';
import { employeeMenu, reportingPersonMenu, requestMenu } from '@/src/components/employee/menuConfig';
import type { MenuItem } from '@/src/components/employee/menuConfig';
import { brand } from '@/src/theme/colors';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function EmployeeSidebar({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const width = Math.min(300, screenWidth * 0.82);
    const pathname = usePathname();
    const { fullName, initials, employeeData } = useEmployee();
    const { isPortalReportingPerson, portalPendingApprovals } = useAppSelector((s) => s.employeePortal);

    const [slide] = useState(() => new Animated.Value(0));

    useEffect(() => {
        if (!visible) return;
        slide.setValue(0);
        Animated.timing(slide, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [visible, slide]);

    // Slide out, then hide the Modal; `after` runs once it is gone
    const close = (after?: () => void) => {
        Animated.timing(slide, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            onClose();
            after?.();
        });
    };

    const open = (item: MenuItem) => {
        const { href, label } = item;
        if (!href) {
            Alert.alert('Coming soon', `${label} is being built and will be available soon.`);
            return;
        }
        close(() => {
            if (label === 'Dashboard') router.dismissTo(href);
            else router.push(href);
        });
    };

    const isActive = (item: MenuItem) =>
        item.label === 'Dashboard'
            ? pathname === '/employee-dashboard'
            : typeof item.href === 'string' && pathname === item.href;

    const group = (title: string, items: MenuItem[]) => (
        <View className="mb-5">
            <Text className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">{title}</Text>
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const badge = item.label === 'Pending Approvals' ? portalPendingApprovals.length : 0;
                return (
                    <TouchableOpacity
                        key={item.label}
                        onPress={() => open(item)}
                        activeOpacity={0.7}
                        className={`flex-row items-center gap-3 px-3 py-3 rounded-lg ${active ? 'bg-white/10' : ''}`}
                    >
                        <View className={`w-1 h-5 rounded-full ${active ? 'bg-orange-400' : 'bg-transparent'}`} />
                        <Icon size={18} color={active ? brand.orangeLight : 'rgba(255,255,255,0.5)'} />
                        <Text
                            className={`flex-1 text-sm ${active ? 'font-semibold text-white' : 'font-medium text-white/75'}`}
                            numberOfLines={1}
                        >
                            {item.label}
                        </Text>
                        {badge > 0 && (
                            <View className="min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 items-center justify-center">
                                <Text className="text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</Text>
                            </View>
                        )}
                        {!item.href && (
                            <View className="px-2 py-0.5 rounded-full bg-orange-400/15">
                                <Text className="text-[10px] font-semibold text-orange-300">Soon</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()} statusBarTranslucent>
            <View className="flex-1 flex-row">
                <Animated.View
                    className="bg-brand-navy"
                    style={{
                        width,
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }],
                    }}
                >
                    {/* Brand */}
                    <View className="flex-row items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
                        <View className="flex-row items-center gap-2.5 flex-1">
                            <View className="w-9 h-9 rounded-lg bg-white items-center justify-center">
                                <Image
                                    source={require('@/assets/images/essellogo.png')}
                                    style={{ width: 28, height: 28 }}
                                    resizeMode="contain"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-sm font-bold" numberOfLines={1}>Employee Portal</Text>
                                <Text className="text-orange-300 text-[11px]" numberOfLines={1}>Essel Projects</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => close()} className="p-1.5" hitSlop={8}>
                            <X size={20} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>

                    {/* Who is signed in */}
                    <View className="flex-row items-center gap-3 mx-3 mt-3 p-3 rounded-xl bg-white/5">
                        <View className="w-10 h-10 rounded-full bg-white/10 border border-orange-400/40 items-center justify-center">
                            <Text className="text-xs font-bold text-orange-400">{initials || '--'}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-white" numberOfLines={1}>{fullName || 'Employee'}</Text>
                            <Text className="text-[11px] text-white/50" numberOfLines={1}>
                                {employeeData.Appointed || employeeData.UserRole || employeeData.EmpRefno || ''}
                            </Text>
                        </View>
                    </View>

                    {/* Nav */}
                    <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16 }}>
                        {group('Employee', employeeMenu)}
                        {group('Self-Service Requests', requestMenu)}
                        {isPortalReportingPerson && group('Reporting Person', reportingPersonMenu)}
                    </ScrollView>

                    {/* Powered by */}
                    <View className="flex-row items-center justify-center gap-1 px-4 py-3 border-t border-white/10">
                        <Text className="text-[10px] text-white/30">Powered by</Text>
                        <Text className="text-[10px] font-bold text-white/50">SL TOUCH COREX</Text>
                    </View>
                </Animated.View>

                {/* Backdrop */}
                <Pressable className="flex-1" onPress={() => close()}>
                    <Animated.View className="flex-1 bg-black/50" style={{ opacity: slide }} />
                </Pressable>
            </View>
        </Modal>
    );
}
