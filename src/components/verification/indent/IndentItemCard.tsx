// One indent line, shaped by the verifier's level — mobile version of the web
// VerifyIndentCreation.jsx CSKTable / PUMTable / ReadOnlyTable rows.
//   CSK   (store keeper): old / new / available stock + "Issued qty" from old stock
//   PUM   (purchase):     old issued, purchase qty, new stock at the chosen CC + "Issued new stock", Trade Issue
//   CC / OTHER:           read-only (OTHER also sees issued / purchase columns)
// Every role ticks each line to confirm it has been checked.
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeftRight, BarChart2, CheckCircle2, Circle } from 'lucide-react-native';
import type { IndentItem, IndentRole } from '@/src/api/verification/indentVerificationAPI';
import { brand } from '@/src/theme/colors';

export const n = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
export const isAssetItem = (item: IndentItem) => (item.ItemCode?.trim() || '').startsWith('1');
const amt = (v: unknown) => `₹${n(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Stat = ({ label, value, tone = 'text-gray-800' }: { label: string; value: string | number; tone?: string }) => (
    <View className="w-1/3 mb-1.5">
        <Text className="text-[10px] text-gray-400">{label}</Text>
        <Text className={`text-xs font-semibold ${tone}`}>{value}</Text>
    </View>
);

type Props = {
    item: IndentItem;
    index: number;
    role: IndentRole;
    checked: boolean;
    onToggle: () => void;
    issuedQty: string;
    onQtyChange: (value: string) => void;
    onStock: () => void;
    onTrade?: () => void;
};

export default function IndentItemCard({ item, index, role, checked, onToggle, issuedQty, onQtyChange, onStock, onTrade }: Props) {
    const asset = isAssetItem(item);
    const raised = n(item.Quantity);
    const basic = n(item.BasicPrice);
    const editable = (role === 'CSK' || role === 'PUM') && !asset;
    const pumNoStock = role === 'PUM' && n(item.AvailableQty) === 0;
    // CSK shows what is still to be bought after issuing from old stock
    const amount = role === 'CSK' ? basic * Math.max(0, raised - n(issuedQty)) : n(item.sumamt || item.Amount);

    return (
        <View className={`rounded-xl border p-3 mb-2.5 ${checked ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white'}`}>
            <TouchableOpacity onPress={onToggle} activeOpacity={0.7} className="flex-row items-start gap-2.5">
                {checked ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#d1d5db" />}
                <View className="flex-1">
                    <Text className="text-[11px] font-mono text-brand-navy">{index + 1}. {item.ItemCode?.trim()}</Text>
                    <Text className="text-sm font-semibold text-gray-900">{item.ItemName}</Text>
                    {item.Specification ? <Text className="text-[11px] text-gray-500 mt-0.5">{item.Specification}</Text> : null}
                    <Text className="text-[11px] text-indigo-600 mt-0.5">
                        {item.DcaCode}{item.SubDcaCode ? ` / ${item.SubDcaCode}` : ''}
                    </Text>
                </View>
                <Text className="text-sm font-bold text-brand-navy">{amt(amount)}</Text>
            </TouchableOpacity>

            <View className="flex-row flex-wrap mt-2.5 pt-2.5 border-t border-gray-100">
                <Stat label={role === 'CSK' ? 'Raised qty' : 'Indent qty'} value={`${item.Quantity} ${item.Units || ''}`} />
                <Stat label="Basic price" value={amt(basic)} />
                {role === 'CSK' ? (
                    <>
                        <Stat label="Old stock" value={item.Stock || '0'} tone="text-amber-600" />
                        <Stat label="New stock" value={item.NewStock || '0'} tone="text-green-600" />
                    </>
                ) : null}
                {role === 'PUM' ? (
                    <>
                        <Stat label="Old issued" value={item.IssuedQty || '0'} tone="text-amber-600" />
                        <Stat label="Purchase qty" value={item.PurchasedQty || '0'} tone="text-green-600" />
                        <Stat label="New stock" value={item.AvailableQty || '0'} tone={n(item.AvailableQty) > 0 ? 'text-green-600' : 'text-gray-400'} />
                    </>
                ) : null}
                {role === 'OTHER' ? (
                    <>
                        <Stat label="Issued CS" value={item.Stock || '0'} />
                        <Stat label="Issued new stock" value={item.NewStock || '0'} />
                        <Stat label="Purchase qty" value={item.PurchasedQty || '—'} />
                    </>
                ) : null}
            </View>

            <View className="flex-row items-center gap-2 mt-1">
                <TouchableOpacity onPress={onStock} className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50">
                    <BarChart2 size={13} color={brand.navy} />
                    <Text className="text-[11px] font-semibold text-brand-navy">
                        {role === 'CSK' ? `Avl ${item.AvailableQty || '0'}` : `Avl at CC ${item.AvlQtyAtCC || item.AvailableQty || '0'}`}
                    </Text>
                </TouchableOpacity>
                {role === 'PUM' && onTrade ? (
                    <TouchableOpacity onPress={onTrade} className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-100">
                        <ArrowLeftRight size={13} color="#6d28d9" />
                        <Text className="text-[11px] font-semibold text-violet-700">Trade issue</Text>
                    </TouchableOpacity>
                ) : null}
                <View className="flex-1" />
                {editable ? (
                    <View className="items-end">
                        <Text className="text-[10px] text-gray-400 mb-0.5">{role === 'CSK' ? 'Issued qty' : 'Issued new stock'}</Text>
                        <TextInput
                            value={issuedQty}
                            onChangeText={onQtyChange}
                            editable={!pumNoStock}
                            keyboardType="decimal-pad"
                            selectTextOnFocus
                            className={`w-24 px-2.5 py-1.5 rounded-lg border text-right text-sm ${pumNoStock ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-orange-300 bg-white text-gray-900'}`}
                        />
                    </View>
                ) : (role === 'CSK' || role === 'PUM') && asset ? (
                    <Text className="text-[10px] italic text-gray-400">Asset item</Text>
                ) : null}
            </View>
        </View>
    );
}
