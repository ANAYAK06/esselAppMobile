// CSK asset item: pick the serials to issue from old stock, up to the raised qty
// (web VerifyIndentCreation.jsx CSKTable serial dropdown, Purchase/GETAssetItemcodes).
// Keeps its own selection because it lives in a sheet; every change is reported to the screen.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { getAssetSerials, type IndentItem } from '@/src/api/verification/indentVerificationAPI';
import { useApiData } from '@/src/hooks/useApiData';
import { brand } from '@/src/theme/colors';
import { n } from './IndentItemCard';

type Props = {
    item: IndentItem;
    ccCode: string;
    initial: string[];
    onChange: (codes: string[]) => void;
};

export default function AssetSerialBody({ item, ccCode, initial, onChange }: Props) {
    const code = item.ItemCode?.trim() || '';
    const load = useCallback(() => getAssetSerials(code, ccCode), [code, ccCode]);
    const { data, loading } = useApiData(load);
    const options = data ?? [];
    const max = Math.max(1, Math.floor(n(item.Quantity)));
    const [selected, setSelected] = useState<string[]>(initial);

    const toggle = (id: string) => {
        let next: string[];
        if (selected.includes(id)) next = selected.filter((c) => c !== id);
        else if (selected.length < max) next = [...selected, id];
        else return Alert.alert(`Only ${max} serial(s) can be selected for this item`);
        setSelected(next);
        onChange(next);
    };

    return (
        <View>
            <Text className="text-xs font-mono text-brand-navy">{code}</Text>
            <Text className="text-sm font-bold text-gray-900">{item.ItemName}</Text>
            <Text className="text-[11px] text-gray-500 mt-1 mb-3">Select up to {max} serial(s) · {selected.length}/{max} selected</Text>
            {loading ? (
                <ActivityIndicator color={brand.orange} style={{ paddingVertical: 20 }} />
            ) : options.length === 0 ? (
                <Text className="text-xs text-gray-400 text-center py-6">No serials available</Text>
            ) : options.map((o, i) => {
                const id = String(o.ItemId ?? '');
                const on = selected.includes(id);
                const blocked = !on && selected.length >= max;
                return (
                    <TouchableOpacity
                        key={id || i}
                        onPress={() => toggle(id)}
                        activeOpacity={0.7}
                        className={`flex-row items-center gap-2.5 py-3 ${i > 0 ? 'border-t border-gray-100' : ''} ${blocked ? 'opacity-40' : ''}`}
                    >
                        {on ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#9ca3af" />}
                        <Text className={`flex-1 text-sm ${on ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{o.Itemtext || id}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
