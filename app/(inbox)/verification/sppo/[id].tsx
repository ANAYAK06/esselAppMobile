// SPPO verification — service lines with lower-only rate editing, tick every line, then
// verify / approve (web: pages/SPPO/VerifySPPO.jsx). Return is not offered on this page.
// The edited rates are only a check aid, as on the web: the payload is the fields legacy ApproveSPPO
// posts, with the PO's stored terms / total (spApproveSPPO rewrites the terms on every action).
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import { approveSPPO, getSPPODetail, type SPPORow, type SPPOService } from '@/src/api/verification/sppoVerificationAPI';
import { isSubmitted, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, Notice, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { buildSPPOUrl } from '@/src/service/s3Config';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import SPPOServiceCard, { num } from '@/src/components/verification/sppo/SPPOServiceCard';

// "a| b |" → "a|b|" — terms re-joined with a trailing '|' like legacy
const joinTerms = (v?: string) => String(v || '').split('|').map((t) => t.trim()).filter(Boolean).map((t) => `${t}|`).join('');

export default function SPPODetailScreen() {
    const row = useRowParam<SPPORow>();
    const { roleId, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);
    const [rates, setRates] = useState<Record<number, string>>({});
    const [checked, setChecked] = useState<Record<number, boolean>>({});

    const load = useCallback(() => getSPPODetail(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const services = d?.ItemDescList ?? [];

    // The web falls back to the original rate when the edited one is empty / 0
    const rateOf = (s: SPPOService, i: number) => (rates[i] != null && num(rates[i]) ? num(rates[i]) : num(s.Rate));
    const total = services.length ? services.reduce((t, s, i) => t + rateOf(s, i) * num(s.Quantity), 0) : num(d?.TotalValue);
    const originalTotal = services.length ? services.reduce((t, s) => t + num(s.Rate) * num(s.Quantity), 0) : num(d?.TotalValue);
    const checkedCount = services.filter((_, i) => checked[i]).length;
    const allChecked = services.length > 0 && checkedCount === services.length;

    const changeRate = (s: SPPOService, i: number, value: string) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
        if (value !== '' && num(value) > num(s.Rate)) {
            Alert.alert('Rate can only be reduced', `The rate cannot be above ${money(s.Rate)}.`);
            return;
        }
        setRates((p) => ({ ...p, [i]: value }));
    };

    const submit = async (action: StatusAction, note: string) => {
        if (!row || !d) return;
        if (!allChecked) {
            Alert.alert('Please verify all services', `${checkedCount}/${services.length} services verified.`);
            return;
        }
        const predefinedExist = d.PredefinedTermsExist || 'No';
        const payload = {
            VendorCode: d.VendorCode || row.VendorCode,
            CCCode: d.CCCode || row.CCCode,
            DCACode: d.DCACode,
            SPPOStartDate: d.SPPOStartDate,
            TotalValue: d.TotalValue,
            Remarks: joinTerms(d.Remarks),
            Action: action.value || action.type,
            ApprovalNote: note,
            SPPONo: row.SPPONo,
            PredefinedTermsExist: predefinedExist,
            ItemTermHeadID: predefinedExist === 'Yes' ? (d.ItemTermHeadID || 0) : 0,
            PreferredRemarks: predefinedExist === 'Yes' ? joinTerms(d.PreferredRemarks) : '',
            RoleId: roleId,
            CreatedBy: userName,
        };
        try {
            const status = await approveSPPO(payload);
            // spApproveSPPO answers "Submited"; anything else is the error text
            if (!isSubmitted(status)) {
                Alert.alert('Not submitted', status || 'Error Occurred While Serivice Provider Verification');
                return;
            }
            showSubmitResult(`${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Service Provider PO"
            subtitle={row?.SPPONo}
            icon={Briefcase}
            backHref={'/verification/sppo/list' as Href}
            onRefresh={() => { setRates({}); setChecked({}); setReloadKey((k) => k + 1); }}
        >
            {!row ? (
                <EmptyState title="SPPO not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the SPPO" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={d.SPPONo || row.SPPONo}
                        amount={money(total)}
                        amountLabel={total !== originalTotal ? `Total SPPO amount (was ${money(originalTotal)})` : 'Total SPPO amount'}
                        chips={[d.VendorName || row.VendorName, d.CCCode, d.Status && `Status ${d.Status}`]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['SPPO ID', d.SPPOId],
                                ['Balance', money(d.Balance)],
                                ['Start Date', d.SPPOStartDate],
                                ['End Date', d.SPPOEndDate],
                                ['Cost Center', [d.CCCode, d.CCName].filter(Boolean).join(' – '), true],
                                ['Account Head', d.DCAName],
                                ['Sub Account Head', d.SubDCAName],
                            ]}
                        />
                    </Section>

                    <DocumentLinks links={[{ label: 'SPPO Attachment', url: buildSPPOUrl(d.FilePath) }]} />

                    <Section
                        title={`Services (${services.length})`}
                        right={services.length ? (
                            <Text
                                onPress={() => setChecked(allChecked ? {} : Object.fromEntries(services.map((_, i) => [i, true])))}
                                className="text-xs font-semibold text-orange-600"
                            >
                                {allChecked ? 'Clear all' : 'Check all'}
                            </Text>
                        ) : null}
                    >
                        {services.length === 0 ? (
                            <Text className="text-sm text-gray-400 text-center py-6">No service lines found.</Text>
                        ) : (
                            <>
                                <Text className="text-[11px] text-gray-500 mb-2">
                                    Tick each service once checked — {checkedCount}/{services.length} verified. Rates can only be lowered.
                                </Text>
                                {services.map((s, i) => (
                                    <SPPOServiceCard
                                        key={String(s.SPPOItemId ?? i)}
                                        service={s}
                                        index={i}
                                        checked={!!checked[i]}
                                        onToggle={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
                                        rate={rates[i] ?? String(s.Rate ?? '')}
                                        onRateChange={(v) => changeRate(s, i, v)}
                                    />
                                ))}
                                <View className="flex-row justify-between pt-2.5 border-t border-gray-200">
                                    <Text className="text-xs font-bold text-gray-700">Total SPPO amount</Text>
                                    <Text className="text-xs font-bold text-brand-navy">{money(total)}</Text>
                                </View>
                            </>
                        )}
                    </Section>

                    {d.Remarks ? (
                        <Section title="SPPO terms & conditions">
                            {d.Remarks.split('|').filter((t) => t.trim()).map((t, i) => (
                                <Text key={i} className="text-xs text-gray-700 leading-5">• {t.trim()}</Text>
                            ))}
                        </Section>
                    ) : null}

                    <RemarksTimeline trno={row.SPPONo} moid={d.MOID} />
                    {/* A returned SPPO (status 0) opens the edit form for the raiser on the web */}
                    {String(row.Status) === '0' ? (
                        <Notice tone="amber" title="Returned SPPO" text="This SPPO was returned for changes. Edit and resubmit it from the Corex web app." />
                    ) : (
                        <ActionPanel moid={d.MOID} roleId={roleId} chkAmt={num(d.TotalValue)} showReturn={false} onSubmit={submit} />
                    )}
                </>
            )}
        </PortalScreen>
    );
}
