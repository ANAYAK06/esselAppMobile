// app/employee/request-advance.tsx
// Mirrors the Corex web portal's RequestAdvance page (pages/EmployeePortal/pages/RequestAdvance.jsx)
import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { UserCheck, Wallet } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyPortalRequests, fetchMyReportingPerson } from '@/src/slice/hr/employeePortalSlice';
import { submitPortalAdvanceRequest } from '@/src/api/hr/employeePortalAPI';
import { useEmployee } from '@/src/hooks/useEmployee';
import RequestFormShell, { RoutesToRow } from '@/src/components/employee/RequestFormShell';
import { SectionCard } from '@/src/components/employee/PortalUI';
import { DateField, FormField, SelectField, TextField } from '@/src/components/employee/FormControls';
import { cleanError } from '@/src/components/employee/portalFormat';

const ADVANCE_TYPES = [
    { label: 'Long Term Advance', value: 'LTA' },
    { label: 'Salary Advance', value: 'SA' },
];

const emptyForm = { advanceType: '', amount: '', emiAmount: '', emiStartDate: '', purpose: '' };

// Keep digits and one decimal point
const numeric = (text: string) => text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

export default function RequestAdvance() {
    const dispatch = useAppDispatch();
    const { empRefNo, username } = useEmployee();
    const { reportingPerson, loading } = useAppSelector((s) => s.employeePortal);

    const [form, setForm] = useState(emptyForm);
    const set = (key: keyof typeof emptyForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const load = useCallback(
        () => (empRefNo ? dispatch(fetchMyReportingPerson(empRefNo)) : Promise.resolve()),
        [dispatch, empRefNo]
    );

    useEffect(() => {
        load();
    }, [load]);

    const reportingPersonName = reportingPerson?.EmployeeName?.trim() || 'your reporting person';

    const handleSubmit = async () => {
        if (!empRefNo) throw new Error('Employee reference not found — please log in again.');

        const missing = [
            !form.advanceType && 'Advance Type',
            !form.amount && 'Amount Requested',
            !form.emiAmount && 'Monthly EMI',
            !form.emiStartDate && 'EMI Starts From',
            !form.purpose.trim() && 'Purpose',
        ].filter(Boolean);
        if (missing.length) throw new Error(`Please fill: ${missing.join(', ')}`);

        const advanceType = form.advanceType as 'LTA' | 'SA';
        const amount = Number(form.amount);
        const emiAmount = Number(form.emiAmount);
        if (!(amount > 0)) throw new Error('Amount must be greater than zero');
        if (!(emiAmount > 0)) throw new Error('EMI must be greater than zero');
        if (advanceType === 'LTA' && emiAmount > amount) throw new Error('EMI cannot be greater than the advance amount');

        const result = await submitPortalAdvanceRequest({
            EmpRefNo: empRefNo,
            AdvanceType: advanceType,
            LTAAmount: amount,
            EmiAmount: emiAmount,
            EMIStartDate: form.emiStartDate,
            Purpose: form.purpose.trim(),
            RequestDate: null,
            CreatedBy: username || empRefNo,
        });

        const status = typeof result?.Data === 'string' ? result.Data : '';
        if (!status.toLowerCase().includes('submit')) {
            throw new Error(cleanError(status, 'Failed to submit advance request'));
        }
        dispatch(fetchMyPortalRequests(empRefNo));
    };

    const sidePanel = (
        <SectionCard title="Where This Goes" icon={UserCheck}>
            <Text className="text-xs text-gray-500">
                Your request is first verified by your reporting person. Once accepted it enters the standard
                advance approval workflow.
            </Text>
            <RoutesToRow loading={loading.reportingPerson} name={reportingPerson?.EmployeeName} />
        </SectionCard>
    );

    return (
        <RequestFormShell
            title="Request Advance"
            subtitle="Raise a long term or salary advance request"
            icon={Wallet}
            submitLabel="Submit Advance Request"
            reportingPersonName={reportingPersonName}
            onSubmit={handleSubmit}
            onReset={() => setForm(emptyForm)}
            onRefresh={load}
            sidePanel={sidePanel}
        >
            <FormField label="Advance Type" required>
                <SelectField title="Advance Type" value={form.advanceType} onChange={set('advanceType')} options={ADVANCE_TYPES} />
            </FormField>
            <FormField label="Amount Requested (₹)" required>
                <TextField
                    value={form.amount}
                    onChangeText={(t) => set('amount')(numeric(t))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                />
            </FormField>
            <FormField label="Monthly EMI (₹)" required>
                <TextField
                    value={form.emiAmount}
                    onChangeText={(t) => set('emiAmount')(numeric(t))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                />
            </FormField>
            <FormField label="EMI Starts From" required>
                <DateField title="EMI Starts From" value={form.emiStartDate} onChange={set('emiStartDate')} />
            </FormField>
            <FormField label="Purpose" required>
                <TextField
                    value={form.purpose}
                    onChangeText={set('purpose')}
                    placeholder="Briefly describe why the advance is needed"
                    multiline
                />
            </FormField>
        </RequestFormShell>
    );
}
