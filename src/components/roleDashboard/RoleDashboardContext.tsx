// Shared state for the role dashboard's cards: who is signed in (CC-scoping params), a scope
// object that changes identity on pull-to-refresh (so every card reloads), and the one detail
// sheet that replaces the web dashboards' modals.
import { createContext, useCallback, useContext } from 'react';
import type { Scope } from '@/src/api/dashboard/roleDashboardAPI';
import { useApiData } from '@/src/hooks/useApiData';

import type { SheetContent } from '@/src/components/common/DetailSheet';

export type { SheetContent };

type RoleDashboardValue = {
    scope: Scope;
    ccCodes: string;
    groupId: number;
    openSheet: (sheet: SheetContent) => void;
};

const RoleDashboardContext = createContext<RoleDashboardValue | null>(null);

export const RoleDashboardProvider = RoleDashboardContext.Provider;

export function useRoleDashboard() {
    const value = useContext(RoleDashboardContext);
    if (!value) throw new Error('useRoleDashboard must be used inside RoleDashboardProvider');
    return value;
}

// Loads `fetcher(scope)` for a card. `fetcher` must be stable (a module-level API function).
export function useScopedData<T>(fetcher: (scope: Scope) => Promise<T>) {
    const { scope } = useRoleDashboard();
    const load = useCallback(() => fetcher(scope), [fetcher, scope]);
    return useApiData(load);
}
