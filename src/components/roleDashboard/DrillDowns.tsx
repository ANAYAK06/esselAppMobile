// Sheet bodies for the dashboard drill-downs. Mobile versions of the web's DetailListModal.jsx
// (employee lists) and PendingDocumentsModal.jsx (documents under process / coming due) —
// each table row becomes a compact card, and the level chips still filter the list.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
    getHRDashboardDetailList,
    type PendingDocument,
    type Scope,
} from '@/src/api/dashboard/roleDashboardAPI';
import { useApiData } from '@/src/hooks/useApiData';
import { useRoleDashboard } from './RoleDashboardContext';
import { EmptyText, Spinner, plural, rupees } from './DashboardUI';

// ---- Employee list (HR tiles) ------------------------------------------------------------

export function EmployeeListBody({ type, dateLabel }: { type: string; dateLabel: string }) {
    const { scope } = useRoleDashboard();
    const load = useCallback(() => getHRDashboardDetailList(type, scope), [type, scope]);
    const { data, loading } = useApiData(load);
    const rows = data ?? [];

    if (loading) return <View className="py-10"><Spinner /></View>;
    if (rows.length === 0) return <EmptyText label="No employees found" />;

    return (
        <View>
            <Text className="text-xs text-gray-500 mb-2">{plural(rows.length, 'employee')}</Text>
            {rows.map((row, index) => (
                <View
                    key={`${row.EmpRefNo}-${index}`}
                    className={`flex-row items-center gap-3 py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                >
                    <View className="w-9 h-9 rounded-full bg-indigo-50 items-center justify-center">
                        <Text className="text-xs font-bold text-brand-navy">{(row.EmpName || '?').trim()[0]}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{row.EmpName?.trim()}</Text>
                        <Text className="text-[11px] text-gray-400">{row.EmpRefNo}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-[10px] text-gray-400">{dateLabel}</Text>
                        <Text className="text-xs font-semibold text-gray-800">{row.DetailDate}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

// ---- Pending documents (Accounts / Store & Purchase tiles) -------------------------------

type Field = [label: string, value: (r: PendingDocument) => string | undefined | null];

export type DocConfig = {
    title: string;
    noun: string;
    summary?: string;           // defaults to "pending across workflow levels"
    showLevels?: boolean;       // false for already-approved items coming due (FD / LC / PO expiry)
    amountLabel?: string | false;
    fields: Field[];
};

const cc = (r: PendingDocument) => [r.CCCode, r.CCName].filter(Boolean).join(' · ');

export const SNP_DOCS: Record<string, DocConfig> = {
    Indent: {
        title: 'Indents Under Process',
        noun: 'indent',
        fields: [['Cost center', cc], ['Raised on', (r) => r.DocDate]],
    },
    MRR: {
        title: 'MRRs Under Process',
        noun: 'MRR',
        amountLabel: false,
        fields: [['PO No', (r) => r.RefNo], ['Vendor', (r) => r.PartyName], ['Cost center', cc], ['Received on', (r) => r.DocDate]],
    },
    PO: {
        title: 'POs Under Process',
        noun: 'PO',
        fields: [['Type', (r) => r.DocType], ['Vendor', (r) => r.PartyName], ['Cost center', cc], ['PO date', (r) => r.DocDate]],
    },
    SupplierPOExpiry: {
        title: 'Supplier POs Nearing Expiry',
        noun: 'supplier PO',
        summary: 'expiring in the next 5 days',
        showLevels: false,
        fields: [['Indent No', (r) => r.RefNo], ['Vendor', (r) => r.PartyName], ['Cost center', cc], ['PO date', (r) => r.DocDate], ['Expiry', (r) => r.ExpiryDate]],
    },
    SPPOExpiry: {
        title: 'SPPOs Nearing Expiry',
        noun: 'SPPO',
        summary: 'expiring in the next 5 days',
        showLevels: false,
        fields: [['Vendor', (r) => r.PartyName], ['Cost center', cc], ['Start date', (r) => r.DocDate], ['Expiry', (r) => r.ExpiryDate]],
    },
};

export const ACCOUNTS_DOCS: Record<string, DocConfig> = {
    Bank: {
        title: 'Bank Transactions Under Process',
        noun: 'bank transaction',
        fields: [['Transaction type', (r) => r.DocType], ['Bank', (r) => r.PartyName], ['Date', (r) => r.DocDate], ['Remarks', (r) => r.Remarks]],
    },
    VendorInvoice: {
        title: 'Vendor Invoices Under Process',
        noun: 'vendor invoice',
        fields: [['PO No', (r) => r.RefNo], ['Vendor type', (r) => r.DocType], ['Vendor', (r) => r.PartyName], ['Cost center', cc], ['Invoice date', (r) => r.DocDate]],
    },
    FDEnd: {
        title: 'FDs Nearing End Date',
        noun: 'FD',
        summary: 'ending in the next 30 days',
        showLevels: false,
        amountLabel: 'FD value',
        fields: [['Bank', (r) => r.PartyName], ['Begin date', (r) => r.DocDate], ['Rate', (r) => r.Remarks], ['End date', (r) => r.ExpiryDate]],
    },
    LCDue: {
        title: 'LCs Nearing Payment',
        noun: 'LC transaction',
        summary: 'valid up to the next 30 days',
        showLevels: false,
        amountLabel: 'Balance',
        fields: [['Transaction ref', (r) => r.RefNo], ['Vendor', (r) => r.PartyName], ['Issue date', (r) => r.DocDate], ['Valid up to', (r) => r.ExpiryDate]],
    },
};

export const docSheetSubtitle = (config: DocConfig, count?: number) =>
    count === undefined
        ? undefined
        : `${plural(count, config.noun)} ${config.summary || 'pending across workflow levels'}`;

const levelKey = (r: PendingDocument) => `${r.PendingLevel ?? '-'}|${r.PendingWithRole || ''}`;

const DocCard = ({ row, config, first }: { row: PendingDocument; config: DocConfig; first: boolean }) => {
    const showLevels = config.showLevels !== false;
    const days = row.DaysLeft;
    return (
        <View className={`py-3 ${first ? '' : 'border-t border-gray-100'}`}>
            <View className="flex-row items-start justify-between gap-3">
                <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>{row.DocNo || '—'}</Text>
                {config.amountLabel !== false && row.Amount != null ? (
                    <Text className="text-sm font-bold text-gray-900">{rupees(row.Amount)}</Text>
                ) : null}
            </View>
            {config.fields.map(([label, value]) => {
                const text = value(row);
                return text ? (
                    <View key={label} className="flex-row gap-2 mt-0.5">
                        <Text className="text-[11px] text-gray-400 w-[92px]">{label}</Text>
                        <Text className="text-[11px] text-gray-700 flex-1" numberOfLines={2}>{text}</Text>
                    </View>
                ) : null;
            })}
            <View className="flex-row flex-wrap gap-1.5 mt-2">
                {showLevels ? (
                    <>
                        <View className="px-2 py-0.5 rounded-full bg-orange-100">
                            <Text className="text-[11px] font-bold text-orange-700">
                                Level {row.PendingLevel ?? '-'} · {row.PendingWithRole || 'Not configured'}
                            </Text>
                        </View>
                        {row.PendingLevel === 1 ? (
                            <View className="px-2 py-0.5 rounded-full bg-red-50">
                                <Text className="text-[11px] font-semibold text-red-600">Returned to raiser</Text>
                            </View>
                        ) : null}
                    </>
                ) : days != null ? (
                    <View className={`px-2 py-0.5 rounded-full ${days <= 1 ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <Text className={`text-[11px] font-bold ${days <= 1 ? 'text-red-700' : 'text-orange-700'}`}>
                            {days === 0 ? 'Due today' : `${plural(days, 'day')} left`}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export function PendingDocumentsBody({
    type,
    config,
    fetcher,
}: {
    type: string;
    config: DocConfig;
    fetcher: (type: string, scope: Scope) => Promise<PendingDocument[]>;
}) {
    const { scope } = useRoleDashboard();
    const load = useCallback(() => fetcher(type, scope), [fetcher, type, scope]);
    const { data, loading } = useApiData(load);
    const [activeLevel, setActiveLevel] = useState<string | null>(null);

    const rows = useMemo(() => data ?? [], [data]);
    const showLevels = config.showLevels !== false;

    const levels = useMemo(() => {
        const map = new Map<string, { key: string; level?: number | null; role?: string | null; count: number }>();
        rows.forEach((row) => {
            const key = levelKey(row);
            const entry = map.get(key) || { key, level: row.PendingLevel, role: row.PendingWithRole, count: 0 };
            entry.count += 1;
            map.set(key, entry);
        });
        return [...map.values()].sort((a, b) => (a.level ?? 99) - (b.level ?? 99));
    }, [rows]);

    if (loading) return <View className="py-10"><Spinner /></View>;

    const visible = activeLevel ? rows.filter((r) => levelKey(r) === activeLevel) : rows;
    const chip = (active: boolean) => `px-3 py-1.5 rounded-full border ${active ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`;
    const chipText = (active: boolean) => `text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`;

    return (
        <View>
            <Text className="text-xs text-gray-500 mb-2">{docSheetSubtitle(config, rows.length)}</Text>

            {showLevels && levels.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1 -mx-4" contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                    <TouchableOpacity onPress={() => setActiveLevel(null)} className={chip(!activeLevel)}>
                        <Text className={chipText(!activeLevel)}>All · {rows.length}</Text>
                    </TouchableOpacity>
                    {levels.map((lvl) => {
                        const active = lvl.key === activeLevel;
                        return (
                            <TouchableOpacity key={lvl.key} onPress={() => setActiveLevel(active ? null : lvl.key)} className={chip(active)}>
                                <Text className={chipText(active)}>
                                    L{lvl.level ?? '-'} · {lvl.role || 'Not configured'} · {lvl.count}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            ) : null}

            {visible.length === 0 ? (
                <EmptyText label={`No ${config.noun}s ${showLevels ? 'under process' : config.summary}`} />
            ) : (
                visible.map((row, index) => (
                    <DocCard key={`${row.DocType}-${row.DocNo}-${index}`} row={row} config={config} first={index === 0} />
                ))
            )}
        </View>
    );
}

