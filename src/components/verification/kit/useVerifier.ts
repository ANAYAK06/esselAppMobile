// Who is verifying (role login) + the queue row a detail screen was opened with.
import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/src/store/hooks';

export function useVerifier() {
    const userData = useAppSelector((state) => state.auth.userData);
    const roleId = useAppSelector((state) => state.auth.roleId);
    return {
        roleId: String(roleId || ''),
        uid: String(userData?.uid || ''),
        // The web posts userData.userName as Createdby / CreatedBy
        userName: userData?.userName || userData?.firstName || 'system',
        roleCode: userData?.roleCode || '',
    };
}

// Detail screens receive the tapped queue row as a JSON `row` param
export function useRowParam<T>(): T | null {
    const { row } = useLocalSearchParams<{ row?: string }>();
    return useMemo(() => {
        if (!row) return null;
        try {
            return JSON.parse(row) as T;
        } catch {
            return null;
        }
    }, [row]);
}
