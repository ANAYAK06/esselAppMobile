// Indent verifications — same routes, methods and payloads as the Corex web:
//   Indent Creation → pages/Purchase/VerifyIndentCreation.jsx (api/PurchaseAPI/indentVerificationAPI.js)
//   Indent Amend    → pages/Purchase/VerifyIndentAmend.jsx (api/Purchase/indentAmendVerificationAPI.js)
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
const first = async <T>(route: string, params: Record<string, unknown>): Promise<T | null> => {
    const data = await get<T | T[]>(route, params);
    return Array.isArray(data) ? (data[0] ?? null) : data;
};
const send = async (method: 'put' | 'post', route: string, payload: Record<string, unknown>): Promise<string> => {
    const response = await axios[method](`${API_BASE_URL}/${route}`, payload, { timeout: 30000 });
    const data = response.data?.Data ?? response.data;
    return typeof data === 'string' ? data : '';
};

// ---- Indent Creation ---------------------------------------------------------------------

export interface IndentRow {
    Indentno: string;
    Costcenter?: string;
    CCType?: string;
    Status?: string;
    Date?: string;
    TotalAmount?: number | string;
    CapitalMaterialType?: string;
    MOID?: number;
    Moid?: number;
    ChkAmt?: number;
}

export interface IndentDetail {
    MOID?: number;
    Indentno?: string;
    Rowid?: string;
    IndentTypeDefine?: string;
    Costcenter?: string;
    TotalAmount?: string;
}

export interface IndentLevels {
    IndentPresentLevel?: number;
    IndentDefineLevel?: number;
    NewItemDefineLevel?: number;
}

// Quantities / prices come back as strings
export interface IndentItem {
    IndentListId: string;
    ItemCode?: string;
    ItemName?: string;
    Specification?: string;
    DcaCode?: string;
    SubDcaCode?: string;
    BasicPrice?: string;
    Units?: string;
    Quantity?: string;
    Amount?: string;
    sumamt?: string;
    Stock?: string;         // old stock (CSK) / issued from CS (others)
    NewStock?: string;
    AvailableQty?: string;  // CSK: available; PUM: new stock at the chosen CC
    AvlQtyAtCC?: string;
    IssuedQty?: string;
    PurchasedQty?: string;
}

export interface IndentSubtotal {
    TotalAmount?: string | number;
    IssueOldstockAmount?: number;
    IssueNewStockAmount?: number;
    NewPurchaseAmount?: number;
}

// Which level the signed-in role is at, from GetIndentLevels (web selectRoleType)
export type IndentRole = 'CSK' | 'PUM' | 'CC' | 'OTHER';

export const indentRoleOf = (lv: IndentLevels | null | undefined): IndentRole | null => {
    if (!lv) return null;
    const p = lv.IndentPresentLevel;
    const d = lv.IndentDefineLevel;
    const n = lv.NewItemDefineLevel;
    if (!p || !d) return null;
    if (p === d) return 'CSK';
    if (n && p === n) return 'PUM';
    if (p < d) return 'CC';
    return 'OTHER';
};

// The web passes the signed-in user name as Created (the SP filters on it)
export const getIndentQueue = (roleId: string, uid: string, userName: string) =>
    list<IndentRow>('Purchase/VerifyIndentCreationGrid', { Roleid: roleId, Created: userName, Userid: uid });

export const getIndentDetail = (indentno: string, roleId: string) =>
    first<IndentDetail>('Purchase/GetVerificationIndentbyCode', { Indentno: indentno, RoleId: roleId });

export const getIndentLevels = (moid: number, roleId: string) =>
    first<IndentLevels>('Purchase/GetIndentLevels', { MOID: moid, Roleid: roleId });

export const getIndentSubtotal = (indentno: string) =>
    list<IndentSubtotal>('Purchase/GetItemCodesSubtotalDetails', { Indent: indentno });

// Items per role: CSK at the define level, PUM at the new-item level, everyone else "Other"
export const getIndentItems = (role: IndentRole, indentno: string, roleId: string, pum?: { ccCode: string; ccType: string }) => {
    if (role === 'CSK') return list<IndentItem>('Purchase/GetItemCodesbyCSKDetails', { Indent: indentno, Role: roleId });
    if (role === 'PUM') return list<IndentItem>('Purchase/GetItemCodesbyPUMDetails', { Indent: indentno, CCCode: pum?.ccCode ?? '', CType: pum?.ccType ?? '' });
    return list<IndentItem>('Purchase/GetItemCodesbyOtherDetails', { Indent: indentno, Role: roleId });
};

// PUM "Issue From CC" choices for a CC type (PCC / NPCC)
export const getIndentNewStockCCs = (indentno: string, ccType: string) =>
    list<{ CCID?: string; CCVAL?: string }>('Purchase/GETIndentnewstockCCs', { Indentno: indentno, cctype: ccType });

export interface StockSummaryRow {
    PopItemCode?: string;
    PopItemName?: string;
    PopSpec?: string;
    PopUnits?: string;
    PopFor?: string;
    PopQuantity?: number | string;
    PopType?: 'A' | 'B' | 'C' | 'D' | string;  // D = the headline available figure
}

export const getItemStockSummary = (itemCode: string, ccCode: string) =>
    list<StockSummaryRow>('Purchase/IndentItemcodeSummaryPopup', { Itemcode: itemCode, CCcode: ccCode });

// Returns nothing useful — success is "no error" (web submitIndentVerification)
export const verifyIndent = (payload: Record<string, unknown>) => send('put', 'Purchase/VerifyIndent', payload);

// ---- PUM trade (5-series) items ----------------------------------------------------------

export const getTradeItemCodes = (itemCode: string, units: string, quantity: string) =>
    list<{ TItemCode?: string; TItemName?: string }>('Purchase/GetTradeItemCodes', {
        Itemcode: itemCode, Units: units, Quantity: quantity, ItemTypeval: '1',
    });

export const getTradeItemDetails = (tradeItemCode: string) =>
    first<{ TradeItemSpecs?: string; TradeItemQuantity?: number | string }>('Purchase/GetTradeItemDetails', { TradeItemcode: tradeItemCode });

export const saveTradeItem = (payload: Record<string, unknown>) => send('post', 'Purchase/SaveTradeItem', payload);
export const rejectTradeItem = (payload: Record<string, unknown>) => send('post', 'Purchase/RejectTradeItem', payload);
export const rejectTradeItemAll = (payload: Record<string, unknown>) => send('post', 'Purchase/RejectTradeItemAll', payload);

// ---- Indent Amend ------------------------------------------------------------------------

export interface IndentAmendRow {
    AmendId: string | number;
    IndentNo: string;
    CCCode: string;
    CCName?: string;
    AmendDate?: string;
    DifferenceAmount?: number | string;
    Status?: string;             // "0" = waiting for the raiser to update — nothing to verify yet
}

export interface IndentAmendItem {
    Amendindentid?: number | string;
    ItemCode?: string;
    ItemName?: string;
    Specification?: string;
    DcaCode?: string;
    SubDcaCode?: string;
    BasicPrice?: number | string;
    Units?: string;
    OldQty?: number | string;
    AmendType?: string;          // Add / Less
    AmendQty?: number | string;
    Amount?: number | string;
    NewQuantity?: number | string;
}

export interface IndentAmendDetail {
    AmendId?: string | number;
    IndentNo?: string;
    CCName?: string;
    AmendDate?: string;
    MOID?: number;
    AmendPlusValue?: number | string;
    AmendMinusValue?: number | string;
    DifferenceValue?: number | string;
    CloseStatus?: string;        // "Yes" → approving closes the indent
    AmendItemsList?: IndentAmendItem[];
}

export const getIndentAmendQueue = (roleId: string, userName: string) =>
    list<IndentAmendRow>('Purchase/GetVerifyIndentAmend', { Roleid: roleId, Username: userName });

export const getIndentAmendDetail = (row: IndentAmendRow) =>
    get<IndentAmendDetail>('Purchase/GetIndentAmendbyNo', { CCCode: row.CCCode, AmendId: row.AmendId, IndentNo: row.IndentNo });

// Answers "Submited" on success; anything else is the error text
export const approveIndentAmend = (payload: Record<string, unknown>) => send('put', 'Purchase/ApproveIndentAmend', payload);
