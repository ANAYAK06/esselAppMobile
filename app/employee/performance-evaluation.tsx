// app/employee/performance-evaluation.tsx
// Mirrors the Corex web portal's PerformanceEvaluation page
// (pages/EmployeePortal/pages/PerformanceEvaluation.jsx): annual 1–10 rating per category.
// The web slider becomes a row of 1–10 buttons on mobile.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ClipboardList, Lock, Pencil, Star } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    clearReporteeEvaluation,
    fetchMyReportees,
    fetchReporteeEvaluation,
} from '@/src/slice/hr/employeePortalSlice';
import { saveReporteeEvaluation } from '@/src/api/hr/employeePortalAPI';
import type { EvaluationLine, ReporteeEvaluation } from '@/src/api/hr/employeePortalAPI';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import {
    Badge, EmptyState, LoadingText, PrimaryButton, SecondaryButton, SectionCard,
} from '@/src/components/employee/PortalUI';
import { FormField, SelectField, TextField } from '@/src/components/employee/FormControls';
import { cleanError, errorText } from '@/src/components/employee/portalFormat';
import { brand } from '@/src/theme/colors';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - i)).map((y) => ({ label: y, value: y }));

const scoreTone = (n: number | null | undefined) =>
    n == null
        ? ['bg-gray-100', 'text-gray-400']
        : n <= 3
            ? ['bg-rose-100', 'text-rose-700']
            : n <= 6
                ? ['bg-amber-100', 'text-amber-700']
                : ['bg-emerald-100', 'text-emerald-700'];

const toneHex = (n: number) => (n <= 3 ? '#e11d48' : n <= 6 ? '#f59e0b' : '#10b981');

type Ratings = Record<string, number>;
type Remarks = Record<string, string>;

function CategoryCard({
    line, rating, remark, remarkOpen, readOnly, onRate, onRemark, onToggleRemark,
}: {
    line: EvaluationLine;
    rating: number | null;
    remark: string;
    remarkOpen: boolean;
    readOnly: boolean;
    onRate: (value: number) => void;
    onRemark: (value: string) => void;
    onToggleRemark: () => void;
}) {
    const [bg, text] = scoreTone(rating);
    const showRemark = readOnly ? !!remark : remarkOpen;

    return (
        <View className="rounded-xl border border-gray-200 bg-white p-3 mb-3">
            <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                    <Text className="text-[13px] font-semibold text-gray-800">{line.CategoryName}</Text>
                    {line.Description ? (
                        <Text className="text-[11px] text-gray-500 mt-0.5" numberOfLines={3}>{line.Description}</Text>
                    ) : null}
                </View>
                <View className="flex-row items-center gap-1.5">
                    <View className={`w-8 h-8 rounded-md items-center justify-center ${bg}`}>
                        <Text className={`text-xs font-bold ${text}`}>{rating ?? '—'}</Text>
                    </View>
                    {!readOnly && (
                        <TouchableOpacity
                            onPress={onToggleRemark}
                            className={`w-8 h-8 rounded-md items-center justify-center border ${
                                remark || remarkOpen ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                            }`}
                        >
                            <Pencil size={14} color={remark || remarkOpen ? brand.orange : '#9ca3af'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View className="flex-row gap-1 mt-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const active = rating != null && n <= rating;
                    return (
                        <TouchableOpacity
                            key={n}
                            disabled={readOnly}
                            onPress={() => onRate(n)}
                            className="flex-1 h-8 rounded-md items-center justify-center"
                            style={{
                                backgroundColor: active ? toneHex(rating!) : '#f3f4f6',
                                opacity: readOnly && !active ? 0.6 : 1,
                            }}
                        >
                            <Text className={`text-[11px] font-semibold ${active ? 'text-white' : 'text-gray-500'}`}>{n}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View className="flex-row justify-between mt-1">
                <Text className="text-[9px] text-gray-400">1 · Poor</Text>
                <Text className="text-[9px] text-gray-400">{rating == null ? 'Tap to rate' : ''}</Text>
                <Text className="text-[9px] text-gray-400">10 · Excellent</Text>
            </View>

            {showRemark && (
                <View className="mt-2">
                    <TextField
                        value={remark}
                        onChangeText={onRemark}
                        editable={!readOnly}
                        placeholder="Optional note for this category"
                    />
                </View>
            )}
        </View>
    );
}

// Seed the form from a freshly loaded evaluation
const formFrom = (evaluation: ReporteeEvaluation | null) => {
    const ratings: Ratings = {};
    const remarks: Remarks = {};
    const open: Record<string, boolean> = {};
    (evaluation?.Lines || []).forEach((l) => {
        const id = String(l.CategoryId);
        if (l.Rating != null) ratings[id] = Number(l.Rating);
        if (l.Remarks) {
            remarks[id] = l.Remarks;
            open[id] = true;
        }
    });
    return { ratings, remarks, open, overall: evaluation?.Context?.OverallRemarks || '' };
};

export default function PerformanceEvaluation() {
    const dispatch = useAppDispatch();
    const params = useLocalSearchParams<{ empRefNo?: string; year?: string }>();
    const { empRefNo, username } = useEmployee();
    const { myReportees, reporteeEvaluation, loading, errors } = useAppSelector((s) => s.employeePortal);

    const [selectedEmp, setSelectedEmp] = useState(params.empRefNo || '');
    const [year, setYear] = useState(Number(params.year) || CURRENT_YEAR);
    const [form, setForm] = useState(() => formFrom(null));
    const [seededFrom, setSeededFrom] = useState<ReporteeEvaluation | null>(null);
    const [saving, setSaving] = useState(false);

    // Re-seed the form whenever a new evaluation arrives (derived during render, not in an effect)
    if (reporteeEvaluation !== seededFrom) {
        setSeededFrom(reporteeEvaluation);
        setForm(formFrom(reporteeEvaluation));
    }

    // Reportee picker source
    useEffect(() => {
        if (empRefNo && myReportees.length === 0) dispatch(fetchMyReportees({ empRefNo, periodYear: year }));
        // Only on open; the reportees list refreshes after a save
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, empRefNo]);

    const loadEvaluation = useCallback(() => {
        if (!empRefNo || !selectedEmp) {
            dispatch(clearReporteeEvaluation());
            return Promise.resolve();
        }
        return dispatch(fetchReporteeEvaluation({ empRefNo: selectedEmp, reportingPersonEmpRefNo: empRefNo, periodYear: year }));
    }, [dispatch, empRefNo, selectedEmp, year]);

    useEffect(() => {
        loadEvaluation();
    }, [loadEvaluation]);

    useEffect(() => () => {
        dispatch(clearReporteeEvaluation());
    }, [dispatch]);

    const ctx = reporteeEvaluation?.Context || null;
    const lines = reporteeEvaluation?.Lines || [];
    const readOnly = ctx?.EvaluationStatus === 'Submitted';
    const ratedCount = lines.filter((l) => form.ratings[String(l.CategoryId)] != null).length;
    const allRated = lines.length > 0 && ratedCount === lines.length;
    const avg = ratedCount
        ? lines.reduce((s, l) => s + (form.ratings[String(l.CategoryId)] || 0), 0) / ratedCount
        : 0;

    const save = async (status: 'Draft' | 'Submitted') => {
        if (!selectedEmp) return Alert.alert('Pick a reportee first');
        if (status === 'Submitted' && !allRated) return Alert.alert('Rate every category before submitting');

        const details = lines
            .filter((l) => status === 'Submitted' || form.ratings[String(l.CategoryId)] != null)
            .map((l) => ({
                CategoryId: l.CategoryId,
                Rating: form.ratings[String(l.CategoryId)] || 0,
                Remarks: form.remarks[String(l.CategoryId)] || null,
            }));
        if (details.length === 0) return Alert.alert('Give at least one rating first');

        setSaving(true);
        try {
            const result = await saveReporteeEvaluation({
                EmpRefNo: selectedEmp,
                ReportingPersonId: empRefNo,
                PeriodYear: year,
                OverallRemarks: form.overall || null,
                Status: status,
                CreatedBy: username || empRefNo,
                Details: details,
            });
            const txt = typeof result?.Data === 'string' ? result.Data : '';
            if (!/^saved$/i.test(txt) && !/^submitted$/i.test(txt)) {
                throw new Error(cleanError(txt, 'Failed to save evaluation'));
            }
            Alert.alert(status === 'Submitted' ? 'Evaluation submitted' : 'Draft saved');
            loadEvaluation();
            dispatch(fetchMyReportees({ empRefNo, periodYear: year }));
        } catch (error) {
            Alert.alert('Could not save', errorText(error, 'Failed to save evaluation'));
        } finally {
            setSaving(false);
        }
    };

    const confirmSubmit = () =>
        Alert.alert('Submit evaluation?', 'A submitted evaluation cannot be changed afterwards.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Submit', onPress: () => save('Submitted') },
        ]);

    const ctxPairs: [string, string | number | undefined][] = ctx
        ? [
            ['Emp Ref', ctx.EmpRefNo],
            ['Period', ctx.PeriodYear],
            ['Designation', ctx.DesignationName],
            ['Department', ctx.DepartmentName],
            ['Cost Center', [ctx.JoiningCostCenter, ctx.CCName].filter(Boolean).join(' · ')],
            ['CC Type', ctx.CCType],
            ...(readOnly ? ([['Submitted On', ctx.SubmittedOn]] as [string, string | undefined][]) : []),
        ]
        : [];

    const setRating = (id: string, value: number) => setForm((f) => ({ ...f, ratings: { ...f.ratings, [id]: value } }));
    const setRemark = (id: string, value: string) => setForm((f) => ({ ...f, remarks: { ...f.remarks, [id]: value } }));
    const toggleRemark = (id: string) => setForm((f) => ({ ...f, open: { ...f.open, [id]: !f.open[id] } }));

    return (
        <PortalScreen
            title="Performance Evaluation"
            subtitle="Annual review — 1 (poor) to 10 (excellent)"
            icon={Star}
            onRefresh={loadEvaluation}
        >
            <View className="flex-row gap-3">
                <View className="flex-1">
                    <FormField label="Reportee">
                        <SelectField
                            title="Select Reportee"
                            value={selectedEmp}
                            onChange={setSelectedEmp}
                            placeholder={loading.myReportees ? 'Loading…' : 'Select reportee…'}
                            options={myReportees.map((r) => ({
                                label: `${r.EmployeeName?.trim()} (${r.EmpRefNo})`,
                                value: r.EmpRefNo,
                            }))}
                        />
                    </FormField>
                </View>
                <View style={{ width: 96 }}>
                    <FormField label="Year">
                        <SelectField title="Evaluation Year" value={String(year)} onChange={(y) => setYear(Number(y))} options={YEAR_OPTIONS} />
                    </FormField>
                </View>
            </View>

            {!selectedEmp ? (
                <SectionCard>
                    <EmptyState icon={Star} title="Pick a reportee" subtitle="Choose an employee above to start their annual evaluation." />
                </SectionCard>
            ) : loading.reporteeEvaluation && (ctx?.EmpRefNo !== selectedEmp || Number(ctx?.PeriodYear) !== year) ? (
                <LoadingText />
            ) : errors.reporteeEvaluation ? (
                <SectionCard>
                    <EmptyState icon={Star} title="Could not load" subtitle={String(errors.reporteeEvaluation)} />
                </SectionCard>
            ) : !ctx ? (
                <SectionCard>
                    <EmptyState icon={Star} title="No data" subtitle="This reportee's details could not be found." />
                </SectionCard>
            ) : (
                <>
                    {/* Context strip */}
                    <View className="rounded-xl border border-gray-200 bg-white px-4 py-3 mb-4">
                        <View className="flex-row items-center gap-2 flex-wrap">
                            <ClipboardList size={16} color={brand.orangeLight} />
                            <Text className="text-sm font-bold text-gray-800 flex-shrink" numberOfLines={1}>
                                {ctx.EmployeeName?.trim()}
                            </Text>
                            <Badge
                                label={ctx.StaffType === 'Site' ? 'Site' : 'Office'}
                                tone={ctx.StaffType === 'Site' ? { bg: 'bg-amber-100', text: 'text-amber-700' } : { bg: 'bg-sky-100', text: 'text-sky-700' }}
                            />
                            {readOnly && (
                                <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100">
                                    <Lock size={11} color="#047857" />
                                    <Text className="text-xs font-semibold text-emerald-700">Submitted</Text>
                                </View>
                            )}
                        </View>
                        {readOnly && ctx.OverallRating != null && (
                            <Text className="text-xs text-gray-500 mt-1.5">
                                Overall <Text className="font-semibold text-gray-800">{Number(ctx.OverallRating).toFixed(1)}</Text> / 10
                            </Text>
                        )}
                        <View className="flex-row flex-wrap mt-2">
                            {ctxPairs.map(([k, v]) => (
                                <View key={k} className="w-1/2 mb-1.5 pr-2">
                                    <Text className="text-[10px] uppercase tracking-wide text-gray-400">{k}</Text>
                                    <Text className="text-xs font-medium text-gray-800" numberOfLines={1}>{v || '—'}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <SectionCard
                        title={`${ctx.StaffType === 'Site' ? 'Site' : 'Office'} Staff Categories (${ratedCount}/${lines.length})`}
                        icon={Star}
                        action={
                            !readOnly && ratedCount > 0 ? (
                                <Text className="text-xs text-gray-500">
                                    Avg <Text className="font-semibold text-gray-700">{avg.toFixed(1)}</Text>
                                </Text>
                            ) : undefined
                        }
                    >
                        {lines.length === 0 ? (
                            <EmptyState icon={Star} title="No categories" subtitle="No active evaluation categories are configured for this staff type." />
                        ) : (
                            lines.map((l) => {
                                const id = String(l.CategoryId);
                                return (
                                    <CategoryCard
                                        key={id}
                                        line={l}
                                        rating={form.ratings[id] ?? null}
                                        remark={form.remarks[id] || ''}
                                        remarkOpen={!!form.open[id]}
                                        readOnly={readOnly}
                                        onRate={(v) => setRating(id, v)}
                                        onRemark={(v) => setRemark(id, v)}
                                        onToggleRemark={() => toggleRemark(id)}
                                    />
                                );
                            })
                        )}

                        <View className="mt-1 pt-3 border-t border-gray-100">
                            <FormField label="Overall Remarks">
                                <TextField
                                    value={form.overall}
                                    onChangeText={(t) => setForm((f) => ({ ...f, overall: t }))}
                                    editable={!readOnly}
                                    placeholder="Summary of the year — strengths, areas to improve, goals"
                                    multiline
                                />
                            </FormField>

                            {!readOnly ? (
                                <View className="gap-2">
                                    <PrimaryButton
                                        label={saving ? 'Submitting…' : 'Submit Evaluation'}
                                        icon={CheckCircle2}
                                        loading={saving}
                                        disabled={!allRated}
                                        onPress={confirmSubmit}
                                    />
                                    <SecondaryButton
                                        label={saving ? 'Saving…' : 'Save Draft'}
                                        disabled={saving || ratedCount === 0}
                                        onPress={() => save('Draft')}
                                    />
                                    {!allRated && (
                                        <Text className="text-[11px] text-gray-400 text-center">
                                            Rate all {lines.length} categories to enable Submit.
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <SecondaryButton label="Back to Reportees" onPress={() => router.back()} />
                            )}
                        </View>
                    </SectionCard>
                </>
            )}
        </PortalScreen>
    );
}
