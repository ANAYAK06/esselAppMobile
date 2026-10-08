// Detail + action for a config-driven verification (web pages/Accounts/ConfigVerification.jsx detail
// panel): hero, field sections, the config's extra blocks, approval history, then either the status
// actions or — for a returned record whose config has one — the inline "correct and resubmit" form.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { FileCheck, RotateCcw, Send } from 'lucide-react-native';
import { getRoute, postRoute, putRoute, dataOf, statusOf } from '@/src/api/verification/configVerificationAPI';
import type { StatusAction } from '@/src/api/verification/verificationCommonAPI';
import DetailSheet, { type SheetContent } from '@/src/components/common/DetailSheet';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText, PrimaryButton } from '@/src/components/employee/PortalUI';
import { DateField, FormField, SelectField, TextField } from '@/src/components/employee/FormControls';
import { useApiData } from '@/src/hooks/useApiData';
import { ACTION_DONE } from '@/src/components/verification/kit/actionText';
import {
    ActionPanel, DetailHero, FieldGrid, Notice, RemarksTimeline, Section, type Field,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import { showDone } from '@/src/components/verification/kit/verificationEvents';
import { VERIFICATION_CONFIGS } from './configs';
import { isOk, routeOf, type Ctx, type Rec, type ResubmitField, type VerificationConfig } from './types';

const text = (v: unknown) => (v === null || v === undefined || v === false ? '' : String(v));

// Config-level lookups + the record's own lookups, keyed by name (a failed lookup is null, as on the web)
const loadAux = async (config: VerificationConfig, row: Rec, record: Rec, ctx: Ctx) => {
    const jobs = [
        ...(config.aux || []).map((a) => [a.name, a.route, a.params ? a.params(ctx) : undefined] as const),
        ...(config.rowAux || [])
            .filter((a) => !a.when || a.when(row, record))
            .map((a) => [a.name, a.route, a.params(row, record, ctx)] as const),
    ];
    const results = await Promise.all(jobs.map(([name, route, params]) =>
        getRoute(route, params).then((body) => [name, dataOf(body) ?? null] as const).catch(() => [name, null] as const)));
    return Object.fromEntries(results) as Rec;
};

export default function ConfigDetail() {
    const { key, path = '', category = '' } = useLocalSearchParams<{ key: string; path?: string; category?: string }>();
    const config = VERIFICATION_CONFIGS[key];
    const row = useRowParam<Rec>();
    const { roleId, uid, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);
    const [ext, setExtState] = useState<Rec>({});
    const [edits, setEdits] = useState<Rec | null>(null);
    const [sheet, setSheet] = useState<SheetContent | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const returned = !!(row && config?.isReturned?.(row));
    const needsDetail = !!config?.detail && (!returned || !!config.resubmit);

    const loadDetail = useCallback(async () => {
        const det = config!.detail!;
        const ctx = { roleId, userId: uid, user: userName, path, category };
        const route = routeOf(det.route, row!);
        const params = det.params(row!, ctx);
        const data = dataOf(det.method === 'post' ? await postRoute(route, params) : await getRoute(route, params));
        // Detail endpoints answer a one-row list or a single object
        const first = Array.isArray(data) ? data[0] ?? null : data ?? null;
        return ((det.select ? det.select(first, row!) : first) ?? null) as Rec | null;
    }, [config, row, roleId, uid, userName, path, category, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const detail = useApiData(config && row && needsDetail ? loadDetail : null);
    const record: Rec | null = !config || !row ? null : needsDetail ? detail.data : row;

    const loadAll = useCallback(
        () => loadAux(config!, row!, record!, { roleId, userId: uid, user: userName, path, category }),
        [config, row, record, roleId, uid, userName, path, category, reloadKey], // eslint-disable-line react-hooks/exhaustive-deps
    );
    const auxState = useApiData(record && (config?.aux || config?.rowAux) ? loadAll : null);
    const aux: Rec = auxState.data ?? {};

    const loadRemarks = useCallback(
        () => config!.remarks!(row!, record!),
        [config, row, record],
    );

    const reload = useCallback(() => setReloadKey((k) => k + 1), []);
    const setExt = useCallback((update: (prev: Rec) => Rec) => setExtState(update), []);
    const openSheet = useCallback((s: SheetContent) => { setSheet(s); setSheetOpen(true); }, []);

    if (!config) {
        return (
            <PortalScreen title="Verification" subtitle="Approvals Inbox" icon={FileCheck} backHref={'/inbox' as Href}>
                <EmptyState title="Unknown verification" subtitle={`No mobile screen is set up for “${key}”.`} />
            </PortalScreen>
        );
    }

    const title = config.title.replace(/ Verification$/, '');
    const backHref = { pathname: '/verification/config/[key]/list', params: { key, path, category } } as unknown as Href;
    const done = (label: string, extra?: string | void) =>
        showDone(`${config.successLabel || title} ${label}${extra ? `\n\n${extra}` : ''}`, () => router.back());

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !record) return;
        const before = config.beforeAction ? await config.beforeAction(action.type, row, record, { aux, ext }) : [];
        if (before === null) return;                                    // cancelled at a confirm
        const errors = Array.isArray(before) ? before : before.errors ?? [];
        if (errors.length) {
            Alert.alert('Check before you continue', errors.join('\n'));
            return;
        }
        const pre = Array.isArray(before) ? {} : before.data ?? {};
        try {
            const payload = config.approve.payload(row, record, {
                action: action.type, value: action.value || action.type, note, user: userName, roleCode, roleId, userId: uid, aux, ext, pre,
            });
            const approveRoute = routeOf(config.approve.route, row);
            const body = config.approve.method === 'post' ? await postRoute(approveRoute, payload) : await putRoute(approveRoute, payload);
            const status = statusOf(body);
            if (!isOk(config.approve.ok, status, row, record, body)) {
                Alert.alert('Not applied', status || `${action.text} was not applied — the server returned no confirmation.`);
                return;
            }
            let extra: string | void = undefined;
            if (config.approve.afterOk) {
                try {
                    extra = await config.approve.afterOk(status, row, record, { action: action.type });
                } catch (e: any) {
                    extra = `${action.type} done, but the follow-up step failed: ${e?.message || e}`;
                }
            }
            // "$" splits the status from extra info some SPs return
            done(ACTION_DONE[action.type] || `${action.type.toLowerCase()}d`, extra || status.split('$')[1]?.trim());
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Error occurred');
        }
    };

    // ---- Returned → inline resubmit form ---------------------------------------------------
    const rs = config.resubmit;
    const derive = (v: Rec) => (rs?.derive ? rs.derive(v) : v);
    const values: Rec = edits ?? (rs && record && row ? derive(rs.initial(row, record, aux)) : {});
    const setValues = (update: (prev: Rec) => Rec) => setEdits((prev) => derive(update(prev ?? values)));

    const resubmit = async () => {
        if (!rs || !row || !record) return;
        const visible = rs.fields.filter((f) => !f.show || f.show(values));
        const errors: string[] = visible.filter((f) => f.required && !String(values[f.key] ?? '').trim()).map((f) => `Enter ${f.label}`);
        if (rs.validate) errors.push(...(rs.validate(values, row, record).filter(Boolean) as string[]));
        if (errors.length) return Alert.alert('Check the form', errors.join('\n'));
        setBusy(true);
        try {
            const payload = rs.payload(row, record, values, { user: userName, roleCode, roleId, userId: uid });
            const route = routeOf(rs.route, row);
            const status = statusOf(rs.method === 'post' ? await postRoute(route, payload) : await putRoute(route, payload));
            if (!isOk(rs.ok, status, row, record)) {
                Alert.alert('Not updated', status || 'Update was not applied — the server returned no confirmation.');
                return;
            }
            done('updated successfully');
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to update');
        } finally {
            setBusy(false);
        }
    };

    const renderField = (f: ResubmitField) => {
        const value = text(values[f.key]);
        const onChange = (v: string) => {
            if (f.filter && v !== '' && !f.filter.test(v)) return;
            setValues((p) => ({ ...p, [f.key]: v }));
        };
        let input: React.ReactNode;
        if (f.readOnly) {
            input = <Text className="text-sm font-semibold text-gray-800">{value || '—'}</Text>;
        } else if (f.type === 'select') {
            const options = (typeof f.options === 'function' ? f.options(aux) : f.options) || [];
            input = <SelectField title={f.label} value={value} options={options} onChange={onChange} />;
        } else if (f.type === 'date') {
            input = <DateField title={f.label} value={value} onChange={onChange} />;
        } else {
            input = (
                <TextField
                    value={value}
                    onChangeText={onChange}
                    multiline={f.type === 'textarea'}
                    maxLength={f.maxLength}
                    keyboardType={f.filter && /\\d/.test(f.filter.source) ? 'decimal-pad' : 'default'}
                />
            );
        }
        return <FormField key={f.key} label={f.label} required={f.required && !f.readOnly}>{input}</FormField>;
    };

    // ---- Render ----------------------------------------------------------------------------
    const header = row && record ? config.header : null;
    const subtitle = header ? text(header.subtitle(row!, record!)) : '';
    const money = subtitle.startsWith('₹') ? subtitle : null;
    const chips = header ? [money ? null : subtitle, ...((header.chips?.(row!, record!) || []).map(text))] : [];
    const sections = row && record && config.sections
        ? config.sections(row, record).filter((s): s is Exclude<typeof s, false | null | undefined | ''> => !!s && s.fields.some(Boolean))
        : [];
    const moid = row && record ? config.moid(row, record) : null;
    const remarksKey = row && record && config.remarksKey ? config.remarksKey(row, record) : null;

    return (
        <PortalScreen
            title={title}
            subtitle={row ? text(config.card.title(row)) : undefined}
            icon={config.icon}
            backHref={backHref}
            onRefresh={() => { setReloadKey((k) => k + 1); setEdits(null); }}
        >
            {!row ? (
                <EmptyState title={`${config.noun[0].toUpperCase()}${config.noun.slice(1)} not found`} subtitle="Go back and open it again from the list." />
            ) : returned && !rs ? (
                <Notice
                    tone="amber"
                    title={`${text(config.card.title(row))} was returned for update`}
                    text={config.returnedNotice || 'Correct and resubmit it from its entry screen — there is nothing to verify until it is resubmitted.'}
                />
            ) : !record && detail.loading ? (
                <LoadingText label={`Loading ${config.noun}…`} />
            ) : !record ? (
                <EmptyState title="Details could not be loaded" subtitle="It may no longer be pending at your level. Pull down to try again." />
            ) : (
                <>
                    <DetailHero title={text(header!.title(row, record)) || '—'} amount={money} chips={chips} returned={returned} />
                    {sections.map((s, i) => (
                        <Section key={s.title || i} title={s.title}>
                            <FieldGrid fields={s.fields.map((f) => (f ? [f[0], f[1] === null || f[1] === undefined ? null : text(f[1]), f[2]] : null) as Field)} />
                        </Section>
                    ))}
                    {config.extra && (!config.rowAux || auxState.data || !auxState.loading)
                        ? config.extra(row, record, { aux, ext, setExt, openSheet, reload, roleId, userId: uid, user: userName })
                        : config.extra ? <LoadingText /> : null}
                    {config.remarks ? <RemarksTimeline load={loadRemarks} />
                        : remarksKey && moid ? <RemarksTimeline trno={remarksKey} moid={moid} /> : null}

                    {returned && rs ? (
                        <Section title="Returned for update — correct and resubmit">
                            <View className="flex-row items-center gap-2 mb-3">
                                <RotateCcw size={14} color="#b45309" />
                                <Text className="flex-1 text-xs text-amber-700">Fix the details below and resubmit for verification.</Text>
                            </View>
                            {rs.fields.filter((f) => !f.show || f.show(values)).map(renderField)}
                            {rs.render ? rs.render(row, record, { aux, values, setValues }) : null}
                            <PrimaryButton label="Resubmit" icon={Send} onPress={resubmit} loading={busy} disabled={busy} />
                        </Section>
                    ) : config.actions ? (
                        config.actions(row, record, {
                            aux, ext, setExt, openSheet, reload, roleId, userId: uid, user: userName,
                            done: (message) => showDone(message, () => router.back()),
                        })
                    ) : (
                        <ActionPanel
                            moid={moid}
                            roleId={roleId}
                            chkAmt={Number(config.chkAmt?.(row, record)) || 0}
                            showReturn={config.showReturn === 'Yes'}
                            exclude={config.excludeActions?.(row, record)}
                            confirmLabel={config.confirmLabel}
                            onSubmit={submit}
                        />
                    )}
                </>
            )}
            <DetailSheet visible={sheetOpen} sheet={sheet} onClose={() => setSheetOpen(false)} />
        </PortalScreen>
    );
}
