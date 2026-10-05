// Shared building blocks for every mobile verification screen, in the Corex look. Mobile
// versions of the web inbox pieces (components/Inbox: InboxListPanel, RemarksHistory,
// ActionButtons, VerificationInput; pages/Accounts/ConfigVerification.jsx Field grid,
// verificationParts.jsx CheckedItemsTable). Screens are a queue list → a detail page.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Linking, ActivityIndicator } from 'react-native';
import {
    CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Circle, FileText, History, RotateCcw, Send, ShieldCheck, ThumbsUp, XCircle,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useApiData } from '@/src/hooks/useApiData';
import { getRemarksHistory, getStatusActions, type RemarkEntry, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { brand } from '@/src/theme/colors';

// ---- Formatting --------------------------------------------------------------------------

// ₹ with Indian grouping and paise when present — ₹12,34,567.50
export const money = (v: number | string | null | undefined) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// ---- Queue -------------------------------------------------------------------------------

export const QueueSummary = ({ count, noun, icon: Icon, loading }: { count: number; noun: string; icon: LucideIcon; loading?: boolean }) => (
    <View className="flex-row items-center gap-4 bg-white rounded-2xl border border-orange-200 p-4 mb-4">
        <View className="w-12 h-12 rounded-xl bg-brand-navy items-center justify-center">
            <Icon size={22} color={brand.orangeLight} />
        </View>
        <View className="flex-1">
            {loading ? <ActivityIndicator color={brand.orange} style={{ alignSelf: 'flex-start' }} /> : (
                <Text className="text-2xl font-bold text-gray-900">{count}</Text>
            )}
            <Text className="text-xs text-gray-500">{noun}{count === 1 ? '' : 's'} awaiting your action</Text>
        </View>
    </View>
);

export const QueueCard = ({
    title, subtitle, meta, amount, returned, badge, onPress,
}: {
    title: string;
    subtitle?: string | null;
    meta?: string | null;
    amount?: string | null;
    returned?: boolean;
    badge?: { label: string; tone: 'green' | 'red' | 'blue' } | null;
    onPress: () => void;
}) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
        <View className="flex-row items-start gap-3">
            <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>{title}</Text>
                {subtitle ? <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            {amount ? <Text className="text-sm font-bold text-brand-navy">{amount}</Text> : null}
        </View>
        <View className="flex-row items-center gap-2 mt-2.5">
            <View className={`px-2 py-0.5 rounded-full ${returned ? 'bg-amber-100' : 'bg-indigo-50'}`}>
                <Text className={`text-[10px] font-semibold ${returned ? 'text-amber-800' : 'text-brand-navy'}`}>
                    {returned ? 'Returned for update' : 'Verification pending'}
                </Text>
            </View>
            {badge ? (
                <View className={`px-2 py-0.5 rounded-full ${badge.tone === 'green' ? 'bg-green-50' : badge.tone === 'red' ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <Text className={`text-[10px] font-semibold ${badge.tone === 'green' ? 'text-green-700' : badge.tone === 'red' ? 'text-red-700' : 'text-blue-700'}`}>
                        {badge.label}
                    </Text>
                </View>
            ) : null}
            <Text className="flex-1 text-[11px] text-gray-400 text-right" numberOfLines={1}>{meta || ''}</Text>
            <ChevronRight size={16} color={brand.orange} />
        </View>
    </TouchableOpacity>
);

// ---- Detail ------------------------------------------------------------------------------

export const DetailHero = ({
    title, amount, amountLabel, chips, returned,
}: {
    title: string;
    amount?: string | null;
    amountLabel?: string;
    chips?: (string | false | null | undefined)[];
    returned?: boolean;
}) => (
    <View className="bg-brand-navy rounded-2xl p-4 mb-4">
        <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-base font-bold text-white">{title}</Text>
            <View className={`px-2 py-0.5 rounded-full ${returned ? 'bg-amber-400/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-semibold ${returned ? 'text-amber-200' : 'text-orange-300'}`}>
                    {returned ? 'Returned' : 'Pending'}
                </Text>
            </View>
        </View>
        {amount ? (
            <View className="mt-3">
                {amountLabel ? <Text className="text-[11px] text-blue-200">{amountLabel}</Text> : null}
                <Text className="text-2xl font-bold text-white" numberOfLines={1} adjustsFontSizeToFit>{amount}</Text>
            </View>
        ) : null}
        {chips && chips.some(Boolean) ? (
            <View className="flex-row flex-wrap gap-1.5 mt-3">
                {chips.filter(Boolean).map((chip) => (
                    <View key={String(chip)} className="px-2 py-0.5 rounded-md bg-white/10">
                        <Text className="text-[11px] font-medium text-orange-200">{chip}</Text>
                    </View>
                ))}
            </View>
        ) : null}
    </View>
);

export type Field = [label: string, value: string | number | null | undefined, wide?: boolean] | false | null | undefined;

// Two-column label/value grid; `wide` fields take the full row (remarks, long names)
export const FieldGrid = ({ fields }: { fields: Field[] }) => (
    <View className="flex-row flex-wrap -mx-1.5">
        {fields.filter(Boolean).map((f) => {
            const [label, value, wide] = f as [string, string | number | null | undefined, boolean?];
            return (
                <View key={label} className={`px-1.5 mb-3 ${wide ? 'w-full' : 'w-1/2'}`}>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</Text>
                    <Text className="text-sm font-semibold text-gray-800">{value || value === 0 ? String(value) : '—'}</Text>
                </View>
            );
        })}
    </View>
);

export const Section = ({ title, right, children }: { title?: string; right?: React.ReactNode; children: React.ReactNode }) => (
    <View className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
        {title ? (
            <View className="flex-row items-center justify-between px-4 pt-3.5 pb-2">
                <Text className="text-sm font-semibold text-gray-900">{title}</Text>
                {right}
            </View>
        ) : null}
        <View className={title ? 'px-4 pb-3' : 'p-4 pb-1'}>{children}</View>
    </View>
);

export const DocumentLinks = ({ links }: { links: { label: string; url: string | null }[] }) => {
    const shown = links.filter((l) => !!l.url);
    if (!shown.length) return null;
    return (
        <Section title="Documents">
            {shown.map((l, i) => (
                <TouchableOpacity
                    key={l.label}
                    onPress={() => Linking.openURL(l.url!).catch(() => Alert.alert('Error', 'Could not open the document'))}
                    className={`flex-row items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                    <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center">
                        <FileText size={16} color={brand.navy} />
                    </View>
                    <Text className="flex-1 text-sm text-gray-800">{l.label}</Text>
                    <ChevronRight size={16} color={brand.orange} />
                </TouchableOpacity>
            ))}
        </Section>
    );
};

export const Notice = ({ tone, title, text }: { tone: 'amber' | 'blue'; title: string; text: string }) => (
    <View className={`rounded-2xl border p-4 mb-4 ${tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <Text className={`text-sm font-semibold ${tone === 'amber' ? 'text-amber-800' : 'text-blue-800'}`}>{title}</Text>
        <Text className={`text-xs mt-1 leading-5 ${tone === 'amber' ? 'text-amber-700' : 'text-blue-700'}`}>{text}</Text>
    </View>
);

// Items the verifier must tick one by one before acting (web CheckedItemsTable)
export const CheckList = <T,>({
    title, items, checked, onChange, renderItem, footer,
}: {
    title: string;
    items: T[];
    checked: Record<number, boolean>;
    onChange: (next: Record<number, boolean>) => void;
    renderItem: (item: T) => React.ReactNode;
    footer?: React.ReactNode;
}) => {
    const done = items.filter((_, i) => checked[i]).length;
    const all = items.length > 0 && done === items.length;
    return (
        <Section
            title={title}
            right={items.length ? (
                <TouchableOpacity onPress={() => onChange(all ? {} : Object.fromEntries(items.map((_, i) => [i, true])))}>
                    <Text className="text-xs font-semibold text-orange-600">{all ? 'Clear all' : 'Check all'}</Text>
                </TouchableOpacity>
            ) : null}
        >
            <Text className="text-[11px] text-gray-500 mb-1">Tick every item to confirm it has been checked — {done}/{items.length} verified</Text>
            {items.map((item, i) => (
                <TouchableOpacity
                    key={i}
                    onPress={() => onChange({ ...checked, [i]: !checked[i] })}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3 py-2.5 border-t border-gray-100"
                >
                    {checked[i] ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#d1d5db" />}
                    <View className="flex-1">{renderItem(item)}</View>
                </TouchableOpacity>
            ))}
            {footer}
        </Section>
    );
};

// ---- Remarks history ---------------------------------------------------------------------

const actionTone = (action = '') => {
    const a = action.toLowerCase();
    if (a.includes('reject')) return 'bg-red-500';
    if (a.includes('return')) return 'bg-amber-500';
    if (a.includes('approv')) return 'bg-green-500';
    if (a.includes('verif')) return 'bg-blue-500';
    return 'bg-gray-400';
};

// Purchase/Remarks by trno + moid, or `load` for screens with their own remarks endpoint (stable function)
export const RemarksTimeline = ({ trno, moid, load: loadOwn }: {
    trno?: string | number | null;
    moid?: string | number | null;
    load?: () => Promise<RemarkEntry[]>;
}) => {
    const [open, setOpen] = useState(true);
    const load = useCallback(() => (loadOwn ? loadOwn() : getRemarksHistory(trno!, moid!)), [loadOwn, trno, moid]);
    const { data, loading } = useApiData(loadOwn || (trno && moid) ? load : null);
    const rows = data ?? [];

    return (
        <Section
            title="Approval history"
            right={(
                <TouchableOpacity onPress={() => setOpen(!open)} className="flex-row items-center gap-1" hitSlop={8}>
                    <History size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-500">{rows.length}</Text>
                    {open ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
                </TouchableOpacity>
            )}
        >
            {!open ? null : loading ? (
                <ActivityIndicator color={brand.orange} style={{ paddingVertical: 12 }} />
            ) : rows.length === 0 ? (
                <Text className="text-xs text-gray-400 py-3 text-center">No remarks yet</Text>
            ) : (
                rows.map((r, i) => (
                    <View key={i} className="flex-row gap-3">
                        <View className="items-center">
                            <View className={`w-2.5 h-2.5 rounded-full mt-1.5 ${actionTone(r.Action)}`} />
                            {i < rows.length - 1 && <View className="flex-1 w-px bg-gray-200 my-1" />}
                        </View>
                        <View className="flex-1 pb-3">
                            <Text className="text-xs font-semibold text-gray-800">
                                {(r.Action || '').trim()} <Text className="font-normal text-gray-600">{(r.ActionBy || '').trim()}</Text>
                            </Text>
                            <Text className="text-[11px] text-gray-400">{[r.ActionRole, r.ActionDate].filter(Boolean).join(' · ')}</Text>
                            {r.ActionRemarks ? <Text className="text-xs text-gray-700 mt-1 leading-5">“{r.ActionRemarks.trim()}”</Text> : null}
                        </View>
                    </View>
                ))
            )}
        </Section>
    );
};

// ---- Actions -----------------------------------------------------------------------------

const ACTION_STYLE: Record<string, { bg: string; icon: LucideIcon }> = {
    Approve: { bg: 'bg-green-600', icon: ThumbsUp },
    Verify: { bg: 'bg-blue-600', icon: ShieldCheck },
    Return: { bg: 'bg-amber-500', icon: RotateCcw },
    Reject: { bg: 'bg-red-600', icon: XCircle },
};

type ActionPanelProps = {
    moid?: string | number | null;
    roleId: string | number;
    chkAmt?: number;
    showReturn?: boolean;
    confirmLabel?: string;                  // "I have verified…" checkbox; omit when not needed
    exclude?: string[];                     // lower-case action types to hide for this record
    onSubmit: (action: StatusAction, note: string) => Promise<void>;
};

// Note + (optional) "I have verified" tick + the buttons GetStatuslist allows for this role
export const ActionPanel = ({ moid, roleId, chkAmt = 0, showReturn = true, confirmLabel, exclude, onSubmit }: ActionPanelProps) => {
    const load = useCallback(() => getStatusActions(moid!, roleId, chkAmt, showReturn), [moid, roleId, chkAmt, showReturn]);
    const { data: allowed, loading, error } = useApiData(moid && roleId ? load : null);
    const actions = exclude?.length ? allowed?.filter((a) => !exclude.includes(a.type.toLowerCase())) : allowed;
    const [note, setNote] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const run = (action: StatusAction) => {
        if (!note.trim()) return Alert.alert('Note required', 'Enter a note before you continue.');
        if (confirmLabel && !confirmed) return Alert.alert('Please confirm', 'Tick the confirmation box after checking the details.');
        Alert.alert(`${action.text}?`, `Are you sure you want to ${action.text.toLowerCase()} this?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: action.text,
                style: action.type === 'Reject' ? 'destructive' : 'default',
                onPress: async () => {
                    setBusy(action.type);
                    try {
                        await onSubmit(action, note.trim());
                    } finally {
                        setBusy(null);
                    }
                },
            },
        ]);
    };

    return (
        <Section title="Your action">
            {confirmLabel ? (
                <TouchableOpacity onPress={() => setConfirmed(!confirmed)} activeOpacity={0.7}
                    className={`flex-row items-center gap-3 p-3 rounded-xl border mb-3 ${confirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    {confirmed ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#9ca3af" />}
                    <Text className="flex-1 text-xs text-gray-700">{confirmLabel}</Text>
                </TouchableOpacity>
            ) : null}

            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Note <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add your verification comments…"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="min-h-[88px] rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 mb-3"
            />

            {loading ? (
                <ActivityIndicator color={brand.orange} style={{ paddingVertical: 12 }} />
            ) : error ? (
                <Text className="text-xs text-red-600 text-center py-3">Could not load the actions. Pull down to retry.</Text>
            ) : !actions?.length ? (
                <Text className="text-xs text-gray-500 text-center py-3">Your role has no action at this step.</Text>
            ) : (
                <View className="flex-row flex-wrap gap-2 mb-1">
                    {actions.map((a) => {
                        const style = ACTION_STYLE[a.type] ?? { bg: 'bg-brand-navy', icon: Send };
                        const Icon = style.icon;
                        return (
                            <TouchableOpacity
                                key={a.type}
                                disabled={!!busy}
                                onPress={() => run(a)}
                                activeOpacity={0.85}
                                className={`flex-row items-center justify-center gap-1.5 rounded-xl py-3 ${style.bg}`}
                                style={{ flexGrow: 1, flexBasis: '45%', opacity: busy && busy !== a.type ? 0.5 : 1 }}
                            >
                                {busy === a.type ? <ActivityIndicator size="small" color="#fff" /> : <Icon size={16} color="#fff" />}
                                <Text className="text-sm font-semibold text-white">{a.text}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </Section>
    );
};

// Success message after a submit; "$" splits the status from extra info the SP returns
export const showSubmitResult = (label: string, status: string, onDone: () => void) => {
    const info = status.includes('$') ? status.split('$')[1]?.trim() : '';
    Alert.alert('Done', `${label}${info ? `\n\n${info}` : ''}`, [{ text: 'OK', onPress: onDone }]);
};
