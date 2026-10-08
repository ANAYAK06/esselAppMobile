// One Supplier PO line — mobile version of a row in the web VerifySupplierPO.jsx item grid.
// The purchase price can only be lowered (never above the quoted price) and locks once the
// line is ticked. Orange = standard vs purchase price differs (ticking asks whether to update
// the standard price); indigo = the item has a recent price change on record.
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { AlertTriangle, CheckCircle2, Circle, History, TrendingDown } from 'lucide-react-native';
import type { SupplierPOItem } from '@/src/api/verification/supplierPOVerificationAPI';
import { brand } from '@/src/theme/colors';
import { money } from '../kit/VerificationKit';

export const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
export const hasPriceDifference = (it: SupplierPOItem) => num(it.basicprice) !== num(it.NewBasicprice);
export const hasRecentChange = (it: SupplierPOItem) => num(it.ItemNewPrice) > 0 && num(it.basicprice) !== num(it.ItemNewPrice);

type Props = {
    item: SupplierPOItem;
    checked: boolean;
    price: string;                    // purchase price being edited
    standardPrice: number;            // after an accepted standard-price update
    standardUpdated: boolean;
    gst: 'same' | 'other' | 'none';   // CGST+SGST / IGST / no GST columns
    onToggle: () => void;
    onPriceChange: (value: string) => void;
    onHistory: () => void;
};

const Price = ({ label, value, tone = 'text-gray-800' }: { label: string; value: string | null; tone?: string }) => (
    <View className="flex-1">
        <Text className="text-[10px] text-gray-400">{label}</Text>
        <Text className={`text-xs font-semibold ${tone}`}>{value}</Text>
    </View>
);

export default function POItemCard({ item, checked, price, standardPrice, standardUpdated, gst, onToggle, onPriceChange, onHistory }: Props) {
    const diff = hasPriceDifference(item);
    const recent = hasRecentChange(item);
    const amount = num(price) * num(item.quantity);
    const lower = num(price) < standardPrice;
    const higher = num(price) > standardPrice;

    return (
        <View className={`rounded-xl border p-3 mb-2.5 ${checked ? 'border-green-300 bg-green-50/40' : diff ? 'border-orange-300 bg-orange-50/40' : recent ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}>
            <TouchableOpacity onPress={onToggle} activeOpacity={0.7} className="flex-row items-start gap-2.5">
                {checked ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#d1d5db" />}
                <View className="flex-1">
                    <Text className="text-[11px] font-mono text-brand-navy">{item.itemcode}{item.HSNCode ? ` · HSN ${item.HSNCode}` : ''}</Text>
                    <Text className="text-sm font-semibold text-gray-900">{item.itemname}</Text>
                    {item.specification ? <Text className="text-[11px] text-gray-500 mt-0.5">{item.specification}</Text> : null}
                    <Text className="text-[11px] text-gray-600 mt-0.5">Qty {item.quantity} {item.units}</Text>
                </View>
                <Text className="text-sm font-bold text-brand-navy">{money(amount)}</Text>
            </TouchableOpacity>

            {(diff && !checked) || recent ? (
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                    {diff && !checked ? (
                        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100">
                            <AlertTriangle size={11} color="#ea580c" />
                            <Text className="text-[10px] font-semibold text-orange-700">Standard vs purchase price differs</Text>
                        </View>
                    ) : null}
                    {recent ? (
                        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100">
                            <TrendingDown size={11} color={brand.navy} />
                            <Text className="text-[10px] font-semibold text-brand-navy">Recent price {money(item.ItemNewPrice)}</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}

            <View className="flex-row items-end gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                <Price label="Quoted" value={money(item.QuotedPrice)} />
                <Price label={standardUpdated ? 'Standard (updated)' : 'Standard'} value={money(standardPrice)} tone={standardUpdated ? 'text-purple-600' : 'text-gray-800'} />
                <View>
                    <Text className="text-[10px] text-gray-400 mb-0.5">Purchase price</Text>
                    <TextInput
                        value={price}
                        onChangeText={onPriceChange}
                        editable={!checked}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        className={`w-28 px-2.5 py-1.5 rounded-lg border text-right text-sm ${checked
                            ? 'border-gray-200 bg-gray-100 text-gray-500'
                            : lower ? 'border-green-300 bg-green-50 text-green-700' : higher ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900'}`}
                    />
                </View>
            </View>

            <View className="flex-row items-center justify-between mt-2">
                <TouchableOpacity onPress={onHistory} className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50">
                    <History size={13} color="#0e7490" />
                    <Text className="text-[11px] font-semibold text-cyan-700">Previous purchases</Text>
                </TouchableOpacity>
                <Text className="text-[11px] text-gray-500">
                    {gst === 'same' ? `CGST ${item.CGSTPercent ?? 0}% · SGST ${item.SGSTPercent ?? 0}%` : gst === 'other' ? `IGST ${item.IGSTPercent ?? 0}%` : ''}
                </Text>
            </View>
            {item.ItemRemark ? <Text className="text-[11px] text-gray-500 mt-1.5">{item.ItemRemark}</Text> : null}
        </View>
    );
}
