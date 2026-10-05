// Indent Creation verification — mobile version of the web pages/Purchase/VerifyIndentCreation.jsx.
// The verifier's level (GetIndentLevels) decides the item view and what gets posted:
//   CSK → issue from old stock, PUM → issue new stock from a chosen CC (+ trade items),
//   CC / OTHER → read-only review. Every line must be ticked (except at PUM, as on the web).
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { SelectField } from '@/src/components/employee/FormControls';
import DetailSheet, { type SheetContent } from '@/src/components/common/DetailSheet';
import { useApiData } from '@/src/hooks/useApiData';
import {
    getIndentDetail,
    getIndentItems,
    getIndentLevels,
    getIndentNewStockCCs,
    getIndentSubtotal,
    indentRoleOf,
    verifyIndent,
    type IndentItem,
    type IndentRole,
    type IndentRow,
} from '@/src/api/verification/indentVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import IndentItemCard, { isAssetItem, n } from '@/src/components/verification/indent/IndentItemCard';
import StockSummaryBody from '@/src/components/verification/indent/StockSummaryBody';
import TradeIssueBody from '@/src/components/verification/indent/TradeIssueBody';

const ROLE_LABEL: Record<IndentRole, string> = {
    CSK: 'Stock Keeper (CSK)',
    PUM: 'Purchase Manager (PUM)',
    CC: 'Cost Centre Approval',
    OTHER: 'Senior Approver',
};

const DONE: Record<string, string> = { Reject: 'rejected', Return: 'returned', Approve: 'approved', Verify: 'verified' };

// The web maps the status button to Verify / Approve / Return / Reject from its text
const actionOf = (a: StatusAction) => {
    const t = (a.value || a.text || a.type || '').toLowerCase();
    return t.includes('reject') ? 'Reject' : t.includes('return') ? 'Return' : t.includes('approv') ? 'Approve' : 'Verify';
};

export default function IndentVerificationDetail() {
    const row = useRowParam<IndentRow>();
    const { roleId, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const [qtys, setQtys] = useState<Record<string, string>>({});
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [pumType, setPumType] = useState('');
    const [pumCC, setPumCC] = useState('');
    const [sheet, setSheet] = useState<SheetContent | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const indentno = row?.Indentno || '';

    const loadDetail = useCallback(() => getIndentDetail(indentno, roleId), [indentno, roleId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const detail = useApiData(indentno && roleId ? loadDetail : null);
    const d = detail.data;
    const moid = row?.MOID || row?.Moid || d?.MOID || 0;

    const loadLevels = useCallback(() => getIndentLevels(moid, roleId), [moid, roleId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const levels = useApiData(moid && roleId ? loadLevels : null);
    const role = indentRoleOf(levels.data);

    const loadItems = useCallback(
        () => getIndentItems(role!, indentno, roleId, role === 'PUM' ? { ccCode: pumCC, ccType: pumType } : undefined),
        [role, indentno, roleId, pumCC, reloadKey], // eslint-disable-line react-hooks/exhaustive-deps
    );
    const itemsData = useApiData(role ? loadItems : null);
    const items = itemsData.data ?? [];

    const loadSubtotal = useCallback(() => getIndentSubtotal(indentno), [indentno, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const subtotal = useApiData(indentno ? loadSubtotal : null).data ?? [];

    const loadCCs = useCallback(() => getIndentNewStockCCs(indentno, pumType), [indentno, pumType]);
    const ccList = useApiData(role === 'PUM' && pumType ? loadCCs : null);

    const openSheet = (content: SheetContent) => {
        setSheet(content);
        setSheetOpen(true);
    };

    const resetInputs = () => {
        setQtys({});
        setChecked({});
    };

    // Issued qty limits, as on the web: CSK ≤ raised; PUM ≤ balance (raised − old issued) and ≤ new stock
    const changeQty = (item: IndentItem, value: string) => {
        if (value !== '' && !/^\d*\.?\d{0,4}$/.test(value)) return;
        const v = n(value);
        let next = value;
        if (role === 'CSK' && v > n(item.Quantity)) {
            Alert.alert('Too much', `Issued qty cannot exceed raised qty (${item.Quantity}).`);
            next = String(n(item.Quantity));
        }
        if (role === 'PUM') {
            const balance = Math.max(0, n(item.Quantity) - n(item.IssuedQty));
            const newStock = n(item.AvailableQty);
            if (v > balance) {
                Alert.alert('Too much', `Cannot exceed balance qty (${balance}).`);
                next = String(balance);
            } else if (newStock > 0 && v > newStock) {
                Alert.alert('Too much', `Exceeds available new stock (${newStock}).`);
                next = String(newStock);
            }
        }
        setQtys((p) => ({ ...p, [item.IndentListId]: next }));
    };

    const allChecked = items.length > 0 && items.every((it) => checked[it.IndentListId]);

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        if ((role === 'CSK' || role === 'CC' || role === 'OTHER') && !allChecked) {
            Alert.alert('Please verify', 'Tick every item to confirm it has been checked.');
            return;
        }
        const act = actionOf(action);
        const base = { Rowid: d.Rowid || '', Indentno: row.Indentno, Remarks: note, Appstatus: act, RoleID: roleId, Createdby: userName };
        let payload: Record<string, unknown> = base;

        const nonAsset = items.filter((it) => !isAssetItem(it));
        const totalIssued = role === 'CSK' || role === 'PUM' ? nonAsset.reduce((s, it) => s + n(qtys[it.IndentListId]), 0) : 0;

        if ((role === 'CSK' || role === 'PUM') && act === 'Verify') {
            payload = {
                ...base,
                // Rowid carries the comma-separated IndentListIds at CSK / PUM
                Rowid: nonAsset.map((it) => `${it.IndentListId},`).join(''),
                Qtys: nonAsset.map((it) => `${n(qtys[it.IndentListId])},`).join(''),
                Basics: nonAsset.map((it) => `${n(it.BasicPrice)},`).join(''),
                Amts: nonAsset.map((it) => `${(n(it.BasicPrice) * Math.max(0, n(it.Quantity) - n(qtys[it.IndentListId]))).toFixed(2)},`).join(''),
                TotalQtys: String(totalIssued),
                ...(role === 'PUM' ? { FromCC: pumCC } : {}),
            };
        }

        try {
            await verifyIndent(payload);
            // On the web an Approve with issued qty jumps to Old / New Stock Issue — not in the app yet
            const next = act === 'Approve' && totalIssued > 0
                ? `\n\nNext: issue the stock from ${role === 'CSK' ? 'Old Stock Issue' : 'New Stock Issue'} on the Corex web app.`
                : '';
            Alert.alert('Done', `Indent ${DONE[act]} successfully.${next}`, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${act.toLowerCase()} indent`);
        }
    };

    const tradeCleared = () => setQtys((p) => Object.fromEntries(Object.keys(p).map((k) => [k, '0'])));

    return (
        <PortalScreen
            title="Indent Verification"
            subtitle={row?.Indentno}
            icon={ShoppingCart}
            backHref={'/verification/indent/list' as Href}
            onRefresh={() => { resetInputs(); setReloadKey((k) => k + 1); }}
        >
            {!row ? (
                <EmptyState title="Indent not found" subtitle="Go back and open it again from the list." />
            ) : detail.loading && !d ? (
                <LoadingText />
            ) : (
                <>
                    <DetailHero
                        title={row.Indentno}
                        amount={money(row.TotalAmount ?? d?.TotalAmount)}
                        amountLabel="Total amount"
                        chips={[row.Costcenter, row.CCType, role && ROLE_LABEL[role],
                            levels.data && `Level ${levels.data.IndentPresentLevel} / ${levels.data.IndentDefineLevel}`]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['Indent No', row.Indentno],
                                ['Date', row.Date],
                                ['Cost Centre', row.Costcenter],
                                ['CC Type', row.CCType],
                                ['Material', row.CapitalMaterialType?.trim()],
                                !!d?.IndentTypeDefine && ['Type Define', d.IndentTypeDefine],
                                !!levels.data && ['Role Level', `Present ${levels.data.IndentPresentLevel} · CSK ${levels.data.IndentDefineLevel} · PUM ${levels.data.NewItemDefineLevel ?? '—'}`, true],
                            ]}
                        />
                    </Section>

                    {role === 'PUM' ? (
                        <Section title="Issue new stock from">
                            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">CC Type</Text>
                            <SelectField
                                title="CC Type"
                                value={pumType}
                                options={[{ label: 'Performing', value: 'PCC' }, { label: 'Non-Performing', value: 'NPCC' }]}
                                onChange={(v) => { setPumType(v); setPumCC(''); resetInputs(); }}
                                placeholder="Select type"
                            />
                            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-3 mb-1">Issue From CC</Text>
                            <SelectField
                                title="Issue From CC"
                                value={pumCC}
                                disabled={!pumType || ccList.loading}
                                options={(ccList.data ?? []).map((c) => ({ label: c.CCVAL || c.CCID || '', value: c.CCID || '' }))}
                                onChange={(v) => { setPumCC(v); resetInputs(); }}
                                placeholder={!pumType ? 'Select CC type first' : ccList.loading ? 'Loading…' : (ccList.data?.length ? 'Select CC' : 'No CC available')}
                            />
                            {pumCC ? <Text className="text-[11px] text-violet-600 mt-2">New stock loaded for {pumCC}</Text> : null}
                        </Section>
                    ) : null}

                    <Section
                        title={`Indent items${items.length ? ` (${items.length})` : ''}`}
                        right={items.length ? (
                            <Text
                                onPress={() => setChecked(allChecked ? {} : Object.fromEntries(items.map((it) => [it.IndentListId, true])))}
                                className="text-xs font-semibold text-orange-600"
                            >
                                {allChecked ? 'Clear all' : 'Check all'}
                            </Text>
                        ) : null}
                    >
                        {levels.loading || itemsData.loading ? (
                            <LoadingText label={levels.loading ? 'Determining role level…' : 'Loading items…'} />
                        ) : !role ? (
                            <Text className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">Role level configuration not loaded yet.</Text>
                        ) : items.length === 0 ? (
                            <Text className="text-sm text-gray-400 text-center py-6">No items found for this indent.</Text>
                        ) : (
                            <>
                                <Text className="text-[11px] text-gray-500 mb-2">
                                    Tick each item once checked — {items.filter((it) => checked[it.IndentListId]).length}/{items.length} verified
                                </Text>
                                {items.map((it, i) => (
                                    <IndentItemCard
                                        key={it.IndentListId || i}
                                        item={it}
                                        index={i}
                                        role={role}
                                        checked={!!checked[it.IndentListId]}
                                        onToggle={() => setChecked((p) => ({ ...p, [it.IndentListId]: !p[it.IndentListId] }))}
                                        issuedQty={qtys[it.IndentListId] ?? '0'}
                                        onQtyChange={(v) => changeQty(it, v)}
                                        onStock={() => openSheet({
                                            title: 'Stock summary',
                                            subtitle: row.Costcenter,
                                            body: <StockSummaryBody itemCode={it.ItemCode?.trim() || ''} ccCode={row.Costcenter || ''} />,
                                        })}
                                        onTrade={() => openSheet({
                                            title: 'Trade issue',
                                            subtitle: '5-series trade item',
                                            tone: 'violet',
                                            body: (
                                                <TradeIssueBody
                                                    item={it}
                                                    costcenter={row.Costcenter || ''}
                                                    tradeCC={pumCC}
                                                    indentId={String(d?.MOID ?? '')}
                                                    userName={userName}
                                                    onIssued={(q) => setQtys((p) => ({ ...p, [it.IndentListId]: String(q) }))}
                                                    onAllCleared={tradeCleared}
                                                    onClose={() => setSheetOpen(false)}
                                                />
                                            ),
                                        })}
                                    />
                                ))}
                            </>
                        )}
                        {subtotal.length > 0 ? (
                            <View className="flex-row flex-wrap gap-x-4 gap-y-1 pt-2.5 mt-1 border-t border-gray-200">
                                {subtotal.map((s, i) => (
                                    <React.Fragment key={i}>
                                        {s.TotalAmount != null ? <Text className="text-xs text-gray-600">Sub total <Text className="font-bold text-brand-navy">{money(s.TotalAmount)}</Text></Text> : null}
                                        {n(s.IssueOldstockAmount) > 0 ? <Text className="text-xs text-gray-600">Issue CS <Text className="font-bold text-amber-600">{money(s.IssueOldstockAmount)}</Text></Text> : null}
                                        {n(s.IssueNewStockAmount) > 0 ? <Text className="text-xs text-gray-600">Issue new stock <Text className="font-bold text-green-600">{money(s.IssueNewStockAmount)}</Text></Text> : null}
                                        {n(s.NewPurchaseAmount) > 0 ? <Text className="text-xs text-gray-600">Purchase <Text className="font-bold text-purple-700">{money(s.NewPurchaseAmount)}</Text></Text> : null}
                                    </React.Fragment>
                                ))}
                            </View>
                        ) : null}
                    </Section>

                    <RemarksTimeline trno={row.Indentno} moid={moid || null} />
                    <ActionPanel
                        moid={moid || null}
                        roleId={roleId}
                        chkAmt={n(row.ChkAmt)}
                        showReturn
                        confirmLabel="I have reviewed this indent request — items, quantities and cost centre are correct"
                        onSubmit={submit}
                    />
                </>
            )}

            <DetailSheet visible={sheetOpen} sheet={sheet} onClose={() => setSheetOpen(false)} />
        </PortalScreen>
    );
}
