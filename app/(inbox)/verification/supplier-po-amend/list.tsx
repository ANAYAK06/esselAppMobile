// Supplier PO Amendment verification queue (web: pages/SupplierPO/VerifySupplierPOAmend.jsx)
import React from 'react';
import { router } from 'expo-router';
import { FileDiff } from 'lucide-react-native';
import { getSupplierPOAmendQueue, type SupplierPOAmendRow } from '@/src/api/verification/supplierPOVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export default function SupplierPOAmendQueue() {
    return (
        <VerificationQueueScreen<SupplierPOAmendRow>
            title="Supplier PO Amendment"
            icon={FileDiff}
            noun="amendment"
            searchPlaceholder="Search PO no, vendor, cost center…"
            load={getSupplierPOAmendQueue}
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
            onOpen={(r) => router.push({ pathname: '/verification/supplier-po-amend/[id]', params: { id: String(r.AmendPONO), row: JSON.stringify(r) } })}
        />
    );
}
