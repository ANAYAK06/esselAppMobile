// Building blocks the verification configs render through extra() — mobile versions of the Corex web
// pages/Accounts/verificationParts.jsx (Block, SimpleTable, CheckedItemsTable, RouteTableModal,
// WIPPartyEditor, ItemsTransferItemsTable, VendorCMSVerifyGrid) plus the editors that live in the web
// verificationConfigs.jsx (StoreCloseEditor, ItemCodeUpdationEditor). Wide web tables become one
// card per row; pop-ups open in the detail screen's bottom sheet.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { CheckCircle2, ChevronDown, ChevronRight, Circle, FileText, Info, Trash2 } from 'lucide-react-native';
import { useApiData } from '@/src/hooks/useApiData';
import { getRoute, listOf, postRoute, statusOf } from '@/src/api/verification/configVerificationAPI';
import { DateField, FormField, SelectField, TextField, toIsoDate } from '@/src/components/employee/FormControls';
import { CheckList, Section, money } from '@/src/components/verification/kit/VerificationKit';
import { brand } from '@/src/theme/colors';
import type { Rec } from './types';

// ---- Formatting --------------------------------------------------------------------------

export const fmt = (v: unknown) => (v != null && v !== '' ? money(v as number | string) ?? '' : '');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Dates the API hands back as DateTime.ToString() text; 'dd-MMM-yyyy' is not portable through Date()
const parseDate = (v: unknown): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
    const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(String(v).trim());
    const mi = m ? MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase()) : -1;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).trim());
    const dt = m && mi >= 0 ? new Date(Number(m[3]), mi, Number(m[1]))
        : iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
            : new Date(String(v));
    return Number.isNaN(dt.getTime()) || dt.getFullYear() < 1900 ? null : dt;
};
const pad = (n: number) => String(n).padStart(2, '0');
// 'dd-MMM-yyyy' for display / payloads, 'yyyy-mm-dd' for date fields
export const displayDate = (v: unknown) => {
    const dt = parseDate(v);
    return dt ? `${pad(dt.getDate())}-${MONTHS[dt.getMonth()]}-${dt.getFullYear()}` : (v as string) || null;
};
export const isoDate = (v: unknown) => {
    const dt = parseDate(v);
    return dt ? `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` : '';
};
export const todayIso = () => toIsoDate(new Date());

// "Role:Employee:Remarks||…" trails some records carry — first entry is the creator
export const splitTrail = (text: unknown) => String(text || '').split('||').filter(Boolean).map((t) => t.split(':'));

const isNode = (c: unknown) => React.isValidElement(c);
const cellText = (c: unknown) => (c === null || c === undefined || c === false ? '' : String(c));

// ---- Layout ------------------------------------------------------------------------------

export const Block = Section;

// Read-only table → one card per row: the first cell is the title, the rest label / value pairs.
// foot: the web's footer cells — the non-empty ones are shown as a total line.
export const SimpleTable = ({
    heads, rows, foot, empty = 'No records',
}: {
    heads: string[];
    rows: unknown[][];
    alignRight?: number[];
    foot?: unknown[];
    empty?: string;
}) => {
    const total = (foot || []).map(cellText).filter(Boolean);
    if (!rows.length) return <Text className="text-xs text-gray-400 py-3 text-center">{empty}</Text>;
    return (
        <View>
            {rows.map((row, ri) => {
                const [first, ...rest] = row;
                return (
                    <View key={ri} className={`py-2.5 ${ri ? 'border-t border-gray-100' : ''}`}>
                        {heads.length === 1 ? (
                            <Text className="text-xs text-gray-800 leading-5">{cellText(first) || '—'}</Text>
                        ) : (
                            <>
                                {heads[0] ? <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{heads[0]}</Text> : null}
                                {isNode(first) ? first as React.ReactNode : (
                                    <Text className="text-sm font-semibold text-gray-900">{cellText(first) || '—'}</Text>
                                )}
                                <View className="flex-row flex-wrap mt-1 -mx-1">
                                    {rest.map((c, ci) => {
                                        if (isNode(c)) return <View key={ci} className="px-1 py-0.5">{c as React.ReactNode}</View>;
                                        const text = cellText(c);
                                        if (!text) return null;
                                        const label = heads[ci + 1];
                                        return (
                                            <Text key={ci} className="px-1 py-0.5 text-[11px] text-gray-700">
                                                {label ? <Text className="text-gray-400">{label} </Text> : null}{text}
                                            </Text>
                                        );
                                    })}
                                </View>
                            </>
                        )}
                    </View>
                );
            })}
            {total.length ? (
                <View className="flex-row justify-end gap-2 pt-2.5 border-t border-gray-200">
                    <Text className="text-xs font-bold text-emerald-600 text-right">{total.join('  ')}</Text>
                </View>
            ) : null}
        </View>
    );
};

export const TableBlock = ({ title, ...props }: { title: string } & React.ComponentProps<typeof SimpleTable>) => (
    <Block title={title}><SimpleTable {...props} /></Block>
);

export const DocButton = ({ label, url }: { label: string; url: string | null }) => (url ? (
    <TouchableOpacity
        onPress={() => Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the document'))}
        activeOpacity={0.85}
        className="flex-row items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 mb-4"
    >
        <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center"><FileText size={16} color={brand.navy} /></View>
        <Text className="flex-1 text-sm font-semibold text-gray-800">{label}</Text>
        <ChevronRight size={16} color={brand.orange} />
    </TouchableOpacity>
) : null);

export const Alarm = ({ text }: { text: string }) => (
    <View className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4">
        <Text className="text-xs text-red-700 leading-5">{text}</Text>
    </View>
);

// ---- Items the verifier ticks (web CheckedItemsTable) ------------------------------------

export type Column = {
    label: string;
    render: (item: Rec) => React.ReactNode;
    align?: 'left' | 'right';      // 'left' = long text (name, spec) → its own line
    link?: boolean;                // tapping it opens onItemPress (a breakup pop-up)
};

export const allItemsChecked = (items: unknown[] | null | undefined, ext: Rec) =>
    !!items && items.length > 0 && items.every((_, i) => (ext.checked || {})[i]);

export const CheckedItems = ({
    title, items, columns, ext, setExt, footer, onItemPress, tone,
}: {
    title: string;
    items: Rec[];
    columns: Column[];
    ext: Rec;
    setExt: (update: (prev: Rec) => Rec) => void;
    footer?: React.ReactNode;
    onItemPress?: (item: Rec) => void;
    tone?: (item: Rec) => string | null;   // small badge per row (e.g. MANUFACTURE / STOCK)
}) => {
    if (!items.length) {
        return <Block title={title}><Text className="text-xs text-gray-400 py-3 text-center">No items found</Text></Block>;
    }
    const [first, ...rest] = columns;
    return (
        <CheckList
            title={title}
            items={items}
            checked={ext.checked || {}}
            onChange={(next) => setExt((p) => ({ ...p, checked: next }))}
            footer={footer}
            renderItem={(it) => {
                const badge = tone?.(it);
                const head = first.render(it);
                return (
                    <View>
                        <View className="flex-row items-center gap-2">
                            {first.link && onItemPress ? (
                                <TouchableOpacity onPress={() => onItemPress(it)} hitSlop={6} className="flex-row items-center gap-1">
                                    <Text className="text-sm font-semibold text-orange-600">{cellText(head)}</Text>
                                    <Info size={13} color={brand.orange} />
                                </TouchableOpacity>
                            ) : (
                                <Text className="text-sm font-semibold text-gray-900">{isNode(head) ? null : cellText(head)}</Text>
                            )}
                            {badge ? <Text className="text-[10px] font-semibold text-brand-navy bg-indigo-50 px-1.5 py-0.5 rounded">{badge}</Text> : null}
                        </View>
                        {rest.filter((c) => c.align === 'left').map((c) => {
                            const v = cellText(c.render(it));
                            return v ? <Text key={c.label} className="text-xs text-gray-600 mt-0.5">{v}</Text> : null;
                        })}
                        <View className="flex-row flex-wrap mt-1 -mx-1">
                            {rest.filter((c) => c.align !== 'left').map((c) => {
                                const v = c.render(it);
                                if (isNode(v)) {
                                    return (
                                        <View key={c.label} className="w-full px-1 py-1">
                                            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{c.label}</Text>
                                            {v}
                                        </View>
                                    );
                                }
                                const text = cellText(v);
                                return text ? (
                                    <Text key={c.label} className="px-1 py-0.5 text-[11px] text-gray-700">
                                        <Text className="text-gray-400">{c.label} </Text>{text}
                                    </Text>
                                ) : null;
                            })}
                        </View>
                    </View>
                );
            }}
        />
    );
};

export const TotalLine = ({ label = 'Total', value }: { label?: string; value: React.ReactNode }) => (
    <View className="flex-row justify-between pt-2.5 border-t border-gray-200 mt-1">
        <Text className="text-xs font-bold text-gray-700">{label}</Text>
        <Text className="text-xs font-bold text-emerald-600">{value}</Text>
    </View>
);

// ---- Pop-up tables (web RouteTableModal / TradeItemSummaryModal) ---------------------------

export const RouteTable = ({ route, params, heads, row }: {
    route: string;
    params: Rec;
    heads: string[];
    row: (x: Rec) => unknown[];
}) => {
    const key = JSON.stringify(params);
    const load = useCallback(() => getRoute(route, JSON.parse(key)).then(listOf), [route, key]);
    const { data, loading } = useApiData(load);
    if (loading && !data) return <ActivityIndicator color={brand.orange} style={{ paddingVertical: 24 }} />;
    return <SimpleTable heads={heads} rows={(data ?? []).map(row)} />;
};

// Item → MRR breakup (legacy TradeItemCodeSummaryPopup and its siblings)
export const stockBreakupSheet = (itemCode: string, route: string, params: Rec) => ({
    title: `Item ${itemCode}`,
    subtitle: 'Stock breakup',
    body: (
        <RouteTable
            route={route}
            params={params}
            heads={['MRR No', 'Item Code', 'Units', 'Basic Price', 'Quantity', 'Amount']}
            row={(r) => [r.TMrrs, r.Pitemcode, r.Punits, fmt(r.pbasicpric), r.pquantity, fmt(r.pamount)]}
        />
    ),
});

// ---- Work In Progress resubmit: Client → Sub Client → PO for a fixed cost center ----------

export const WIPPartyEditor = ({ ccCode, wpId, values, setValues }: {
    ccCode: string;
    wpId: unknown;
    values: Rec;
    setValues: (update: (prev: Rec) => Rec) => void;
}) => {
    const client = values.Clientcode || '';
    const subClient = values.SubClientcode || '';
    const loadClients = useCallback(() => getRoute('Accounts/GetClientsbyCCForWorkProgress', { CCCode: ccCode }).then(listOf), [ccCode]);
    const loadSubs = useCallback(() => getRoute('Accounts/GetSubClientsbyClientForWP', { CCCode: ccCode, clientcode: client }).then(listOf), [ccCode, client]);
    // Passing the entry's Id keeps its own PO in the list
    const loadPos = useCallback(
        () => getRoute('Accounts/GetClientPOforWP', { CCCode: ccCode, Client: client, SubClient: subClient, Id: wpId }).then(listOf),
        [ccCode, client, subClient, wpId],
    );
    const clients = useApiData(loadClients).data ?? [];
    const subs = useApiData(client ? loadSubs : null).data ?? [];
    const pos = useApiData(client && subClient ? loadPos : null).data ?? [];

    return (
        <View>
            <FormField label="Client" required>
                <SelectField
                    title="Client"
                    value={client}
                    options={clients.map((c) => ({ value: String(c.ClientCode), label: c.ClientName }))}
                    onChange={(v) => setValues((p) => ({ ...p, Clientcode: v, SubClientcode: '', PONumber: '' }))}
                />
            </FormField>
            <FormField label="Sub Client" required>
                <SelectField
                    title="Sub Client"
                    value={subClient}
                    options={client ? subs.map((s) => ({ value: String(s.SubClientCode), label: s.SubClientCodename })) : []}
                    onChange={(v) => setValues((p) => ({ ...p, SubClientcode: v, PONumber: '' }))}
                />
            </FormField>
            <FormField label="PO Number" required>
                <SelectField
                    title="PO Number"
                    value={values.PONumber || ''}
                    options={client && subClient ? pos.map((po) => ({ value: String(po.PONumber), label: String(po.PONumber) })) : []}
                    onChange={(v) => setValues((p) => ({ ...p, PONumber: v }))}
                />
            </FormField>
        </View>
    );
};

// ---- Items Transfer (legacy VerifyItemsTransferView / ViewItemTransferDetailsGridView) --------
// Below the define level (central store keeper) the verifier only ticks items; at the define level
// they pick a depreciation % per asset; above it the CSK % is pre-selected and can be changed.
// Item codes starting with "1" are consumables (no depreciation).
export const itemsTransferIsConsumable = (it: Rec) => String(it.ItemCode || '').trim().startsWith('1');

// Options from the configured max depreciation %: from the central store 10…max (100 = "FullValue"), else max…100
export const itemsTransferDepOptions = (maxPercent: unknown, fromCC: unknown, centralStoreCC: unknown) => {
    const no = Math.floor((Number(maxPercent) || 0) / 10);
    if (no <= 0) return [];
    const opt = (v: number) => ({ value: String(v), label: v >= 100 ? 'FullValue' : String(v) });
    if (fromCC === centralStoreCC) {
        if (no === 10) return [...Array.from({ length: 9 }, (_, i) => opt((i + 1) * 10)), opt(100)];
        return Array.from({ length: no }, (_, i) => opt((i + 1) * 10));
    }
    if (no === 10) return [opt(100)];
    return Array.from({ length: 10 - no + 1 }, (_, i) => opt((no + i) * 10));
};

// Selected % for a row: the verifier's pick, else (above the define level) the stored CSK %
export const itemsTransferDep = (it: Rec, ext: Rec, above: boolean): string => {
    const picked = (ext.dep || {})[it.ItId];
    if (picked !== undefined) return picked;
    if (!above || it.CskPercent == null || it.CskPercent === '') return '';
    return it.CskPercent === 'Full Value' ? '100' : String(parseInt(it.CskPercent, 10));
};

const itemsTransferAfterDep = (it: Rec, ext: Rec, above: boolean) => {
    const base = above ? it.CskDep : it.AfterDep;
    if (itemsTransferIsConsumable(it) || (ext.dep || {})[it.ItId] === undefined) return base;
    const dep = (ext.dep || {})[it.ItId];
    if (dep === '') return '';
    if (Number(dep) === 100) return 0;
    return ((Number(it.Amount) || 0) * (100 - Number(dep))) / 100;
};

export const ItemsTransferItems = ({ items, levels, depOptions, ext, setExt }: {
    items: Rec[];
    levels: Rec;
    depOptions: { value: string; label: string }[];
    ext: Rec;
    setExt: (update: (prev: Rec) => Rec) => void;
}) => {
    const present = Number(levels.IndentPresentLevel);
    const define = Number(levels.IndentDefineLevel);
    const atOrAbove = present >= define;
    const above = present > define;
    const depSelect = (it: Rec) => (itemsTransferIsConsumable(it) ? null : (
        <SelectField
            title={`${above ? 'CSK %' : 'Depreciation'} — ${it.ItemCode}`}
            value={itemsTransferDep(it, ext, above)}
            options={depOptions}
            onChange={(v) => setExt((p) => ({ ...p, dep: { ...(p.dep || {}), [it.ItId]: v } }))}
        />
    ));
    const sumTotal = items.reduce((a, it) => a + (Number(it.Amount) || 0), 0);
    const depTotal = items.reduce((a, it) => a + (itemsTransferIsConsumable(it) ? 0 : Number(itemsTransferAfterDep(it, ext, above)) || 0), 0);
    const columns: Column[] = [
        { label: 'Item Code', render: (it) => it.ItemCode },
        { label: 'Item Name', render: (it) => it.ItemName, align: 'left' },
        { label: 'Specification', render: (it) => it.Specification, align: 'left' },
        { label: 'DCA', render: (it) => it.DcaCode },
        { label: 'Sub DCA', render: (it) => it.SubDcaCode },
        ...(atOrAbove ? [{ label: 'Basic', render: (it: Rec) => fmt(it.Basic) }] : []),
        { label: 'Units', render: (it) => it.Units },
        { label: 'Issued Qty', render: (it) => it.IssQuantity },
        { label: 'Status', render: (it) => it.ItemStatus },
        ...(atOrAbove ? [
            { label: above ? 'Amount' : 'Before Dep.', render: (it: Rec) => fmt(it.Amount) },
            { label: above ? 'CSK Depreciation' : 'Depreciation Value', render: (it: Rec) => fmt(itemsTransferAfterDep(it, ext, above)) },
            { label: above ? 'CSK %' : 'Depreciation %', render: depSelect },
        ] : []),
    ];
    return (
        <CheckedItems
            title="Transfer Items"
            items={items}
            columns={columns}
            ext={ext}
            setExt={setExt}
            footer={atOrAbove ? (
                <View>
                    <TotalLine label="Sum total" value={fmt(sumTotal) || '0'} />
                    <TotalLine label="After depreciation" value={fmt(depTotal) || '0'} />
                </View>
            ) : null}
        />
    );
};

// Legacy ApproveItemstransferDetails payload for the define level and above (CSV lists end with a comma),
// kept as legacy computes it, including resetting the before / after sums when a row is at full value
export const itemsTransferApprovalAtDefine = (items: Rec[], ext: Rec, above: boolean, action: string) => {
    let rowIds = '';
    let deps = '';
    let depAmounts = '';
    let amount = 0;
    let effAmount = 0;
    let sumBefore = 0;
    let sumAfter = 0;
    const reject = String(action).toLowerCase() === 'reject';
    items.forEach((it) => {
        rowIds += `${it.ItId},`;
        if (itemsTransferIsConsumable(it)) return;
        const value = Number(it.Amount) || 0;
        const dep = itemsTransferDep(it, ext, above);
        if (Number(dep) !== 100) {
            const pct = Number(dep) || 0;
            deps += `${dep},`;
            depAmounts += `${value - (value * pct) / 100},`;
            if (reject) {
                amount = 0; effAmount = 0; sumBefore = 0; sumAfter = 0;
            } else {
                amount += value - (value * pct) / 100;
                effAmount += (value * pct) / 100;
                sumBefore += value;
                sumAfter += Number(itemsTransferAfterDep(it, ext, above)) || 0;
            }
        } else {
            depAmounts += '0,';
            deps += 'Full Value,';
            if (reject) amount = 0; else amount += value;
            sumBefore = 0;
            sumAfter = 0;
        }
    });
    return { rowIds, deps, depAmounts, amount, effAmount, sumBefore, sumAfter };
};

// ---- Vendor CMS Payment (legacy ViewCMSPaymentAddedVerificationData / …InnerData) ---------
// Vendors in the CMS batch, each expandable to its invoices. The verifier ticks the vendors to pay
// (ext.cmsVendors) and may drop a ticked invoice from the batch (RemoveCMSSingleVerInvoices).
export const VendorCMSVerifyGrid = ({ tranNo, ext, setExt }: {
    tranNo: string;
    ext: Rec;
    setExt: (update: (prev: Rec) => Rec) => void;
}) => {
    const [reload, setReload] = useState(0);
    const [open, setOpen] = useState<string | null>(null);
    const [invTicks, setInvTicks] = useState<Record<string, boolean>>({});
    const [busy, setBusy] = useState(false);
    const loadVendors = useCallback(
        () => getRoute('Purchase/ViewCMSPaymentAddedVerificationData', { Trno: tranNo }).then(listOf),
        [tranNo, reload], // eslint-disable-line react-hooks/exhaustive-deps
    );
    const loadInvoices = useCallback(
        () => getRoute('Purchase/ViewCMSPaymentAddedVerificationInnerData', { Vendorcode: open, TranNo: tranNo }).then(listOf),
        [open, tranNo, reload], // eslint-disable-line react-hooks/exhaustive-deps
    );
    const { data: vendors } = useApiData(loadVendors);
    const { data: invData, loading: invLoading } = useApiData(open ? loadInvoices : null);
    const invoices = invData ?? [];
    const ticks = ext.cmsVendors || {};

    const remove = async (inv: Rec) => {
        if (!invTicks[inv.Id]) return Alert.alert('Remove invoice', 'Tick the invoice first to remove it.');
        setBusy(true);
        try {
            const st = statusOf(await postRoute('Purchase/RemoveCMSSingleVerInvoices', {
                RID: String(inv.Id), VendorCode: inv.VendorCode, Veninvid: String(inv.Veninvid), TransactionNo: inv.TransactionNo || tranNo,
            }));
            if (/^Submitt?ed$/.test(st)) {
                Alert.alert('Done', 'Removed successfully');
                setInvTicks({});
                setReload((k) => k + 1);
            } else {
                Alert.alert('Error', st || 'Error occurred while deleting the item');
            }
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Error occurred while deleting the item');
        } finally {
            setBusy(false);
        }
    };

    if (!vendors) return <Block title="Vendors"><ActivityIndicator color={brand.orange} style={{ paddingVertical: 16 }} /></Block>;
    const total = vendors.reduce((a, v) => a + (Number(v.BasicBalance) || 0), 0);
    return (
        <Block title="Vendors">
            <Text className="text-[11px] text-gray-500 mb-1">Tick the vendors to pay; expand a vendor to review or remove its invoices.</Text>
            {!vendors.length ? <Text className="text-xs text-gray-400 py-3 text-center">No vendors in this payment</Text> : null}
            {vendors.map((v) => {
                const isOpen = open === v.VendorCode;
                return (
                    <View key={v.VendorCode} className="border-t border-gray-100">
                        <View className="flex-row items-center gap-2 py-2.5">
                            <TouchableOpacity
                                hitSlop={8}
                                onPress={() => setExt((p) => ({ ...p, cmsVendors: { ...(p.cmsVendors || {}), [v.VendorCode]: !(p.cmsVendors || {})[v.VendorCode] } }))}
                            >
                                {ticks[v.VendorCode] ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#d1d5db" />}
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 flex-row items-center gap-2" onPress={() => { setOpen(isOpen ? null : v.VendorCode); setInvTicks({}); }}>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-900">{v.VendorName}</Text>
                                    <Text className="text-[11px] text-gray-500">{v.VendorCode}</Text>
                                </View>
                                <Text className="text-sm font-bold text-brand-navy">{fmt(v.BasicBalance)}</Text>
                                {isOpen ? <ChevronDown size={16} color={brand.orange} /> : <ChevronRight size={16} color={brand.orange} />}
                            </TouchableOpacity>
                        </View>
                        {isOpen ? (
                            <View className="bg-gray-50 rounded-xl px-3 mb-2">
                                {invLoading && !invData ? <ActivityIndicator color={brand.orange} style={{ paddingVertical: 12 }} /> : null}
                                {!invLoading && !invoices.length ? <Text className="text-xs text-gray-400 py-3 text-center">No invoices</Text> : null}
                                {invoices.map((inv, i) => (
                                    <View key={inv.Id} className={`flex-row items-center gap-2 py-2.5 ${i ? 'border-t border-gray-200' : ''}`}>
                                        <TouchableOpacity hitSlop={8} onPress={() => setInvTicks((p) => ({ ...p, [inv.Id]: !p[inv.Id] }))}>
                                            {invTicks[inv.Id] ? <CheckCircle2 size={18} color="#16a34a" /> : <Circle size={18} color="#d1d5db" />}
                                        </TouchableOpacity>
                                        <View className="flex-1">
                                            <Text className="text-xs font-semibold text-gray-900">{inv.Invoiceno}</Text>
                                            <Text className="text-[11px] text-gray-500">{[inv.CCCode, inv.InvoiceDate, inv.PoNo && `PO ${inv.PoNo}`].filter(Boolean).join(' · ')}</Text>
                                        </View>
                                        <Text className="text-xs font-bold text-gray-800">{fmt(inv.BasicBalance)}</Text>
                                        <TouchableOpacity disabled={busy} onPress={() => remove(inv)} className="p-1.5 rounded-lg bg-red-600" style={{ opacity: busy ? 0.5 : 1 }}>
                                            <Trash2 size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </View>
                );
            })}
            {vendors.length ? <TotalLine value={fmt(total)} /> : null}
        </Block>
    );
};

// ---- Store Closing (legacy VerifyStoreClosingView) ----------------------------------------
// Reschedule (type 3) defaults to today, between the requested closing date and 30 days out; suspend
// types (2, 4) keep the requested window, never earlier than the requested start. ISO dates.
export const storeCloseBounds = (d: Rec) => ({
    today: todayIso(),
    plus30: toIsoDate(new Date(Date.now() + 30 * 86400000)),
    closeMin: isoDate(d.SCCClosingDate),
    startMin: isoDate(d.SCCStartDate),
});
export const storeCloseValues = (d: Rec, ext: Rec) => {
    const { today, closeMin } = storeCloseBounds(d);
    const type = String(d.SClosingTypeid);
    const defClose = type === '3' ? (closeMin && closeMin > today ? closeMin : today) : isoDate(d.SCCClosingDate);
    return {
        closingDate: (ext.closingDate ?? defClose) as string,
        startDate: (ext.startDate ?? isoDate(d.SCCStartDate)) as string,
        endDate: (ext.endDate ?? isoDate(d.SCCEndDate)) as string,
        alertNote: (ext.alertNote ?? (d.SAlertnote || '')) as string,
    };
};
export const StoreCloseEditor = ({ d, ext, setExt }: { d: Rec; ext: Rec; setExt: (update: (prev: Rec) => Rec) => void }) => {
    const type = String(d.SClosingTypeid);
    const v = storeCloseValues(d, ext);
    const { closeMin, startMin } = storeCloseBounds(d);
    const set = (k: string) => (val: string) => setExt((p) => ({ ...p, [k]: val }));
    return (
        <Block title="Closing details">
            {type === '1' ? (
                <FormField label="Closing Date"><Text className="text-sm font-semibold text-gray-800">{displayDate(v.closingDate) || '—'}</Text></FormField>
            ) : null}
            {type === '3' ? (
                <FormField label="Closing Date" hint="Up to 30 days from today">
                    <DateField title="Closing Date" value={v.closingDate} onChange={set('closingDate')} minDate={closeMin || undefined} />
                </FormField>
            ) : null}
            {type === '2' || type === '4' ? (
                <>
                    <FormField label="Store Suspend Start Date">
                        <DateField title="Start Date" value={v.startDate} onChange={set('startDate')} minDate={startMin || undefined} />
                    </FormField>
                    <FormField label="Store Suspend End Date">
                        <DateField title="End Date" value={v.endDate} onChange={set('endDate')} minDate={v.startDate || startMin || undefined} />
                    </FormField>
                </>
            ) : null}
            <FormField label="Alert Note" required>
                <TextField value={v.alertNote} onChangeText={set('alertNote')} maxLength={50} autoCapitalize="characters" />
            </FormField>
        </Block>
    );
};

// ---- Item Code Updation (legacy VerifyItemCodeUpdationView) -------------------------------
// ext holds the verifier's edits; untouched fields fall back to the request
export const itemCodeUpdValues = (d: Rec, ext: Rec) => ({
    Itemname: (ext.Itemname ?? (d.Itemname || '')) as string,
    Basicprice: (ext.Basicprice ?? (d.Basicprice != null ? String(d.Basicprice) : '')) as string,
    HSNCode: (ext.HSNCode ?? (d.HSNCode != null ? String(d.HSNCode) : '')) as string,
    Specification: (ext.Specification ?? (d.Specification || '')) as string,
    Units: (ext.Units ?? (d.Units != null ? String(d.Units) : '')) as string,
});
export const ItemCodeUpdationEditor = ({ d, aux, ext, setExt }: { d: Rec; aux: Rec; ext: Rec; setExt: (update: (prev: Rec) => Rec) => void }) => {
    const v = itemCodeUpdValues(d, ext);
    const hsn: Rec[] = Array.isArray(aux.icuHsn) ? aux.icuHsn : [];
    const units: Rec[] = Array.isArray(aux.icuUnits) ? aux.icuUnits : [];
    const set = (k: string, filter?: RegExp) => (val: string) => {
        if (filter && val !== '' && !filter.test(val)) return;
        setExt((p) => ({ ...p, [k]: val }));
    };
    return (
        <Block title="Requested changes (editable)">
            <FormField label="Item Code"><Text className="text-sm font-semibold text-gray-800">{d.ItemCode || '—'}</Text></FormField>
            <FormField label="Item Name" required>
                <TextField value={v.Itemname} onChangeText={set('Itemname')} autoCapitalize="characters" />
            </FormField>
            <FormField label="Basic Price" required>
                <TextField value={v.Basicprice} onChangeText={set('Basicprice', /^\d*\.?\d{0,2}$/)} keyboardType="decimal-pad" />
            </FormField>
            <FormField label="HSN Code" required>
                <SelectField title="HSN Code" value={v.HSNCode} options={hsn.map((h) => ({ value: String(h.HSNID), label: String(h.HSNCode) }))} onChange={set('HSNCode')} />
            </FormField>
            <FormField label="Specification" required>
                <TextField value={v.Specification} onChangeText={set('Specification')} />
            </FormField>
            <FormField label="Units" required>
                <SelectField title="Units" value={v.Units} options={units.map((u) => ({ value: String(u.Unitsval), label: String(u.Unitstext) }))} onChange={set('Units')} />
            </FormField>
        </Block>
    );
};
