// Item Code verification — item details, the trader quotes and web price links it was raised
// with, then verify / approve (web: pages/Purchase/VerifyItemCode.jsx). The verifier may correct
// the item name and specification and lower (never raise) the basic price; all three are posted.
import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronDown, ChevronUp, ExternalLink, Package } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    getItemCodeDetail, getItemCodeLinks, getItemCodeRemarks, getItemCodeTraders, verifyItemCode,
    type ItemCodeDetail, type ItemCodeRow,
} from '@/src/api/verification/purchaseVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { brand } from '@/src/theme/colors';

const ITEM_CODE_MOID = 270;   // web fallback when the record has no MOID

const num = (v: unknown) => {
    const n = parseFloat(String(v ?? ''));
    return Number.isNaN(n) ? 0 : n;
};

export default function ItemCodeDetailScreen() {
    const row = useRowParam<ItemCodeRow>();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getItemCodeDetail(row!.Rowid), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);

    return (
        <PortalScreen
            title="Item Code"
            subtitle={row?.ItemCode}
            icon={Package}
            backHref={'/verification/item-code/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Item code not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the item code" subtitle="Pull down to try again." />
            ) : (
                // Keyed so the editable fields start from this record's values
                <ItemCodeBody key={d.Rowid} d={d} />
            )}
        </PortalScreen>
    );
}

function ItemCodeBody({ d }: { d: ItemCodeDetail }) {
    const { roleId, userName, roleCode } = useVerifier();
    const [itemName, setItemName] = useState(d.Itemname || '');
    const [specification, setSpecification] = useState(d.Specification || '');
    const [basicPrice, setBasicPrice] = useState(d.Basicprice || '');

    const tranNo = d.TranNo || '';
    const loadRemarks = useCallback(() => getItemCodeRemarks(tranNo), [tranNo]);
    const maxPrice = num(d.Basicprice);
    const priceTooHigh = basicPrice !== '' && num(basicPrice) > maxPrice;

    const submit = async (action: StatusAction, note: string) => {
        if (!itemName.trim()) return void Alert.alert('Item name required', 'Enter the item name before you continue.');
        if (priceTooHigh) return void Alert.alert('Check the basic price', `The basic price cannot be more than ${money(maxPrice)}.`);
        try {
            const status = await verifyItemCode({
                Rowid: d.Rowid,
                Remarks: appendApprovalComment(d.Remarks || '', roleCode || 'Item Code Verifier', userName, note),
                Appstatus: action.value || action.text || action.type,
                RoleID: roleId,
                LastRoleID: d.LastRoleID ?? null,
                Basicprice: basicPrice,
                Itemname: itemName.trim(),
                Specification: specification.trim(),
                Createdby: userName,
            });
            // The SP answers "Invalid …" for a rejected request, even with IsSuccessful true
            if (status.toLowerCase().startsWith('invalid')) return void Alert.alert('Not saved', status);
            showSubmitResult(`${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <>
            <DetailHero
                title={d.Itemname || d.ItemCode || `Item ${d.Rowid}`}
                amount={money(d.Basicprice)}
                amountLabel={`Basic price${d.Units ? ` per ${d.Units}` : ''}`}
                chips={[d.ItemCode, d.TransactionType, d.ItemCodeType]}
            />
            <Section>
                <FieldGrid
                    fields={[
                        ['Item Code', d.ItemCode],
                        ['Unit', d.Units],
                        ['HSN Code', d.HSNCode],
                        ['Spec Code', d.Specificationcode],
                        ['Major Group', [d.Majorgroupcode, d.Majorgroupname].filter(Boolean).join(' — '), true],
                        ['Sub Group', [d.Subgroupcode, d.Subgroupname].filter(Boolean).join(' — '), true],
                        ['DCA', d.ItemcodeDca, true],
                        ['Sub DCA', d.ItemcodeSDca, true],
                        !!d.HSNRemarks && ['HSN Remarks', d.HSNRemarks, true],
                        !!tranNo && ['Transaction No', tranNo],
                        ['Row ID', d.Rowid],
                    ]}
                />
            </Section>

            <Section title="Updatable fields">
                <Label text="Item name" />
                <TextInput
                    value={itemName}
                    onChangeText={setItemName}
                    autoCapitalize="characters"
                    className="rounded-xl border border-orange-300 bg-white px-3 py-2.5 text-sm text-gray-900 mb-3"
                />
                <Label text="Specification" />
                <TextInput
                    value={specification}
                    onChangeText={setSpecification}
                    multiline
                    textAlignVertical="top"
                    className="min-h-[72px] rounded-xl border border-orange-300 bg-white p-3 text-sm text-gray-900 mb-3"
                />
                <Label text={`Basic price${maxPrice ? ` (max ${money(maxPrice)})` : ''}`} />
                <TextInput
                    value={basicPrice}
                    onChangeText={(v) => setBasicPrice(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    className={`rounded-xl border px-3 py-2.5 text-sm ${priceTooHigh ? 'border-red-400 bg-red-50 text-red-700' : 'border-orange-300 bg-white text-gray-900'}`}
                />
                <Text className={`text-[11px] mt-1 mb-2 ${priceTooHigh ? 'text-red-600' : 'text-gray-400'}`}>
                    {priceTooHigh ? `Cannot be more than the original ${money(maxPrice)}` : 'You can lower the price, not raise it'}
                </Text>
            </Section>

            {tranNo ? (
                <>
                    <TraderQuotes tranNo={tranNo} />
                    <PriceLinks tranNo={tranNo} />
                    <RemarksTimeline load={loadRemarks} />
                </>
            ) : null}

            <ActionPanel
                moid={d.MOID || ITEM_CODE_MOID}
                roleId={roleId}
                showReturn
                confirmLabel="I have verified the item code details — item name, HSN code, specification and pricing"
                onSubmit={submit}
            />
        </>
    );
}

const Label = ({ text }: { text: string }) => (
    <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{text}</Text>
);

// Collapsible section that loads its rows the first time it is opened
function LazySection<T>({ title, load, empty, renderRow }: {
    title: string;
    load: () => Promise<T[]>;
    empty: string;
    renderRow: (row: T, i: number) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const { data, loading } = useApiData(open ? load : null);
    const rows = data ?? [];
    return (
        <Section
            title={data ? `${title} (${rows.length})` : title}
            right={(
                <TouchableOpacity onPress={() => setOpen(!open)} hitSlop={8} className="flex-row items-center gap-1">
                    <Text className="text-xs font-semibold text-orange-600">{open ? 'Hide' : 'Show'}</Text>
                    {open ? <ChevronUp size={14} color={brand.orange} /> : <ChevronDown size={14} color={brand.orange} />}
                </TouchableOpacity>
            )}
        >
            {!open ? null : loading ? (
                <ActivityIndicator color={brand.orange} style={{ paddingVertical: 12 }} />
            ) : rows.length === 0 ? (
                <Text className="text-xs text-gray-400 py-3 text-center">{empty}</Text>
            ) : (
                rows.map(renderRow)
            )}
        </Section>
    );
}

const Amounts = ({ rate, amount, basic }: { rate: unknown; amount: unknown; basic: unknown }) => (
    <View className="flex-row mt-1.5">
        {([['Rate', rate], ['Amount', amount], ['Basic', basic]] as const).map(([label, v]) => (
            <View key={label} className="flex-1">
                <Text className="text-[10px] text-gray-400">{label}</Text>
                <Text className="text-xs font-semibold text-gray-800">{money(v as string) || '—'}</Text>
            </View>
        ))}
    </View>
);

function TraderQuotes({ tranNo }: { tranNo: string }) {
    const load = useCallback(() => getItemCodeTraders(tranNo), [tranNo]);
    return (
        <LazySection
            title="Trader quotes"
            load={load}
            empty="No trader quotes found"
            renderRow={(t, i) => (
                <View key={i} className={`py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <Text className="text-sm font-semibold text-gray-900">{t.SupName || '—'}</Text>
                    {t.Supphone || t.Supemail ? (
                        <Text className="text-[11px] text-gray-500" numberOfLines={1}>{[t.Supphone, t.Supemail].filter(Boolean).join(' · ')}</Text>
                    ) : null}
                    <Amounts rate={t.SupRate} amount={t.SupAmt} basic={t.Basic} />
                </View>
            )}
        />
    );
}

function PriceLinks({ tranNo }: { tranNo: string }) {
    const load = useCallback(() => getItemCodeLinks(tranNo), [tranNo]);
    return (
        <LazySection
            title="Price links"
            load={load}
            empty="No price links found"
            renderRow={(l, i) => {
                const url = (l.Link || l.Linkshort || '').trim();
                return (
                    <View key={i} className={`py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                        {url ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the link'))}
                                className="flex-row items-center gap-1.5"
                            >
                                <ExternalLink size={13} color={brand.navy} />
                                <Text className="flex-1 text-xs text-brand-navy underline" numberOfLines={1}>{url.replace(/^https?:\/\/(www\.)?/, '')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text className="text-xs text-gray-400">No link</Text>
                        )}
                        <Amounts rate={l.LinkRate} amount={l.LinkAmt} basic={l.Basic} />
                    </View>
                );
            }}
        />
    );
}
