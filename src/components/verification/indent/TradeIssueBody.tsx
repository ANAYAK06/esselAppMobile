// PUM "Trade Issue": issue a matching 5-series trade item instead of the indented item
// (web VerifyIndentCreation.jsx TradeItemPopup). Needs the "Issue From CC" picked on the screen.
// The trade item list is inline (not a SelectField) because this already lives in a sheet —
// iOS cannot present a second Modal on top.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeftRight, Ban, Check } from 'lucide-react-native';
import {
    getTradeItemCodes,
    getTradeItemDetails,
    rejectTradeItem,
    rejectTradeItemAll,
    saveTradeItem,
    type IndentItem,
} from '@/src/api/verification/indentVerificationAPI';
import { useApiData } from '@/src/hooks/useApiData';

type Props = {
    item: IndentItem;
    costcenter: string;
    tradeCC: string;             // PUM "Issue From CC"
    indentId: string;            // the web sends the indent detail's MOID here
    userName: string;
    onIssued: (qty: number, tradeItemCode?: string) => void;   // the saved trade item code is posted at PUM
    onAllCleared: () => void;
    onClose: () => void;
};

export default function TradeIssueBody({ item, costcenter, tradeCC, indentId, userName, onIssued, onAllCleared, onClose }: Props) {
    const code = item.ItemCode?.trim() || '';
    const loadList = useCallback(() => getTradeItemCodes(code, item.Units || '', item.Quantity || '0'), [code, item.Units, item.Quantity]);
    const { data: tradeList, loading } = useApiData(loadList);

    const [selected, setSelected] = useState('');
    const loadDetail = useCallback(() => getTradeItemDetails(selected), [selected]);
    const detail = useApiData(selected ? loadDetail : null);
    const [qty, setQty] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Issue qty defaults to the trade item's available qty until the user edits it
    const shownQty = qty ?? (detail.data?.TradeItemQuantity != null ? String(detail.data.TradeItemQuantity) : '');

    const run = async (fn: () => Promise<void>) => {
        setSaving(true);
        try {
            await fn();
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    const add = () => run(async () => {
        if (!selected || !detail.data) return Alert.alert('Select a trade item first');
        if (!tradeCC) return Alert.alert('Issue From CC', 'Select "Issue From CC" before adding a trade item.');
        const result = await saveTradeItem({
            OldItemCode: code, TradeItemCode: selected, Costcenter: costcenter, TradeCC: tradeCC,
            TradeQty: String(shownQty), IndentId: indentId, Createdby: userName,
        });
        const [status, ref] = result.split(',');
        if (status === 'Submited') {
            Alert.alert('Trade item issued', ref ? `Ref: ${ref}` : undefined);
            onIssued(parseFloat(shownQty) || 0, selected);
            onClose();
        } else {
            Alert.alert('Save failed', result || 'The server returned no confirmation.');
        }
    });

    const reject = () => run(async () => {
        if (!tradeCC) return Alert.alert('Issue From CC', 'Select "Issue From CC" first.');
        await rejectTradeItem({
            OldItemCode: code, Costcenter: costcenter, TradeCC: tradeCC,
            TradeQty: String(item.Quantity || '0'), IndentId: indentId, Createdby: userName,
        });
        Alert.alert('Trade item rejected');
        onIssued(0);
        onClose();
    });

    const rejectAll = () => run(async () => {
        await rejectTradeItemAll({ Createdby: userName });
        Alert.alert('All trade items rejected');
        onAllCleared();
        onClose();
    });

    const options = tradeList ?? [];

    return (
        <View>
            <Text className="text-xs text-gray-500">{code}{item.Units ? ` · ${item.Units}` : ''}</Text>
            <Text className="text-sm font-bold text-gray-900">{item.ItemName}</Text>
            <Text className="text-xs text-violet-700 mt-1">
                Indent qty {item.Quantity}{tradeCC ? ` · Issue from ${tradeCC}` : ' · Pick "Issue From CC" first'}
            </Text>

            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-4 mb-1.5">Select 5-series trade item</Text>
            {loading ? (
                <ActivityIndicator color="#7c3aed" style={{ paddingVertical: 12 }} />
            ) : options.length === 0 ? (
                <Text className="text-xs text-gray-400 italic py-2">No matching trade items found for this item.</Text>
            ) : (
                <View className="rounded-xl border border-violet-200 overflow-hidden">
                    {options.map((t, i) => {
                        const value = t.TItemCode || '';
                        const active = value === selected;
                        return (
                            <TouchableOpacity
                                key={value || i}
                                onPress={() => { setSelected(value); setQty(null); }}
                                className={`flex-row items-center gap-2 px-3 py-3 ${i > 0 ? 'border-t border-violet-100' : ''} ${active ? 'bg-violet-50' : 'bg-white'}`}
                            >
                                <Text className={`flex-1 text-sm ${active ? 'font-semibold text-violet-700' : 'text-gray-800'}`}>{t.TItemName || value}</Text>
                                {active && <Check size={16} color="#7c3aed" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {selected ? (
                detail.loading ? (
                    <ActivityIndicator color="#7c3aed" style={{ paddingVertical: 12 }} />
                ) : detail.data ? (
                    <View className="mt-3 rounded-xl bg-violet-50 border border-violet-200 p-3">
                        {detail.data.TradeItemSpecs ? <Text className="text-xs text-gray-700 mb-2">{detail.data.TradeItemSpecs}</Text> : null}
                        <View className="flex-row items-center gap-3">
                            <View className="flex-1">
                                <Text className="text-[10px] uppercase text-violet-500">Available</Text>
                                <Text className="text-sm font-bold text-green-700">{String(detail.data.TradeItemQuantity ?? '—')}</Text>
                            </View>
                            <View>
                                <Text className="text-[10px] uppercase text-violet-500 mb-1">Issue qty</Text>
                                <TextInput
                                    value={shownQty}
                                    onChangeText={setQty}
                                    keyboardType="decimal-pad"
                                    className="w-28 px-2.5 py-2 rounded-lg border border-violet-300 bg-white text-right text-sm text-gray-900"
                                />
                            </View>
                        </View>
                    </View>
                ) : null
            ) : null}

            <TouchableOpacity
                disabled={saving || !selected || !detail.data}
                onPress={add}
                className="flex-row items-center justify-center gap-2 mt-4 py-3 rounded-xl bg-violet-600"
                style={{ opacity: saving || !selected || !detail.data ? 0.5 : 1 }}
            >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <ArrowLeftRight size={16} color="#fff" />}
                <Text className="text-sm font-semibold text-white">Add to issued</Text>
            </TouchableOpacity>
            <View className="flex-row gap-2 mt-2">
                <TouchableOpacity disabled={saving} onPress={reject} className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <Ban size={14} color="#e11d48" />
                    <Text className="text-xs font-semibold text-rose-700">Reject this</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    disabled={saving}
                    onPress={() => Alert.alert('Reject all trade items?', 'This rejects every trade item you have added.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reject all', style: 'destructive', onPress: rejectAll },
                    ])}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 border border-red-200"
                >
                    <Ban size={14} color="#dc2626" />
                    <Text className="text-xs font-semibold text-red-700">Reject all</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
