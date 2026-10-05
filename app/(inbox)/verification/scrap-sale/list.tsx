// Scrap Sale verification queue (web: pages/Stock/VerifyScrapSale.jsx)
import React from 'react';
import { router } from 'expo-router';
import { Recycle } from 'lucide-react-native';
import { getScrapSaleQueue, type ScrapSaleRow } from '@/src/api/verification/stockVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function ScrapSaleQueue() {
    return (
        <VerificationQueueScreen<ScrapSaleRow>
            title="Scrap Sale"
            icon={Recycle}
            noun="scrap sale"
            searchPlaceholder="Search request no, cost center, date…"
            load={getScrapSaleQueue}
            keyOf={(r) => `${r.RequestNo}-${r.RId}`}
            searchText={(r) => `${r.RequestNo} ${r.CCCode} ${r.RequestDate} ${r.ClientName}`}
            card={(r) => ({
                title: `Request ${r.RequestNo}`,
                subtitle: [r.CCCode, r.ClientName?.split(',')[1]?.trim() || r.ClientName].filter(Boolean).join(' · '),
                meta: r.RequestDate,
                amount: Number(r.Amount) > 0 ? money(r.Amount) : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/scrap-sale/[id]', params: { id: String(r.RequestNo), row: JSON.stringify(r) } })}
        />
    );
}
