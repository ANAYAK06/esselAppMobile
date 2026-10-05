// Service Provider PO (SPPO) verifications — same routes, methods and payload fields as the
// Corex web: pages/SPPO/VerifySPPO.jsx, VerifySPPOAmend.jsx, VerifySPPOClose.jsx
// (api/spPOAPI/sppoApi.js, spPoAmendAPI.js, closeSPPOAPI.js).
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

// A service line on an SPPO
export interface SPPOService {
    SPPOItemId?: number | string;
    Description?: string;
    Unit?: string;
    Quantity?: number | string;
    Rate?: number | string;          // editable at verification — can only be lowered
    ClientRate?: number | string;
    PRWRate?: number | string;       // reference rate the edited rate is coloured against
    Amount?: number | string;
    // amendment lines
    CurrentQuantity?: number | string;
    AmendQuantity?: number;
    POType?: string;                 // Add / …
    ItemStatus?: string;
}

// ---- SPPO --------------------------------------------------------------------------------

export interface SPPORow {
    SPPONo: string;
    SPPOId?: number;
    VendorCode?: string;
    VendorName?: string;
    CCCode?: string;
    TotalValue?: number;
    Status?: string;
}

export interface SPPODetail {
    SPPONo?: string;
    SPPOId?: number;
    MOID?: number;
    VendorCode?: string;
    VendorName?: string;
    CCCode?: string;
    CCName?: string;
    DCAName?: string;
    SubDCAName?: string;
    SPPOStartDate?: string;
    SPPOEndDate?: string;
    Status?: string;
    Balance?: number;
    TotalValue?: number;
    ApprovedUser?: string;           // approval comments so far, "||"-separated
    // close
    ClosingBalance?: number;
    POCloseDate?: string;
    POCloseRemarks?: string;
    Remarks?: string;
    FilePath?: string;
    ItemDescList?: SPPOService[];
}

export const getSPPOQueue = (roleId: string, uid: string) =>
    list<SPPORow>('Purchase/GetVerificationSPPO', { RoleId: roleId, Userid: uid });

export const getSPPODetail = (row: SPPORow) =>
    get<SPPODetail>('Purchase/GetSPPObyNoForVerify', { Sppono: row.SPPONo, CCCode: row.CCCode, VendorCode: row.VendorCode, AmendId: row.SPPOId || 0 });

export const approveSPPO = (payload: Record<string, unknown>) => put('Purchase/ApproveSPPO', payload);

// ---- SPPO Amend --------------------------------------------------------------------------

export interface SPPOAmendRow {
    AmendId: number | string;
    SPPONo: string;
    VendorCode?: string;
    VendorName?: string;
    CCCode?: string;
    DCACode?: string;
    AmendDate?: string;
    AmendAmount?: number;
    SubstractAmount?: number;
    Terms?: string;
}

export interface SPPOAmendDetail extends Omit<SPPOAmendRow, 'AmendId' | 'SPPONo'> {
    AmendId?: number | string;
    SPPONo?: string;
    MOID?: number;
    Status?: string;
    ApprovalNote?: string;           // approval comments so far
    ApprovedUser?: string;
    AmendPlusValue?: number;
    AmendMinusValue?: number;
    AmendTotalValue?: number;
    OldPOValue?: number;
    POValue?: number;
    POBalance?: number;
    OldTerms?: string;
    FilePath?: string;
    ItemDescList?: SPPOService[];
}

export const getSPPOAmendQueue = (roleId: string, uid: string) =>
    list<SPPOAmendRow>('Purchase/GetVerificationSPPOAmend', { RoleId: roleId, Userid: uid });

export const getSPPOAmendDetail = (roleId: string, amendId: number | string, uid: string) =>
    get<SPPOAmendDetail>('Purchase/GetSPPOAmendbyId', { RoleId: roleId, AmendId: amendId, Userid: uid });

// Documents attached to the SPPO and its amendments
export const getSPPODocs = (sppoNo: string) =>
    list<{ Path?: string; POType?: string; For?: string }>('Purchase/POUploadedDocsView', { PONO: sppoNo, For: 'Amendment' });

// NB: the route really is spelled "Amemd"
export const approveSPPOAmend = (payload: Record<string, unknown>) => put('Purchase/ApproveSPPOAmemd', payload);

// ---- SPPO Close --------------------------------------------------------------------------

export type SPPOCloseType = 'Performing' | 'Non-Performing';

export interface SPPOCloseRow {
    SPPONo: string;
    VendorCode?: string;
    VendorName?: string;
    CCCode?: string;
    Balance?: number;
}

export const getSPPOCloseQueue = (roleId: string, uid: string, type: SPPOCloseType) =>
    list<SPPOCloseRow>('Purchase/GetVerificationSPPOClose', { Roleid: roleId, Userid: uid, Type: type });

export const getSPPOForClose = (row: SPPOCloseRow) =>
    get<SPPODetail>('Purchase/GetSPPObyNo', { Sppono: row.SPPONo, CCCode: row.CCCode, VendorCode: row.VendorCode });

export const approveCloseSPPO = (payload: Record<string, unknown>) => put('Purchase/ApproveCloseSPPO', payload);
