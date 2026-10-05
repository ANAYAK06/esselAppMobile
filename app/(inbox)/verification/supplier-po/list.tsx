// Supplier PO verification queue (web: pages/SupplierPO/VerifySupplierPO.jsx)
import React from 'react';
import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { getSupplierPOQueue, type SupplierPORow } from '@/src/api/verification/supplierPOVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';

export default function SupplierPOQueue() {
    return (
        <VerificationQueueScreen<SupplierPORow>
            title="Supplier PO"
            icon={ShoppingBag}
            noun="PO"
            searchPlaceholder="Search PO no, vendor, cost center…"
            load={getSupplierPOQueue}
            keyOf={(r) => r.PONo}
            searchText={(r) => `${r.PONo} ${r.IndentNo} ${r.VendorName} ${r.CCCode} ${r.RefNo}`}
            card={(r) => ({
                title: r.PONo,
                subtitle: r.VendorName,
                meta: [r.CCCode, r.PODate].filter(Boolean).join(' · '),
                badge: r.CCType ? { label: r.CCType, tone: 'blue' } : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/supplier-po/[id]', params: { id: r.PONo, row: JSON.stringify(r) } })}
        />
    );
}
