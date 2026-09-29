// app/employee/attendance.tsx
// Mirrors the Corex web portal's Attendance page (pages/EmployeePortal/pages/Attendance.jsx).
// The web shows three months side by side; a phone shows one month with Older / Newer arrows.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchAttendancePeriod, periodKey } from '@/src/slice/hr/employeePortalSlice';
import type { AttendanceRecord } from '@/src/api/hr/employeePortalAPI';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText, SectionCard, StatCard } from '@/src/components/employee/PortalUI';
import { MONTHS } from '@/src/components/employee/portalFormat';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const statusLabel: Record<string, string> = {
    P: 'Present', A: 'Absent', HD: 'Half Day', PL: 'Paid Leave', L: 'Leave',
    H: 'Holiday', S: 'Sun / Holiday', WO: 'Week Off',
};

// Calendar cell tints (bg + text)
const dayStyles: Record<string, [string, string]> = {
    P: ['bg-emerald-100', 'text-emerald-800'],
    A: ['bg-rose-100', 'text-rose-700'],
    HD: ['bg-amber-100', 'text-amber-800'],
    PL: ['bg-blue-100', 'text-blue-700'],
    L: ['bg-sky-100', 'text-sky-700'],
    H: ['bg-violet-100', 'text-violet-700'],
    S: ['bg-gray-100', 'text-gray-400'],
    WO: ['bg-gray-100', 'text-gray-400'],
};
const legend = ['P', 'HD', 'A', 'PL', 'L', 'H', 'S', 'WO'];

// Day columns are keyed "<weekday>#<date>" (e.g. "Mon#01"); take whichever part is the date
const parseRecord = (record: AttendanceRecord | null | undefined) => {
    const byDate: Record<number, string> = {};
    if (record) {
        Object.keys(record).forEach((key) => {
            if (!key.includes('#')) return;
            const day = key.split('#').map((part) => parseInt(part, 10)).find((n) => !Number.isNaN(n));
            if (day) byDate[day] = String(record[key] ?? '').trim();
        });
    }
    return { byDate, totalPresentDays: record?.TotalPresentDays, totalMonthDays: record?.TotalMonthDays };
};

export default function Attendance() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { attendanceByPeriod, attendancePeriodLoading } = useAppSelector((s) => s.employeePortal);

    const today = useMemo(() => new Date(), []);
    const [view, setView] = useState({ year: today.getFullYear(), monthIndex: today.getMonth() });

    const monthName = MONTHS[view.monthIndex];
    const key = periodKey(monthName, view.year);
    const isCurrentMonth = view.year === today.getFullYear() && view.monthIndex === today.getMonth();

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchAttendancePeriod({ empRefNo, month: monthName, year: view.year })) : Promise.resolve()),
        [dispatch, empRefNo, monthName, view.year]
    );

    const known = Object.prototype.hasOwnProperty.call(attendanceByPeriod, key);
    const monthLoading = !!attendancePeriodLoading[key];

    // Fetch each month once; pull-to-refresh fetches it again
    useEffect(() => {
        if (!known && !monthLoading) load();
    }, [known, monthLoading, load]);

    const shift = (delta: number) =>
        setView((v) => {
            const d = new Date(v.year, v.monthIndex + delta, 1);
            if (d > new Date(today.getFullYear(), today.getMonth(), 1)) return v; // never page into the future
            return { year: d.getFullYear(), monthIndex: d.getMonth() };
        });

    const { byDate, totalPresentDays, totalMonthDays } = parseRecord(attendanceByPeriod[key]);
    const hasData = Object.keys(byDate).length > 0;

    const summary = Object.values(byDate).reduce(
        (acc, v) => {
            if (v === 'P') acc.present += 1;
            else if (v === 'A') acc.absent += 1;
            else if (v === 'HD') acc.halfDay += 1;
            else if (v === 'PL' || v === 'L') acc.leave += 1;
            return acc;
        },
        { present: 0, absent: 0, halfDay: 0, leave: 0 }
    );

    const firstWeekday = new Date(view.year, view.monthIndex, 1).getDay();
    const daysInMonth = new Date(view.year, view.monthIndex + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <PortalScreen title="Attendance / Time" subtitle="Your monthly attendance calendar" icon={Clock} onRefresh={load}>
            <View className="gap-3 mb-4">
                <View className="flex-row gap-3">
                    <StatCard label="Present" value={summary.present} tone="navy" />
                    <StatCard
                        label="Payable Days"
                        value={totalPresentDays ?? '—'}
                        sub={totalMonthDays ? `of ${totalMonthDays}` : undefined}
                        tone="orange"
                    />
                </View>
                <View className="flex-row gap-3">
                    <StatCard label="Half Day" value={summary.halfDay} tone="white" />
                    <StatCard label="Absent" value={summary.absent} tone="white" />
                    <StatCard label="On Leave" value={summary.leave} tone="white" />
                </View>
            </View>

            <SectionCard
                title={`${monthName} ${view.year}`}
                icon={Clock}
                action={
                    <View className="flex-row items-center gap-1">
                        <TouchableOpacity onPress={() => shift(-1)} className="p-1.5 rounded-lg bg-gray-100" hitSlop={6}>
                            <ChevronLeft size={18} color="#4b5563" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => shift(1)}
                            disabled={isCurrentMonth}
                            className="p-1.5 rounded-lg bg-gray-100"
                            style={{ opacity: isCurrentMonth ? 0.4 : 1 }}
                            hitSlop={6}
                        >
                            <ChevronRight size={18} color="#4b5563" />
                        </TouchableOpacity>
                    </View>
                }
            >
                {monthLoading && !hasData ? (
                    <LoadingText />
                ) : !hasData ? (
                    <EmptyState icon={Clock} title="No attendance found" subtitle="No attendance has been recorded for this month yet." />
                ) : (
                    <>
                        <View className="flex-row mb-1">
                            {WEEKDAYS.map((w) => (
                                <Text key={w} className="flex-1 text-center text-[10px] font-semibold text-gray-400">{w}</Text>
                            ))}
                        </View>
                        {Array.from({ length: cells.length / 7 }, (_, row) => (
                            <View key={row} className="flex-row">
                                {cells.slice(row * 7, row * 7 + 7).map((day, i) => {
                                    if (day === null) return <View key={i} className="flex-1 aspect-square" />;
                                    const code = byDate[day];
                                    const [bg, text] = dayStyles[code] ?? ['', 'text-gray-300'];
                                    const isToday = isCurrentMonth && day === today.getDate();
                                    return (
                                        <View key={i} className="flex-1 aspect-square p-0.5">
                                            <View
                                                className={`flex-1 rounded-md items-center justify-center ${bg} ${isToday ? 'border-2 border-orange-400' : ''}`}
                                            >
                                                <Text className={`text-[12px] font-medium ${text}`}>{day}</Text>
                                                {code ? <Text className={`text-[8px] uppercase opacity-70 ${text}`}>{code}</Text> : null}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-100">
                            {legend.map((code) => (
                                <View key={code} className="flex-row items-center gap-1.5">
                                    <View className={`w-3 h-3 rounded ${dayStyles[code][0]}`} />
                                    <Text className="text-[11px] text-gray-500">{statusLabel[code]}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </SectionCard>
        </PortalScreen>
    );
}
