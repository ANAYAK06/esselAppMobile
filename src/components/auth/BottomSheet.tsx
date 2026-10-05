// Shared bottom-sheet container for the login screen. The login flow swaps the content
// (quick-login setup → Employee / Role options) inside ONE Modal: iOS silently refuses to
// present a Modal while another one is still being dismissed, so stacking separate Modals fails.
// Navigating away while the Modal is still up freezes iOS (an invisible layer keeps eating
// touches), so hide it with `visible={false}` and navigate from `onDismissed`.
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    visible?: boolean;
    onRequestClose: () => void; // backdrop tap / Android back button
    onDismissed?: () => void; // runs once the Modal is fully gone after `visible` turns false
    children: React.ReactNode;
};

export default function BottomSheet({ visible = true, onRequestClose, onDismissed, children }: Props) {
    const insets = useSafeAreaInsets();
    const [slide] = useState(() => new Animated.Value(0));
    const dismissedRef = useRef(false);

    useEffect(() => {
        Animated.timing(slide, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [slide]);

    const fireDismissed = () => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;
        onDismissed?.();
    };

    // iOS reports the end of the dismissal through onDismiss (with a fallback in case it never
    // fires); Android hides the dialog synchronously.
    useEffect(() => {
        if (visible) {
            dismissedRef.current = false;
            return;
        }
        if (Platform.OS !== 'ios') {
            fireDismissed();
            return;
        }
        const fallback = setTimeout(fireDismissed, 700);
        return () => clearTimeout(fallback);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onRequestClose}
            onDismiss={fireDismissed}
            statusBarTranslucent
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <Pressable className="flex-1 bg-black/50" onPress={onRequestClose} />
                <Animated.View
                    className="bg-white rounded-t-3xl px-6 pt-3"
                    style={{
                        paddingBottom: Math.max(insets.bottom, 16) + 8,
                        transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
                    }}
                >
                    <View className="self-center w-10 h-1.5 rounded-full bg-gray-300 mb-4" />
                    {children}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
