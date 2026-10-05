// Lost / Damaged (scrapped) items verification — the report's items with lost and damaged
// quantities and values, the supporting document, then verify / approve
// (web: pages/Stock/LostDamagedItemsVerification.jsx). The web hides Return here, so does this.
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { PackageX } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveLostDamaged, getLostDamagedDetail, type LostDamagedItem, type LostDamagedRow,
} from '@/src/api/verification/stockVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import { buildLostDamagedItemsUrl } from '@/src/service/s3Config';
import {
    ActionPanel, DetailHero, DocumentLinks, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const num = (v: unknown) => {
    const n = parseFloat(String(v ?? ''));
    return Number.isNaN(n) ? 0 : n;
};

export default function LostDamagedDetailScreen() {
    const row = useRowParam<LostDamagedRow>();
    const { roleId, uid, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getLostDamagedDetail(row!.Refno), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: d, loading } = useApiData(row ? load : null);
    const items = d?.itemlist ?? [];

    const lostQty = items.reduce((s, i) => s + num(i.Lost), 0);
    const damagedQty = items.reduce((s, i) => s + num(i.Damaged), 0);
    const lostAmt = items.reduce((s, i) => s + num(i.LostAmt), 0);
    const damagedAmt = items.reduce((s, i) => s + num(i.DamagedAmt), 0);
    const total = lostAmt + damagedAmt;

    const submit = async (action: StatusAction, note: string) => {
        if (!d) return;
        const remarks = appendApprovalComment(d.UserRemarks || d.Remarks || '', roleCode || 'LD Items Verifier', userName, note);
        try {
            // Same fields as the web payload — the SP reads the item lists as comma-joined strings
            const status = await approveLostDamaged({
                Id: d.Id || 0,
                Date: d.Date || '',
                CCCode: d.CCCode || '',
                Category: d.Category || null,
                Createdby: userName,
                Roleid: roleId,
                itemids: items.map((i) => i.id).join(','),
                itemcodes: items.map((i) => i.itemcode).join(','),
                Reporttype: d.Reporttype || null,
                Lostqtys: items.map((i) => i.Lost || 0).join(','),
                Damangedqtys: items.map((i) => i.Damaged || 0).join(','),
                Stocktype: d.Stocktype || null,
                Remarks: remarks,
                AvlQtys: d.AvlQtys || null,
                CategoryNo: d.CategoryNo || 0,
                Refno: d.Refno || row?.Refno || '',
                MOID: d.MOID || 0,
                Action: action.value || action.text || action.type,
                ApprovalNote: note,
                Status: d.Status || '',
                itemlist: items,
                ApprovedUser: d.ApprovedUser || '',
                ApprUserList: d.ApprUserList || [],
                UserRemarks: remarks,
                Filechk: d.Filechk || null,
                Extension: d.Extension || null,
                FilePath: d.FilePath || null,
                Userid: uid,
            });
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Lost / Damaged Items"
            subtitle={row ? `Ref ${row.Refno}` : undefined}
            icon={PackageX}
            backHref={'/verification/lost-damaged/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Report not found" subtitle="Go back and open it again from the list." />
            ) : loading && !d ? (
                <LoadingText />
            ) : !d ? (
                <EmptyState title="Could not load the report" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={`Lost / Damaged report ${d.Refno || row.Refno}`}
                        // Older reports carry no amounts — show the quantities instead of ₹0
                        amount={total > 0 ? money(total) : `${items.length} item${items.length === 1 ? '' : 's'}`}
                        amountLabel={total > 0 ? `Lost ${money(lostAmt)} · Damaged ${money(damagedAmt)}` : 'Reported'}
                        chips={[d.CCCode || row.CCCode, `Lost qty ${lostQty}`, `Damaged qty ${damagedQty}`]}
                    />
                    <Section>
                        <FieldGrid
                            fields={[
                                ['Reference No', d.Refno || row.Refno],
                                ['Cost Center', d.CCCode || row.CCCode],
                                ['Date', (d.Date || row.Date || '').split(' ')[0]],
                                ['Items', items.length],
                            ]}
                        />
                    </Section>

                    <Section title={`Items (${items.length})`}>
                        {items.length ? (
                            items.map((it, i) => <LDItemCard key={String(it.id ?? i)} item={it} first={i === 0} />)
                        ) : (
                            <Text className="text-xs text-gray-400 py-3 text-center">No items on this report</Text>
                        )}
                    </Section>

                    <DocumentLinks links={[{ label: 'Supporting document', url: buildLostDamagedItemsUrl(d.FilePath) }]} />

                    <RemarksTimeline trno={d.Refno || row.Refno} moid={d.MOID} />
                    <ActionPanel
                        moid={d.MOID}
                        roleId={roleId}
                        showReturn={false}
                        confirmLabel="I have verified the lost / damaged items — quantities, amounts, cost center and supporting document"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}

function LDItemCard({ item: it, first }: { item: LostDamagedItem; first: boolean }) {
    const lost = num(it.Lost);
    const damaged = num(it.Damaged);
    return (
        <View className={`py-3 ${first ? '' : 'border-t border-gray-100'}`}>
            <View className="flex-row items-start gap-2">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{(it.itemname || '—').trim()}</Text>
                    <Text className="text-[11px] text-gray-500">
                        {[it.itemcode, it.specification?.trim(), it.itemstatus].filter(Boolean).join(' · ')}
                    </Text>
                </View>
                {it.Basicprice ? <Text className="text-xs text-gray-500">{money(it.Basicprice)}/{it.units || 'unit'}</Text> : null}
            </View>
            <View className="flex-row flex-wrap gap-1.5 mt-2">
                {lost > 0 ? (
                    <View className="px-2 py-0.5 rounded-full bg-red-50">
                        <Text className="text-[11px] font-semibold text-red-700">
                            Lost {lost} {it.units || ''}{num(it.LostAmt) > 0 ? ` · ${money(it.LostAmt)}` : ''}
                        </Text>
                    </View>
                ) : null}
                {damaged > 0 ? (
                    <View className="px-2 py-0.5 rounded-full bg-orange-50">
                        <Text className="text-[11px] font-semibold text-orange-700">
                            Damaged {damaged} {it.units || ''}{num(it.DamagedAmt) > 0 ? ` · ${money(it.DamagedAmt)}` : ''}
                        </Text>
                    </View>
                ) : null}
                {it.dcacode ? (
                    <View className="px-2 py-0.5 rounded-full bg-gray-100">
                        <Text className="text-[11px] text-gray-600">{[it.dcacode, it.subdcacode].filter(Boolean).join(' / ')}</Text>
                    </View>
                ) : null}
            </View>
            {it.Remarks?.trim() ? <Text className="text-xs text-gray-600 mt-1.5">Reason: {it.Remarks.trim()}</Text> : null}
        </View>
    );
}
