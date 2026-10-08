// app/employee/pf-esi.tsx
// Mirrors the Corex web portal's PFESI page (pages/EmployeePortal/pages/PFESI.jsx).
// Mobile shows the history as a searchable list with "Show more" instead of pages.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyPFESIHistory } from '@/src/slice/hr/employeePortalSlice';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import {
    Badge, EmptyState, InfoRow, LoadingText, SearchInput, SectionCard, StatCard,
} from '@/src/components/employee/PortalUI';
import { formatRupees } from '@/src/components/employee/portalFormat';

const typeTone: Record<string, { bg: string; text: string }> = {
    PF: { bg: 'bg-blue-100', text: 'text-blue-700' },
    ESI: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

const PAGE_SIZE = 10;

export default function PFESI() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { pfEsiHistory, loading } = useAppSelector((s) => s.employeePortal);
    const [search, setSearch] = useState('');
    const [visible, setVisible] = useState(PAGE_SIZE);

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchMyPFESIHistory(empRefNo)) : Promise.resolve()),
        [dispatch, empRefNo]
    );

    useEffect(() => {
        load();
    }, [load]);

    const history = useMemo(() => pfEsiHistory?.History || [], [pfEsiHistory]);
    const latestPF = history.find((h) => h.Type === 'PF');
    const latestESI = history.find((h) => h.Type === 'ESI');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return history;
        return history.filter((h) =>
            `${h.Type} ${h.MonthName} ${h.Year} ${h.CCName || ''} ${h.CCCode || ''}`.toLowerCase().includes(term)
        );
    }, [history, search]);

    const onSearch = (text: string) => {
        setSearch(text);
        setVisible(PAGE_SIZE);
    };

    const busy = loading.pfEsiHistory && !pfEsiHistory;

    return (
        <PortalScreen title="PF / ESI Details" subtitle="Your statutory contribution details" icon={ShieldCheck} onRefresh={load}>
            <View className="gap-3 mb-4">
                <View className="flex-row">
                    <StatCard
                        label={latestPF ? `PF — ${latestPF.MonthName} ${latestPF.Year}` : 'PF Contribution'}
                        value={busy ? '…' : formatRupees(latestPF?.EmployeeContAmt)}
                        sub={latestPF ? `Employer: ${formatRupees(latestPF.EmployerContAmt)}` : 'No PF contributions yet'}
                        tone="navy"
                    />
                </View>
                <View className="flex-row">
                    <StatCard
                        label={latestESI ? `ESI — ${latestESI.MonthName} ${latestESI.Year}` : 'ESI Contribution'}
                        value={busy ? '…' : formatRupees(latestESI?.EmployeeContAmt)}
                        sub={latestESI ? `Employer: ${formatRupees(latestESI.EmployerContAmt)}` : 'No ESI contributions yet'}
                        tone="orange"
                    />
                </View>
            </View>

            <SectionCard title="Statutory Identifiers" icon={ShieldCheck}>
                <InfoRow label="UAN" value={pfEsiHistory?.UANNumber} />
                <InfoRow label="PF Number" value={pfEsiHistory?.PFNumber} />
                <InfoRow label="ESI Number" value={pfEsiHistory?.ESINumber} last />
            </SectionCard>

            <SectionCard title="Contribution History" icon={ShieldCheck}>
                {busy ? (
                    <LoadingText />
                ) : history.length === 0 ? (
                    <EmptyState
                        icon={ShieldCheck}
                        title="No PF/ESI history found"
                        subtitle="Contribution records will appear here once a payroll run has been approved for you."
                    />
                ) : (
                    <>
                        <SearchInput value={search} onChangeText={onSearch} placeholder="Search type, month, year, CC…" />
                        {filtered.length === 0 ? (
                            <EmptyState icon={ShieldCheck} title="No matching records" subtitle="Try a different search term." />
                        ) : (
                            filtered.slice(0, visible).map((h, index) => (
                                <View
                                    key={`${h.Type}-${h.Year}-${h.Month}-${h.CCCode}-${index}`}
                                    className={`flex-row items-center justify-between gap-3 py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                                >
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <Badge label={h.Type} tone={typeTone[h.Type]} />
                                        <View className="flex-1">
                                            <Text className="text-sm font-semibold text-gray-800">
                                                {h.MonthName} {h.Year}
                                            </Text>
                                            <Text className="text-xs text-gray-400" numberOfLines={1}>{h.CCName || h.CCCode}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-sm font-semibold text-gray-800">{formatRupees(h.EmployeeContAmt)}</Text>
                                        <Text className="text-xs text-gray-400">Employer: {formatRupees(h.EmployerContAmt)}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                        {filtered.length > visible && (
                            <TouchableOpacity onPress={() => setVisible((v) => v + PAGE_SIZE)} className="pt-3 mt-1 border-t border-gray-100">
                                <Text className="text-xs font-semibold text-orange-500 text-center">
                                    Show more ({filtered.length - visible} left)
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </SectionCard>
        </PortalScreen>
    );
}
