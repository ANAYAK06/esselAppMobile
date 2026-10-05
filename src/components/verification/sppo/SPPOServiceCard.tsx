// One SPPO service line (web VerifySPPO.jsx / VerifySPPOAmend.jsx / VerifySPPOClose.jsx tables).
// With `rate` + `onRateChange` the rate is editable (lower only, locked once ticked) and is
// coloured green / red against the PRW rate; without them the line is read-only.
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import type { SPPOService } from '@/src/api/verification/sppoVerificationAPI';
import { money } from '../kit/VerificationKit';

export const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

type Props = {
    service: SPPOService;
    index: number;
    checked?: boolean;
    onToggle?: () => void;
    rate?: string;
    onRateChange?: (value: string) => void;
    amend?: boolean;   // show current / amended quantity and the add / subtract type
};

export default function SPPOServiceCard({ service: s, index, checked, onToggle, rate, onRateChange, amend }: Props) {
    const editable = rate !== undefined && !!onRateChange;
    const rateValue = editable ? num(rate) : num(s.Rate ?? s.PRWRate);
    const amount = editable ? rateValue * num(s.Quantity) : num(s.Amount ?? rateValue * num(s.Quantity));
    const vsPRW = rateValue - num(s.PRWRate);
    const amendQty = num(s.AmendQuantity);

    const Head = onToggle ? TouchableOpacity : View;
    return (
        <View className={`rounded-xl border p-3 mb-2.5 ${checked ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white'}`}>
            <Head onPress={onToggle} activeOpacity={0.7} className="flex-row items-start gap-2.5">
                {onToggle ? (checked ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#d1d5db" />) : null}
                <View className="flex-1">
                    <Text className="text-[11px] text-gray-400">{index + 1}.{s.SPPOItemId ? ` Item ${s.SPPOItemId}` : ''}</Text>
                    <Text className="text-sm font-semibold text-gray-900">{s.Description}</Text>
                    <Text className="text-[11px] text-gray-600 mt-0.5">
                        {amend
                            ? `Current ${s.CurrentQuantity ?? s.Quantity ?? '—'} ${s.Unit || ''}`
                            : `Qty ${s.Quantity} ${s.Unit || ''}`}
                    </Text>
                </View>
                <Text className="text-sm font-bold text-brand-navy">{money(amount)}</Text>
            </Head>

            {amend ? (
                <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
                    <View className={`px-2 py-0.5 rounded-full ${amendQty >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`text-[11px] font-bold ${amendQty >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            Amend {amendQty > 0 ? '+' : ''}{s.AmendQuantity ?? 0}
                        </Text>
                    </View>
                    {s.POType ? (
                        <View className={`px-2 py-0.5 rounded-full ${s.POType.toLowerCase() === 'add' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <Text className={`text-[11px] font-semibold ${s.POType.toLowerCase() === 'add' ? 'text-green-700' : 'text-red-700'}`}>{s.POType}</Text>
                        </View>
                    ) : null}
                    {s.ItemStatus ? <Text className="text-[11px] text-gray-500">{s.ItemStatus}</Text> : null}
                </View>
            ) : null}

            <View className="flex-row items-end gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                <View className="flex-1">
                    <Text className="text-[10px] text-gray-400">Client rate</Text>
                    <Text className="text-xs font-semibold text-gray-800">{money(s.ClientRate) || '₹0'}</Text>
                </View>
                {s.PRWRate != null ? (
                    <View className="flex-1">
                        <Text className="text-[10px] text-gray-400">PRW rate</Text>
                        <Text className="text-xs font-semibold text-gray-800">{money(s.PRWRate)}</Text>
                    </View>
                ) : null}
                {editable ? (
                    <View>
                        <Text className="text-[10px] text-gray-400 mb-0.5">Rate</Text>
                        <TextInput
                            value={rate}
                            onChangeText={onRateChange}
                            editable={!checked}
                            keyboardType="decimal-pad"
                            selectTextOnFocus
                            className={`w-28 px-2.5 py-1.5 rounded-lg border text-right text-sm ${checked
                                ? 'border-gray-200 bg-gray-100 text-gray-500'
                                : vsPRW < 0 ? 'border-green-300 bg-green-50 text-green-700' : vsPRW > 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900'}`}
                        />
                    </View>
                ) : (
                    <View className="flex-1">
                        <Text className="text-[10px] text-gray-400">Rate</Text>
                        <Text className="text-xs font-semibold text-gray-800">{money(rateValue)}</Text>
                    </View>
                )}
            </View>
            {editable && s.PRWRate != null && vsPRW !== 0 ? (
                <Text className={`text-[10px] mt-1 text-right ${vsPRW < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {money(Math.abs(vsPRW))} {vsPRW < 0 ? 'below' : 'above'} PRW rate
                </Text>
            ) : null}
        </View>
    );
}
