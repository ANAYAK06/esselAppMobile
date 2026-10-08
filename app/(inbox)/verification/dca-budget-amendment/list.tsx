// Account Head (DCA) Budget Amendment verification queue (web: pages/Budget/VerifyDCABudgetAmendment.jsx)
import React from 'react';
import { router } from 'expo-router';
import { ArrowLeftRight } from 'lucide-react-native';
import { getDCAAmendmentQueue, type DCAAmendmentRow } from '@/src/api/verification/budgetVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';

export default function DCAAmendmentQueue() {
    return (
        <VerificationQueueScreen<DCAAmendmentRow>
            title="DCA Budget Amendment"
            icon={ArrowLeftRight}
            noun="amendment"
            searchPlaceholder="Search cost center, name, state…"
            load={getDCAAmendmentQueue}
            keyOf={(r) => `${r.CCCode}|${r.FYYear}|${r.RefNo ?? ''}`}
            searchText={(r) => `${r.CCCode} ${r.CCName} ${r.cc_Type} ${r.FYYear} ${r.State}`}
            card={(r) => ({
                title: `${r.CCCode}${r.CCName ? ` - ${r.CCName}` : ''}`,
                subtitle: [r.cc_Type, r.FYYear && r.FYYear !== 'N/A' && `FY ${r.FYYear}`].filter(Boolean).join(' · '),
                meta: r.AmdDate,
                badge: r.State ? { label: r.State, tone: 'blue' } : null,
            })}
            onOpen={(r) => router.push({
                pathname: '/verification/dca-budget-amendment/[id]',
                params: { id: r.CCCode, row: JSON.stringify(r) },
            })}
        />
    );
}
