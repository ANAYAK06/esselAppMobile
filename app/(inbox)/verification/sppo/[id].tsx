// SPPO verification — service lines with lower-only rate editing, tick every line, then
// verify / approve (web: pages/SPPO/VerifySPPO.jsx). Return is not offered on this page.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import { approveSPPO, getSPPODetail, type SPPORow, type SPPOService } from '@/src/api/verification/sppoVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { buildSPPOUrl } from '@/src/service/s3Config';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';
import SPPOServiceCard, { num } from '@/src/components/verification/sppo/SPPOServiceCard';

export default function SPPODetailScreen() {
    const row = useRowParam<SPPORow>();
    const { roleId, uid, userName, roleCode } = useVerifier();
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
        const act = action.value || action.type;
        const payload: Record<string, unknown> = {
            SPPONo: row.SPPONo,
            ApprovalNote: note,
            Remarks: appendApprovalComment(d.ApprovedUser, roleCode || 'SPPO Verifier', userName, note),
            Action: act,
            RoleId: roleId,
            Userid: uid,
            VendorCode: d.VendorCode || row.VendorCode,
            CCCode: d.CCCode || row.CCCode,
            AmendId: 0,
            Createdby: userName,
            Amount: total,
            ApprovalStatus: act,
            ...(d.MOID ? { MOID: d.MOID } : {}),
            ...(d.SPPOId ? { SPPOId: d.SPPOId } : {}),
            ...(d.ItemDescList ? {
                ItemDescList: d.ItemDescList.map((s, i) => ({ ...s, Rate: rateOf(s, i), Amount: rateOf(s, i) * num(s.Quantity) })),
            } : {}),
        };
        try {
            const status = await approveSPPO(payload);
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

                    <RemarksTimeline trno={row.SPPONo} moid={d.MOID} />
                    <ActionPanel moid={d.MOID} roleId={roleId} chkAmt={originalTotal} showReturn={false} onSubmit={submit} />
                </>
            )}
        </PortalScreen>
    );
}
