// app/employee/my-reportees.tsx
// Mirrors the Corex web portal's MyReportees page (pages/EmployeePortal/pages/MyReportees.jsx)
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, ChevronRight, HardHat, MapPin, Star, Users2 } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyReportees, fetchReporteePhoto } from '@/src/slice/hr/employeePortalSlice';
import type { Reportee } from '@/src/api/hr/employeePortalAPI';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import {
    Badge, EmptyState, LoadingText, PrimaryButton, SearchInput, SectionCard, StatCard,
} from '@/src/components/employee/PortalUI';
import { SelectField } from '@/src/components/employee/FormControls';
import { initialsOf, photoUri } from '@/src/components/employee/portalFormat';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - i)).map((y) => ({ label: y, value: y }));
const PAGE_SIZE = 10;

export const staffTypeTone = (t: string) =>
    t === 'Site' ? { bg: 'bg-amber-100', text: 'text-amber-700' } : { bg: 'bg-sky-100', text: 'text-sky-700' };

const evalStatusTone = (s: string) =>
    ({
        Submitted: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
        Draft: { bg: 'bg-amber-100', text: 'text-amber-700' },
    })[s] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

const coverColors = (t: string) =>
    (t === 'Site' ? ['#fbbf24', '#fb923c', '#f97316'] : ['#38bdf8', '#60a5fa', '#6366f1']) as [string, string, string];

const ctaLabel = (s: string) => (s === 'Submitted' ? 'Review' : s === 'Draft' ? 'Continue' : 'Evaluate');

// Rating is out of 10 → 5 stars
const Stars = ({ value }: { value: number }) => {
    const filled = Math.round((Number(value) || 0) / 2);
    return (
        <View className="flex-row">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={13} color={n <= filled ? '#fbbf24' : '#d1d5db'} fill={n <= filled ? '#fbbf24' : 'transparent'} />
            ))}
        </View>
    );
};

function ReporteeCard({ r, onEvaluate }: { r: Reportee; onEvaluate: () => void }) {
    const dispatch = useAppDispatch();
    const photo = useAppSelector((s) => s.employeePortal.reporteePhotos[r.EmpRefNo]);
    const photoLoading = useAppSelector((s) => s.employeePortal.reporteePhotoLoading[r.EmpRefNo]);

    // Lazily pull each visible reportee's photo once; cached by EmpRefNo in the slice
    useEffect(() => {
        if (r.EmpRefNo && !photo && !photoLoading) dispatch(fetchReporteePhoto(r.EmpRefNo));
    }, [dispatch, r.EmpRefNo, photo, photoLoading]);

    const uri = photoUri(photo?.base64, photo?.fileType);
    const colors = coverColors(r.StaffType);

    return (
        <View className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-3">
            <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 56 }} />
            <View className="px-4 pb-4 -mt-8 items-center">
                <View className="w-16 h-16 rounded-full overflow-hidden border-4 border-white items-center justify-center" style={{ backgroundColor: colors[1] }}>
                    {uri ? (
                        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                        <Text className="text-white text-base font-bold">{initialsOf(r.EmployeeName) || '—'}</Text>
                    )}
                </View>

                <Text className="mt-2 text-sm font-bold text-gray-800" numberOfLines={1}>{r.EmployeeName?.trim()}</Text>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {r.DesignationName || 'Employee'}
                    {r.DepartmentName ? ` · ${r.DepartmentName}` : ''}
                </Text>

                <View className="flex-row flex-wrap justify-center gap-1.5 mt-2">
                    <Badge label={r.StaffType === 'Site' ? 'Site Staff' : 'Office Staff'} tone={staffTypeTone(r.StaffType)} />
                    {r.MappingType === 'Default' && <Badge label="Default" tone={{ bg: 'bg-gray-100', text: 'text-gray-500' }} />}
                </View>

                <View className="flex-row items-center gap-1 mt-2">
                    <MapPin size={12} color="#9ca3af" />
                    <Text className="text-[11px] text-gray-400 flex-shrink" numberOfLines={1}>
                        {r.JoiningCostCenter || '—'}
                        {r.CCName ? ` · ${r.CCName}` : ''}
                        {r.CCType ? ` (${r.CCType})` : ''}
                    </Text>
                </View>

                <View className="flex-row items-center gap-2 mt-2.5">
                    <Badge label={r.EvaluationStatus} tone={evalStatusTone(r.EvaluationStatus)} />
                    {r.OverallRating != null && (
                        <View className="flex-row items-center gap-1">
                            <Stars value={r.OverallRating} />
                            <Text className="text-[11px] font-semibold text-gray-600">{Number(r.OverallRating).toFixed(1)}</Text>
                        </View>
                    )}
                </View>

                <View className="w-full mt-3.5">
                    <PrimaryButton label={ctaLabel(r.EvaluationStatus)} icon={ChevronRight} onPress={onEvaluate} />
                </View>
            </View>
        </View>
    );
}

export default function MyReportees() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { myReportees: rows, loading } = useAppSelector((s) => s.employeePortal);

    const [year, setYear] = useState(CURRENT_YEAR);
    const [search, setSearch] = useState('');
    const [visible, setVisible] = useState(PAGE_SIZE);

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchMyReportees({ empRefNo, periodYear: year })) : Promise.resolve()),
        [dispatch, empRefNo, year]
    );

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            [r.EmployeeName, r.EmpRefNo, r.DesignationName, r.DepartmentName, r.CCName]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [rows, search]);

    const siteCount = rows.filter((r) => r.StaffType === 'Site').length;
    const officeCount = rows.filter((r) => r.StaffType === 'Office').length;
    const doneCount = rows.filter((r) => r.EvaluationStatus === 'Submitted').length;

    return (
        <PortalScreen
            title="My Reportees"
            subtitle="Employees who report to you"
            icon={Users2}
            onRefresh={load}
            headerAction={
                <View style={{ width: 92 }}>
                    <SelectField
                        title="Evaluation Year"
                        value={String(year)}
                        options={YEAR_OPTIONS}
                        onChange={(y) => {
                            setYear(Number(y));
                            setVisible(PAGE_SIZE);
                        }}
                    />
                </View>
            }
        >
            <View className="gap-3 mb-4">
                <View className="flex-row gap-3">
                    <StatCard label="Total Reportees" value={rows.length} icon={Users2} tone="navy" />
                    <StatCard label="Site Staff" value={siteCount} icon={HardHat} tone="orange" />
                </View>
                <View className="flex-row gap-3">
                    <StatCard label="Office Staff" value={officeCount} icon={Building2} tone="white" />
                    <StatCard label={`Evaluated ${year}`} value={`${doneCount} / ${rows.length}`} icon={Star} tone="white" />
                </View>
            </View>

            <SectionCard title={`Reportees (${filtered.length})`} icon={Users2}>
                <SearchInput
                    value={search}
                    onChangeText={(t) => {
                        setSearch(t);
                        setVisible(PAGE_SIZE);
                    }}
                    placeholder="Search name, ID, CC…"
                />
                {loading.myReportees && rows.length === 0 ? (
                    <LoadingText />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Users2}
                        title="No reportees"
                        subtitle={
                            rows.length === 0
                                ? 'Nobody is mapped to report to you yet. Ask HR to configure Employee Connections.'
                                : 'Nobody matches this search.'
                        }
                    />
                ) : (
                    <>
                        {filtered.slice(0, visible).map((r) => (
                            <ReporteeCard
                                key={r.EmpRefNo}
                                r={r}
                                onEvaluate={() =>
                                    router.push({
                                        pathname: '/employee/performance-evaluation',
                                        params: { empRefNo: r.EmpRefNo, year: String(year) },
                                    })
                                }
                            />
                        ))}
                        {filtered.length > visible && (
                            <TouchableOpacity onPress={() => setVisible((v) => v + PAGE_SIZE)} className="py-2">
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
