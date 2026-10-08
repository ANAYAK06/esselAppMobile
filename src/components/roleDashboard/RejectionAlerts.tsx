// Rejection alerts list shown from the header bell — mobile version of the web top bar's
// "Rejection Alerts" dropdown (RAPP-SLAPP frontend: components/TopNavbarLayout.jsx).
// Tap an alert to mark it read, × to dismiss it for good, "AI Insight" to expand the AI note.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, CheckCheck, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    dismissAlert,
    isAlertUnread,
    markAlertRead,
    selectRejectionAlerts,
    selectRejectionAlertsLoading,
    updateAlertStatus,
} from '@/src/slice/notifications/rejectionAlertsSlice';
import type { RejectionAlert } from '@/src/api/notifications/rejectionAlertAPI';
import { Spinner } from './DashboardUI';

export default function RejectionAlertsBody({ userId }: { userId: string }) {
    const dispatch = useAppDispatch();
    const alerts = useAppSelector(selectRejectionAlerts);
    const loading = useAppSelector(selectRejectionAlertsLoading);
    const [expanded, setExpanded] = useState<number | null>(null);

    const markRead = (alert: RejectionAlert) => {
        if (!isAlertUnread(alert)) return;
        dispatch(markAlertRead(alert.RejectionAlertId));
        dispatch(updateAlertStatus({ RejectionAlertId: alert.RejectionAlertId, UserId: userId, Status: 1 }));
    };

    const dismiss = (alert: RejectionAlert) => {
        dispatch(dismissAlert(alert.RejectionAlertId));
        dispatch(updateAlertStatus({ RejectionAlertId: alert.RejectionAlertId, UserId: userId, Status: 2 }));
    };

    if (loading && alerts.length === 0) return <View className="py-10"><Spinner color="#ef4444" /></View>;

    if (alerts.length === 0) {
        return (
            <View className="items-center py-10">
                <CheckCheck size={40} color="#34d399" />
                <Text className="text-sm font-semibold text-gray-700 mt-3">All clear!</Text>
                <Text className="text-xs text-gray-400 mt-1">No rejection alerts</Text>
            </View>
        );
    }

    return (
        <View className="gap-2.5">
            {alerts.map((alert, index) => {
                const unread = isAlertUnread(alert);
                const open = expanded === alert.RejectionAlertId;
                return (
                    <View
                        key={alert.RejectionAlertId ?? index}
                        className={`rounded-xl border overflow-hidden ${unread ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <TouchableOpacity onPress={() => markRead(alert)} activeOpacity={unread ? 0.7 : 1} className="flex-row items-start gap-3 p-3">
                            <View className={`w-8 h-8 rounded-full items-center justify-center mt-0.5 ${unread ? 'bg-red-500' : 'bg-gray-300'}`}>
                                <AlertCircle size={16} color="#ffffff" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center gap-1.5">
                                    <Text className={`text-xs font-bold flex-shrink ${unread ? 'text-red-600' : 'text-gray-500'}`} numberOfLines={1}>
                                        {alert.ModuleName || 'Rejection'}
                                    </Text>
                                    {unread && <View className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                </View>
                                <Text className="text-[11px] text-gray-500 mt-0.5">
                                    Rejected by <Text className="font-semibold text-gray-700">{alert.RejectedBy || '—'}</Text>
                                    {alert.RejectedOn ? ` · ${alert.RejectedOn}` : ''}
                                </Text>
                                {alert.Refno ? <Text className="text-[11px] text-gray-400 mt-0.5">{alert.Refno}</Text> : null}
                                {alert.Remarks ? (
                                    <Text className={`text-xs italic mt-1.5 ${unread ? 'text-gray-700' : 'text-gray-500'}`} numberOfLines={3}>
                                        “{alert.Remarks}”
                                    </Text>
                                ) : null}
                                {unread && <Text className="text-[10px] text-red-500 mt-1">Tap to mark as read</Text>}
                            </View>
                            <TouchableOpacity onPress={() => dismiss(alert)} hitSlop={10} className="p-1">
                                <X size={15} color="#9ca3af" />
                            </TouchableOpacity>
                        </TouchableOpacity>

                        {alert.AiMessage ? (
                            <>
                                <TouchableOpacity
                                    onPress={() => setExpanded(open ? null : alert.RejectionAlertId)}
                                    className="flex-row items-center justify-between px-3 py-2 bg-violet-50 border-t border-violet-100"
                                >
                                    <Text className="text-[11px] font-semibold text-violet-600">✨ AI Insight</Text>
                                    {open ? <ChevronUp size={14} color="#7c3aed" /> : <ChevronDown size={14} color="#7c3aed" />}
                                </TouchableOpacity>
                                {open && (
                                    <Text className="px-3 py-3 text-[11px] leading-5 text-gray-600 bg-violet-50/60 border-t border-violet-100">
                                        {alert.AiMessage}
                                    </Text>
                                )}
                            </>
                        ) : null}
                    </View>
                );
            })}
        </View>
    );
}
