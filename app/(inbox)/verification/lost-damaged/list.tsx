// Lost / Damaged (scrapped) items verification queue (web: pages/Stock/LostDamagedItemsVerification.jsx)
import React from 'react';
import { router } from 'expo-router';
import { PackageX } from 'lucide-react-native';
import { getLostDamagedQueue, type LostDamagedRow } from '@/src/api/verification/stockVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';

export default function LostDamagedQueue() {
    return (
        <VerificationQueueScreen<LostDamagedRow>
            title="Lost / Damaged Items"
            icon={PackageX}
            noun="report"
            searchPlaceholder="Search ref no, cost center, date…"
            load={getLostDamagedQueue}
            keyOf={(r) => String(r.Refno)}
            searchText={(r) => `${r.Refno} ${r.CCCode} ${r.Date}`}
            card={(r) => ({
                title: `Ref ${r.Refno}`,
                subtitle: r.CCCode,
                meta: r.Date?.split(' ')[0],
            })}
            onOpen={(r) => router.push({ pathname: '/verification/lost-damaged/[id]', params: { id: String(r.Refno), row: JSON.stringify(r) } })}
        />
    );
}
