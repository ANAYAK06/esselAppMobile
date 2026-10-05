// Service Provider (SP) Invoice verification queue (web: verificationConfigs.jsx SPPOInvoice).
// Returned invoices (Status 0) are corrected on the SP Invoice entry screen — nothing to verify.
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { FileSpreadsheet } from 'lucide-react-native';
import { getSPInvoiceQueue, type SPInvoiceRow } from '@/src/api/verification/invoiceVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const isReturned = (r: SPInvoiceRow) => String(r.Status ?? '').trim() === '0';

export default function SPInvoiceQueue() {
    return (
        <VerificationQueueScreen<SPInvoiceRow>
            title="SP Invoice"
            icon={FileSpreadsheet}
            noun="invoice"
            searchPlaceholder="Search invoice, PO, vendor, cost center…"
            load={getSPInvoiceQueue}
            keyOf={(r) => String(r.InvoiceId || r.SPPOInvoiceNo)}
            searchText={(r) => `${r.SPPOInvoiceNo} ${r.SPPONo} ${r.VendorName} ${r.CCName} ${r.NetAmount}`}
            card={(r) => ({
                title: r.SPPOInvoiceNo,
                subtitle: r.VendorName,
                meta: [r.SPPONo, r.CCName].filter(Boolean).join(' · '),
                amount: money(r.NetAmount),
                returned: isReturned(r),
            })}
            onOpen={(r) => {
                if (isReturned(r)) {
                    Alert.alert('Returned for update', 'Correct and resubmit it from the SP Invoice screen — there is nothing to verify until it is resubmitted.');
                    return;
                }
                router.push({ pathname: '/verification/sp-invoice/[id]', params: { id: r.SPPOInvoiceNo, row: JSON.stringify(r) } });
            }}
        />
    );
}
