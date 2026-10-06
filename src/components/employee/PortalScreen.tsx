// Screen shell for every Employee Portal page: navy header with back button + the page title
// (the web portal's PageHeader), then a pull-to-refresh, keyboard-aware scroll area: while the
// keyboard is up the content gets that much extra bottom room and the focused field (e.g. a
// verification note at the end of a long page) is scrolled to sit just above the keyboard.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, RefreshControl, Platform, Keyboard, TextInput,
    type KeyboardEvent, type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';

const GAP = 16; // space kept between the focused field and the keyboard / top edge

type Props = {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    onRefresh?: () => Promise<unknown> | void;
    headerAction?: React.ReactNode;
    backHref?: Href; // where back goes when there is no history (default: employee dashboard)
    children: React.ReactNode;
};

export default function PortalScreen({ title, subtitle, icon: Icon, onRefresh, headerAction, backHref, children }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [keyboardInset, setKeyboardInset] = useState(0);
    const frameRef = useRef<View>(null);
    const scrollRef = useRef<ScrollView>(null);
    const scrollY = useRef(0);
    const keyboardTop = useRef<number | null>(null);   // window y of the keyboard's top edge while shown
    const touchStartY = useRef(0);

    // Scroll so the focused input is fully visible between the top of the scroll area and the keyboard
    const revealFocused = useCallback(() => {
        const input = TextInput.State.currentlyFocusedInput();
        const frame = frameRef.current;
        if (!input || !frame || keyboardTop.current == null) return;
        frame.measureInWindow((_fx, fy, _fw, fh) => {
            input.measureInWindow((_ix, iy, _iw, ih) => {
                if (keyboardTop.current == null) return;
                const top = fy + GAP;
                const bottom = Math.min(fy + fh, keyboardTop.current) - GAP;
                let delta = 0;
                if (iy + ih > bottom) delta = Math.min(iy + ih - bottom, iy - top); // a tall field keeps its top in view
                else if (iy < top) delta = iy - top;
                if (Math.abs(delta) > 1) scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: true });
            });
        });
    }, []);

    useEffect(() => {
        const onShow = (e: KeyboardEvent) => {
            keyboardTop.current = e.endCoordinates.screenY;
            // Extra bottom room = the part of the scroll area the keyboard covers (0 if the window resized)
            frameRef.current?.measureInWindow((_x, y, _w, h) => {
                setKeyboardInset(Math.max(0, y + h - e.endCoordinates.screenY));
                setTimeout(revealFocused, 60);
            });
        };
        const onHide = () => {
            keyboardTop.current = null;
            setKeyboardInset(0);
        };
        const ios = Platform.OS === 'ios';
        const subs = [
            Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', onShow),
            Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', onHide),
        ];
        return () => subs.forEach((sub) => sub.remove());
    }, [revealFocused]);

    // Tapping another field while the keyboard is already up raises no keyboard event — reveal it
    // after a tap (not after a drag, which would fight the user's scrolling)
    const onTouchStart = (e: GestureResponderEvent) => {
        touchStartY.current = e.nativeEvent.pageY;
    };
    const onTouchEnd = (e: GestureResponderEvent) => {
        if (keyboardTop.current != null && Math.abs(e.nativeEvent.pageY - touchStartY.current) < 10) setTimeout(revealFocused, 250);
    };

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    };

    const goBack = () => (router.canGoBack() ? router.back() : router.replace(backHref ?? '/(dashboard)/employee-dashboard'));

    return (
        <SafeAreaView className="flex-1 bg-brand-navy" edges={['top']}>
            <StatusBar style="light" />

            <View className="bg-brand-navy px-3 pt-1 pb-4 flex-row items-center gap-2.5">
                <TouchableOpacity onPress={goBack} className="p-1.5 rounded-lg bg-white/10" hitSlop={8}>
                    <ChevronLeft size={22} color="#ffffff" />
                </TouchableOpacity>
                <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                    <Icon size={18} color={brand.orangeLight} />
                </View>
                <View className="flex-1">
                    <Text className="text-white text-base font-bold" numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text className="text-orange-300 text-[11px]" numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                </View>
                {headerAction}
            </View>

            <View ref={frameRef} className="flex-1 bg-gray-50">
                <ScrollView
                    ref={scrollRef}
                    className="flex-1 bg-gray-50"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 + keyboardInset }}
                    keyboardShouldPersistTaps="handled"
                    onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
                    scrollEventThrottle={16}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={brand.orange}
                                colors={[brand.orange]}
                            />
                        ) : undefined
                    }
                >
                    {children}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
