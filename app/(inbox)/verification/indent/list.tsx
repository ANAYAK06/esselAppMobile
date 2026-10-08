// Indent Creation verification queue (web: pages/Purchase/VerifyIndentCreation.jsx)
import React from 'react';
import { router } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { getIndentQueue, type IndentRow } from '@/src/api/verification/indentVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function IndentQueue() {
    return (
        <VerificationQueueScreen<IndentRow>
            title="Indent Verification"
            icon={ShoppingCart}
            noun="indent"
            searchPlaceholder="Search indent no, cost centre, date…"
            load={getIndentQueue}
            keyOf={(r) => r.Indentno}
            searchText={(r) => `${r.Indentno} ${r.Costcenter} ${r.Status} ${r.Date}`}
            card={(r) => ({
                title: r.Indentno,
                subtitle: [r.Costcenter, r.CCType].filter(Boolean).join(' · '),
                meta: r.Date,
                amount: money(r.TotalAmount),
                badge: r.CapitalMaterialType?.trim() ? { label: r.CapitalMaterialType.trim(), tone: 'blue' } : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/indent/[id]', params: { id: r.Indentno, row: JSON.stringify(r) } })}
        />
    );
}
