// Shared bottom-sheet container for the login screen. The login flow swaps the content
// (quick-login setup → Employee / Role options) inside ONE Modal: iOS silently refuses to
// present a Modal while another one is still being dismissed, so stacking separate Modals fails.
import React, { useEffect, useState } from 'react';
import { View, Modal, Pressable, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    onRequestClose: () => void; // backdrop tap / Android back button
    children: React.ReactNode;
};

export default function BottomSheet({ onRequestClose, children }: Props) {
    const insets = useSafeAreaInsets();
    const [slide] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.timing(slide, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [slide]);

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onRequestClose} statusBarTranslucent>
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
