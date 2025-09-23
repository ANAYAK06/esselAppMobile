// src/hooks/useAppBadge.ts
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectTotalPendingCount } from '@/src/slice/notifications/inboxNotificationsSlice';
import { NotificationBadgeManager } from '@/src/utils/notificationBadge';

export const useAppBadge = () => {
    const totalPendingCount = useSelector(selectTotalPendingCount);
    const previousCount = useRef(-1);

    useEffect(() => {
        // Initialize badge manager once
        NotificationBadgeManager.initialize();
    }, []);

    useEffect(() => {
        // Only update when count actually changes
        if (totalPendingCount !== previousCount.current) {
            console.log('Badge count changed from', previousCount.current, 'to', totalPendingCount);

            // Update badge to reflect current count
            NotificationBadgeManager.updateBadgeFromCount(totalPendingCount);

            previousCount.current = totalPendingCount;
        }
    }, [totalPendingCount]);
};