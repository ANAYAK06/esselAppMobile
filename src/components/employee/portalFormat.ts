// Text helpers shared by the Employee Portal screens (same wording as the Corex web portal)
import type { PortalRequest } from '@/src/api/hr/employeePortalAPI';

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const advanceTypeLabel: Record<string, string> = { LTA: 'Long Term Advance', SA: 'Salary Advance' };

export const formatRupees = (amount: number | string | undefined | null) =>
    `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const plural = (n: number | undefined, word: string) => `${n} ${word}${Number(n) === 1 ? '' : 's'}`;

export const requestTitle = (r: PortalRequest) =>
    r.RequestType === 'Advance'
        ? `${advanceTypeLabel[r.AdvanceType ?? ''] || 'Advance'} — ${formatRupees(r.Amount)}`
        : `${r.LeaveName || 'Leave'} — ${plural(r.NoOfDays, 'day')}`;

const installments = (r: PortalRequest) => (r.NoOfInstallments ? ` × ${Math.round(r.NoOfInstallments)}` : '');

export const requestSubtitle = (r: PortalRequest) =>
    r.RequestType === 'Advance'
        ? `Advance · EMI ${formatRupees(r.EMIAmount)}${installments(r)}${r.EMIStartDate ? ` from ${r.EMIStartDate}` : ''}`
        : `Leave · ${r.FromDate} → ${r.ToDate}`;

// One-line summary for the reporting person's approval list
export const requestSummary = (r: PortalRequest) =>
    r.RequestType === 'Advance'
        ? `${advanceTypeLabel[r.AdvanceType ?? ''] || 'Advance'} — ${formatRupees(r.Amount)} (EMI ${formatRupees(r.EMIAmount)}${installments(r)})`
        : `${r.LeaveName || 'Leave'} — ${plural(r.NoOfDays, 'day')} (${r.FromDate} → ${r.ToDate})`;

// Portal POSTs return "Error$<reason>" in Data on failure
export const cleanError = (text: string | undefined, fallback: string) =>
    (text || '').replace('Error$', '').trim() || fallback;

export const errorText = (error: unknown, fallback: string) =>
    typeof error === 'string' ? error : (error as Error)?.message || fallback;

export const initialsOf = (name?: string) =>
    (name || '').trim().split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase();

export const photoUri = (base64: string | null | undefined, fileType?: string | null) =>
    base64 ? `data:${(fileType || '').toUpperCase() === 'PNG' ? 'image/png' : 'image/jpeg'};base64,${base64}` : null;
