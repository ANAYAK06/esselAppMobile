// Cost Center Budget verification queue (web: verificationConfigs.jsx CCBudget)
import React from 'react';
import { router } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import { getCCBudgetQueue, isNonPerformingCC, type CCBudgetRow } from '@/src/api/verification/budgetVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function CCBudgetQueue() {
    return (
        <VerificationQueueScreen<CCBudgetRow>
            title="Cost Center Budget"
            icon={Wallet}
            noun="budget"
            searchPlaceholder="Search cost center, name, type, year…"
            load={getCCBudgetQueue}
            keyOf={(r) => String(r.Budgetid)}
            searchText={(r) => `${r.CostCenter} ${r.CC_Name} ${r.CCType} ${r.SubType} ${r.Year} ${r.Amount}`}
            card={(r) => ({
                title: `${r.CostCenter}${r.CC_Name ? ` - ${r.CC_Name}` : ''}`,
                subtitle: [r.CCType, r.SubType].filter(Boolean).join(' · '),
                meta: [r.BudgetCreationDate, isNonPerformingCC(r.CCType) && r.Year].filter(Boolean).join(' · '),
                amount: money(r.Amount),
                returned: String(r.Status) === '0',
            })}
            onOpen={(r) => router.push({ pathname: '/verification/cc-budget/[id]', params: { id: String(r.Budgetid), row: JSON.stringify(r) } })}
        />
    );
}
