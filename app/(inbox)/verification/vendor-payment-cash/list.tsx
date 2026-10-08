// Vendor Payment by Cash verification queue (web: pages/Accounts/VerifyVendorPaymentByCash.jsx —
// the same queue route as the bank page)
import React from 'react';
import { router } from 'expo-router';
import { Banknote } from 'lucide-react-native';
import { getVendorPaymentQueue, type VendorPaymentRow } from '@/src/api/verification/paymentVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const load = (roleId: string) => getVendorPaymentQueue(roleId);

export default function VendorPaymentCashQueue() {
    return (
        <VerificationQueueScreen<VendorPaymentRow>
            title="Vendor Payment by Cash"
            icon={Banknote}
            noun="payment"
            searchPlaceholder="Search vendor, ref no, payment type…"
            load={load}
            keyOf={(r) => `${r.TransactionRefNo}-${r.VendorCode}-${r.TransactionType}`}
            searchText={(r) => `${r.VendorName} ${r.TransactionRefNo} ${r.VendorCode} ${r.PaymentTypeName}`}
            card={(r) => ({
                title: r.VendorName || r.VendorCode || r.TransactionRefNo,
                subtitle: [r.PaymentTypeName, r.TransactionRefNo].filter(Boolean).join(' · '),
                meta: r.TransactionDate,
                amount: money(r.TransactionAmount),
                badge: r.PaymentTypeName === 'Vendor Advance' ? { label: 'Advance', tone: 'blue' } : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/vendor-payment-cash/[id]', params: { id: r.TransactionRefNo, row: JSON.stringify(r) } })}
        />
    );
}
