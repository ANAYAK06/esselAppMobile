// Previous purchases of an item, compared with the price on this PO
// (web VerifySupplierPO.jsx "Previous Purchases" panel, Purchase/GetPreviousePODetails).
import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getPreviousPurchases } from '@/src/api/verification/supplierPOVerificationAPI';
import { useApiData } from '@/src/hooks/useApiData';
import { brand } from '@/src/theme/colors';
import { money } from '../kit/VerificationKit';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

type Props = { itemCode: string; itemName?: string; currentPrice: number; standardPrice?: number; quotedPrice?: number | string };

export default function PreviousPurchasesBody({ itemCode, itemName, currentPrice, standardPrice, quotedPrice }: Props) {
    const load = useCallback(() => getPreviousPurchases(itemCode), [itemCode]);
    const { data, loading } = useApiData(load);
    const rows = data ?? [];

    return (
        <View>
            <Text className="text-xs font-mono text-brand-navy">{itemCode}</Text>
            {itemName ? <Text className="text-sm font-bold text-gray-900">{itemName}</Text> : null}
            <View className="flex-row gap-2 mt-3 mb-3">
                <View className="flex-1 rounded-lg bg-indigo-50 p-2.5">
                    <Text className="text-[10px] text-gray-500">Current price</Text>
                    <Text className="text-sm font-bold text-brand-navy">{money(currentPrice)}</Text>
                </View>
                {standardPrice != null ? (
                    <View className="flex-1 rounded-lg bg-gray-50 p-2.5">
                        <Text className="text-[10px] text-gray-500">Standard price</Text>
                        <Text className="text-sm font-bold text-gray-800">{money(standardPrice)}</Text>
                    </View>
                ) : null}
                <View className="flex-1 rounded-lg bg-gray-50 p-2.5">
                    <Text className="text-[10px] text-gray-500">Quoted price</Text>
                    <Text className="text-sm font-bold text-gray-800">{money(quotedPrice)}</Text>
                </View>
            </View>

            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Previous purchases ({rows.length})</Text>
            {loading ? (
                <ActivityIndicator color={brand.orange} style={{ paddingVertical: 20 }} />
            ) : rows.length === 0 ? (
                <Text className="text-xs text-gray-400 text-center py-6">No previous purchase history found for this item</Text>
            ) : rows.map((r, i) => {
                const prev = num(r.BasicPrice);
                const diff = currentPrice - prev;
                const pct = prev ? Math.abs((diff / prev) * 100).toFixed(2) : '0';
                return (
                    <View key={i} className={`flex-row items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{r.VendorName}</Text>
                            <Text className="text-[11px] text-gray-400">{[r.PODate, r.CCCode].filter(Boolean).join(' · ')}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-sm font-semibold text-gray-900">{money(prev)}</Text>
                            <Text className={`text-[10px] font-semibold ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {diff === 0 || !prev ? 'No change' : `${diff > 0 ? '▲' : '▼'} ${pct}% now`}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
