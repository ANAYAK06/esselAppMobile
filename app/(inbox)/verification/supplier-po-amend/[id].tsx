// Supplier PO Amendment verification — value breakdown, amended lines, documents, then
// verify / approve (web: pages/SupplierPO/VerifySupplierPOAmend.jsx). The purchase price of 'New'
// items can be lowered; the payload is the web's port of legacy CountSupplierPOAmount() +
// ApproveSupplierPOAmend(): budget plus / minus and PO values recomputed from the rows, item lists
// carrying only 'New' rows, Remarks = this verifier's note. Return is dropped, as on the web.
import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { FileDiff } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveSupplierPOAmend,
    getPOUploadedDocs,
    getSupplierPOAmendDetail,
    type SupplierPOAmendItem,
    type SupplierPOAmendRow,
} from '@/src/api/verification/supplierPOVerificationAPI';
import { isSubmitted, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildSupplierPOAmendUrl, buildSupplierPOUrl, getFileName } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
const isSubtract = (t?: string) => (t || '').toLowerCase() === 'substract';
const round2 = (v: number) => Math.round(v * 100) / 100;
const isNewItem = (it: SupplierPOAmendItem) => String(it.ItemType || '').trim() === 'New';

export default function SupplierPOAmendDetailScreen() {
    const row = useRowParam<SupplierPOAmendRow>();
    const { ccType } = useLocalSearchParams<{ ccType?: string }>();
    const { roleId, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);
    const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});   // by IndentListId, 'New' items only

    const load = useCallback(() => getSupplierPOAmendDetail(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const loadDocs = useCallback(() => getPOUploadedDocs(row!.PONo), [row]);
    const docs = useApiData(row ? loadDocs : null).data ?? [];
    const items = d?.lstItems ?? [];

    // Purchase price / amount after the verifier's edit ('New' items only)
    const effPrice = (it: SupplierPOAmendItem) => {
        const k = String(it.IndentListId);
        return isNewItem(it) && priceEdits[k] !== undefined ? num(priceEdits[k]) : num(it.POPurchasePrice);
    };
    const effAmount = (it: SupplierPOAmendItem) => {
        const k = String(it.IndentListId);
        return isNewItem(it) && priceEdits[k] !== undefined ? round2(num(it.AmendQty) * effPrice(it)) : num(it.Amount);
    };
    const changePrice = (it: SupplierPOAmendItem, value: string) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
        const k = String(it.IndentListId);
        if (value !== '' && num(value) > num(it.POPurchasePrice)) {
            Alert.alert('Your Are Not Able To Increase Purchase Price');
            setPriceEdits((p) => ({ ...p, [k]: String(it.POPurchasePrice ?? '') }));
            return;
        }
        setPriceEdits((p) => ({ ...p, [k]: value }));
    };

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        if (items.some((it) => isNewItem(it) && !(effPrice(it) > 0))) {
            Alert.alert('Enter Purchase Price For New Items');
            return;
        }

        let plusTotal = 0, minusTotal = 0, poPlusAmt = 0, poMinusAmt = 0, newPurchaseTotal = 0;
        let ids = '', itemcodes = '', oldPurchasePrices = '', newPurchasePrices = '', newPurchaseAmounts = '',
            oldPurchaseAmounts = '', standardPrices = '', standardPriceAmounts = '';
        items.forEach((it) => {
            const itemType = String(it.ItemType || '').trim();
            const amendType = String(it.AmendType || '').trim();
            const qty = num(it.AmendQty);
            const std = num(it.POStandardPrice);
            const price = effPrice(it);
            const stdAmt = qty * std;
            const rowAmt = qty * price;

            if ((itemType === 'New' && price > 0) || (itemType === 'Existing' && amendType === 'Add')) {
                if (std < price) plusTotal += rowAmt - stdAmt;
                else if (std > price) minusTotal += stdAmt - rowAmt;
            } else if (itemType === 'Existing' && amendType === 'Substract') {
                if (std < price) minusTotal += rowAmt - stdAmt;
                else if (std > price) plusTotal += stdAmt - rowAmt;
            }
            if (amendType === 'Add') poPlusAmt += effAmount(it);
            else if (amendType === 'Substract') poMinusAmt += effAmount(it);

            if (itemType === 'New') {
                ids += `${it.IndentListId},`;
                itemcodes += `${String(it.itemcode || '').trim()},`;
                oldPurchasePrices += `${it.POPurchasePrice},`;
                newPurchasePrices += `${effPrice(it)},`;
                newPurchaseAmounts += `${effAmount(it)},`;
                oldPurchaseAmounts += `${it.Amount},`;
                standardPrices += `${it.POStandardPrice},`;
                standardPriceAmounts += `${it.OldAmount},`;
                newPurchaseTotal += effAmount(it);
            } else if (amendType === 'Add') {
                newPurchaseTotal += effAmount(it);
            }
        });

        const plus = round2(plusTotal);
        const minus = round2(minusTotal);
        const payload = {
            PONo: d.PONo || row.PONo || '',
            AmendPONO: d.AmendPONO || row.AmendPONO || 0,
            RoleId: roleId,
            CreatedBy: userName,
            Action: action.value || action.text || action.type,
            Remarks: note,
            IndentNo: d.IndentNo || row.IndentNo || '',
            PlusAmount: plus,
            MinusAmount: minus,
            ReducedBudgetAmount: plus,
            ReturnBudgetAmount: minus,
            NewPurchasepriceTotal: newPurchaseTotal,
            Itemcodes: itemcodes,
            Indentlistids: ids,
            Standardprices: standardPrices,
            StandardpriceAmts: standardPriceAmounts,
            Purchaseprices: oldPurchasePrices,
            PurchasepriceAmts: oldPurchaseAmounts,
            NewPurchaseprices: newPurchasePrices,
            NewPurchasepriceAmts: newPurchaseAmounts,
            AmendDiffValue: round2(Math.abs(poPlusAmt - poMinusAmt)),
            RevisedValue: round2(num(d.OldPOValue) + poPlusAmt - poMinusAmt),
            AddedPO: round2(poPlusAmt),
            SubstractedPO: round2(poMinusAmt),
        };
        try {
            const status = await approveSupplierPOAmend(payload);
            // spApproveSupplierPOAmend answers "Submited"; anything else is the error text
            if (!isSubmitted(status)) {
                Alert.alert('Not submitted', status || 'Error Occurred');
                return;
            }
            showSubmitResult(`${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Supplier PO Amendment"
            subtitle={row?.PONo}
            icon={FileDiff}
            backHref={(ccType === 'NPCC' ? '/verification/supplier-po-amend/list?ccType=NPCC' : '/verification/supplier-po-amend/list') as Href}
            onRefresh={() => { setPriceEdits({}); setReloadKey((k) => k + 1); }}
        >
            {!row ? (
                <EmptyState title="Amendment not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the amendment" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={d.PONo || row.PONo}
                        amount={money(d.RevisedValue)}
                        amountLabel={`Revised PO value (was ${money(d.OldPOValue) || '₹0'})`}
                        chips={[d.VendorName || row.VendorName, d.CCType, d.SerialNo != null && `Amendment ${d.SerialNo}`,
                            num(d.PlusAmount) > 0 && `+${money(d.PlusAmount)}`, num(d.MinusAmount) > 0 && `−${money(d.MinusAmount)}`]}
                    />

                    <Section>
                        <FieldGrid
                            fields={[
                                ['Amend PO No', `${d.AmendPONO ?? row.AmendPONO}`],
                                ['Indent No', d.IndentNo || row.IndentNo],
                                ['Vendor Code', d.VendorCode],
                                ['Cost Center', [d.CCCode, d.CCName].filter(Boolean).join(' – ')],
                                ['Amend Date', d.AmendDate],
                                ['PO Date', d.PODate],
                                ['PO Expire Date', d.POExpireDate],
                                ['MRR Type', d.MRRType],
                                ['Reference', [d.RefNo, d.RefDate && `(${d.RefDate})`].filter(Boolean).join(' '), true],
                            ]}
                        />
                    </Section>

                    <Section title="Amendment value breakdown">
                        <FieldGrid
                            fields={[
                                ['Excess PO value (+)', money(d.PlusAmount)],
                                ['Reduced PO value (−)', money(d.MinusAmount)],
                                ['Old PO value', money(d.OldPOValue)],
                                ['Amend diff. value', money(d.AmendDiffValue)],
                                ['Revised value', money(d.RevisedValue)],
                                (num(d.AddedPO) > 0 || num(d.SubstractedPO) > 0) && ['Added / subtracted', `+${money(d.AddedPO)} / −${money(d.SubstractedPO)}`],
                            ]}
                        />
                    </Section>

                    {items.length ? (
                        <Section title={`Amended items (${items.length})`}>
                            {items.map((it, i) => {
                                const minus = isSubtract(it.AmendType);
                                return (
                                    <View key={String(it.IndentListId ?? i)} className={`py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                        <View className="flex-row items-start gap-3">
                                            <View className="flex-1">
                                                <Text className="text-[11px] font-mono text-brand-navy">{it.itemcode?.trim()}{it.HSNCode ? ` · HSN ${it.HSNCode}` : ''}</Text>
                                                <Text className="text-sm font-semibold text-gray-900">{it.itemname}</Text>
                                                {it.specification ? <Text className="text-[11px] text-gray-500 mt-0.5">{it.specification}</Text> : null}
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-sm font-bold text-gray-900">{money(effAmount(it))}</Text>
                                                {it.OldAmount != null && num(it.OldAmount) !== num(it.Amount) ? (
                                                    <Text className="text-[10px] text-gray-400">was {money(it.OldAmount)}</Text>
                                                ) : null}
                                            </View>
                                        </View>
                                        <View className="flex-row gap-2 mt-2">
                                            <View className="flex-1 rounded-lg bg-gray-50 px-2.5 py-1.5">
                                                <Text className="text-[10px] text-gray-400">Previous qty</Text>
                                                <Text className="text-xs font-semibold text-gray-800">{it.quantity ?? it.CurrentQty ?? '—'} {it.units}</Text>
                                            </View>
                                            <View className={`flex-1 rounded-lg px-2.5 py-1.5 ${minus ? 'bg-rose-50' : 'bg-green-50'}`}>
                                                <Text className="text-[10px] text-gray-400">{it.AmendType || 'Amend'}</Text>
                                                <Text className={`text-xs font-bold ${minus ? 'text-rose-700' : 'text-green-700'}`}>
                                                    {it.AmendQty ? `${minus ? '−' : '+'}${it.AmendQty}` : '—'}
                                                </Text>
                                            </View>
                                            <View className="flex-1 rounded-lg bg-indigo-50 px-2.5 py-1.5">
                                                <Text className="text-[10px] text-gray-400">Revised qty</Text>
                                                <Text className="text-xs font-bold text-brand-navy">{it.PONewQty ?? '—'}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-[11px] text-gray-500 mt-1.5">
                                            Quoted {money(it.POQuotedPrice) || '₹0'} · Std {money(it.basicprice || it.POStandardPrice) || '₹0'}
                                            {isNewItem(it) ? '' : ` · Purchase ${money(it.POPurchasePrice) || '₹0'}`}
                                            {it.CGSTPercent != null ? ` · CGST ${it.CGSTPercent}% · SGST ${it.SGSTPercent ?? 0}%` : ''}
                                            {it.ItemType ? ` · ${it.ItemType}` : ''}
                                        </Text>
                                        {isNewItem(it) ? (
                                            <View className="flex-row items-center justify-between mt-2">
                                                <Text className="text-[11px] text-gray-500">Purchase price (new item, lower only)</Text>
                                                <TextInput
                                                    value={priceEdits[String(it.IndentListId)] ?? String(it.POPurchasePrice ?? '')}
                                                    onChangeText={(v) => changePrice(it, v)}
                                                    keyboardType="decimal-pad"
                                                    selectTextOnFocus
                                                    className="w-28 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-right text-sm text-gray-900"
                                                />
                                            </View>
                                        ) : null}
                                        {it.ItemRemark ? <Text className="text-[11px] text-gray-500 mt-0.5">{it.ItemRemark}</Text> : null}
                                    </View>
                                );
                            })}
                        </Section>
                    ) : null}

                    {d.Remarks ? (
                        <Section title="PO terms & conditions">
                            {d.Remarks.split('|').filter((t) => t.trim()).map((t, i) => (
                                <Text key={i} className="text-xs text-gray-700 leading-5">• {t.trim()}</Text>
                            ))}
                        </Section>
                    ) : null}

                    <DocumentLinks
                        links={docs.filter((doc) => doc.Path).map((doc, i) => ({
                            label: `${doc.POType === 'Amend' ? `Amendment ${doc.POCount ?? ''}` : 'Original PO'} — ${getFileName(doc.Path) || `Document ${i + 1}`}`,
                            url: doc.POType === 'Amend' ? buildSupplierPOAmendUrl(doc.Path) : buildSupplierPOUrl(doc.Path),
                        }))}
                    />

                    <RemarksTimeline trno={d.AmendPONO ?? row.AmendPONO} moid={d.MOID} />
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        chkAmt={0}
                        showReturn={false}
                        confirmLabel="I have verified this Supplier PO amendment — quantity / price changes, value breakdown and documents"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
