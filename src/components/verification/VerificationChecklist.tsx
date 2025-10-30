// src/components/verification/VerificationChecklist.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';

interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

interface VerificationChecklistProps {
    items: ChecklistItem[];
    onToggle: (id: string) => void;
    title?: string;
}

const VerificationChecklist: React.FC<VerificationChecklistProps> = ({
                                                                         items,
                                                                         onToggle,
                                                                         title = 'Verification Checklist',
                                                                     }) => {
    const allChecked = items.every(item => item.checked);
    const checkedCount = items.filter(item => item.checked).length;

    return (
        <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 mb-4">
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-green-800 font-bold text-base">{title}</Text>
                <View className="bg-green-100 px-3 py-1 rounded-full border border-green-300">
                    <Text className="text-green-700 text-xs font-bold">
                        {checkedCount}/{items.length}
                    </Text>
                </View>
            </View>

            {items.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => onToggle(item.id)}
                    className="flex-row items-start py-3 border-b border-green-100"
                    activeOpacity={0.7}
                >
                    {item.checked ? (
                        <CheckCircle size={24} color="#22c55e" />
                    ) : (
                        <Circle size={24} color="#9ca3af" />
                    )}
                    <Text className={`ml-3 flex-1 text-sm ${
                        item.checked ? 'text-green-800 font-semibold' : 'text-gray-700'
                    }`}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}

            {allChecked && (
                <View className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
                    <View className="flex-row items-center">
                        <CheckCircle size={16} color="#22c55e" />
                        <Text className="text-green-800 text-sm font-semibold ml-2">
                            ✓ All verification steps completed
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default VerificationChecklist;