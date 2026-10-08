// Stock verifications — same routes, methods and payloads as the Corex web:
//   Lost / Damaged (scrapped) items → pages/Stock/LostDamagedItemsVerification.jsx (api/Stock/lostDamagedItemsVerificationAPI.js)
//   Scrap Sale → pages/Stock/VerifyScrapSale.jsx (api/Stock/scrapSaleVerificationAPI.js)
//   Daily Issue → pages/Stock/VerifyDailyIssue.jsx (api/Stock/dailyIssueVerificationAPI.js)
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

// yyyy-mm-dd (UTC, as the web sends it) — the Scrap Sale and Daily Issue queue SPs take a "Created" date
const todayISO = () => new Date().toISOString().split('T')[0];

// ---- Lost / Damaged items ----------------------------------------------------------------

export interface LostDamagedRow {
    Refno: string;
    CCCode?: string;
    Date?: string;
    Status?: string;
}

export interface LostDamagedItem {
    id?: number;
    itemcode?: string;
    itemname?: string;
    specification?: string;
    dcacode?: string;
    subdcacode?: string;
    units?: string;
    quantity?: string;
    Lost?: string;               // quantities come back as strings
    Damaged?: string;
    Basicprice?: number;
    LostAmt?: number;            // 0 on older reports
    DamagedAmt?: number;
    itemstatus?: string;         // Stock / Asset / …
    Remarks?: string;            // reason given for this item
}

export interface LostDamagedDetail {
    Id?: number;
    Refno?: string;
    MOID?: number;
    Date?: string;               // "4/16/2024 12:00:00 AM"
    CCCode?: string;
    Category?: string | null;
    CategoryNo?: number;
    Reporttype?: string | null;
    Stocktype?: string | null;
    Status?: string;
    Remarks?: string | null;
    UserRemarks?: string | null; // approval comments so far, "||"-separated
    ApprovedUser?: string;
    ApprUserList?: unknown[];
    AvlQtys?: string | null;
    Filechk?: string | null;
    Extension?: string | null;
    FilePath?: string | null;    // under Upload docs/LandDPROD
    itemlist?: LostDamagedItem[];
}

export const getLostDamagedQueue = (roleId: string, uid: string) =>
    list<LostDamagedRow>('Purchase/GetVerificationLDItems', { Roleid: roleId, Userid: uid });

export const getLostDamagedDetail = (refno: string) =>
    get<LostDamagedDetail>('Purchase/GetVerificationLDItemsbyRefno', { Refno: refno });

export const approveLostDamaged = (payload: Record<string, unknown>) => put('Purchase/ApproveLostDamagedItems', payload);

// ---- Scrap Sale --------------------------------------------------------------------------

export interface ScrapSaleRow {
    RequestNo: string;           // numeric (the SP converts it to bigint)
    RId?: string | number;       // second key the detail calls need
    RequestDate?: string;
    CCCode?: string;             // the cost center selling the scrap
    Status?: string;
    MOID?: number;
    Amount?: number | string;
    ClientName?: string;
}

export interface ScrapSaleDetail {
    RequestNo?: string;
    ItemId?: string;             // posted back on approval
    MOID?: number;
    SubmitDate?: string;
    ClientName?: string;         // "code,Name"
    SubclientName?: string;
    PartyName?: string;
    PartyAddress?: string;
    VAmount?: number | string;
    Remarks?: string;            // approval comments so far, "||"-separated
}

export interface ScrapSaleItem {
    RId?: string | number;
    ItemCode?: string;
    ItemName?: string;
    Specification?: string;
    Quantity?: number | string;
    Units?: string;
    BasicPrice?: number | string;
    Amount?: number | string;
    DcaCode?: string;
    SubDcaCode?: string;
}


export const getScrapSaleQueue = (roleId: string, uid: string) =>
    list<ScrapSaleRow>('Purchase/VerifyScrapSaleGrid', { Roleid: roleId, Created: todayISO(), Userid: uid });

// Header and items come from two calls, both keyed by request no + RId
export const getScrapSale = async (row: ScrapSaleRow) => {
    const params = { Requestno: row.RequestNo, Rid: row.RId };
    const [header, items] = await Promise.all([
        list<ScrapSaleDetail>('Purchase/GetScrapSaleDetails', params),
        list<ScrapSaleItem>('Purchase/GetScrapSaleDataDetails', params),
    ]);
    return { header: header[0] ?? null, items };
};

export const approveScrapSale = (payload: Record<string, unknown>) => put('Purchase/ApproveScrapSale', payload);

// ---- Daily Issue -------------------------------------------------------------------------

export interface DailyIssueRow {
    Tranno: string;              // "CC-210/2026/94"
    FromCC?: string;
    Date?: string;
    Status?: string;
    MOID?: number;               // only the queue row carries it
    Remarks?: string;
}

export interface DailyIssueItem {
    Rid?: string;
    ItemCode?: string;
    ItemName?: string;
    Specification?: string;
    DcaCode?: string;
    SubDCAcode?: string;
    Units?: string;
    Qty?: string;                // "2400.0000"
    Basic?: string;              // basic price per unit
    AvailableQty?: string;
    Amount?: string | number | null;   // null on the test API
    Remarks?: string | null;
}

export const getDailyIssueQueue = (roleId: string, uid: string) =>
    list<DailyIssueRow>('Purchase/VerifyDailyIssueGrid', { Roleid: roleId, Created: todayISO(), Userid: uid });

// Data is the flat item list for the issue
export const getDailyIssueItems = (row: DailyIssueRow) =>
    list<DailyIssueItem>('Purchase/GetDailyIssueDetails', { TranNo: row.Tranno, CCCode: row.FromCC });

// Rows carry one "Created By : Store Keeper : NAME : comment" line each in Remarks — split into the
// shared timeline shape ("Role : User : comment" lines without an action are shown as comments)
export const getDailyIssueRemarks = async (tranno: string): Promise<RemarkEntry[]> => {
    const rows = await list<{ Remarks?: string | null }>('Purchase/GetDailyIssueRemarks', { Refno: tranno });
    return rows
        .flatMap((r) => (r.Remarks || '').split('||'))
        .map((line) => line.split(' : ').map((p) => p.trim()))
        .filter((parts) => parts.some(Boolean))
        .map((parts) => {
            const hasAction = /\sby$/i.test(parts[0]) && parts.length >= 3;
            const [action, role, by, ...rest] = hasAction ? parts : ['Comment', ...parts];
            return { Action: action, ActionRole: role, ActionBy: by, ActionRemarks: rest.join(' : ') };
        });
};

export const approveDailyIssue = (payload: Record<string, unknown>) => put('Purchase/ApproveDailyIssue', payload);
