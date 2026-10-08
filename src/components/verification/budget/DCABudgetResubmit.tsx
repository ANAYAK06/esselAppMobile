// Returned account-head budget → re-assign and resubmit (web verificationConfigs.jsx DCABudget.resubmit,
// legacy UpdateDCAAssignedBudget with Action 'Update'). Every account head of the CC type is listed;
// tick a head and enter its amount. The new total may not exceed the CC balance plus what was
// assigned before.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { CheckSquare, Send, Square } from 'lucide-react-native';
import { FormField, TextField } from '@/src/components/employee/FormControls';
import { PrimaryButton } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    getBudgetDCAHeads,
    updateDCAAssignedBudget,
    type DCABudgetDetail,
    type DCABudgetRow,
} from '@/src/api/verification/budgetVerificationAPI';
import { brand } from '@/src/theme/colors';
import { FieldGrid, Section, money } from '../kit/VerificationKit';
import { showDone } from '../kit/verificationEvents';

type HeadValue = { amount: string; checked: boolean };

type Props = {
    row: DCABudgetRow;
    detail: DCABudgetDetail;
    roleId: string;
    userName: string;
    onDone: () => void;
};

const subTotal = (dca: Record<string, HeadValue>) => Object.values(dca).reduce((a, x) => a + (parseFloat(x.amount) || 0), 0);

export default function DCABudgetResubmit({ row, detail: d, roleId, userName, onDone }: Props) {
    const ccType = d.CCType || row.CC_Type;
    const [dca, setDca] = useState<Record<string, HeadValue>>(() =>
        Object.fromEntries((d.items || []).map((it) => [it.DCACode, { amount: String(it.DCABudgetValue ?? ''), checked: true }])),
    );
    const [old] = useState(() => (d.items || []).reduce((a, it) => a + (Number(it.DCABudgetValue) || 0), 0));
    const [remarks, setRemarks] = useState(d.Remarks || '');
    const [busy, setBusy] = useState(false);

    const loadHeads = useCallback(() => getBudgetDCAHeads(d.CCTypeId!), [d.CCTypeId]);
    const heads = useApiData(d.CCTypeId ? loadHeads : null);
    const headList = heads.data?.length ? heads.data : (d.items || []).map((it) => ({ DCACode: it.DCACode, DCAName: it.DCAName }));

    const total = subTotal(dca);
    const available = (Number(d.CCBudgetBalance) || 0) + old - total;

    const setRow = (code: string, patch: Partial<HeadValue>) =>
        setDca((p) => ({ ...p, [code]: { ...(p[code] ?? { amount: '', checked: false }), ...patch } }));

    const submit = async () => {
        const rows = Object.values(dca);
        const errors: string[] = [];
        if (!rows.some((x) => x.checked) || rows.some((x) => !x.checked && x.amount !== '')) errors.push('Check Account Head to Assign budget');
        if (rows.some((x) => x.checked && x.amount === '')) errors.push('Enter Account Head Budget');
        if (total > (Number(d.CCBudgetBalance) || 0) + old) errors.push('Account Head Budget is greater than CC Budget');
        if (!remarks.trim()) errors.push('Enter Remarks');
        if (errors.length) return Alert.alert('Check the form', errors.join('\n'));

        const picked = Object.entries(dca).filter(([, x]) => x.checked && x.amount !== '');
        setBusy(true);
        try {
            const status = await updateDCAAssignedBudget({
                UDCACode: picked.map(([code]) => `${code},`).join(''),
                UCCCode: d.CCCode || row.CC_Code,
                UDcaAmounts: picked.map(([, x]) => `${x.amount},`).join(''),
                ...(ccType !== 'Performing' ? { UFYyear: d.FYyear || '' } : {}),
                URemarks: remarks.trim(),
                UAction: 'Update',
                UOldBudgetAmount: old.toFixed(2),
                RoleId: roleId,
                UCreatedBy: userName,
            });
            if (status === 'Updated') showDone('Account head budget updated successfully', onDone);
            else Alert.alert('Not updated', status || 'The server returned no confirmation.');
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Failed to update');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Section title="Update and resubmit">
            <FieldGrid
                fields={[
                    ['Cost Center', d.CCCode || row.CC_Code],
                    ccType !== 'Performing' && ['Financial Year', d.FYyear],
                    ['CC Budget', money(d.CCBudget)],
                    ['CC Balance', money(d.CCBudgetBalance)],
                ]}
            />

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1 rounded-xl bg-gray-50 p-3">
                    <Text className="text-[10px] font-bold uppercase text-gray-400">Sub total</Text>
                    <Text className="text-sm font-bold text-gray-900 mt-0.5">{money(total) || '₹0'}</Text>
                </View>
                <View className={`flex-1 rounded-xl p-3 ${available < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <Text className="text-[10px] font-bold uppercase text-gray-400">Available after this</Text>
                    <Text className={`text-sm font-bold mt-0.5 ${available < 0 ? 'text-red-600' : 'text-green-700'}`}>{money(available) || '₹0'}</Text>
                </View>
            </View>

            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Account heads</Text>
            {heads.loading && !heads.data ? (
                <ActivityIndicator color={brand.orange} style={{ paddingVertical: 12 }} />
            ) : headList.length === 0 ? (
                <Text className="text-xs text-gray-400 text-center py-4">No Account Heads Found</Text>
            ) : (
                <View className="rounded-xl border border-amber-200 mb-4 overflow-hidden">
                    {headList.map((h, i) => {
                        const value = dca[h.DCACode] || { amount: '', checked: false };
                        return (
                            <View key={h.DCACode} className={`flex-row items-center gap-2.5 px-3 py-2 ${i > 0 ? 'border-t border-gray-100' : ''} ${value.checked ? 'bg-amber-50' : 'bg-white'}`}>
                                <TouchableOpacity onPress={() => setRow(h.DCACode, { checked: !value.checked })} hitSlop={8}>
                                    {value.checked ? <CheckSquare size={20} color={brand.orange} /> : <Square size={20} color="#9ca3af" />}
                                </TouchableOpacity>
                                <View className="flex-1">
                                    <Text className="text-xs font-semibold text-gray-800">{h.DCACode}</Text>
                                    <Text className="text-[11px] text-gray-500" numberOfLines={1}>{h.DCAName}</Text>
                                </View>
                                <TextInput
                                    value={value.amount}
                                    onChangeText={(v) => { if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setRow(h.DCACode, { amount: v }); }}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    placeholderTextColor="#9ca3af"
                                    className="w-28 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-right text-sm text-gray-900"
                                />
                            </View>
                        );
                    })}
                </View>
            )}

            <FormField label="Remarks" required>
                <TextField value={remarks} onChangeText={setRemarks} multiline placeholder="Reason for the change…" />
            </FormField>

            <View className="mb-2">
                <PrimaryButton label="Update & Resubmit" icon={Send} onPress={submit} loading={busy} />
            </View>
        </Section>
    );
}
