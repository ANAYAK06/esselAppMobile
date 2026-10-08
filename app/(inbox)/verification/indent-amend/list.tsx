// Indent Amend verification queue (web: pages/Purchase/VerifyIndentAmend.jsx).
// Rows with Status "0" are waiting for the raiser to update — nothing to verify yet.
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { FilePen } from 'lucide-react-native';
import { getIndentAmendQueue, type IndentAmendRow } from '@/src/api/verification/indentVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const queue = (roleId: string, _uid: string, userName: string) => getIndentAmendQueue(roleId, userName);

export default function IndentAmendQueue() {
    return (
        <VerificationQueueScreen<IndentAmendRow>
            title="Indent Amend"
            icon={FilePen}
            noun="amendment"
            searchPlaceholder="Search indent no, cost centre…"
            load={queue}
            keyOf={(r) => `${r.AmendId}`}
            searchText={(r) => `${r.IndentNo} ${r.CCName} ${r.CCCode}`}
            card={(r) => ({
                title: r.IndentNo,
                subtitle: [r.CCCode, r.CCName].filter(Boolean).join(' · '),
                meta: r.AmendDate,
                amount: r.DifferenceAmount != null ? money(r.DifferenceAmount) : null,
                returned: r.Status === '0',
            })}
            onOpen={(r) => {
                if (r.Status === '0') {
                    Alert.alert('Waiting for the raiser', 'This amendment is pending update from the raiser — nothing to verify yet.');
                    return;
                }
                router.push({ pathname: '/verification/indent-amend/[id]', params: { id: String(r.AmendId), row: JSON.stringify(r) } });
            }}
        />
    );
}
