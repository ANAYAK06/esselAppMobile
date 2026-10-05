// Budget verifications — the same routes, methods and payloads as the Corex web:
//   CC Budget / Account Head (DCA) Budget → pages/Accounts/verificationConfigs.jsx (CCBudget, DCABudget)
//   CC / DCA Budget Amendment             → pages/Budget/VerifyCCBudgetAmendment.jsx, VerifyDCABudgetAmendment.jsx
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';

// Budget endpoints often answer IsSuccessful:false with valid Data, so only Data is used
const get = async <T>(route: string, params: Record<string, unknown>): Promise<T | null> => {
    const response = await axios.get(`${API_BASE_URL}/${route}`, { params });
    return (response.data?.Data ?? null) as T | null;
};

const list = async <T>(route: string, params: Record<string, unknown>): Promise<T[]> => {
    const data = await get<T[]>(route, params);
    return Array.isArray(data) ? data : [];
};

// Detail routes return a one-row list or a single object
const first = async <T>(route: string, params: Record<string, unknown>): Promise<T | null> => {
    const data = await get<T | T[]>(route, params);
    return Array.isArray(data) ? (data[0] ?? null) : data;
};

// Submits return a status string in Data (e.g. "Submited", "Updated", "Submitted$<info>")
const put = async (route: string, payload: Record<string, unknown>): Promise<string> => {
    const response = await axios.put(`${API_BASE_URL}/${route}`, payload, { timeout: 30000 });
    const data = response.data?.Data ?? response.data;
    return typeof data === 'string' ? data : '';
};

export { isSubmitted } from './verificationCommonAPI';

// ---- Shared -----------------------------------------------------------------------------

export interface CCDocs {
    contractscopeisexists?: string;
    contractscope?: string;
    contractpretenderBudget?: string;
    Approvedbudgetexecution?: string;
}

// Cost center PDFs — only returned for users set up in Budget View Attachment Config
export const getCCUploadDocs = (ccCode: string, uid: string | number) =>
    first<CCDocs>('Accounts/Getccuploadocsexists', { CCCode: ccCode, UID: uid });

// ---- CC Budget ---------------------------------------------------------------------------

export interface CCBudgetRow {
    Budgetid: number;
    CostCenter: string;
    CC_Name?: string;
    CCType?: string;
    SubType?: string;
    Year?: string;
    Amount?: number;
    BudgetCreationDate?: string;
    Status?: string | number;   // "0" = returned for update
}

export interface CCBudgetDetail extends CCBudgetRow {
    MOID?: number;
    Refno?: string;
    Remarks?: string;
    ReturnCreatedate?: string;
    Approvedbudgetexecution?: string | null;
}

export const getCCBudgetQueue = (roleId: string | number, uid: string | number) =>
    list<CCBudgetRow>('Accounts/GetVerificationCCBudget', { Roleid: roleId, UID: uid });

export const getCCBudgetById = (budgetId: string | number) =>
    first<CCBudgetDetail>('Accounts/GetCCBudgetbyId', { BudgetId: budgetId });

export const approveCCBudget = (payload: {
    CostCenter: string; Action: string; ApprovalNote: string; Year?: string;
    RoleId: string | number; Createdby: string; UID: string | number;
}) => put('Accounts/ApproveCostCenterBudget', payload);

// Returned budget → resubmit. Performing CC with a new PDF answers "Submited,<file name>"
// (the name to upload the PDF under); the non-performing branch answers blank on success.
export const updateCCBudget = (payload: {
    CostCenter: string; Year: string; Amount: number; Createdby: string; Remarks: string;
    budgetexecutionexists: 'Yes' | 'No'; CCType?: string; RoleId: string | number;
}) => put('Accounts/UpdateCCBudget', payload);

// Cost center types whose budget is per financial year (legacy: Non-Performing / Capital / Other Capital)
export const isNonPerformingCC = (t?: string) => ['Non-Performing', 'Capital', 'Other Capital'].includes(t || '');

// ---- Account Head (DCA) Budget -----------------------------------------------------------

export interface DCABudgetRow {
    CC_Code: string;
    CC_Name?: string;
    CC_Type?: string;
    FYyear?: string;
    BudgetValue?: number;
    BalanceBudget?: number;
    Status?: string | number;   // "0" = returned for update
}

export interface DCABudgetItem {
    DCABudgetId?: number;
    DCACode: string;
    DCAName?: string;
    DCABudgetValue?: number;
    DCABudgetCreationdate?: string;
    FYyear?: string;
}

export interface DCABudgetDetail {
    items: DCABudgetItem[];
    MOID?: number;
    Refno?: string;
    Remarks?: string;
    FYyear?: string;
    CCCode?: string;
    CCType?: string;
    CCTypeId?: number;
    CCBudget?: number;
    CCBudgetBalance?: number;
}

export const getDCABudgetQueue = (roleId: string | number, uid: string | number) =>
    list<DCABudgetRow>('Accounts/GetVerificationDCABudgets', { Roleid: roleId, Uid: uid });

// Verify view → list of account-head rows; returned (update) view → CC header with DCABudgetDetails
export const getDCABudgetDetail = async (row: DCABudgetRow, roleId: string | number): Promise<DCABudgetDetail | null> => {
    const returned = String(row.Status) === '0';
    const params = { CCCode: row.CC_Code, Year: row.FYyear, CCType: row.CC_Type, ...(returned ? {} : { RoleId: roleId }) };
    const data = await get<any>(returned ? 'Accounts/GetDCABudgetUpdationbyId' : 'Accounts/GetVerifyDCABudgetbyId', params);
    if (Array.isArray(data)) return { items: data, ...(data[0] || {}) };
    return data ? { ...data, items: data.DCABudgetDetails || [] } : null;
};

// Every account head of a CC type (for re-assigning a returned budget)
export const getBudgetDCAHeads = (ccTypeId: number) =>
    list<{ DCACode: string; DCAName?: string }>('Accounts/GetBudgetDCADetails', { CcTypeID: ccTypeId });

export const approveDCABudget = (payload: Record<string, unknown>) => put('Accounts/ApproveDCABudget', payload);

export const updateDCAAssignedBudget = (payload: Record<string, unknown>) => put('Accounts/UpdateDCAAssignedBudget', payload);

// ---- CC Budget Amendment -----------------------------------------------------------------

export interface CCAmendmentRow {
    CCBudgetAmendmentid: number;
    CCCode: string;
    CCName?: string;
    AmendmentType?: string;     // Add / Subtract
    AmendedValue?: number;
    AmendmentDate?: string;
    OtherCCCode?: string;       // set when the amount is transferred from another cost center
}

export interface CCAmendmentDetail extends CCAmendmentRow {
    MOID?: number;
    Refno?: string;
    BudgetId?: number;
    FYYear?: string;
    CCType?: string;
    OldBudget?: number;          // NB: the web treats this as the revised total (after the amendment)
    OldBudgetBalance?: number;
    NewBudgetBalance?: number;
    FilePath?: string;
    Remarks?: string;
}

export const getCCAmendmentQueue = (roleId: string | number, uid: string | number) =>
    list<CCAmendmentRow>('Accounts/GetApprovalCCAmendBudgetCDetails', { Roleid: roleId, UID: uid });

export const getCCAmendmentById = (amendId: string | number, amendType: string) =>
    first<CCAmendmentDetail>('Accounts/GetApprovalCCAmendBudgetById', { AmendId: amendId, AmendType: amendType });

export const approveCCAmendment = (payload: Record<string, unknown>) => put('Accounts/ApproveCostCenterBudgetAmend', payload);

// ---- DCA Budget Amendment ----------------------------------------------------------------

export interface DCAAmendmentRow {
    CCCode: string;
    CCName?: string;
    cc_Type?: string;
    FYYear?: string;
    AmdDate?: string;
    State?: string;
    Status?: string | number;
    RefNo?: string;
}

export interface DCAAmendmentDetail {
    MOID?: number;
    RefNo?: string;
    AmendedValue?: number;
    CCCode?: string;
    CCName?: string;
    cc_Type?: string;
}

export interface DCAAmendmentItem {
    ADCA?: string;
    ADCAName?: string;
    AAddition?: number | string;
    ASubstraction?: number | string;
}

export const getDCAAmendmentQueue = (roleId: string | number, uid: string | number) =>
    list<DCAAmendmentRow>('Accounts/GetVerificationDCAAmends', { Roleid: roleId, Userid: uid });

export const getDCAAmendmentById = (row: DCAAmendmentRow) =>
    first<DCAAmendmentDetail>('Accounts/GetVerifyDCABudgetAmendbyId', {
        CCCode: row.CCCode, Fyear: row.FYYear || 'N/A', Ctype: row.cc_Type || 'Performing', Status: row.Status ?? '1',
    });

// The grid comes back under BudgetItems (or Data / a bare list, depending on the SP)
export const getDCAAmendmentItems = async (row: DCAAmendmentRow): Promise<DCAAmendmentItem[]> => {
    const response = await axios.get(`${API_BASE_URL}/Accounts/GetDCABudgetAmendgrid`, {
        params: { CCCode: row.CCCode, Fyear: row.FYYear, Status: row.Status },
    });
    const raw = response.data?.Data ?? response.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.BudgetItems)) return raw.BudgetItems;
    if (Array.isArray(raw?.Data)) return raw.Data;
    const firstArray = raw && Object.values(raw).find(Array.isArray);
    return (firstArray as DCAAmendmentItem[]) || [];
};

export const approveDCAAmendment = (payload: Record<string, unknown>) => put('Accounts/ApproveDCABudgetAmend', payload);
