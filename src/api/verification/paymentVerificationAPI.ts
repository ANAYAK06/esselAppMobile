// Vendor payment verifications — same routes, methods and payloads as the Corex web:
//   Vendor Payment (bank) → pages/VendorPayment/VerifyVendorPayment.jsx (api/VendorPaymentAPI/vendorPaymentAPI.js)
//   Vendor Payment by Cash → pages/Accounts/VerifyVendorPaymentByCash.jsx (same queue, detail and approve routes)
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';
import type { RemarkEntry } from './verificationCommonAPI';

const get = async <T>(route: string, params: Record<string, unknown>): Promise<T | null> => {
    const response = await axios.get(`${API_BASE_URL}/${route}`, { params });
    return (response.data?.Data ?? null) as T | null;
};
const list = async <T>(route: string, params: Record<string, unknown>): Promise<T[]> => {
    const data = await get<T[]>(route, params);
    return Array.isArray(data) ? data : [];
};
const put = async (route: string, payload: Record<string, unknown>): Promise<string> => {
    const response = await axios.put(`${API_BASE_URL}/${route}`, payload, { timeout: 30000 });
    const data = response.data?.Data ?? response.data;
    return typeof data === 'string' ? data : '';
};

// ---- Vendor Payment ----------------------------------------------------------------------

export interface VendorPaymentRow {
    TransactionRefNo: string;
    TransactionType?: string;        // detail call takes it as Transtype
    VendorCode?: string;
    VendorName?: string;
    PaymentTypeName?: string;        // "Vendor Invoice" / "Vendor Advance"
    TransactionDate?: string;
    TransactionAmount?: number | string;
}

// One invoice being paid, or the advance line
export interface VendorPaymentLine {
    InvoiceNo?: string;
    Amount?: number | string;
    Type?: string;
    CCCode?: string;
    DCACode?: string;
    SubDcaCode?: string;
    ITCode?: string;
}

export interface VendorPaymentDetail extends Partial<VendorPaymentRow> {
    MOID?: number;
    BankName?: string;
    ModeofPay?: string;
    Number?: string;                 // cheque / UTR number ("Online" when none)
    PoNo?: string;
    VendorType?: string;
    CCCode?: string;                 // cash voucher: own cost center (or PaidToCC)
    PaidToCC?: string;
    OtherCCCode?: string;            // cash voucher: other cost center (or PaidAganstCC)
    PaidAganstCC?: string;
    AmountInWords?: string;
    Remarks?: string;                // approval trail "Role : Name : comment||…"
    lstPayInvoiceData?: VendorPaymentLine[];
}

// NB: the queue takes the role only — no user id
export const getVendorPaymentQueue = (roleId: string) =>
    list<VendorPaymentRow>('Purchase/GetVerificationVendorPayments', { Roleid: roleId });

export const getVendorPaymentDetail = (row: VendorPaymentRow) =>
    get<VendorPaymentDetail>('Purchase/GetVerificationVendorPaybyRefno', {
        Refno: row.TransactionRefNo, Transtype: row.TransactionType, Vendorcode: row.VendorCode,
    });

export const approveVendorPayment = (payload: Record<string, unknown>) => put('Purchase/ApproveVendorPayment', payload);

// The web shows approvals from the record's own Remarks trail ("Role : Name : comment", "||"-joined)
export const parseApprovalTrail = (remarks?: string | null): RemarkEntry[] =>
    (remarks || '')
        .split('||')
        .map((entry) => entry.trim().split(' : '))
        .map((parts) => (parts.length >= 3
            ? { ActionRole: parts[0].trim(), ActionBy: parts[1].trim(), ActionRemarks: parts.slice(2).join(' : ').trim() }
            : { ActionRemarks: parts.join(' : ').trim() }))
        .filter((r) => r.ActionRemarks);
