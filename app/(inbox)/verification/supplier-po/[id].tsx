// Supplier PO verification — mobile version of the web pages/SupplierPO/VerifySupplierPO.jsx.
// Tick every line (the purchase price can be lowered before ticking); when a line's standard
// and purchase prices differ, ticking asks whether to update the standard price. Return is not
// offered for this module. spApproveSupplierPO reads the lines as parallel comma lists and
// computes tax itself, so the amounts sent are pre-tax.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import DetailSheet, { type SheetContent } from '@/src/components/common/DetailSheet';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveSupplierPO,
    getSupplierPODetail,
    type SupplierPOItem,
    type SupplierPORow,
} from '@/src/api/verification/supplierPOVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildSupplierPOUrl } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import POItemCard, { hasPriceDifference, num } from '@/src/components/verification/supplierPO/POItemCard';
import PreviousPurchasesBody from '@/src/components/verification/supplierPO/PreviousPurchasesBody';

const Address = ({ title, lines }: { title: string; lines: (string | undefined | false)[] }) => (
    <View className="flex-1 rounded-xl bg-gray-50 p-3">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{title}</Text>
        {lines.filter(Boolean).map((l, i) => (
            <Text key={i} className={i === 0 ? 'text-xs font-semibold text-gray-800' : 'text-[11px] text-gray-600'}>{l}</Text>
        ))}
    </View>
);

export default function SupplierPODetailScreen() {
    const row = useRowParam<SupplierPORow>();
    const { roleId, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const [prices, setPrices] = useState<Record<string, string>>({});      // edited purchase prices
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [stdUpdates, setStdUpdates] = useState<Record<string, number>>({}); // accepted standard-price updates
    const [sheet, setSheet] = useState<SheetContent | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const load = useCallback(() => getSupplierPODetail(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const items = d?.PODataList ?? [];

    // Header GST flags come from the first item (the web derives them the same way)
    const state = items[0]?.StateStatus;
    const gst: 'same' | 'other' | 'none' = !state || state === 'NoNeed' ? 'none' : state === 'Same' ? 'same' : 'other';

    const priceOf = (it: SupplierPOItem) => prices[it.itemcode] ?? String(it.NewBasicprice ?? 0);
    // Line amount: recomputed only when the verifier edited the price, else the PO's own Amount
    const amountOf = (it: SupplierPOItem) => (prices[it.itemcode] != null ? num(prices[it.itemcode]) * num(it.quantity) : num(it.Amount));
    const total = items.reduce((s, it) => s + amountOf(it), 0);
    const originalTotal = items.reduce((s, it) => s + num(it.Amount), 0);   // approval limits use the PO as submitted
    const edited = Object.keys(prices).length > 0;
    const savings = items.reduce((s, it) => s + (num(it.QuotedPrice) - num(prices[it.itemcode] ?? it.QuotedPrice)) * num(it.quantity), 0);
    const checkedCount = items.filter((it) => checked[it.itemcode]).length;

    const openSheet = (content: SheetContent) => {
        setSheet(content);
        setSheetOpen(true);
    };

    const changePrice = (it: SupplierPOItem, value: string) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
        if (value !== '' && num(value) > num(it.QuotedPrice)) {
            Alert.alert('Price can only be reduced', `The purchase price cannot be above the quoted price (${money(it.QuotedPrice)}).`);
            return;
        }
        setPrices((p) => ({ ...p, [it.itemcode]: value }));
    };

    const toggle = (it: SupplierPOItem) => {
        const code = it.itemcode;
        if (checked[code]) {
            setChecked((p) => ({ ...p, [code]: false }));
            return;
        }
        if (priceOf(it) === '') return Alert.alert('Enter the purchase price first');
        if (!hasPriceDifference(it)) {
            setChecked((p) => ({ ...p, [code]: true }));
            return;
        }
        const standard = num(it.basicprice);
        const purchase = num(it.NewBasicprice);
        Alert.alert(
            'Update the standard price?',
            `${it.itemname}\n\nCurrent standard price: ${money(standard)}\nNew purchase price: ${money(purchase)}\nDifference: ${purchase > standard ? '+' : '−'}${money(Math.abs(purchase - standard))}\n\nUpdating sets this as the item's standard price for future PO approvals.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Keep standard', onPress: () => setChecked((p) => ({ ...p, [code]: true })) },
                {
                    text: 'Update standard',
                    onPress: () => {
                        setStdUpdates((p) => ({ ...p, [code]: purchase }));
                        setChecked((p) => ({ ...p, [code]: true }));
                    },
                },
            ],
        );
    };

    const checkAll = () => {
        if (checkedCount === items.length) return setChecked({});
        const pending = items.filter((it) => !checked[it.itemcode] && hasPriceDifference(it));
        if (pending.length) {
            Alert.alert('Verify individually', `${pending.length} item(s) have price differences. Tick each of them to decide on the standard price.`);
            return;
        }
        setChecked(Object.fromEntries(items.map((it) => [it.itemcode, true])));
    };

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        if (checkedCount < items.length) {
            Alert.alert('Please verify all items', `${checkedCount}/${items.length} items verified.`);
            return;
        }
        if (items.some((it) => priceOf(it) === '')) return Alert.alert('Enter every purchase price');

        const payload = {
            PONo: row.PONo,
            IndentNo: row.IndentNo,
            ApprovalNote: note,
            Remarks: appendApprovalComment(d.ApprovedUser, roleCode || 'PO Verifier', userName, note),
            Action: action.value || action.type,
            Roleid: roleId,
            Createdby: userName,
            Itemcodes: items.map((it) => `${it.itemcode},`).join(''),
            NewPurchasePrices: items.map((it) => `${num(priceOf(it))},`).join(''),
            ItemNewTotal: items.map((it) => `${amountOf(it)},`).join(''),
            Newtotalamt: total,
            Oldtotalamt: items.reduce((s, it) => s + num(it.basicprice) * num(it.quantity), 0),
            OldPurchasetotalamt: originalTotal,
            // Echo the server's flag: it decides whether the SP may overwrite the master standard price
            PriceChangeAccess: d.PriceChangeAccess || '',
            Standardprices: items.map((it) => `${stdUpdates[it.itemcode] ?? num(it.basicprice)},`).join(''),
            ItemTermHeadID: d.ItemTermHeadID || 0,
            PreferredRemarks: d.PreferredRemarks || null,
            PredefinedTermsExist: d.PredefinedTermsExist || 'No',
        };

        try {
            const status = await approveSupplierPO(payload);
            const updates = Object.keys(stdUpdates).length;
            showSubmitResult(
                `${action.text} completed successfully.${updates ? `\n${updates} standard price(s) updated.` : ''}`,
                status,
                () => router.back(),
            );
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Supplier PO"
            subtitle={row?.PONo}
            icon={ShoppingBag}
            backHref={'/verification/supplier-po/list' as Href}
            onRefresh={() => { setPrices({}); setChecked({}); setStdUpdates({}); setReloadKey((k) => k + 1); }}
        >
            {!row ? (
                <EmptyState title="PO not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the PO" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={d.PONo || row.PONo}
                        amount={money(total)}
                        amountLabel={edited ? `Total (was ${money(originalTotal)})` : 'Total amount (before tax)'}
                        chips={[d.VendorName || row.VendorName, d.CCCode, d.CCType, d.Status && `Status ${d.Status}`]}
                    />

                    <Section>
                        <FieldGrid
                            fields={[
                                ['Indent No', d.IndentNo],
                                ['PO Date', d.PODate],
                                ['Ref No', d.RefNo],
                                ['Cost Center', d.CCCode],
                                !!d.LCApplicable && ['LC Applicable', d.LCApplicable],
                                ['Vendor', d.VendorName, true],
                                !!d.VendorGST && ['Vendor GST', d.VendorGST],
                                !!d.VendorAddress && ['Vendor Address', d.VendorAddress, true],
                            ]}
                        />
                        <View className="flex-row gap-2 mb-3">
                            <Address title="Invoice address" lines={[d.InvAddress1, d.InvAddress2, d.GstNo && `GST ${d.GstNo}`, d.MobileNo && `Mobile ${d.MobileNo}`]} />
                            <Address title="Delivery address" lines={[d.SiteAddress1, d.SiteAddress2, d.Contact && `Contact ${d.Contact}`, d.SiteMobileNo && `Mobile ${d.SiteMobileNo}`]} />
                        </View>
                    </Section>

                    {/* QCS is shown only above ₹50,000, as on the web */}
                    {d.FilePath && total > 50000 ? (
                        <DocumentLinks links={[{ label: 'QCS — Quotation Comparison Sheet', url: buildSupplierPOUrl(d.FilePath) }]} />
                    ) : null}

                    <Section
                        title={`Items (${items.length})`}
                        right={items.length ? (
                            <Text onPress={checkAll} className="text-xs font-semibold text-orange-600">
                                {checkedCount === items.length ? 'Clear all' : 'Check all'}
                            </Text>
                        ) : null}
                    >
                        <Text className="text-[11px] text-gray-500 mb-2">
                            Tick each item once checked — {checkedCount}/{items.length} verified
                            {edited && savings > 0 ? ` · savings ${money(savings)}` : ''}
                            {Object.keys(stdUpdates).length ? ` · ${Object.keys(stdUpdates).length} standard price update(s)` : ''}
                        </Text>
                        {items.map((it) => (
                            <POItemCard
                                key={it.itemcode}
                                item={it}
                                checked={!!checked[it.itemcode]}
                                price={priceOf(it)}
                                standardPrice={stdUpdates[it.itemcode] ?? num(it.basicprice)}
                                standardUpdated={stdUpdates[it.itemcode] != null}
                                gst={gst}
                                onToggle={() => toggle(it)}
                                onPriceChange={(v) => changePrice(it, v)}
                                onHistory={() => openSheet({
                                    title: 'Previous purchases',
                                    subtitle: it.itemname,
                                    body: <PreviousPurchasesBody itemCode={it.itemcode} currentPrice={num(priceOf(it))} quotedPrice={it.QuotedPrice} />,
                                })}
                            />
                        ))}
                        <View className="flex-row justify-between pt-2.5 border-t border-gray-200">
                            <Text className="text-xs font-bold text-gray-700">Total (before tax)</Text>
                            <Text className="text-xs font-bold text-brand-navy">{money(total)}</Text>
                        </View>
                    </Section>

                    {d.Remarks ? (
                        <Section title="PO terms & conditions">
                            {d.Remarks.split('|').filter((t) => t.trim()).map((t, i) => (
                                <Text key={i} className="text-xs text-gray-700 leading-5">• {t.trim()}</Text>
                            ))}
                        </Section>
                    ) : null}

                    <RemarksTimeline trno={row.PONo} moid={d.MOID} />
                    <ActionPanel moid={d.MOID} roleId={roleId} chkAmt={originalTotal} showReturn={false} onSubmit={submit} />
                </>
            )}

            <DetailSheet visible={sheetOpen} sheet={sheet} onClose={() => setSheetOpen(false)} />
        </PortalScreen>
    );
}
