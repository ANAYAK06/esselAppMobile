// Supplier Invoice verification queue (web: pages/VendorInvoice/VerifySupplierInvoice.jsx)
import React from 'react';
import { router } from 'expo-router';
import { ReceiptIndianRupee } from 'lucide-react-native';
import {
    getSupplierInvoiceQueue,
    vendorDisplayName,
    type SupplierInvoiceRow,
} from '@/src/api/verification/invoiceVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function SupplierInvoiceQueue() {
    return (
        <VerificationQueueScreen<SupplierInvoiceRow>
            title="Supplier Invoice"
            icon={ReceiptIndianRupee}
            noun="invoice"
            searchPlaceholder="Search vendor, invoice, PO, MRR…"
            load={getSupplierInvoiceQueue}
            keyOf={(r) => r.InvoiceNo}
            searchText={(r) => `${vendorDisplayName(r.VendorName)} ${r.InvoiceNo} ${r.VendorId} ${r.PONo} ${r.MRR}`}
            card={(r) => ({
                title: vendorDisplayName(r.VendorName) || r.InvoiceNo,
                subtitle: `${r.InvoiceNo}${r.CCCode ? ` · ${r.CCCode}` : ''}`,
                meta: [r.PONo && `PO ${r.PONo}`, r.MRR && `MRR ${r.MRR}`].filter(Boolean).join(' · '),
                amount: money(r.NetAmount ?? r.InvoiceValue),
            })}
            onOpen={(r) => router.push({ pathname: '/verification/supplier-invoice/[id]', params: { id: r.InvoiceNo, row: JSON.stringify(r) } })}
        />
    );
}
