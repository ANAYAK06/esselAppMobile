// Stock summary for one item at the indent's cost center — web VerifyIndentCreation.jsx
// StockSummaryPopup (Purchase/IndentItemcodeSummaryPopup). Row types: A/B/C movements, D = available.
import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getItemStockSummary } from '@/src/api/verification/indentVerificationAPI';
import { useApiData } from '@/src/hooks/useApiData';
import { brand } from '@/src/theme/colors';

const qtyClass: Record<string, string> = {
    A: 'text-blue-700',
    B: 'text-green-700 font-bold',
    C: 'text-orange-600',
    D: 'text-brand-navy font-extrabold text-base',
};

export default function StockSummaryBody({ itemCode, ccCode }: { itemCode: string; ccCode: string }) {
    const load = useCallback(() => getItemStockSummary(itemCode, ccCode), [itemCode, ccCode]);
    const { data, loading, error } = useApiData(load);
    const rows = data ?? [];
    const head = rows[0];

    if (loading) return <ActivityIndicator color={brand.orange} style={{ paddingVertical: 32 }} />;
    if (error) return <Text className="text-sm text-red-600 text-center py-6">Failed to load stock summary</Text>;
    if (!rows.length) return <Text className="text-sm text-gray-500 text-center py-6">No stock data available.</Text>;

    return (
        <View>
            <Text className="text-xs text-gray-500 mb-0.5">{head?.PopItemCode}{head?.PopUnits ? ` · ${head.PopUnits}` : ''}</Text>
            <Text className="text-sm font-bold text-gray-900">{head?.PopItemName}</Text>
            {head?.PopSpec ? <Text className="text-xs text-gray-500 mt-0.5">{head.PopSpec}</Text> : null}
            <View className="mt-3">
                {rows.map((r, i) => (
                    <View
                        key={i}
                        className={`flex-row items-center justify-between px-3 py-2.5 rounded-lg ${
                            r.PopType === 'D' ? 'bg-indigo-50 border border-indigo-200 mt-1' : r.PopType === 'B' ? 'bg-green-50' : ''}`}
                    >
                        <Text className={`flex-1 pr-3 text-xs ${r.PopType === 'D' ? 'font-bold text-brand-navy' : 'text-gray-600'}`}>{r.PopFor}</Text>
                        <Text className={`text-sm ${qtyClass[r.PopType || ''] || 'text-gray-700'}`}>
                            {Number(r.PopQuantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
