// Loads one API call for a dashboard card. Pass a memoised loader (useCallback): whenever its
// identity changes — new role/user, or a pull-to-refresh bump — it is called again.
// `loading` is derived (result belongs to an older loader) rather than set inside the effect,
// which keeps the React Compiler lint rules happy.
import { useEffect, useState } from 'react';

type Result<T> = { load: () => Promise<T>; data: T | null; error: boolean; errorMessage: string | null };

// The thrown error's text, so screens can show what went wrong: the server's error body
// ({ Message, ErrorDetails }) on a raw axios error, else the error's own message
export const errorText = (e: unknown) => {
    const body = (e as { response?: { data?: { Message?: string; ErrorDetails?: { ErrorMessage?: string } } } })?.response?.data;
    const server = body?.ErrorDetails?.ErrorMessage || body?.Message;
    return server || (e instanceof Error ? e.message : typeof e === 'string' ? e : '') || 'Request failed';
};

export function useApiData<T>(load: (() => Promise<T>) | null) {
    const [result, setResult] = useState<Result<T> | null>(null);

    useEffect(() => {
        if (!load) return;
        let cancelled = false;
        load()
            .then((data) => { if (!cancelled) setResult({ load, data, error: false, errorMessage: null }); })
            .catch((e) => { if (!cancelled) setResult({ load, data: null, error: true, errorMessage: errorText(e) }); });
        return () => { cancelled = true; };
    }, [load]);

    return {
        // Previous data stays visible while a refresh is in flight
        data: result?.data ?? null,
        loading: !!load && result?.load !== load,
        error: result?.load === load && result.error,
        errorMessage: result?.load === load ? result.errorMessage : null,
    };
}
