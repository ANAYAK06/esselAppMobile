// Who is verifying (role login) + the queue row a detail screen was opened with.
import { useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/src/store/hooks';
import { clearOpenRow, setOpenRow } from './verificationEvents';

export function useVerifier() {
    const userData = useAppSelector((state) => state.auth.userData);
    const roleId = useAppSelector((state) => state.auth.roleId);
    return {
        roleId: String(roleId || ''),
        uid: String(userData?.uid || ''),
        // The web posts userData.userName as Createdby / CreatedBy, falling back to 'system' (getCurrentUser)
        userName: userData?.userName || 'system',
        roleCode: userData?.roleCode || '',
    };
}

// Detail screens receive the tapped queue row as a JSON `row` param. It is registered as the
// open record so showDone can tell the queue which row to drop.
export function useRowParam<T>(): T | null {
    const { row } = useLocalSearchParams<{ row?: string }>();
    const parsed = useMemo(() => {
        if (!row) return null;
        try {
            return JSON.parse(row) as T;
        } catch {
            return null;
        }
    }, [row]);
    useEffect(() => {
        setOpenRow(parsed);
        return () => clearOpenRow(parsed);
    }, [parsed]);
    return parsed;
}
