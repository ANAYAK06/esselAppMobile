// Mobile counterparts of the Corex web department-dashboard building blocks
// (RAPP-SLAPP frontend: pages/Dashboard/StatTile.jsx, NeedsAttentionCard.jsx, SummaryCard.jsx,
// MonthComparisonCard.jsx). Same wording and colours, restacked for a phone-width column.
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { brand } from '@/src/theme/colors';

// ---- Formatting --------------------------------------------------------------------------

// Whole rupees in Indian grouping — ₹12,34,567
export const rupees = (amount: number | null | undefined) =>
    `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;

// Compact Indian notation for headline numbers — ₹4.39 Cr, ₹12.5 L, ₹8.2 K
export const compactRupees = (amount: number | null | undefined) => {
    const value = Number(amount) || 0;
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
    return `${sign}₹${abs.toFixed(0)}`;
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ---- Tones -------------------------------------------------------------------------------

export type Tone = 'blue' | 'orange' | 'red' | 'green' | 'purple' | 'navy';

export const TONES: Record<Tone, { bg: string; soft: string; text: string; color: string }> = {
    blue: { bg: 'bg-blue-100', soft: 'bg-blue-50', text: 'text-blue-600', color: '#2563eb' },
    orange: { bg: 'bg-orange-100', soft: 'bg-orange-50', text: 'text-orange-600', color: '#ea580c' },
    red: { bg: 'bg-red-100', soft: 'bg-red-50', text: 'text-red-600', color: '#dc2626' },
    green: { bg: 'bg-green-100', soft: 'bg-green-50', text: 'text-green-600', color: '#16a34a' },
    purple: { bg: 'bg-purple-100', soft: 'bg-purple-50', text: 'text-purple-600', color: '#9333ea' },
    navy: { bg: 'bg-indigo-100', soft: 'bg-indigo-50', text: 'text-brand-navy', color: brand.navy },
};

// ---- Primitives --------------------------------------------------------------------------

export const Spinner = ({ color = brand.orange }: { color?: string }) => (
    <ActivityIndicator size="small" color={color} />
);

export const IconBadge = ({ icon: Icon, tone = 'blue', size = 32 }: { icon: LucideIcon; tone?: Tone; size?: number }) => (
    <View
        className={`rounded-lg items-center justify-center ${TONES[tone].bg}`}
        style={{ width: size, height: size }}
    >
        <Icon size={size * 0.5} color={TONES[tone].color} />
    </View>
);

export const Pill = ({ label, tone = 'orange' }: { label: string; tone?: Tone | 'gray' }) => {
    const style = tone === 'gray' ? { soft: 'bg-gray-100', text: 'text-gray-600' } : TONES[tone];
    return (
        <View className={`px-2.5 py-1 rounded-full ${style.soft}`}>
            <Text className={`text-[11px] font-semibold ${style.text}`} numberOfLines={1}>{label}</Text>
        </View>
    );
};

export const EmptyText = ({ label }: { label: string }) => (
    <Text className="text-xs text-gray-400 py-6 text-center">{label}</Text>
);

// White card with an optional header row
export const Card = ({
    title,
    subtitle,
    right,
    children,
    padded = true,
}: {
    title?: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
    padded?: boolean;
}) => (
    <View className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
        {title ? (
            <View className="flex-row items-start justify-between gap-3 px-4 pt-4 pb-2">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{title}</Text>
                    {subtitle ? <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text> : null}
                </View>
                {right}
            </View>
        ) : null}
        <View className={padded ? 'px-4 pb-4 pt-1' : ''}>{children}</View>
    </View>
);

// Upper-case eyebrow + big title, e.g. "STORE & PURCHASE / Procurement overview"
export const SectionTitle = ({ eyebrow, title, note }: { eyebrow?: string; title: string; note?: string }) => (
    <View className="mb-3 mt-1">
        {eyebrow ? <Text className="text-[11px] font-semibold tracking-wider text-gray-500">{eyebrow}</Text> : null}
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
        {note ? <Text className="text-xs text-gray-500 mt-0.5">{note}</Text> : null}
    </View>
);

// Thin proportional bar; segments are { value, color }
export const SegmentBar = ({ segments, height = 6 }: { segments: { value: number; color: string }[]; height?: number }) => {
    const total = segments.reduce((sum, s) => sum + Math.max(0, s.value || 0), 0);
    return (
        <View className="flex-row w-full rounded-full overflow-hidden bg-gray-100" style={{ height }}>
            {total > 0
                ? segments
                    .filter((s) => s.value > 0)
                    .map((s, i) => <View key={i} style={{ flex: s.value, backgroundColor: s.color }} />)
                : <View className="flex-1 bg-gray-200" />}
        </View>
    );
};

// ---- Tiles -------------------------------------------------------------------------------

// Navy gradient headline tile (HR Active Headcount, Accounts Cash in hand, Admin headcounts)
export const HeadlineTile = ({
    title,
    value,
    subtitle,
    icon: Icon,
    loading,
    onPress,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    loading?: boolean;
    onPress?: () => void;
}) => {
    const body = (
        <LinearGradient
            colors={[brand.navy, '#16247f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 16, flexGrow: 1 }}
        >
            <View className="flex-row items-start justify-between">
                <Text className="text-xs font-medium text-blue-100 flex-1" numberOfLines={1}>{title}</Text>
                <View className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center">
                    <Icon size={16} color="#ffffff" />
                </View>
            </View>
            <View className="mt-2 min-h-[36px] justify-center">
                {loading ? (
                    <Spinner color="#ffffff" />
                ) : (
                    <Text className="text-3xl font-bold text-white" numberOfLines={1} adjustsFontSizeToFit>
                        {value}
                    </Text>
                )}
            </View>
            {subtitle ? <Text className="text-[11px] text-blue-200 mt-1" numberOfLines={1}>{subtitle}</Text> : null}
        </LinearGradient>
    );
    return onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>{body}</TouchableOpacity>
    ) : (
        <View style={{ flex: 1 }}>{body}</View>
    );
};

// White tile, two per row (the web's MiniStatTile). Tappable only with onPress.
export const MiniTile = ({
    title,
    value,
    subtitle,
    icon,
    tone = 'blue',
    loading,
    onPress,
}: {
    title: string;
    value: string | number | null | undefined;
    subtitle?: string;
    icon: LucideIcon;
    tone?: Tone;
    loading?: boolean;
    onPress?: () => void;
}) => {
    const Wrapper = onPress ? TouchableOpacity : View;
    return (
        <Wrapper
            onPress={onPress}
            activeOpacity={0.8}
            className={`flex-1 bg-white rounded-2xl border p-3.5 ${onPress ? 'border-orange-200' : 'border-gray-200'}`}
        >
            <View className="flex-row items-start justify-between gap-2">
                <Text className="text-xs font-medium text-gray-500 flex-1" numberOfLines={2}>{title}</Text>
                <IconBadge icon={icon} tone={tone} size={28} />
            </View>
            <View className="mt-2 min-h-[32px] justify-center">
                {loading ? (
                    <Spinner color={TONES[tone].color} />
                ) : (
                    <Text className="text-2xl font-bold text-gray-900" numberOfLines={1} adjustsFontSizeToFit>
                        {value ?? 0}
                    </Text>
                )}
            </View>
            <View className="flex-row items-center justify-between mt-0.5">
                {subtitle ? <Text className="text-[11px] text-gray-400 flex-1" numberOfLines={1}>{subtitle}</Text> : <View />}
                {onPress ? <ChevronRight size={14} color={brand.orange} /> : null}
            </View>
        </Wrapper>
    );
};

export const TileRow = ({ children }: { children: React.ReactNode }) => (
    <View className="flex-row gap-3 mb-3">{children}</View>
);

// ---- Needs attention ---------------------------------------------------------------------

export type AttentionRow = {
    key: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    tone: Tone;
    dueLabel: string;
    count?: number | null; // null = no data source yet ("No data yet")
};

export const NeedsAttentionCard = ({
    subtitle,
    rows,
    loading,
    onOpen,
}: {
    subtitle: string;
    rows: AttentionRow[];
    loading?: boolean;
    onOpen?: (key: string) => void;
}) => {
    const needsAction = rows.filter((r) => (r.count || 0) > 0).length;
    return (
        <Card
            title="Needs attention"
            subtitle={subtitle}
            right={needsAction > 0 ? <Pill label={`${needsAction} need${needsAction === 1 ? 's' : ''} action`} /> : null}
        >
            {rows.map((row, index) => {
                const count = row.count || 0;
                const noData = row.count === null;
                const clickable = count > 0 && !!onOpen;
                const Wrapper = clickable ? TouchableOpacity : View;
                return (
                    <Wrapper
                        key={row.key}
                        onPress={() => onOpen?.(row.key)}
                        activeOpacity={0.7}
                        className={`flex-row items-center gap-3 py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                        <IconBadge icon={row.icon} tone={row.tone} />
                        <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{row.title}</Text>
                            <Text className="text-[11px] text-gray-400" numberOfLines={1}>
                                {row.subtitle} · {row.dueLabel}
                            </Text>
                        </View>
                        {loading ? (
                            <Spinner color={TONES[row.tone].color} />
                        ) : noData ? (
                            <Text className="text-[11px] font-medium text-gray-400">No data yet</Text>
                        ) : (
                            <View className="items-end">
                                <Text className={`text-lg font-bold ${count > 0 ? TONES[row.tone].text : 'text-gray-300'}`}>{count}</Text>
                                <Text className={`text-[10px] font-semibold ${clickable ? 'text-blue-600' : 'text-green-600'}`}>
                                    {clickable ? 'View list ›' : 'All clear'}
                                </Text>
                            </View>
                        )}
                    </Wrapper>
                );
            })}
        </Card>
    );
};

// ---- Breakdown (Receivables / Payables / GST) --------------------------------------------

export type BreakdownRow =
    | { divider: true }
    // `id` is the React key when the label repeats within a card (e.g. two "IGST · CGST · SGST" rows)
    | { id?: string; label: string; value?: number | null; dot?: string; bold?: boolean; sub?: boolean; text?: string; valueClass?: string };

// The web's SummaryCard: tinted header with total, proportion bar, then label/amount rows.
// Bar colours come from each row's `dot` (a hex colour) before the first divider.
export const BreakdownCard = ({
    title,
    subtitle,
    icon,
    tone,
    total,
    loading,
    hasData,
    rows,
    bar,
    footnote,
}: {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    tone: Tone;
    total: number | null | undefined;
    loading?: boolean;
    hasData: boolean;
    rows: BreakdownRow[];
    bar?: { value: number; color: string }[];
    footnote?: string;
}) => (
    <View className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden">
        <View className={`flex-row items-center justify-between gap-2 px-3.5 py-3 ${TONES[tone].soft}`}>
            <View className="flex-row items-center gap-2.5 flex-1">
                <IconBadge icon={icon} tone={tone} />
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{title}</Text>
                    <Text className="text-[11px] text-gray-500" numberOfLines={1}>{subtitle}</Text>
                </View>
            </View>
            {loading ? <Spinner color={TONES[tone].color} /> : (
                <Text className="text-base font-bold text-gray-900">{rupees(total)}</Text>
            )}
        </View>
        <View className="px-3.5 py-2.5">
            {loading || !hasData ? (
                <EmptyText label={loading ? 'Loading…' : 'No data available'} />
            ) : (
                <>
                    {bar ? <View className="mb-2"><SegmentBar segments={bar} /></View> : null}
                    {rows.map((row, i) =>
                        'divider' in row ? (
                            <View key={`d${i}`} className="my-1.5 border-t border-dashed border-gray-200" />
                        ) : (
                            <View key={row.id ?? row.label} className={`flex-row items-center justify-between ${row.sub ? 'py-0.5 pl-4' : 'py-1'}`}>
                                <View className="flex-row items-center flex-1">
                                    {row.dot ? <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: row.dot }} /> : null}
                                    <Text
                                        className={`${row.sub ? 'text-[11px] text-gray-500' : 'text-xs text-gray-600'} ${row.bold ? 'font-semibold' : ''}`}
                                        numberOfLines={1}
                                    >
                                        {row.label}
                                    </Text>
                                </View>
                                <Text
                                    className={`${row.sub ? 'text-[11px]' : 'text-xs'} ${row.bold ? 'font-bold' : 'font-medium'} ${row.valueClass || 'text-gray-900'}`}
                                >
                                    {row.text ?? rupees(row.value)}
                                </Text>
                            </View>
                        ),
                    )}
                    {footnote ? <Text className="text-[10px] text-gray-400 mt-1">{footnote}</Text> : null}
                </>
            )}
        </View>
    </View>
);

// ---- Sales / Purchase this month ---------------------------------------------------------

export const MonthComparisonCard = ({
    title,
    icon,
    tone,
    barColor,
    loading,
    current,
    previous,
    unfavorable,
}: {
    title: string;
    icon: LucideIcon;
    tone: Tone;
    barColor: string;
    loading?: boolean;
    current: number;
    previous: number;
    unfavorable?: boolean; // purchase going up reads red, not green
}) => {
    const growth = previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;
    const favorable = growth === 0 ? null : growth > 0 ? !unfavorable : !!unfavorable;
    const max = Math.max(current, previous, 1);
    return (
        <View className="flex-1 bg-white rounded-2xl border border-gray-200 p-3.5">
            <View className="flex-row items-start justify-between gap-2">
                <Text className="text-xs font-medium text-gray-500 flex-1" numberOfLines={2}>{title}</Text>
                <IconBadge icon={icon} tone={tone} size={28} />
            </View>
            <View className="mt-1.5 min-h-[30px] justify-center">
                {loading ? <Spinner color={TONES[tone].color} /> : (
                    <Text className="text-xl font-bold text-gray-900" numberOfLines={1} adjustsFontSizeToFit>
                        {compactRupees(current)}
                    </Text>
                )}
            </View>
            <View className="flex-row mt-1 mb-2.5">
                <View className={`px-1.5 py-0.5 rounded-full ${favorable === null ? 'bg-gray-100' : favorable ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Text className={`text-[10px] font-semibold ${favorable === null ? 'text-gray-500' : favorable ? 'text-green-600' : 'text-red-600'}`}>
                        {growth === 0 ? 'No change' : `${growth > 0 ? '↑' : '↓'}${Math.abs(growth)}% vs last month`}
                    </Text>
                </View>
            </View>
            {[
                { label: 'This month', value: current, color: barColor },
                { label: 'Last month', value: previous, color: '#d1d5db' },
            ].map((r) => (
                <View key={r.label} className="flex-row items-center gap-1.5 mt-1">
                    <Text className="text-[10px] text-gray-400 w-[54px]">{r.label}</Text>
                    <View className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <View className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color }} />
                    </View>
                </View>
            ))}
        </View>
    );
};
