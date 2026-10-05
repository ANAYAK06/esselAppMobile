// Service Provider PO (SPPO) verification queue (web: pages/SPPO/VerifySPPO.jsx)
import React from 'react';
import { router } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import { getSPPOQueue, type SPPORow } from '@/src/api/verification/sppoVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function SPPOQueue() {
    return (
        <VerificationQueueScreen<SPPORow>
            title="Service Provider PO"
            icon={Briefcase}
            noun="SPPO"
            searchPlaceholder="Search SPPO no, vendor, cost center…"
            load={getSPPOQueue}
            keyOf={(r) => r.SPPONo}
            searchText={(r) => `${r.SPPONo} ${r.VendorName} ${r.VendorCode} ${r.CCCode}`}
            card={(r) => ({
                title: r.SPPONo,
                subtitle: r.VendorName,
                meta: r.CCCode,
                amount: r.TotalValue != null ? money(r.TotalValue) : null,
            })}
            onOpen={(r) => router.push({ pathname: '/verification/sppo/[id]', params: { id: r.SPPONo, row: JSON.stringify(r) } })}
        />
    );
}
