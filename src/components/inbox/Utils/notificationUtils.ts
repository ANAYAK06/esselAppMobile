// src/components/inbox/Utils/notificationUtils.ts
import {
    FileText,
    DollarSign,
    CheckCircle,
    AlertCircle,
} from 'lucide-react-native';

// Icon mapping for different notification types
export const getNotificationIcon = (moduleDisplayName: string, category: string) => {
    const name = moduleDisplayName.toLowerCase();

    if (name.includes('purchase') || name.includes('order')) {
        return FileText;
    } else if (name.includes('budget') || name.includes('approval')) {
        return DollarSign;
    } else if (name.includes('service') || name.includes('provider')) {
        return CheckCircle;
    } else {
        return AlertCircle;
    }
};

// Color mapping for different priorities/statuses
export const getStatusColor = (status: number, priority: string) => {
    if (status === 1 || priority === 'High') {
        return '#ef4444'; // Red
    } else if (status === 2 || priority === 'Medium') {
        return '#f97316'; // Orange
    } else {
        return '#22c55e'; // Green
    }
};

// Status text mapping
export const getStatusText = (status: number) => {
    switch (status) {
        case 1:
            return 'Pending verification';
        case 2:
            return 'Awaiting your review';
        default:
            return 'Ready for approval';
    }
};

// Badge text formatter
export const formatBadgeText = (count: number) => {
    return count > 99 ? '99+' : count.toString();
};