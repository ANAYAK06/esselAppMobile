// Daily Issue verification queue (web: pages/Stock/VerifyDailyIssue.jsx)
import React from 'react';
import { router } from 'expo-router';
import { Layers } from 'lucide-react-native';
import { getDailyIssueQueue, type DailyIssueRow } from '@/src/api/verification/stockVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';

export default function DailyIssueQueue() {
    return (
        <VerificationQueueScreen<DailyIssueRow>
            title="Daily Issue"
            icon={Layers}
            noun="issue"
            searchPlaceholder="Search transaction no, cost center, date…"
            load={getDailyIssueQueue}
            keyOf={(r) => r.Tranno}
            searchText={(r) => `${r.Tranno} ${r.FromCC} ${r.Date}`}
            card={(r) => ({
                title: r.Tranno,
                subtitle: r.FromCC && `From ${r.FromCC}`,
                meta: r.Date?.split(' ')[0],
            })}
            onOpen={(r) => router.push({ pathname: '/verification/daily-issue/[id]', params: { id: r.Tranno, row: JSON.stringify(r) } })}
        />
    );
}
