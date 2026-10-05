// Loads one API call for a dashboard card. Pass a memoised loader (useCallback): whenever its
// identity changes — new role/user, or a pull-to-refresh bump — it is called again.
// `loading` is derived (result belongs to an older loader) rather than set inside the effect,
// which keeps the React Compiler lint rules happy.
import { useEffect, useState } from 'react';

type Result<T> = { load: () => Promise<T>; data: T | null; error: boolean };

export function useApiData<T>(load: (() => Promise<T>) | null) {
    const [result, setResult] = useState<Result<T> | null>(null);

    useEffect(() => {
        if (!load) return;
        let cancelled = false;
        load()
            .then((data) => { if (!cancelled) setResult({ load, data, error: false }); })
            .catch(() => { if (!cancelled) setResult({ load, data: null, error: true }); });
        return () => { cancelled = true; };
    }, [load]);

    return {
        // Previous data stays visible while a refresh is in flight
        data: result?.data ?? null,
        loading: !!load && result?.load !== load,
        error: result?.load === load && result.error,
    };
}
