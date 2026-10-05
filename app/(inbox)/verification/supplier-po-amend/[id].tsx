// Supplier PO Amendment verification — value breakdown, amended lines, documents, then
// verify / approve (web: pages/SupplierPO/VerifySupplierPOAmend.jsx). Read-only: the amended
// purchase price / amount are sent back as both the current and the "new" values, as on the web.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { FileDiff } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveSupplierPOAmend,
    getPOUploadedDocs,
    getSupplierPOAmendDetail,
    type SupplierPOAmendRow,
} from '@/src/api/verification/supplierPOVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildSupplierPOAmendUrl, buildSupplierPOUrl, getFileName } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
const isSubtract = (t?: string) => (t || '').toLowerCase() === 'substract';

export default function SupplierPOAmendDetailScreen() {
    const row = useRowParam<SupplierPOAmendRow>();
    const { roleId, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getSupplierPOAmendDetail(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const loadDocs = useCallback(() => getPOUploadedDocs(row!.PONo), [row]);
    const docs = useApiData(row ? loadDocs : null).data ?? [];
    const items = d?.lstItems ?? [];

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        const payload = {
            PONo: d.PONo || row.PONo,
            AmendPONO: d.AmendPONO || row.AmendPONO || 0,
            RoleId: roleId,
            CreatedBy: userName,
            Action: action.value || action.text || action.type,
            Remarks: appendApprovalComment(d.Remarks, roleCode || 'Supplier PO Amend Verifier', userName, note),
            IndentNo: d.IndentNo || row.IndentNo || '',
            PlusAmount: d.PlusAmount || 0,
            MinusAmount: d.MinusAmount || 0,
            ReducedBudgetAmount: d.ReducedBudgetAmount || 0,
            ReturnBudgetAmount: d.ReturnBudgetAmount || 0,
            NewPurchasepriceTotal: d.NewPurchasepriceTotal || 0,
            Itemcodes: items.map((it) => `${it.itemcode},`).join(''),
            Indentlistids: items.map((it) => `${it.IndentListId},`).join(''),
            Standardprices: items.map((it) => `${it.basicprice || 0},`).join(''),
            StandardpriceAmts: items.map((it) => `${it.OldAmount || 0},`).join(''),
            Purchaseprices: items.map((it) => `${it.POPurchasePrice || 0},`).join(''),
            PurchasepriceAmts: items.map((it) => `${it.Amount || 0},`).join(''),
            // The SP returns the amended price / amount as POPurchasePrice / Amount; with no price
            // editing here, "new" equals the amended values
            NewPurchaseprices: items.map((it) => `${it.POPurchasePrice || 0},`).join(''),
            NewPurchasepriceAmts: items.map((it) => `${it.Amount || 0},`).join(''),
            AmendDiffValue: d.AmendDiffValue || 0,
            RevisedValue: d.RevisedValue || 0,
            AddedPO: d.AddedPO || 0,
            SubstractedPO: d.SubstractedPO || 0,
        };
        try {
            const status = await approveSupplierPOAmend(payload);
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Supplier PO Amendment"
            subtitle={row?.PONo}
            icon={FileDiff}
            backHref={'/verification/supplier-po-amend/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
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
                                                <Text className="text-sm font-bold text-gray-900">{money(it.Amount)}</Text>
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
                                            Quoted {money(it.POQuotedPrice) || '₹0'} · Std {money(it.basicprice || it.POStandardPrice) || '₹0'} · Purchase {money(it.POPurchasePrice) || '₹0'}
                                            {it.CGSTPercent != null ? ` · CGST ${it.CGSTPercent}% · SGST ${it.SGSTPercent ?? 0}%` : ''}
                                        </Text>
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
                        chkAmt={num(d.RevisedValue)}
                        showReturn
                        confirmLabel="I have verified this Supplier PO amendment — quantity / price changes, value breakdown and documents"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}
