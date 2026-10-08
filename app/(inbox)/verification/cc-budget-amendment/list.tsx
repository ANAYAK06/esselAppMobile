// Cost Center Budget Amendment verification queue (web: pages/Budget/VerifyCCBudgetAmendment.jsx)
import React from 'react';
import { router } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { getCCAmendmentQueue, type CCAmendmentRow } from '@/src/api/verification/budgetVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const typeTone = (t?: string) => (t === 'Add' ? 'green' : t === 'Transfer' ? 'blue' : 'red') as 'green' | 'red' | 'blue';

export default function CCAmendmentQueue() {
    return (
        <VerificationQueueScreen<CCAmendmentRow>
            title="CC Budget Amendment"
            icon={TrendingUp}
            noun="amendment"
            searchPlaceholder="Search cost center, name, type…"
            load={getCCAmendmentQueue}
            keyOf={(r) => String(r.CCBudgetAmendmentid)}
            searchText={(r) => `${r.CCCode} ${r.CCName} ${r.AmendmentType} ${r.OtherCCCode || ''}`}
            card={(r) => ({
                title: `${r.CCCode}${r.CCName ? ` - ${r.CCName}` : ''}`,
                subtitle: r.OtherCCCode ? `From ${r.OtherCCCode}` : null,
                meta: r.AmendmentDate,
                amount: r.AmendedValue != null ? `${r.AmendmentType === 'Add' ? '+' : '−'}${money(r.AmendedValue)}` : null,
                badge: r.AmendmentType ? { label: r.AmendmentType, tone: typeTone(r.AmendmentType) } : null,
            })}
            onOpen={(r) => router.push({
                pathname: '/verification/cc-budget-amendment/[id]',
                params: { id: String(r.CCBudgetAmendmentid), row: JSON.stringify(r) },
            })}
        />
    );
}
