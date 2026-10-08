// Account Head (DCA) Budget verification queue (web: verificationConfigs.jsx DCABudget)
import React from 'react';
import { router } from 'expo-router';
import { PieChart } from 'lucide-react-native';
import { getDCABudgetQueue, type DCABudgetRow } from '@/src/api/verification/budgetVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

export default function DCABudgetQueue() {
    return (
        <VerificationQueueScreen<DCABudgetRow>
            title="Account Head Budget"
            icon={PieChart}
            noun="budget"
            searchPlaceholder="Search cost center, name, year, type…"
            load={getDCABudgetQueue}
            keyOf={(r) => `${r.CC_Code}|${r.FYyear}`}
            searchText={(r) => `${r.CC_Code} ${r.CC_Name} ${r.CC_Type} ${r.FYyear} ${r.BudgetValue}`}
            card={(r) => ({
                title: `${r.CC_Code}${r.CC_Name ? ` - ${r.CC_Name}` : ''}`,
                subtitle: [r.CC_Type, r.FYyear !== 'N/A' && r.FYyear].filter(Boolean).join(' · '),
                meta: r.BalanceBudget != null ? `Balance ${money(r.BalanceBudget)}` : null,
                amount: money(r.BudgetValue),
                returned: String(r.Status) === '0',
            })}
            onOpen={(r) => router.push({ pathname: '/verification/dca-budget/[id]', params: { id: r.CC_Code, row: JSON.stringify(r) } })}
        />
    );
}
