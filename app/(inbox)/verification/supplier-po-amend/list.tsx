// Supplier PO Amendment verification queue (web: pages/SupplierPO/VerifySupplierPOAmend.jsx)
import React, { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FileDiff } from 'lucide-react-native';
import { getSupplierPOAmendQueue, type SupplierPOAmendRow } from '@/src/api/verification/supplierPOVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export default function SupplierPOAmendQueue() {
    // The inbox opens the NPCC entry with ?ccType=NPCC; everything else is PCC
    const params = useLocalSearchParams<{ ccType?: string }>();
    const ccType = params.ccType === 'NPCC' ? 'NPCC' : 'PCC';
    const load = useCallback((roleId: string, uid: string) => getSupplierPOAmendQueue(roleId, uid, ccType), [ccType]);

    return (
        <VerificationQueueScreen<SupplierPOAmendRow>
            title={ccType === 'NPCC' ? 'Supplier PO Amendment (NPCC)' : 'Supplier PO Amendment'}
            icon={FileDiff}
            noun="amendment"
            searchPlaceholder="Search PO no, vendor, cost center…"
            load={load}
            keyOf={(r) => `${r.AmendPONO}`}
            searchText={(r) => `${r.PONo} ${r.IndentNo} ${r.VendorName} ${r.CCCode}`}
            card={(r) => ({
                title: r.PONo,
                subtitle: r.VendorName,
                meta: [r.CCCode, r.AmendDate].filter(Boolean).join(' · '),
                amount: r.AmendDiffValue != null ? money(r.AmendDiffValue) : null,
                badge: num(r.PlusAmount) > 0
                    ? { label: `+${money(r.PlusAmount)}`, tone: 'green' }
                    : num(r.MinusAmount) > 0 ? { label: `−${money(r.MinusAmount)}`, tone: 'red' } : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/supplier-po-amend/[id]', params: { id: String(r.AmendPONO), ccType, row: JSON.stringify(r) } })}
        />
    );
}
