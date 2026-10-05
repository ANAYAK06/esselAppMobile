// Supplier PO verifications — same routes, methods and payload fields as the Corex web:
//   Supplier PO       → pages/SupplierPO/VerifySupplierPO.jsx (api/SupplierPOAPI/supplierPOAPI.js)
//   Supplier PO Amend → pages/SupplierPO/VerifySupplierPOAmend.jsx
// Both queues are fetched for CCType 'PCC', as the web does.
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

// ---- Supplier PO -------------------------------------------------------------------------

export interface SupplierPORow {
    PONo: string;
    IndentNo: string;
    VendorCode?: string;
    VendorName?: string;
    CCCode?: string;
    CCType?: string;
    PODate?: string;
    RefNo?: string;
}

export interface SupplierPOItem {
    itemcode: string;
    itemname?: string;
    specification?: string;
    units?: string;
    quantity?: number | string;
    HSNCode?: string;
    QuotedPrice?: number | string;
    basicprice?: number | string;      // standard price
    NewBasicprice?: number | string;   // purchase price
    ItemNewPrice?: number | string;    // latest price on record (recent change when ≠ standard)
    Amount?: number | string;
    CGSTPercent?: number | string;
    SGSTPercent?: number | string;
    IGSTPercent?: number | string;
    StateStatus?: 'Same' | 'NotSame' | 'NoNeed' | string;
    ItemRemark?: string;
}

export interface SupplierPODetail {
    PONo?: string;
    IndentNo?: string;
    PODate?: string;
    RefNo?: string;
    CCCode?: string;
    CCType?: string;
    Status?: string;
    MOID?: number;
    VendorName?: string;
    VendorAddress?: string;
    VendorGST?: string;
    InvAddress1?: string;
    InvAddress2?: string;
    GstNo?: string;
    MobileNo?: string;
    SiteAddress1?: string;
    SiteAddress2?: string;
    Contact?: string;
    SiteMobileNo?: string;
    FilePath?: string;               // QCS (quotation comparison sheet)
    Remarks?: string;                // PO terms, "|"-separated
    ApprovedUser?: string;           // approval comments so far, "||"-separated
    PriceChangeAccess?: string;
    ItemTermHeadID?: number;
    PreferredRemarks?: string | null;
    PredefinedTermsExist?: string;
    PODataList?: SupplierPOItem[];
}

export interface PreviousPurchase {
    PODate?: string;
    VendorName?: string;
    CCCode?: string;
    BasicPrice?: number | string;
}

export const getSupplierPOQueue = (roleId: string, uid: string) =>
    list<SupplierPORow>('Purchase/GetVerificationSupplierPO', { Roleid: roleId, Userid: uid, CCType: 'PCC' });

export const getSupplierPODetail = (row: SupplierPORow) =>
    get<SupplierPODetail>('Purchase/GetVerificationSupplierPObyPO', { PONo: row.PONo, IndentNo: row.IndentNo });

export const getPreviousPurchases = (itemCode: string) =>
    list<PreviousPurchase>('Purchase/GetPreviousePODetails', { Itemcode: itemCode });

// May answer "Status$extra info"
export const approveSupplierPO = (payload: Record<string, unknown>) => put('Purchase/ApproveSupplierPO', payload);

// ---- Supplier PO Amend -------------------------------------------------------------------

export interface SupplierPOAmendRow {
    AmendPONO: string | number;
    PONo: string;
    IndentNo: string;
    VendorName?: string;
    CCCode?: string;
    AmendDate?: string;
    AmendDiffValue?: number | string;
    PlusAmount?: number | string;
    MinusAmount?: number | string;
}

export interface SupplierPOAmendItem {
    itemcode?: string;
    itemname?: string;
    specification?: string;
    IndentListId?: string | number;
    HSNCode?: string;
    units?: string;
    quantity?: number | string;
    CurrentQty?: number | string;
    AmendType?: string;             // Add / Substract
    AmendQty?: number | string;
    PONewQty?: number | string;
    POQuotedPrice?: number | string;
    basicprice?: number | string;
    POStandardPrice?: number | string;
    POPurchasePrice?: number | string;
    Amount?: number | string;
    OldAmount?: number | string;
    CGSTPercent?: number | string;
    SGSTPercent?: number | string;
    ItemRemark?: string;
}

export interface SupplierPOAmendDetail {
    AmendPONO?: string | number;
    SerialNo?: number;
    PONo?: string;
    IndentNo?: string;
    VendorCode?: string;
    VendorName?: string;
    CCCode?: string;
    CCName?: string;
    CCType?: string;
    AmendDate?: string;
    PODate?: string;
    POExpireDate?: string;
    MRRType?: string;
    RefNo?: string;
    RefDate?: string;
    MOID?: number;
    Remarks?: string;
    PlusAmount?: number;
    MinusAmount?: number;
    OldPOValue?: number;
    AmendDiffValue?: number;
    RevisedValue?: number;
    AddedPO?: number;
    SubstractedPO?: number;
    ReducedBudgetAmount?: number;
    ReturnBudgetAmount?: number;
    NewPurchasepriceTotal?: number;
    lstItems?: SupplierPOAmendItem[];
}

export interface PODocument {
    Path?: string;
    POType?: string;   // 'Amend' → amendment document, else the original PO's
    POCount?: number;
}

export const getSupplierPOAmendQueue = (roleId: string, uid: string) =>
    list<SupplierPOAmendRow>('Purchase/GetVerifySupplierPOAmend', { Roleid: roleId, Userid: uid, CCType: 'PCC' });

export const getSupplierPOAmendDetail = (row: SupplierPOAmendRow) =>
    get<SupplierPOAmendDetail>('Purchase/GetSupplierPOAmendbyPO', { AmendPONO: row.AmendPONO, PONo: row.PONo, IndentNo: row.IndentNo });

export const getPOUploadedDocs = (poNo: string) =>
    list<PODocument>('Purchase/POUploadedDocsView', { PONO: poNo, For: 'Supplier' });

export const approveSupplierPOAmend = (payload: Record<string, unknown>) => put('Purchase/ApproveSupplierPOAmend', payload);
