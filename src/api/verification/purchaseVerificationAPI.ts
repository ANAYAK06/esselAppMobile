// Purchase master-data verifications — same routes, methods and payloads as the Corex web:
//   Item Code → pages/Purchase/VerifyItemCode.jsx (api/PurchaseAPI/itemCodeVerificationAPI.js)
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

// ---- Item Code ---------------------------------------------------------------------------

export interface ItemCodeRow {
    Rowid: string;
    Itemname?: string;
    ItemCode?: string;
    Basicprice?: string;
}

export interface ItemCodeDetail {
    Rowid: string;
    MOID?: number;
    TranNo?: string | null;           // links the trader quotes, web links and remarks
    TransactionType?: string;         // Assets / Semi Assets/Consumables / Consumables
    ItemCodeType?: string;
    ItemCode?: string;
    Itemname?: string;
    Specification?: string;
    Specificationcode?: string;
    Units?: string;
    Basicprice?: string;              // editable at verification — can only be lowered
    HSNCode?: string;
    HSNRemarks?: string | null;
    ItemcodeDca?: string;             // "DCA-11,Consumables/Semi-Consumables"
    ItemcodeSDca?: string;
    Majorgroupcode?: string;          // "SE, Safety equipments"
    Majorgroupname?: string | null;
    Subgroupcode?: string;
    Subgroupname?: string | null;
    Status?: string;
    Remarks?: string | null;          // approval comments so far, "||"-separated
    LastRoleID?: number | string | null;
}

// Supplier quotes collected when the item code was raised
export interface ItemCodeTrader {
    SupName?: string;
    Supphone?: string;
    Supemail?: string;
    SupRate?: string | number;
    SupAmt?: string | number;
    Basic?: string | number;
}

// Online price references (IndiaMART, IndustryBuying, …)
export interface ItemCodeLink {
    Link?: string;
    Linkshort?: string;
    LinkRate?: string | number;
    LinkAmt?: string | number;
    Basic?: string | number;
}

// NB: the queue takes "Roleid" only — no user id
export const getItemCodeQueue = (roleId: string) =>
    list<ItemCodeRow>('Purchase/VerifyItemCodeCreationGrid', { Roleid: roleId });

export const getItemCodeDetail = async (rowid: string) =>
    (await list<ItemCodeDetail>('Purchase/GetVerificationitemcodebyId', { Rowid: rowid }))[0] ?? null;

export const getItemCodeTraders = (tranNo: string) =>
    list<ItemCodeTrader>('Purchase/GetViewItemCodeTradersGrid', { TranNo: tranNo });

export const getItemCodeLinks = (tranNo: string) =>
    list<ItemCodeLink>('Purchase/GetViewItemCodeLinkDataGrid', { TranNo: tranNo });

// Rows carry the usual Action / ActionBy / ActionRole / ActionRemarks fields
export const getItemCodeRemarks = (tranNo: string) =>
    list<RemarkEntry>('Purchase/GetItemCodeRemarks', { TranNo: tranNo });

// Answers "Submitted…" on success; strings starting "Invalid" are errors even with IsSuccessful true
export const verifyItemCode = (payload: Record<string, unknown>) => put('Purchase/VerifyItemcode', payload);
