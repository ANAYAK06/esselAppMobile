// Cards shared by several department dashboards — mobile versions of the web's welcome banner,
// ApprovalsCard.jsx, RecentTransactionsCard.jsx and useSalesPurchaseMetrics.js. The web's
// "Quick access" card lists web-only screens, so on mobile its place is taken by the
// approvals inbox, which is what a role user acts on from the phone.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AlertTriangle, ArrowLeft, CheckCircle, ChevronRight, Clock, Inbox, ListChecks } from 'lucide-react-native';
import { useAppSelector } from '@/src/store/hooks';
import { selectTotalPendingCount } from '@/src/slice/notifications/inboxNotificationsSlice';
import {
    getRejectedData,
    getTrackingData,
    getTrackingNos,
    getTrackingValues,
    getTransactionLog,
    type RejectedRow,
    type Scope,
    type TrackingValue,
} from '@/src/api/dashboard/roleDashboardAPI';
import { useApiData } from '@/src/hooks/useApiData';
import { brand } from '@/src/theme/colors';
import { useRoleDashboard, useScopedData } from './RoleDashboardContext';
import { Card, EmptyText, Pill, Spinner, plural, rupees } from './DashboardUI';

// ---- Dates (YYYY-MM-DD, device local time — the app is used in IST) -----------------------

const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const monthRange = (offset: number): [string, string] => {
    const now = new Date();
    return [ymd(new Date(now.getFullYear(), now.getMonth() + offset, 1)), ymd(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0))];
};

export const todayLabel = () =>
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

// ---- Welcome -----------------------------------------------------------------------------

export const WelcomeCard = ({ name, roleCode, department }: { name?: string; roleCode?: string; department?: string }) => (
    <LinearGradient
        colors={[brand.navy, brand.navyDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 18, marginBottom: 16 }}
    >
        <Text className="text-xl font-bold text-white">Welcome Back{name ? `, ${name}` : ''}!</Text>
        <Text className="text-sm text-orange-200 mt-1">Role: {roleCode || '—'}</Text>
        {department ? (
            <View className="flex-row mt-3">
                <View className="px-2.5 py-1 rounded-full bg-white/10 border border-orange-400/30">
                    <Text className="text-[11px] font-semibold text-orange-300">{department} dashboard</Text>
                </View>
            </View>
        ) : null}
    </LinearGradient>
);

// ---- Approvals inbox ---------------------------------------------------------------------

export const InboxCard = () => {
    const pending = useAppSelector(selectTotalPendingCount) || 0;
    return (
        <TouchableOpacity
            onPress={() => router.push('/inbox')}
            activeOpacity={0.8}
            className="flex-row items-center gap-3 bg-white rounded-2xl border border-orange-200 p-4 mb-4"
        >
            <View className="w-11 h-11 rounded-xl bg-brand-navy items-center justify-center">
                <Inbox size={20} color={brand.orangeLight} />
                {pending > 0 && (
                    <View className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 items-center justify-center">
                        <Text className="text-[10px] font-bold text-white">{pending > 99 ? '99+' : pending}</Text>
                    </View>
                )}
            </View>
            <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">Approvals Inbox</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                    {pending > 0 ? `${plural(pending, 'item')} waiting for your action` : "You're all caught up"}
                </Text>
            </View>
            <ChevronRight size={18} color={brand.orange} />
        </TouchableOpacity>
    );
};

// ---- Approvals (pending chain + rejected) ------------------------------------------------

// Step 1 transaction type → step 2 role in its approval chain → step 3 that role's records
function PendingFlowBody({ values }: { values: TrackingValue[] }) {
    const { scope, ccCodes, groupId } = useRoleDashboard();
    const [moid, setMoid] = useState<number | null>(null);
    const [role, setRole] = useState<{ id: number; code: string } | null>(null);

    const loadNos = useCallback(() => getTrackingNos(moid!, ccCodes, scope), [moid, ccCodes, scope]);
    const nos = useApiData(moid !== null ? loadNos : null);

    const loadRows = useCallback(() => getTrackingData(role!.id, moid!, ccCodes, groupId), [role, moid, ccCodes, groupId]);
    const records = useApiData(moid !== null && role ? loadRows : null);

    if (moid === null) {
        return (
            <View>
                <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Step 1 — Choose a transaction type
                </Text>
                {values.map((item, index) => (
                    <TouchableOpacity
                        key={item.MOID}
                        onPress={() => setMoid(item.MOID)}
                        className={`flex-row items-center gap-3 py-3.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                        <ListChecks size={16} color={brand.orange} />
                        <Text className="flex-1 text-sm text-gray-800">{(item.Value || '').trim()}</Text>
                        <ChevronRight size={16} color="#9ca3af" />
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    const typeLabel = (values.find((v) => v.MOID === moid)?.Value || '').trim();
    const chain = nos.data ?? [];
    const rows = records.data ?? [];

    return (
        <View>
            <TouchableOpacity
                onPress={() => { setMoid(null); setRole(null); }}
                className="flex-row items-center gap-1.5 mb-3"
            >
                <ArrowLeft size={15} color={brand.orange} />
                <Text className="text-xs font-semibold text-orange-600">All transaction types</Text>
            </TouchableOpacity>
            <Text className="text-sm font-bold text-gray-900 mb-3">{typeLabel}</Text>

            <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Step 2 — Tap a role with pending items
            </Text>
            {nos.loading ? (
                <View className="py-4"><Spinner /></View>
            ) : chain.length === 0 ? (
                <EmptyText label="No approval chain found" />
            ) : (
                <View className="flex-row flex-wrap items-center gap-1.5 mb-4">
                    {chain.map((n, idx) => {
                        const hasPending = n.No > 0;
                        const selected = role?.id === n.UserRoleID;
                        return (
                            <View key={n.UserRoleID} className="flex-row items-center gap-1.5">
                                <TouchableOpacity
                                    disabled={!hasPending}
                                    onPress={() => setRole({ id: n.UserRoleID, code: n.UserRoleCode })}
                                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${selected
                                        ? 'bg-orange-500 border-orange-500'
                                        : hasPending ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200 opacity-60'}`}
                                >
                                    <Text className={`text-xs font-semibold ${selected ? 'text-white' : hasPending ? 'text-orange-700' : 'text-gray-400'}`}>
                                        {n.UserRoleCode}
                                    </Text>
                                    {hasPending && (
                                        <View className={`min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center ${selected ? 'bg-white' : 'bg-orange-500'}`}>
                                            <Text className={`text-[10px] font-bold ${selected ? 'text-orange-600' : 'text-white'}`}>{n.No}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {idx < chain.length - 1 && <ChevronRight size={12} color="#d1d5db" />}
                            </View>
                        );
                    })}
                </View>
            )}

            {role ? (
                records.loading ? (
                    <View className="py-6"><Spinner /></View>
                ) : rows.length === 0 ? (
                    <View className="items-center py-6 gap-2">
                        <CheckCircle size={28} color="#d1d5db" />
                        <Text className="text-xs text-gray-400">No pending transactions for {role.code}</Text>
                    </View>
                ) : (
                    <View className="rounded-xl border border-orange-100 overflow-hidden">
                        <View className="flex-row items-center justify-between px-3 py-2 bg-orange-50">
                            <Text className="text-xs font-bold text-orange-700">Pending at: {role.code}</Text>
                            <Text className="text-[11px] font-semibold text-orange-600">{plural(rows.length, 'record')}</Text>
                        </View>
                        {rows.map((r, idx) => (
                            <View key={idx} className="px-3 py-2.5 border-t border-gray-100">
                                <View className="flex-row justify-between gap-2">
                                    <Text className="text-xs font-semibold text-gray-800 flex-1" numberOfLines={1}>{r.TransactionNo || '—'}</Text>
                                    <Text className="text-xs font-bold text-gray-900">{rupees(r.Amount)}</Text>
                                </View>
                                <Text className="text-[11px] text-gray-500 mt-0.5" numberOfLines={1}>{r.Name || '—'}</Text>
                                <Text className="text-[11px] text-gray-400 mt-0.5">{[r.CCCode, r.Date].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ))}
                        <View className="flex-row justify-between px-3 py-2.5 border-t border-gray-100 bg-gray-50">
                            <Text className="text-xs font-bold text-gray-600">Total</Text>
                            <Text className="text-xs font-bold text-orange-600">{rupees(rows.reduce((s, r) => s + (r.Amount || 0), 0))}</Text>
                        </View>
                    </View>
                )
            ) : chain.length > 0 ? (
                <Text className="text-xs text-gray-400 text-center py-3">Step 3 — pending transactions show here</Text>
            ) : null}
        </View>
    );
}

const RejectedBody = ({ rows }: { rows: RejectedRow[] }) => (
    <View>
        {rows.map((row, idx) => {
            const moduleName = ((row.MCode || '').split(',')[1] || row.MCode || '—').trim();
            const ccName = ((row.CCName || '').split(',')[1] || row.CCName || '—').trim();
            return (
                <View key={idx} className={`py-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                    <View className="flex-row items-center justify-between gap-2">
                        <Text className="text-sm font-semibold text-brand-navy flex-1" numberOfLines={1}>{row.Refno || '—'}</Text>
                        <Text className="text-[11px] text-gray-400">{row.Rejectedate}</Text>
                    </View>
                    <Text className="text-xs text-gray-700 mt-0.5" numberOfLines={1}>{moduleName}</Text>
                    <Text className="text-[11px] text-gray-400 mt-0.5" numberOfLines={1}>{ccName}</Text>
                    <Text className="text-[11px] mt-1">
                        <Text className="font-semibold text-rose-600">{(row.RejectedBy || '—').trim()}</Text>
                        {row.Remarks ? <Text className="text-gray-600">{`  “${row.Remarks.trim()}”`}</Text> : null}
                    </Text>
                </View>
            );
        })}
    </View>
);

const scopedTrackingValues = (scope: Scope) => getTrackingValues(scope.roleId);

export const ApprovalsCard = () => {
    const { openSheet } = useRoleDashboard();
    const values = useScopedData(scopedTrackingValues);
    const rejected = useScopedData(getRejectedData);

    const pendingTypes = values.data ?? [];
    const rejectedRows = rejected.data ?? [];

    const row = (
        label: string,
        count: number,
        loading: boolean,
        tone: 'orange' | 'red',
        Icon: typeof Clock,
        onPress: () => void,
    ) => {
        const active = count > 0;
        const color = tone === 'orange' ? brand.orange : '#ef4444';
        return (
            <TouchableOpacity
                disabled={!active}
                onPress={onPress}
                className={`flex-1 rounded-xl border p-3 ${active ? (tone === 'orange' ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100') : 'bg-gray-50 border-gray-100'}`}
            >
                <View className="flex-row items-center gap-1.5">
                    <Icon size={15} color={active ? color : '#9ca3af'} />
                    <Text className="text-xs font-medium text-gray-700">{label}</Text>
                </View>
                <View className="mt-2 min-h-[24px] justify-center">
                    {loading ? <Spinner color={color} /> : active ? (
                        <View className="flex-row items-center justify-between">
                            <Text className={`text-xl font-bold ${tone === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>{count}</Text>
                            <Text className={`text-[11px] font-semibold ${tone === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>Review ›</Text>
                        </View>
                    ) : (
                        <Text className="text-xs font-semibold text-green-600">All clear</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Card title="Approvals" subtitle="Pending transaction types and entries rejected back to you">
            <View className="flex-row gap-3">
                {row('Pending', pendingTypes.length, values.loading, 'orange', Clock, () =>
                    openSheet({
                        title: 'Pending Transactions',
                        subtitle: `${plural(pendingTypes.length, 'transaction type')} pending approval`,
                        body: <PendingFlowBody values={pendingTypes} />,
                    }))}
                {row('Rejected', rejectedRows.length, rejected.loading, 'red', AlertTriangle, () =>
                    openSheet({
                        title: 'Rejected Transactions',
                        subtitle: `${plural(rejectedRows.length, 'record')} found`,
                        tone: 'red',
                        body: <RejectedBody rows={rejectedRows} />,
                    }))}
            </View>
        </Card>
    );
};

// ---- Today's recent activity -------------------------------------------------------------

const todayLog = (scope: Scope) => {
    const today = ymd(new Date());
    return getTransactionLog(today, today, 'Select All', scope);
};

export const RecentActivityCard = ({ limit = 5 }: { limit?: number }) => {
    const { data, loading } = useScopedData(todayLog);
    const rows = (data ?? []).slice(0, limit);
    return (
        <Card
            title="Today's Recent Activity"
            subtitle={data && data.length > limit ? `Latest ${limit} of ${data.length} entries` : undefined}
        >
            {loading ? (
                <View className="py-6"><Spinner /></View>
            ) : rows.length === 0 ? (
                <EmptyText label="No transactions found for today" />
            ) : (
                rows.map((t, index) => {
                    const debit = Number(t.DebitValue) || 0;
                    const credit = Number(t.CreditValue) || 0;
                    const status = t.Status || 'Approved';
                    return (
                        <View key={index} className={`flex-row items-center gap-3 py-2.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{t.NameofAccount || '—'}</Text>
                                <View className="flex-row items-center gap-1.5 mt-1">
                                    <View className="px-2 py-0.5 rounded-full bg-indigo-50">
                                        <Text className="text-[10px] font-semibold text-brand-navy">{t.VoucherType || '—'}</Text>
                                    </View>
                                    <Text className="text-[10px] text-gray-400">{t.EntryDate}</Text>
                                </View>
                            </View>
                            <View className="items-end gap-1">
                                {debit > 0 ? <Text className="text-xs font-semibold text-red-600">Dr {rupees(debit)}</Text> : null}
                                {credit > 0 ? <Text className="text-xs font-semibold text-green-600">Cr {rupees(credit)}</Text> : null}
                                <Pill label={status} tone={status.toLowerCase() === 'approved' ? 'green' : 'red'} />
                            </View>
                        </View>
                    );
                })
            )}
        </Card>
    );
};

// ---- Sales / Purchase this month vs last (Client Invoice = Sales, Vendor Invoice = Purchase) ----

const logTotal = (rows: { DebitValue?: number; CreditValue?: number }[] | null) =>
    (rows ?? []).reduce((sum, r) => sum + (Number(r.DebitValue) || 0) + (Number(r.CreditValue) || 0), 0);

const salesThisMonth = (scope: Scope) => getTransactionLog(...monthRange(0), 'Client Invoice', scope);
const salesLastMonth = (scope: Scope) => getTransactionLog(...monthRange(-1), 'Client Invoice', scope);
const purchaseThisMonth = (scope: Scope) => getTransactionLog(...monthRange(0), 'Vendor Invoice', scope);
const purchaseLastMonth = (scope: Scope) => getTransactionLog(...monthRange(-1), 'Vendor Invoice', scope);

export const useSalesPurchaseMetrics = () => {
    const salesNow = useScopedData(salesThisMonth);
    const salesPrev = useScopedData(salesLastMonth);
    const purchaseNow = useScopedData(purchaseThisMonth);
    const purchasePrev = useScopedData(purchaseLastMonth);
    return {
        sales: { current: logTotal(salesNow.data), previous: logTotal(salesPrev.data), loading: salesNow.loading || salesPrev.loading },
        purchase: { current: logTotal(purchaseNow.data), previous: logTotal(purchasePrev.data), loading: purchaseNow.loading || purchasePrev.loading },
    };
};
