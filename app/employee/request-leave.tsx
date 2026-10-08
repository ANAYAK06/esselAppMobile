// app/employee/request-leave.tsx
// Mirrors the Corex web portal's RequestLeave page (pages/EmployeePortal/pages/RequestLeave.jsx)
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { CalendarCheck, CalendarClock, Wallet } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    fetchLeaveApplicationContext,
    fetchLeaveTypesForPortal,
    fetchMyPortalRequests,
    fetchMyReportingPerson,
} from '@/src/slice/hr/employeePortalSlice';
import { submitPortalLeaveRequest } from '@/src/api/hr/employeePortalAPI';
import { useEmployee } from '@/src/hooks/useEmployee';
import RequestFormShell, { RoutesToRow } from '@/src/components/employee/RequestFormShell';
import { SectionCard } from '@/src/components/employee/PortalUI';
import { DateField, FormField, SelectField, TextField, parseIsoDate } from '@/src/components/employee/FormControls';
import { cleanError } from '@/src/components/employee/portalFormat';

const emptyForm = { leaveType: '', fromDate: '', toDate: '', contact: '', reason: '' };

export default function RequestLeave() {
    const dispatch = useAppDispatch();
    const { empRefNo, username } = useEmployee();
    const { leaveTypes, leaveApplicationContext, reportingPerson, loading } = useAppSelector((s) => s.employeePortal);

    const [form, setForm] = useState(emptyForm);
    const set = (key: keyof typeof emptyForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const load = useCallback(() => {
        const calls: Promise<unknown>[] = [];
        if (username) calls.push(dispatch(fetchLeaveTypesForPortal(username)));
        if (empRefNo) {
            calls.push(dispatch(fetchLeaveApplicationContext(empRefNo)));
            calls.push(dispatch(fetchMyReportingPerson(empRefNo)));
        }
        return Promise.all(calls);
    }, [dispatch, empRefNo, username]);

    useEffect(() => {
        load();
    }, [load]);

    const reportingPersonName = reportingPerson?.EmployeeName?.trim() || 'your reporting person';

    const handleSubmit = async () => {
        if (!empRefNo) throw new Error('Employee reference not found — please log in again.');

        const missing = [
            !form.leaveType && 'Leave Type',
            !form.fromDate && 'From Date',
            !form.toDate && 'To Date',
            !form.reason.trim() && 'Reason',
        ].filter(Boolean);
        if (missing.length) throw new Error(`Please fill: ${missing.join(', ')}`);

        const noOfDays =
            Math.round((parseIsoDate(form.toDate).getTime() - parseIsoDate(form.fromDate).getTime()) / 86400000) + 1;
        if (!(noOfDays > 0)) throw new Error('To Date must be on or after From Date');

        const result = await submitPortalLeaveRequest({
            EmpRefNo: empRefNo,
            // Send the id exactly as GetLeaveTypes returned it (the picker works with strings)
            LeaveTypeId: leaveTypes.find((lt) => String(lt.LeaveId) === form.leaveType)?.LeaveId ?? form.leaveType,
            FromDate: form.fromDate,
            ToDate: form.toDate,
            NoOfDays: noOfDays,
            ContactNumber: form.contact.trim(),
            Reason: form.reason.trim(),
            CreatedBy: username || empRefNo,
        });

        const status = typeof result?.Data === 'string' ? result.Data : '';
        if (!status.toLowerCase().includes('submit')) {
            throw new Error(cleanError(status, 'Failed to submit leave request'));
        }
        dispatch(fetchMyPortalRequests(empRefNo));
    };

    const days =
        form.fromDate && form.toDate
            ? Math.round((parseIsoDate(form.toDate).getTime() - parseIsoDate(form.fromDate).getTime()) / 86400000) + 1
            : 0;

    const sidePanel = (
        <SectionCard title="Leave Balance" icon={Wallet}>
            {loading.leaveApplicationContext ? (
                <Text className="text-sm text-gray-400">Loading…</Text>
            ) : (
                <>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-medium text-gray-500">Balance (current year)</Text>
                        <Text className="text-lg font-bold text-brand-navy">
                            {leaveApplicationContext?.Balanceleaves ?? '—'}
                            {leaveApplicationContext?.Balanceleaves != null ? ' days' : ''}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2 pt-3 mt-3 border-t border-gray-100">
                        <CalendarClock size={16} color="#9ca3af" />
                        <View className="flex-1">
                            <Text className="text-xs text-gray-500">Return from last leave</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {leaveApplicationContext?.PreviousLRDate || '—'}
                            </Text>
                        </View>
                    </View>
                    <RoutesToRow loading={loading.reportingPerson} name={reportingPerson?.EmployeeName} />
                </>
            )}
        </SectionCard>
    );

    return (
        <RequestFormShell
            title="Request Leave"
            subtitle="Raise a leave request for approval"
            icon={CalendarCheck}
            submitLabel="Submit Leave Request"
            reportingPersonName={reportingPersonName}
            onSubmit={handleSubmit}
            onReset={() => setForm(emptyForm)}
            onRefresh={load}
            sidePanel={sidePanel}
        >
            <FormField label="Leave Type" required>
                <SelectField
                    title="Leave Type"
                    value={form.leaveType}
                    onChange={set('leaveType')}
                    placeholder={loading.leaveTypes ? 'Loading…' : 'Select…'}
                    options={leaveTypes.map((lt) => ({ label: lt.LeaveName, value: String(lt.LeaveId) }))}
                />
            </FormField>
            <View className="flex-row gap-3">
                <View className="flex-1">
                    <FormField label="From Date" required>
                        <DateField title="From Date" value={form.fromDate} onChange={set('fromDate')} />
                    </FormField>
                </View>
                <View className="flex-1">
                    <FormField label="To Date" required>
                        <DateField
                            title="To Date"
                            value={form.toDate}
                            onChange={set('toDate')}
                            minDate={form.fromDate || undefined}
                        />
                    </FormField>
                </View>
            </View>
            {days > 0 && (
                <Text className="text-xs text-gray-500 -mt-2 mb-4">
                    {days} day{days === 1 ? '' : 's'} of leave
                </Text>
            )}
            <FormField label="Contact Number During Leave">
                <TextField
                    value={form.contact}
                    onChangeText={set('contact')}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                />
            </FormField>
            <FormField label="Reason" required>
                <TextField
                    value={form.reason}
                    onChangeText={set('reason')}
                    placeholder="Briefly describe the reason for leave"
                    multiline
                />
            </FormField>
        </RequestFormShell>
    );
}
