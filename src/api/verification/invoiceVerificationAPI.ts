// Vendor invoice verifications — same routes, methods and payloads as the Corex web:
//   Supplier Invoice → pages/VendorInvoice/VerifySupplierInvoice.jsx (api/VendorInvoiceAPI/supplierInvoiceVerificationAPI.js)
//   SP (service provider) Invoice → pages/Accounts/verificationConfigs.jsx SPPOInvoice
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';

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

// Charge / deduction lines shared by both invoice types
export interface ChargeLine {
    TaxType?: string;
    Type?: string;
    CCCode?: string;
    DCACode?: string;
    SubDCACode?: string;
    Amount?: number | string;
}

// ---- Supplier Invoice --------------------------------------------------------------------

export interface SupplierInvoiceRow {
    InvoiceNo: string;
    VendorId?: string;
    VendorName?: string;          // "code,Name" — the display name is after the comma
    PONo?: string;
    MRR?: string;
    CCCode?: string;
    Status?: string;
    InvoiceDate?: string;
    NetAmount?: number;
    InvoiceValue?: number;
}

export interface SupplierInvoiceItem {
    itemcode?: string;
    itemname?: string;
    specification?: string;
    units?: string;
    dcacode?: string;
    subdcacode?: string;
    Requestedqty?: number | string;
    NewBasicprice?: number | string;
    Amount?: number | string;
}

export interface SupplierInvoiceDetail {
    InvoiceNo?: string;
    VendorName?: string;
    VendorType?: string;
    GSTType?: string;
    PONo?: string;
    MRR?: string;
    CCCode?: string;
    InvoiceDate?: string;
    MOID?: number;
    NetAmount?: number;
    InvoiceValue?: number;
    ItemTotal?: number;
    FileName?: string;            // invoice PDF (VendorPROD)
    MrrPath?: string;             // MRR / QMQC PDF (MRRPROD)
    ApprovedUser?: string;
    VendorGST?: string;
    CompanyGST?: string;
    CGSTTotal?: number; InvTotalCGSTAmt?: number;
    SGSTTotal?: number; InvTotalSGSTAmt?: number;
    IGSTTotal?: number; InvTotalIGSTAmt?: number;
    InvGSTTotal?: number;
    MRRItemData?: SupplierInvoiceItem[];
    OtherChargeList?: ChargeLine[];
    DeductionList?: ChargeLine[];
}

// "code,Name" → "Name"
export const vendorDisplayName = (v?: string) => v?.split(',')[1]?.trim() || v || '';

export const getSupplierInvoiceQueue = (roleId: string, uid: string) =>
    list<SupplierInvoiceRow>('Purchase/GetVerificationSupplierInvoice', { Roleid: roleId, Userid: uid });

export const getSupplierInvoiceDetail = (invoiceNo: string) =>
    get<SupplierInvoiceDetail>('Purchase/GetSupplierInvoiceByNo', { InvoiceNo: invoiceNo });

export const approveSupplierInvoice = (payload: Record<string, unknown>) => put('Purchase/ApproveSupplierInvoice', payload);

// ---- SP Invoice --------------------------------------------------------------------------

export interface SPInvoiceRow {
    InvoiceId?: number;
    SPPOInvoiceNo: string;
    SPPONo?: string;
    VendorName?: string;
    CCName?: string;
    NetAmount?: number;
    Status?: string | number;     // "0" = returned — corrected on the SP Invoice entry screen
}

export interface SPInvoiceDetail {
    SPPOInvoiceNo?: string;
    SPPONo?: string;
    MOID?: number;
    VendorName?: string;
    CCCode?: string;
    DCACode?: string;
    SubDCACode?: string;
    SPPOInvoiceDate?: string;
    SPPOInvoiceMakingDate?: string;
    SPPOBasicValue?: number;
    TaxApplicable?: string;       // "Yes" / "No"
    GSTType?: string;
    CompanyGST?: string;
    VendorGST?: string;
    Statecheck?: boolean | string; // true → CGST + SGST, else IGST
    Taxdcas?: string;
    Cgstsdca?: string; Cgstsdcaamt?: number;
    Sgstsdca?: string; Sgstsdcaamt?: number;
    Igstsdca?: string; Igstsdcaamt?: number;
    TaxTotal?: number;
    TaxList?: { Amount?: number | string }[];
    Advance?: number;
    Retention?: number;
    Hold?: number;
    InvoiceValue?: number;
    NetAmount?: number;
    Description?: string;
    FileName?: string;
    ApprovedUser?: string;        // "Role:Employee||…", first entry is the creator
    OtherChargeList?: ChargeLine[];
    DeductionList?: ChargeLine[];
}

// Tax total as the legacy view computes it: the TaxList sum when there are tax lines, else the stored total
export const spInvoiceTaxTotal = (d: SPInvoiceDetail) =>
    (d.TaxList || []).length ? (d.TaxList || []).reduce((a, x) => a + (Number(x.Amount) || 0), 0) : Number(d.TaxTotal) || 0;

export const getSPInvoiceQueue = (roleId: string, uid: string) =>
    list<SPInvoiceRow>('Purchase/GetVerificationSPPOInvoice', { RoleId: roleId, Userid: uid });

// The detail route is an HttpPost (the params go in the body)
export const getSPInvoiceDetail = async (invoiceNo: string): Promise<SPInvoiceDetail | null> => {
    const response = await axios.post(`${API_BASE_URL}/Purchase/GetSPPOInvoiceByNo`, { InvoiceNo: invoiceNo });
    const data = response.data?.Data ?? null;
    return Array.isArray(data) ? (data[0] ?? null) : data;
};

export const approveSPInvoice = (payload: Record<string, unknown>) => put('Purchase/ApproveSPPOInvoice', payload);
