// One component per dashboard type, mirroring the Corex web department dashboards
// (RAPP-SLAPP frontend: pages/Dashboard/{HR,Accounts,Finance,StorePurchase,Project,Admin,Base}Dashboard.jsx
// and DashboardContent.jsx for Top Level). Same data and wording; the web's side-by-side grid
// is restacked into one column, most actionable numbers first.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
    Award, Ban, Building2, CalendarCheck, Calendar, ChevronRight, ClipboardList, Copy, CreditCard, DollarSign,
    FileBadge, FileClock, FileText, HardHat, Landmark, PiggyBank, Receipt, ScrollText, ShieldAlert, ShieldCheck,
    ShieldX, ShoppingCart, TrendingUp, Truck, UserMinus, UserPlus, UserX, Users, Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
    getAccountsDashboardSummary,
    getAccountsPendingDetails,
    getAdminDashboardSummary,
    getCCCashBalanceSummary,
    getClientOutStandingSummary,
    getHRDashboardSummary,
    getProjectDashboardSummary,
    getSNPDashboardSummary,
    getSNPPendingDetails,
    getStockPurchaseConsolidateSummary,
    getVendorOutStandingSummary,
    type CCCashBalance,
    type DepartmentCode,
} from '@/src/api/dashboard/roleDashboardAPI';
import { brand } from '@/src/theme/colors';
import { useRoleDashboard, useScopedData } from './RoleDashboardContext';
import {
    BreakdownCard, Card, EmptyText, HeadlineTile, IconBadge, MiniTile, MonthComparisonCard, NeedsAttentionCard,
    Pill, SectionTitle, SegmentBar, Spinner, TileRow, compactRupees, plural, rupees, type AttentionRow,
} from './DashboardUI';
import { ACCOUNTS_DOCS, EmployeeListBody, PendingDocumentsBody, SNP_DOCS, docSheetSubtitle } from './DrillDowns';
import { ApprovalsCard, RecentActivityCard, todayLabel, useSalesPurchaseMetrics } from './SharedCards';

// Tailwind colours used for bars / dots (hex, since they are applied as inline styles)
const C = {
    green: '#22c55e', lime: '#84cc16', yellow: '#eab308', orange: '#f97316', red: '#ef4444',
    blue: '#60a5fa', gray: '#9ca3af', navy: '#1e3a8a',
};

// ---- HR ----------------------------------------------------------------------------------

const HR_DETAILS: Record<string, { title: string; dateLabel: string }> = {
    ThisMonthJoinee: { title: 'This Month Joinees', dateLabel: 'Joining date' },
    OneYearCompletion: { title: '1-Year Anniversary Soon', dateLabel: 'Anniversary' },
    ContractExpiring: { title: 'Contracts Expiring', dateLabel: 'Contract ends' },
    NearingRetirement: { title: 'Nearing Retirement', dateLabel: 'Turns 60 on' },
    NearingPF58: { title: 'Nearing PF Age (58)', dateLabel: 'Turns 58 on' },
    OnLeaveToday: { title: 'On Leave Today', dateLabel: 'Leave period' },
};

const HR_ATTENTION: (Omit<AttentionRow, 'count'> & { countKey: string })[] = [
    { key: 'OneYearCompletion', countKey: 'OneYearCompletionCount', title: '1-Year anniversary', subtitle: 'Completing 1 year', icon: Award, tone: 'purple', dueLabel: 'Next 30 days' },
    { key: 'ContractExpiring', countKey: 'ContractExpiringCount', title: 'Contracts expiring', subtitle: 'Contract staff', icon: FileClock, tone: 'orange', dueLabel: 'Next 30 days' },
    { key: 'NearingPF58', countKey: 'NearingPF58Count', title: 'Nearing PF age (58)', subtitle: 'Stop PF before 58', icon: ShieldAlert, tone: 'red', dueLabel: 'Upcoming' },
    { key: 'NearingRetirement', countKey: 'NearingRetirementCount', title: 'Nearing retirement', subtitle: 'Turning 60', icon: UserMinus, tone: 'orange', dueLabel: 'Next 90 days' },
];

function HRDashboard() {
    const { openSheet } = useRoleDashboard();
    const { data: summary, loading } = useScopedData(getHRDashboardSummary);
    const s: Record<string, number | undefined> = { ...summary };

    const openDetail = (type: string) => {
        const cfg = HR_DETAILS[type];
        openSheet({ title: cfg.title, body: <EmployeeListBody type={type} dateLabel={cfg.dateLabel} /> });
    };
    const tap = (type: string, count?: number) => ((count || 0) > 0 ? () => openDetail(type) : undefined);

    return (
        <>
            <TileRow>
                <HeadlineTile
                    title="Active Headcount"
                    value={s.ActiveHeadcount ?? 0}
                    subtitle="Approved, currently employed"
                    icon={Users}
                    loading={loading}
                />
            </TileRow>
            <TileRow>
                <MiniTile title="Joinees this month" subtitle="Joined this month" icon={UserPlus} loading={loading}
                    value={s.ThisMonthJoineeCount} onPress={tap('ThisMonthJoinee', s.ThisMonthJoineeCount)} />
                <MiniTile title="On leave today" subtitle="Approved leave today" icon={CalendarCheck} loading={loading}
                    value={s.OnLeaveTodayCount} onPress={tap('OnLeaveToday', s.OnLeaveTodayCount)} />
            </TileRow>
            <View className="h-1" />
            <NeedsAttentionCard
                subtitle="Upcoming employee events"
                loading={loading}
                rows={HR_ATTENTION.map((r) => ({ ...r, count: s[r.countKey] || 0 })).sort((a, b) => (b.count || 0) - (a.count || 0))}
                onOpen={openDetail}
            />
        </>
    );
}

// ---- Accounts ----------------------------------------------------------------------------

const CashByCostCenter = ({ balances, limit }: { balances: CCCashBalance[]; limit?: number }) => (
    <>
        {(limit ? balances.slice(0, limit) : balances).map((cc, index) => (
            <View key={cc.CCCode} className={`flex-row items-center gap-3 py-2.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{cc.CCCode}</Text>
                    <Text className="text-[11px] text-gray-400" numberOfLines={1}>{cc.CCName}</Text>
                </View>
                <Text className={`text-sm font-semibold ${cc.CCAmount < 0 ? 'text-red-600' : 'text-gray-900'}`}>{rupees(cc.CCAmount)}</Text>
            </View>
        ))}
    </>
);

function AccountsDashboard() {
    const { openSheet } = useRoleDashboard();
    const { data: summary, loading } = useScopedData(getAccountsDashboardSummary);
    const cash = useScopedData(getCCCashBalanceSummary);

    const balances = [...(cash.data ?? [])].sort((a, b) => Math.abs(b.CCAmount) - Math.abs(a.CCAmount));
    const cashTotal = balances.reduce((sum, cc) => sum + (cc.CCAmount || 0), 0);

    const openDocs = (type: string, count?: number) => {
        const config = ACCOUNTS_DOCS[type];
        openSheet({
            title: config.title,
            subtitle: docSheetSubtitle(config, count),
            body: <PendingDocumentsBody type={type} config={config} fetcher={getAccountsPendingDetails} />,
        });
    };
    const tap = (type: string, count?: number) => ((count || 0) > 0 ? () => openDocs(type, count) : undefined);
    const openAllCash = () => openSheet({
        title: 'Cash balance by cost center',
        subtitle: `${plural(balances.length, 'cost center')} · ${rupees(cashTotal)}`,
        body: <CashByCostCenter balances={balances} />,
    });

    return (
        <>
            <TileRow>
                <HeadlineTile
                    title="Cash in hand"
                    value={rupees(cashTotal)}
                    subtitle={`Across ${plural(balances.length, 'cost center')}`}
                    icon={Wallet}
                    loading={cash.loading}
                    onPress={balances.length > 0 ? openAllCash : undefined}
                />
            </TileRow>
            <TileRow>
                <MiniTile title="Bank transactions pending" subtitle="All levels" icon={Landmark} loading={loading}
                    value={summary?.BankPendingCount} onPress={tap('Bank', summary?.BankPendingCount)} />
                <MiniTile title="Vendor invoices pending" subtitle="All levels" icon={FileText} loading={loading}
                    value={summary?.VendorInvoicePendingCount} onPress={tap('VendorInvoice', summary?.VendorInvoicePendingCount)} />
            </TileRow>
            <View className="h-1" />
            <NeedsAttentionCard
                subtitle="Approved FDs and LCs coming due"
                loading={loading}
                rows={[
                    { key: 'FDEnd', title: 'FDs nearing end date', subtitle: 'Open fixed deposits', icon: PiggyBank, tone: 'purple', dueLabel: 'Next 30 days', count: summary?.FDNearingEndCount || 0 },
                    { key: 'LCDue', title: 'LCs nearing payment', subtitle: 'Unsettled LCs', icon: ScrollText, tone: 'red', dueLabel: 'Next 30 days', count: summary?.LCNearingDueCount || 0 },
                ]}
                onOpen={(key) => openDocs(key, key === 'FDEnd' ? summary?.FDNearingEndCount : summary?.LCNearingDueCount)}
            />
            <Card
                title="Cash balance by cost center"
                subtitle="Cost centers currently holding cash"
                right={<Pill label={cash.loading ? '…' : plural(balances.length, 'cost center')} tone="blue" />}
            >
                {cash.loading ? <View className="py-6"><Spinner /></View>
                    : balances.length === 0 ? <EmptyText label="No cash held in any cost center" />
                        : <CashByCostCenter balances={balances} limit={5} />}
                {!cash.loading && balances.length > 5 ? (
                    <TouchableOpacity onPress={openAllCash} className="flex-row items-center justify-center gap-1 pt-3 mt-1 border-t border-gray-100">
                        <Text className="text-xs font-semibold text-orange-600">View all {balances.length}</Text>
                        <ChevronRight size={14} color={brand.orange} />
                    </TouchableOpacity>
                ) : null}
            </Card>
            <RecentActivityCard />
        </>
    );
}

// ---- Finance / Top Level -----------------------------------------------------------------

const monthLabel = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

function FinanceDashboard() {
    const { sales, purchase } = useSalesPurchaseMetrics();
    const receivables = useScopedData(getClientOutStandingSummary);
    const payables = useScopedData(getVendorOutStandingSummary);
    const gst = useScopedData(getStockPurchaseConsolidateSummary);

    const r = receivables.data;
    const p = payables.data;
    const g = gst.data;

    const outward = g?.ClientGSTTotal || 0;
    const inward = g?.VendorGSTTotal || 0;
    const net = outward - inward;
    const fromDate = g?.FromDate ? new Date(g.FromDate) : null;
    const gstMonth = fromDate ? monthLabel(fromDate) : '';
    const paymentMonth = fromDate ? monthLabel(new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1)) : '';
    const gstPaid = g?.GSTPaid || 0;
    const paidOn = g?.GSTPaidDate ? new Date(g.GSTPaidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
    const split = (i?: number, c?: number, s?: number) => `${rupees(i)} · ${rupees(c)} · ${rupees(s)}`;

    return (
        <>
            <TileRow>
                <MonthComparisonCard title="Sales this month" icon={TrendingUp} tone="green" barColor={C.green}
                    loading={sales.loading} current={sales.current} previous={sales.previous} />
                <MonthComparisonCard title="Purchase this month" icon={ShoppingCart} tone="navy" barColor={brand.navy}
                    loading={purchase.loading} current={purchase.current} previous={purchase.previous} unfavorable />
            </TileRow>
            <View className="h-1" />
            <ApprovalsCard />

            <SectionTitle title="Outstanding" />
            <BreakdownCard
                title="Receivables" subtitle="Client outstanding by age" icon={DollarSign} tone="green"
                loading={receivables.loading} hasData={!!r} total={r?.TotalBalance}
                bar={[
                    { value: r?.InvoiceBalBelow || 0, color: C.green },
                    { value: r?.InvoiceBalBetween91to120 || 0, color: C.yellow },
                    { value: r?.InvoiceBalBetween121to180 || 0, color: C.orange },
                    { value: r?.InvoiceBalAbove || 0, color: C.red },
                ]}
                rows={[
                    { label: '0 – 90 days', value: r?.InvoiceBalBelow, dot: C.green },
                    { label: '91 – 120 days', value: r?.InvoiceBalBetween91to120, dot: C.yellow },
                    { label: '121 – 180 days', value: r?.InvoiceBalBetween121to180, dot: C.orange },
                    { label: 'Above 180 days', value: r?.InvoiceBalAbove, dot: C.red },
                    { divider: true },
                    { label: 'Retention', value: r?.RetentionBalance, dot: C.blue },
                    { label: 'Hold', value: r?.HoldBalance, dot: C.gray },
                ]}
            />
            <BreakdownCard
                title="Payables" subtitle="Vendor outstanding by age" icon={CreditCard} tone="red"
                loading={payables.loading} hasData={!!p} total={p?.TotalBalance}
                bar={[
                    { value: p?.Below30Days || 0, color: C.green },
                    { value: p?.Between31And60Days || 0, color: C.lime },
                    { value: p?.Between61And90Days || 0, color: C.yellow },
                    { value: p?.Between91And120Days || 0, color: C.orange },
                    { value: p?.Above120Days || 0, color: C.red },
                ]}
                rows={[
                    { label: '0 – 30 days', value: p?.Below30Days, dot: C.green },
                    { label: '31 – 60 days', value: p?.Between31And60Days, dot: C.lime },
                    { label: '61 – 90 days', value: p?.Between61And90Days, dot: C.yellow },
                    { label: '91 – 120 days', value: p?.Between91And120Days, dot: C.orange },
                    { label: 'Above 120 days', value: p?.Above120Days, dot: C.red },
                    { divider: true },
                    { label: 'Retention', value: p?.RetentionBalance, dot: C.blue },
                    { label: 'Hold', value: p?.HoldBalance, dot: C.gray },
                ]}
            />
            <BreakdownCard
                title="GST position"
                subtitle={g ? `${net < 0 ? 'Net credit' : 'Net payable'}${gstMonth ? ` · ${gstMonth}` : ''}` : 'Net GST for last month'}
                icon={Receipt} tone={net < 0 ? 'green' : 'orange'}
                loading={gst.loading} hasData={!!g} total={Math.abs(net)}
                bar={[{ value: outward, color: C.orange }, { value: inward, color: C.blue }]}
                rows={[
                    { label: 'Outward GST (clients)', value: outward, dot: C.orange, bold: true },
                    { label: 'Invoices', value: g?.ClientInvoiceGST, sub: true },
                    { label: '+ Debit notes', value: g?.ClientDebitNoteGST, sub: true },
                    { label: '− Credit notes', value: g?.ClientCreditNoteGST, sub: true },
                    { id: 'client-gst-split', label: 'IGST · CGST · SGST', sub: true, text: split(g?.ClientIGST, g?.ClientCGST, g?.ClientSGST), valueClass: 'text-gray-500' },
                    { divider: true },
                    { label: 'Inward GST (vendors)', value: inward, dot: C.blue, bold: true },
                    { id: 'vendor-gst-split', label: 'IGST · CGST · SGST', sub: true, text: split(g?.VendorIGST, g?.VendorCGST, g?.VendorSGST), valueClass: 'text-gray-500' },
                    { divider: true },
                    {
                        label: `GST paid${paymentMonth ? ` in ${paymentMonth}` : ''}`,
                        dot: gstPaid > 0 ? C.green : '#d1d5db',
                        text: gstPaid > 0 ? rupees(gstPaid) : 'Not paid yet',
                        valueClass: gstPaid > 0 ? 'text-green-600' : 'text-gray-400',
                    },
                ]}
                footnote={gstPaid > 0 && paidOn ? `Last payment on ${paidOn}` : undefined}
            />
            <View className="h-1" />
            <RecentActivityCard />
        </>
    );
}

// ---- Store & Purchase --------------------------------------------------------------------

const PipelineStage = ({
    step, title, icon: Icon, value, subtitle, loading, onPress, last, children,
}: {
    step: number; title: string; icon: LucideIcon; value?: number; subtitle?: string;
    loading: boolean; onPress: () => void; last?: boolean; children?: React.ReactNode;
}) => (
    <View className="flex-row gap-3">
        {/* Step rail */}
        <View className="items-center">
            <View className="w-7 h-7 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-xs font-bold text-white">{step}</Text>
            </View>
            {!last && <View className="flex-1 w-0.5 bg-orange-200 my-1" />}
        </View>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50 ${last ? '' : 'mb-3'}`}
        >
            <View className="p-1.5 rounded-md bg-orange-100">
                <Icon size={16} color="#ea580c" />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">{title}</Text>
                {subtitle ? <Text className="text-[11px] text-gray-500 mt-0.5">{subtitle}</Text> : null}
                {children}
            </View>
            {loading ? <Spinner /> : <Text className="text-2xl font-bold text-orange-700">{value ?? 0}</Text>}
            <ChevronRight size={16} color="#fdba74" />
        </TouchableOpacity>
    </View>
);

function StorePurchaseDashboard() {
    const { openSheet } = useRoleDashboard();
    const { data: s, loading } = useScopedData(getSNPDashboardSummary);

    const openDocs = (type: string, count?: number) => {
        const config = SNP_DOCS[type];
        openSheet({
            title: config.title,
            subtitle: docSheetSubtitle(config, count),
            body: <PendingDocumentsBody type={type} config={config} fetcher={getSNPPendingDetails} />,
        });
    };

    const openItems = (s?.IndentPendingCount || 0) + (s?.POPendingCount || 0) + (s?.MRRPendingCount || 0);
    const expiring = (s?.SupplierPOExpiringCount || 0) + (s?.SPPOExpiringCount || 0);
    const hasPOSplit = s?.SupplierPOPendingCount != null && s?.SPPOPendingCount != null;

    const expiryRow = (title: string, type: string, value: number | undefined, first: boolean) => (
        <TouchableOpacity
            onPress={() => openDocs(type, value)}
            className={`flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-gray-100'}`}
        >
            <IconBadge icon={Calendar} tone={(value || 0) > 0 ? 'red' : 'blue'} />
            <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">{title}</Text>
                <Text className={`text-[11px] ${(value || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {(value || 0) > 0 ? 'Expiring soon · tap for details' : 'All clear'}
                </Text>
            </View>
            {loading ? <Spinner /> : (
                <Text className={`text-xl font-bold ${(value || 0) > 0 ? 'text-red-600' : 'text-gray-300'}`}>{value ?? 0}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <>
            <SectionTitle eyebrow="STORE & PURCHASE" title="Procurement overview" note={todayLabel()} />
            <Card
                title="Procurement pipeline"
                subtitle="Items waiting at each stage · tap a stage"
                right={<Pill label={loading ? '…' : `${openItems} open`} />}
            >
                <View className="pt-2">
                    <PipelineStage step={1} title="Indents" icon={ClipboardList} value={s?.IndentPendingCount}
                        subtitle="Under process at all levels" loading={loading} onPress={() => openDocs('Indent', s?.IndentPendingCount)} />
                    <PipelineStage step={2} title="Purchase orders" icon={Copy} value={s?.POPendingCount}
                        subtitle={hasPOSplit ? undefined : 'Supplier + service provider POs'} loading={loading}
                        onPress={() => openDocs('PO', s?.POPendingCount)}>
                        {hasPOSplit ? (
                            <Text className="text-[11px] text-gray-500 mt-0.5">
                                Supplier {s?.SupplierPOPendingCount} · Service provider {s?.SPPOPendingCount}
                            </Text>
                        ) : null}
                    </PipelineStage>
                    <PipelineStage step={3} title="Material receipts (MRR)" icon={Truck} value={s?.MRRPendingCount}
                        subtitle="Vendor receipts under process" loading={loading} last
                        onPress={() => openDocs('MRR', s?.MRRPendingCount)} />
                </View>
            </Card>
            <Card
                title="Expiring in the next 5 days"
                subtitle="Open POs close to their validity date"
                right={<Pill label={loading ? '…' : expiring > 0 ? `${expiring} expiring` : 'Nothing expiring'} tone={expiring > 0 ? 'red' : 'green'} />}
            >
                {expiryRow('Supplier PO', 'SupplierPOExpiry', s?.SupplierPOExpiringCount, true)}
                {expiryRow('Service provider PO (SPPO)', 'SPPOExpiry', s?.SPPOExpiringCount, false)}
            </Card>
        </>
    );
}

// ---- Project -----------------------------------------------------------------------------

const utilizationColor = (pct: number) => (pct >= 95 ? '#dc2626' : pct >= 85 ? C.orange : C.yellow);

function ProjectDashboard() {
    const { data: s, loading } = useScopedData(getProjectDashboardSummary);

    const assigned = s?.BudgetAssigned || 0;
    const utilized = s?.BudgetUtilized || 0;
    const utilizedPct = assigned > 0 ? Math.round((utilized / assigned) * 100) : 0;
    const leftPct = Math.max(100 - utilizedPct, 0);

    const current = s?.ExpensesCurrentMonth || 0;
    const previous = s?.ExpensesPreviousMonth || 0;
    const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
    const hasSplit = s?.CashVoucherCurrentMonth != null && s?.VendorInvoiceCurrentMonth != null;
    const max = Math.max(current, previous, 1);

    const nearLimit = [...(s?.CostCentersNearLimit ?? [])].sort((a, b) => (b.UtilizedPct || 0) - (a.UtilizedPct || 0)).slice(0, 4);

    const expenseBar = (label: string, value: number, color: string) => (
        <View key={label} className="mt-2.5">
            <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-600">{label}</Text>
                <Text className="text-xs font-semibold text-gray-900">{rupees(value)}</Text>
            </View>
            <View className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <View className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
            </View>
        </View>
    );

    const kpi = (title: string, value: number | undefined, subtitle: string, icon: LucideIcon, tone: 'blue' | 'orange', first: boolean) => (
        <View className={`flex-1 items-center px-1 ${first ? '' : 'border-l border-gray-100'}`}>
            <IconBadge icon={icon} tone={tone} size={30} />
            {loading ? <View className="h-8 justify-center"><Spinner /></View> : (
                <Text className="text-xl font-bold text-gray-900 mt-1.5" numberOfLines={1} adjustsFontSizeToFit>{value ?? 0}</Text>
            )}
            <Text className="text-[11px] font-medium text-gray-700 text-center" numberOfLines={2}>{title}</Text>
            <Text className="text-[10px] text-gray-400 text-center mt-0.5" numberOfLines={2}>{subtitle}</Text>
        </View>
    );

    return (
        <>
            <SectionTitle
                eyebrow="PROJECTS"
                title="Project overview"
                note={`${todayLabel()}${loading ? '' : ` · ${plural(s?.ActiveCostCenterCount ?? 0, 'active cost center')}`}`}
            />
            <Card title="Budget utilization" subtitle="Across all active cost centers">
                {loading ? <View className="py-8"><Spinner /></View> : (
                    <>
                        <View className="flex-row items-baseline gap-2 flex-wrap">
                            <Text className={`text-4xl font-bold ${utilizedPct >= 90 ? 'text-orange-700' : 'text-gray-900'}`}>{utilizedPct}%</Text>
                            <Text className="text-xs text-gray-600">used · <Text className="font-semibold text-gray-900">{leftPct}% left</Text></Text>
                        </View>
                        <View className="h-3 rounded-full overflow-hidden bg-green-100 mt-3">
                            <View className="h-full bg-orange-500" style={{ width: `${Math.min(utilizedPct, 100)}%` }} />
                        </View>
                        <View className="flex-row mt-4">
                            {[
                                { label: 'Assigned', value: assigned, dot: null, cls: 'text-gray-900' },
                                { label: 'Utilized', value: utilized, dot: C.orange, cls: 'text-gray-900' },
                                { label: 'Balance', value: s?.BudgetBalance || 0, dot: C.green, cls: 'text-green-600' },
                            ].map((b) => (
                                <View key={b.label} className="flex-1">
                                    <View className="flex-row items-center gap-1.5">
                                        {b.dot ? <View className="w-2 h-2 rounded-full" style={{ backgroundColor: b.dot }} /> : null}
                                        <Text className="text-[11px] text-gray-500">{b.label}</Text>
                                    </View>
                                    <Text className={`text-sm font-bold mt-0.5 ${b.cls}`}>{compactRupees(b.value)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </Card>

            <View className="bg-white rounded-2xl border border-gray-200 mb-4 py-4 flex-row">
                {kpi('Active cost centers', s?.ActiveCostCenterCount, 'Not closed or suspended', Building2, 'blue', true)}
                {kpi('Labour on site', s?.LabourCount, 'Approved, working', HardHat, 'blue', false)}
                {kpi('Open purchase orders', s?.OpenPOCount, 'SP + supplier', Copy, 'orange', false)}
            </View>

            <Card
                title="Expenses this month"
                subtitle="Cash vouchers + vendor invoices"
                right={loading ? null : (
                    <Pill label={`${change > 0 ? '+' : ''}${change}% vs last month`} tone={change > 0 ? 'red' : change < 0 ? 'green' : 'gray'} />
                )}
            >
                {loading ? <View className="py-6"><Spinner /></View> : (
                    <>
                        <Text className="text-2xl font-bold text-gray-900">{rupees(current)}</Text>
                        {hasSplit ? (
                            <>
                                {expenseBar('Cash vouchers', s?.CashVoucherCurrentMonth || 0, C.blue)}
                                {expenseBar('Vendor invoices', s?.VendorInvoiceCurrentMonth || 0, C.navy)}
                            </>
                        ) : expenseBar('This month', current, C.navy)}
                        {expenseBar('Last month total', previous, C.gray)}
                    </>
                )}
            </Card>

            <Card title="Cost centers near budget limit" subtitle="Highest utilization first">
                {loading ? <View className="py-6"><Spinner /></View> : nearLimit.length === 0 ? (
                    <EmptyText label="No cost-center breakdown available" />
                ) : nearLimit.map((cc, index) => {
                    const pct = Math.round(cc.UtilizedPct || 0);
                    return (
                        <View key={cc.CCName} className={`py-2.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                            <View className="flex-row justify-between gap-3 mb-1.5">
                                <Text className="text-sm font-medium text-gray-900 flex-1" numberOfLines={1}>{cc.CCName}</Text>
                                <Text className={`text-sm font-bold ${pct >= 95 ? 'text-red-600' : 'text-orange-600'}`}>{pct}%</Text>
                            </View>
                            <SegmentBar segments={[{ value: Math.min(pct, 100), color: utilizationColor(pct) }, { value: Math.max(100 - pct, 0), color: '#f3f4f6' }]} />
                        </View>
                    );
                })}
            </Card>
        </>
    );
}

// ---- Administration ----------------------------------------------------------------------

// Listed so the layout is ready, but the backend has no data source for these yet (same as web)
const ADMIN_ATTENTION: AttentionRow[] = [
    { key: 'LicenseExpiring', title: 'Licenses expiring', subtitle: 'Due for renewal', icon: FileBadge, tone: 'orange', dueLabel: 'Next 30 days', count: null },
    { key: 'InsuranceExpiring', title: 'Insurance expiring', subtitle: 'Policies due', icon: ShieldCheck, tone: 'orange', dueLabel: 'Next 30 days', count: null },
    { key: 'BlacklistedPeople', title: 'Blacklisted people', subtitle: 'Staff / labour', icon: UserX, tone: 'red', dueLabel: 'Current', count: null },
    { key: 'BlacklistedVendors', title: 'Blacklisted vendors', subtitle: 'Vendors / SPs', icon: Ban, tone: 'red', dueLabel: 'Current', count: null },
    { key: 'BlacklistedClients', title: 'Blacklisted clients', subtitle: 'Clients', icon: ShieldX, tone: 'red', dueLabel: 'Current', count: null },
];

function AdminDashboard() {
    const { data: s, loading } = useScopedData(getAdminDashboardSummary);
    return (
        <>
            <TileRow>
                <HeadlineTile title="Staff Headcount" value={s?.StaffHeadcount ?? 0} subtitle="Currently employed" icon={Users} loading={loading} />
                <HeadlineTile title="Labour Headcount" value={s?.LabourHeadcount ?? 0} subtitle="Currently working" icon={HardHat} loading={loading} />
            </TileRow>
            <View className="h-1" />
            <NeedsAttentionCard subtitle="Expiries and blacklists" rows={ADMIN_ATTENTION} />
        </>
    );
}

// ---- Base (default) ----------------------------------------------------------------------

function BaseDashboard() {
    return <RecentActivityCard />;
}

// ---- Routing -----------------------------------------------------------------------------

// Keyed by DepartmentCode from GetUserRoleDashboardType, same map as the web's
// RoleBasedApplication.jsx. Top Level shares the Finance layout on mobile.
export const DASHBOARDS: Record<DepartmentCode, { name: string; component: React.ComponentType }> = {
    TL: { name: 'Top Level', component: FinanceDashboard },
    HR: { name: 'HR', component: HRDashboard },
    ACC: { name: 'Accounts', component: AccountsDashboard },
    FIN: { name: 'Finance', component: FinanceDashboard },
    SNP: { name: 'Store and Purchase', component: StorePurchaseDashboard },
    PRJ: { name: 'Project', component: ProjectDashboard },
    ADM: { name: 'Administration', component: AdminDashboard },
    BASE: { name: 'Base', component: BaseDashboard },
};
