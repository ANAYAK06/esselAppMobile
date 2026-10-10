// Supplier PO verification queue (web: pages/SupplierPO/VerifySupplierPO.jsx)
import React, { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { getSupplierPOQueue, type SupplierPORow } from '@/src/api/verification/supplierPOVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';

export default function SupplierPOQueue() {
    // The inbox opens the NPCC entry with ?ccType=NPCC; everything else is PCC
    const params = useLocalSearchParams<{ ccType?: string }>();
    const ccType = params.ccType === 'NPCC' ? 'NPCC' : 'PCC';
    const load = useCallback((roleId: string, uid: string) => getSupplierPOQueue(roleId, uid, ccType), [ccType]);

    return (
        <VerificationQueueScreen<SupplierPORow>
            title={ccType === 'NPCC' ? 'Supplier PO (NPCC)' : 'Supplier PO'}
            icon={ShoppingBag}
            noun="PO"
            searchPlaceholder="Search PO no, vendor, indent, cost center…"
            load={load}
            keyOf={(r) => r.PONo}
            searchText={(r) => `${r.PONo} ${r.IndentNo} ${r.VendorName} ${r.CCCode} ${r.RefNo}`}
            card={(r) => ({
                title: r.PONo,
                subtitle: r.VendorName,
                meta: [r.CCCode, r.PODate, r.IndentNo && `Indent ${r.IndentNo.slice(-6)}`, r.RefNo && `Ref ${r.RefNo}`].filter(Boolean).join(' · '),
                badge: r.CCType ? { label: r.CCType, tone: 'blue' } : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/supplier-po/[id]', params: { id: r.PONo, ccType, row: JSON.stringify(r) } })}
        />
    );
}
