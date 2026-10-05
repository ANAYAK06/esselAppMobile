// Queue for a config-driven verification (web pages/Accounts/ConfigVerification.jsx left panel)
import React, { useCallback } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { FileCheck } from 'lucide-react-native';
import { getRoute, listOf } from '@/src/api/verification/configVerificationAPI';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState } from '@/src/components/employee/PortalUI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { useVerifier } from '@/src/components/verification/kit/useVerifier';
import { VERIFICATION_CONFIGS } from './configs';
import type { Rec } from './types';

const text = (v: unknown) => (v === null || v === undefined || v === false ? '' : String(v));

export default function ConfigQueue() {
    const { key, path = '', category = '' } = useLocalSearchParams<{ key: string; path?: string; category?: string }>();
    const config = VERIFICATION_CONFIGS[key];
    const { uid, userName } = useVerifier();

    const load = useCallback(
        (roleId: string) => {
            if (!config) return Promise.resolve([]);
            const ctx = { roleId, userId: uid, user: userName, path, category };
            const fetchQueue = (q: { route: string; params: (c: typeof ctx) => Rec; tag?: string }) => getRoute(
                // Some queue routes take the role / user in the path ("…/GetVerifyDividendDeclaration/{roleId}")
                q.route.replace('{roleId}', roleId).replace('{userId}', uid),
                q.params(ctx),
            ).then(listOf).then((rows: Rec[]) => (q.tag ? rows.map((r) => ({ ...r, _type: q.tag })) : rows));
            if (!config.queue.more?.length) return fetchQueue(config.queue);
            // As on the web each queue loads on its own: one failing still shows the other's rows
            return Promise.allSettled([config.queue, ...config.queue.more].map(fetchQueue)).then((results) => {
                const failed = results.find((x): x is PromiseRejectedResult => x.status === 'rejected');
                if (failed && results.every((x) => x.status === 'rejected')) throw failed.reason;
                return results.flatMap((x) => (x.status === 'fulfilled' ? x.value : []));
            });
        },
        [config, uid, userName, path, category],
    );

    if (!config) {
        return (
            <PortalScreen title="Verification" subtitle="Approvals Inbox" icon={FileCheck} backHref={'/inbox' as Href}>
                <EmptyState title="Unknown verification" subtitle={`No mobile screen is set up for “${key}”.`} />
            </PortalScreen>
        );
    }

    return (
        <VerificationQueueScreen<Rec>
            title={config.title.replace(/ Verification$/, '')}
            icon={config.icon}
            noun={config.noun}
            searchPlaceholder={config.searchPlaceholder || 'Search…'}
            load={load}
            keyOf={(r) => String(config.itemKey(r))}
            searchText={(r) => text(config.searchText ? config.searchText(r) : `${text(config.card.title(r))} ${text(config.card.subtitle(r))}`)}
            card={(r) => ({
                title: text(config.card.title(r)) || '—',
                subtitle: text(config.card.subtitle(r)),
                meta: config.card.meta ? text(config.card.meta(r)) : null,
                amount: config.card.amount ? config.card.amount(r) : null,
                returned: !!config.isReturned?.(r),
            })}
            onOpen={(r) => router.push({
                pathname: '/verification/config/[key]/[id]',
                params: { key, id: String(config.itemKey(r)), row: JSON.stringify(r), path, category },
            } as Href)}
        />
    );
}
