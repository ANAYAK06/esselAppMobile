// SPPO Amendment verification queue (web: pages/SPPO/VerifySPPOAmend.jsx)
import React from 'react';
import { router } from 'expo-router';
import { FilePen } from 'lucide-react-native';
import { getSPPOAmendQueue, type SPPOAmendRow } from '@/src/api/verification/sppoVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function SPPOAmendQueue() {
    return (
        <VerificationQueueScreen<SPPOAmendRow>
            title="SPPO Amendment"
            icon={FilePen}
            noun="amendment"
            searchPlaceholder="Search SPPO no, vendor, cost center…"
            load={getSPPOAmendQueue}
            keyOf={(r) => `${r.AmendId}`}
            searchText={(r) => `${r.SPPONo} ${r.VendorName} ${r.CCCode} ${r.AmendId}`}
            card={(r) => ({
                title: r.SPPONo,
                subtitle: r.VendorName,
                meta: [`Amend ${r.AmendId}`, r.AmendDate].filter(Boolean).join(' · '),
                amount: money(r.AmendAmount ?? 0),
            })}
            onOpen={(r) => router.push({ pathname: '/verification/sppo-amend/[id]', params: { id: String(r.AmendId), row: JSON.stringify(r) } })}
        />
    );
}
