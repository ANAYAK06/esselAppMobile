// SPPO Close verification queue (web: pages/SPPO/VerifySPPOClose.jsx). The close type comes
// from the inbox item (?type=…); the switch lets the verifier look at the other type too.
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Archive } from 'lucide-react-native';
import { getSPPOCloseQueue, type SPPOCloseRow, type SPPOCloseType } from '@/src/api/verification/sppoVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { ChipTabs } from '@/src/components/employee/PortalUI';

const TYPES: SPPOCloseType[] = ['Performing', 'Non-Performing'];

// Stable loaders, one per type
const loadPerforming = (roleId: string, uid: string) => getSPPOCloseQueue(roleId, uid, 'Performing');
const loadNonPerforming = (roleId: string, uid: string) => getSPPOCloseQueue(roleId, uid, 'Non-Performing');

export default function SPPOCloseQueue() {
    const params = useLocalSearchParams<{ type?: string }>();
    const [type, setType] = useState<SPPOCloseType>(params.type === 'Non-Performing' ? 'Non-Performing' : 'Performing');

    return (
        <VerificationQueueScreen<SPPOCloseRow>
            title="SPPO Close"
            icon={Archive}
            noun="SPPO"
            searchPlaceholder="Search SPPO no, vendor, cost center…"
            load={type === 'Performing' ? loadPerforming : loadNonPerforming}
            header={<ChipTabs options={TYPES} value={type} onChange={setType} />}
            keyOf={(r) => r.SPPONo}
            searchText={(r) => `${r.SPPONo} ${r.VendorName} ${r.CCCode}`}
            card={(r) => ({
                title: r.SPPONo,
                subtitle: r.VendorName,
                meta: r.CCCode,
                amount: money(r.Balance ?? 0),
            })}
            onOpen={(r) => router.push({ pathname: '/verification/sppo-close/[id]', params: { id: r.SPPONo, row: JSON.stringify(r) } })}
        />
    );
}
