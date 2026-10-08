// Queue (list) screen shared by every verification: header, count, search, one card per row.
// A record actioned on its detail screen is hidden at once (verificationEvents) and the list
// reloads; it also reloads each time it comes back into focus.
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, type Href } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { EmptyState, LoadingText, SearchInput } from '@/src/components/employee/PortalUI';
import { useApiData } from '@/src/hooks/useApiData';
import { QueueCard, QueueSummary } from './VerificationKit';
import { useVerifier } from './useVerifier';
import { onVerified } from './verificationEvents';

type CardProps = Omit<React.ComponentProps<typeof QueueCard>, 'onPress'>;

type Props<T> = {
    title: string;
    icon: LucideIcon;
    noun: string;                                           // "budget" → "3 budgets awaiting your action"
    searchPlaceholder: string;
    load: (roleId: string, uid: string, userName: string) => Promise<T[]>;   // stable (module-level) function
    keyOf: (row: T) => string;
    searchText: (row: T) => string;
    card: (row: T) => CardProps;
    onOpen: (row: T) => void;
    header?: React.ReactNode;                               // extra controls above the list (e.g. a type switch)
};

export default function VerificationQueueScreen<T>({ title, icon, noun, searchPlaceholder, load, keyOf, searchText, card, onOpen, header }: Props<T>) {
    const { roleId, uid, userName } = useVerifier();
    const [reloadKey, setReloadKey] = useState(0);
    const [query, setQuery] = useState('');

    const [done, setDone] = useState<ReadonlySet<string>>(() => new Set());

    useFocusEffect(useCallback(() => setReloadKey((k) => k + 1), []));

    useEffect(() => onVerified((row) => {
        if (row) setDone((prev) => new Set(prev).add(keyOf(row as T)));
        setReloadKey((k) => k + 1);
    }), [keyOf]);

    const loader = useCallback(() => load(roleId, uid, userName), [load, roleId, uid, userName, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data, loading, error } = useApiData(roleId ? loader : null);
    // Kept hidden even if a reload still returns it (the server can lag behind the action)
    const rows = (data ?? []).filter((r) => !done.has(keyOf(r)));

    const q = query.trim().toLowerCase();
    const shown = q ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;

    return (
        <PortalScreen
            title={title}
            subtitle="Approvals Inbox"
            icon={icon}
            backHref={'/inbox' as Href}
            onRefresh={() => setReloadKey((k) => k + 1)}
        >
            {header}
            <QueueSummary count={rows.length} noun={noun} icon={icon} loading={loading && !data} />
            {rows.length > 3 ? <SearchInput value={query} onChangeText={setQuery} placeholder={searchPlaceholder} /> : null}

            {loading && !data ? (
                <LoadingText />
            ) : error ? (
                <EmptyState title="Could not load the list" subtitle="Pull down to try again." />
            ) : shown.length === 0 ? (
                <View className="pt-6">
                    <EmptyState
                        icon={CheckCircle}
                        title={q ? 'No matches' : 'All caught up!'}
                        subtitle={q ? 'Try a different search.' : `No ${noun}s are waiting for your verification.`}
                    />
                </View>
            ) : (
                shown.map((row) => <QueueCard key={keyOf(row)} {...card(row)} onPress={() => onOpen(row)} />)
            )}
        </PortalScreen>
    );
}
