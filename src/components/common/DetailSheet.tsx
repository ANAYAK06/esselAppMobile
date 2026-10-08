// Bottom sheet used for dashboard drill-downs and verification pop-ups (the web dashboards open centred modals with
// wide tables; on a phone those become a scrollable list in a sheet). The screen keeps ONE of
// these mounted and swaps its content — iOS will not present a Modal while another is dismissing.
import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
export type SheetContent = {
    title: string;
    subtitle?: string;
    tone?: 'orange' | 'red' | 'violet';
    body: React.ReactNode;
};

type Props = {
    visible: boolean;
    sheet: SheetContent | null;
    onClose: () => void;
};

export default function DetailSheet({ visible, sheet, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <View className="flex-1 justify-end">
                <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
                <View className="bg-white rounded-t-3xl overflow-hidden" style={{ maxHeight: height * 0.85 }}>
                    <View className={sheet?.tone === 'red' ? 'bg-red-50' : sheet?.tone === 'violet' ? 'bg-violet-50' : 'bg-orange-50'}>
                        <View className="self-center w-10 h-1.5 rounded-full bg-gray-300 mt-2.5" />
                        <View className="flex-row items-start gap-3 px-5 pt-3 pb-3.5">
                            <View className="flex-1">
                                <Text className="text-base font-bold text-gray-900">{sheet?.title}</Text>
                                {sheet?.subtitle ? <Text className="text-xs text-gray-500 mt-0.5">{sheet.subtitle}</Text> : null}
                            </View>
                            <TouchableOpacity onPress={onClose} className="p-1.5 rounded-lg bg-white/70" hitSlop={8}>
                                <X size={18} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
                    >
                        {sheet?.body}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
