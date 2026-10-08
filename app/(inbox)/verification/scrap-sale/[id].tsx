// Scrap Sale verification — buyer, the scrap items with quantities and prices, then
// verify / approve / return (web: pages/Stock/VerifyScrapSale.jsx).
import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { Recycle } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import {
    approveScrapSale, getScrapSale, type ScrapSaleItem, type ScrapSaleRow,
} from '@/src/api/verification/stockVerificationAPI';
import { appendApprovalComment, type StatusAction } from '@/src/api/verification/verificationCommonAPI';
import {
    ActionPanel, DetailHero, FieldGrid, RemarksTimeline, Section, money, showSubmitResult,
} from '@/src/components/verification/kit/VerificationKit';
import { useRowParam, useVerifier } from '@/src/components/verification/kit/useVerifier';

const num = (v: unknown) => {
    const n = parseFloat(String(v ?? ''));
    return Number.isNaN(n) ? 0 : n;
};

// "SC048 , TARKESH ENTERPRISES" → "TARKESH ENTERPRISES"
const nameOf = (v?: string) => (v ? v.split(',')[1]?.trim() || v.trim() : undefined);

export default function ScrapSaleDetailScreen() {
    const row = useRowParam<ScrapSaleRow>();
    const { roleId, uid, userName, roleCode } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);

    const load = useCallback(() => getScrapSale(row!), [row, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data, loading } = useApiData(row ? load : null);
    const h = data?.header;
    const items = data?.items ?? [];
    const total = items.reduce((s, i) => s + num(i.Amount), 0) || num(row?.Amount);
    const moid = h?.MOID || row?.MOID;
    const requestNo = h?.RequestNo || row?.RequestNo || '';

    const submit = async (action: StatusAction, note: string) => {
        try {
            const status = await approveScrapSale({
                Requestno: requestNo,
                Appstatus: action.value || action.text || action.type,
                Remarks: appendApprovalComment(h?.Remarks || '', roleCode || 'Scrap Sale Verifier', userName, note),
                Createdby: userName,
                RoleID: roleId,
                UserId: uid,
                ItemId: h?.ItemId || '',
            });
            showSubmitResult(status && !status.includes('$') ? status : `${action.text} completed successfully`, status, () => router.back());
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || `Failed to ${action.text.toLowerCase()}`);
        }
    };

    return (
        <PortalScreen
            title="Scrap Sale"
            subtitle={row ? `Request ${row.RequestNo}` : undefined}
            icon={Recycle}
            backHref={'/verification/scrap-sale/list' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {!row ? (
                <EmptyState title="Scrap sale not found" subtitle="Go back and open it again from the list." />
            ) : loading && !data ? (
                <LoadingText />
            ) : !h && !items.length ? (
                <EmptyState title="Could not load the scrap sale" subtitle="Pull down to try again." />
            ) : (
                <>
                    <DetailHero
                        title={`Scrap sale request ${requestNo}`}
                        amount={total > 0 ? money(total) : null}
                        amountLabel={`Total value · ${items.length} item${items.length === 1 ? '' : 's'}`}
                        chips={[row.CCCode && `From ${row.CCCode}`, row.Status, h?.SubmitDate && `Submitted ${h.SubmitDate}`]}
                    />
                    <Section title="Buyer">
                        <FieldGrid
                            fields={[
                                ['Client', nameOf(h?.ClientName || row.ClientName), true],
                                !!h?.SubclientName && ['Sub Client', nameOf(h.SubclientName), true],
                                !!h?.PartyName && ['Party', h.PartyName, true],
                                !!h?.PartyAddress && ['Party Address', h.PartyAddress, true],
                                ['Request No', requestNo],
                                ['Request Date', row.RequestDate],
                                ['Cost Center', row.CCCode],
                                num(h?.VAmount) > 0 && ['Value', money(h?.VAmount)],
                            ]}
                        />
                    </Section>

                    <Section title={`Scrap items (${items.length})`}>
                        {items.length ? (
                            items.map((it, i) => <ScrapItemCard key={String(it.RId ?? i)} item={it} first={i === 0} />)
                        ) : (
                            <Text className="text-xs text-gray-400 py-3 text-center">No items on this request</Text>
                        )}
                    </Section>

                    <RemarksTimeline trno={requestNo} moid={moid} />
                    <ActionPanel
                        moid={moid}
                        roleId={roleId}
                        showReturn
                        confirmLabel="I have verified the scrap sale — items, quantities, pricing and buyer details"
                        onSubmit={submit}
                    />
                </>
            )}
        </PortalScreen>
    );
}

function ScrapItemCard({ item: it, first }: { item: ScrapSaleItem; first: boolean }) {
    return (
        <View className={`py-3 ${first ? '' : 'border-t border-gray-100'}`}>
            <View className="flex-row items-start gap-2">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{(it.ItemName || '—').trim()}</Text>
                    <Text className="text-[11px] text-gray-500">
                        {[it.ItemCode, it.Specification?.trim(), [it.DcaCode, it.SubDcaCode].filter(Boolean).join(' / ')].filter(Boolean).join(' · ')}
                    </Text>
                </View>
                <Text className="text-sm font-bold text-brand-navy">{money(it.Amount) || '₹0'}</Text>
            </View>
            <Text className="text-xs text-gray-600 mt-1">
                {num(it.Quantity)} {it.Units || ''} × {money(it.BasicPrice) || '₹0'}
            </Text>
        </View>
    );
}
