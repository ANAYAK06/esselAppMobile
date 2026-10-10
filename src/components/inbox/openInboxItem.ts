// The inbox entry the user last opened. The web hands this object to each verification page as
// `notificationData`, and some pages build the approval-comment trail from it (InboxTitle /
// ModuleDisplayName), so mobile keeps it for the screen that entry opens.
import type { NotificationsSummaryItem } from '@/src/slice/notifications/inboxNotificationsSlice';
import { inboxRouteFor } from './inboxRoutes';

let openItem: NotificationsSummaryItem | null = null;

export const setOpenInboxItem = (item: NotificationsSummaryItem | null) => {
    openItem = item;
};

// The opened entry, only if it belongs to the screen asking (`routeKey` from inboxRoutes) — a
// screen reached another way (e.g. a dashboard drill-down) gets null, as the web page would.
export const getOpenInboxItem = (routeKey: string) =>
    openItem && inboxRouteFor(openItem)?.key === routeKey ? openItem : null;
