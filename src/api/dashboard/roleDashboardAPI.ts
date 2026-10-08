// Role (department) dashboard endpoints — the same ones the Corex web dashboards use
// (RAPP-SLAPP frontend: api/HRAPI/hrDashboardAPI.js, api/AccountsAPI/accountsDashboardAPI.js,
// api/PurchaseAPI/snpDashboardAPI.js, api/FinanceReportAPI/*, api/dashboardAPI/trackingAPI.js).
// RoleId/UserId drive backend CC-scoping: for roles with ApplicableForCC='Yes', results are
// restricted to the cost centers assigned to this user.
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';

export type Scope = { roleId: string | number; userId: string | number };

// These endpoints often answer IsSuccessful:false with valid (or empty) Data, so only Data is used
const getData = async <T>(path: string, params: Record<string, unknown>): Promise<T | null> => {
    const response = await axios.get(`${API_BASE_URL}/${path}`, { params });
    return (response.data?.Data ?? null) as T | null;
};

const getList = async <T>(path: string, params: Record<string, unknown>): Promise<T[]> => {
    const data = await getData<T[]>(path, params);
    return Array.isArray(data) ? data : [];
};

const scoped = ({ roleId, userId }: Scope) => ({ RoleId: roleId, UserId: userId });

// ---- Dashboard type ----------------------------------------------------------------------

export type DepartmentCode = 'TL' | 'HR' | 'ACC' | 'FIN' | 'SNP' | 'PRJ' | 'ADM' | 'BASE';

export interface DashboardDepartment {
    DashboardTypeDepartmentId?: number;
    DepartmentCode: DepartmentCode;
    DepartmentName: string;
}

export const getUserRoleDashboardType = (roleId: string | number) =>
    getData<DashboardDepartment>('Accounts/GetUserRoleDashboardType', { roleId });

// ---- HR / Admin --------------------------------------------------------------------------

export interface HRDashboardSummary {
    ActiveHeadcount?: number;
    ThisMonthJoineeCount?: number;
    OnLeaveTodayCount?: number;
    OneYearCompletionCount?: number;
    ContractExpiringCount?: number;
    NearingRetirementCount?: number;
    NearingPF58Count?: number;
}

export interface EmployeeDetailRow {
    EmpRefNo: string;
    EmpName: string;
    DetailDate: string;
}

export const getHRDashboardSummary = (scope: Scope) =>
    getData<HRDashboardSummary>('HR/GetHRDashboardSummary', scoped(scope));

export const getHRDashboardDetailList = (type: string, scope: Scope) =>
    getList<EmployeeDetailRow>('HR/GetHRDashboardDetailList', { Type: type, ...scoped(scope) });

export interface AdminDashboardSummary {
    StaffHeadcount?: number;
    LabourHeadcount?: number;
}

export const getAdminDashboardSummary = (scope: Scope) =>
    getData<AdminDashboardSummary>('HR/GetAdminDashboardSummary', scoped(scope));

// ---- Accounts ----------------------------------------------------------------------------

export interface AccountsDashboardSummary {
    BankPendingCount?: number;
    VendorInvoicePendingCount?: number;
    FDNearingEndCount?: number;
    LCNearingDueCount?: number;
}

export interface CCCashBalance {
    CCCode: string;
    CCName: string;
    CCAmount: number;
}

export const getAccountsDashboardSummary = (scope: Scope) =>
    getData<AccountsDashboardSummary>('Accounts/GetAccountsDashboardSummary', scoped(scope));

export const getCCCashBalanceSummary = (scope: Scope) =>
    getList<CCCashBalance>('Accounts/GetCCCashBalanceSummary', scoped(scope));

// Pending / due documents behind the Accounts and Store & Purchase drill-downs
export interface PendingDocument {
    DocType?: string;
    DocNo?: string;
    RefNo?: string;
    CCCode?: string;
    CCName?: string;
    DocDate?: string;
    Amount?: number | null;
    PartyName?: string;
    Remarks?: string;
    ExpiryDate?: string | null;
    DaysLeft?: number | null;
    PendingLevel?: number | null;
    PendingWithRole?: string | null;
}

export const getAccountsPendingDetails = (type: string, scope: Scope) =>
    getList<PendingDocument>('Accounts/GetAccountsPendingDetails', { Type: type, ...scoped(scope) });

// ---- Store & Purchase --------------------------------------------------------------------

export interface SNPDashboardSummary {
    IndentPendingCount?: number;
    POPendingCount?: number;
    MRRPendingCount?: number;
    SupplierPOPendingCount?: number;
    SPPOPendingCount?: number;
    SupplierPOExpiringCount?: number;
    SPPOExpiringCount?: number;
}

export const getSNPDashboardSummary = (scope: Scope) =>
    getData<SNPDashboardSummary>('Purchase/GetSNPDashboardSummary', scoped(scope));

export const getSNPPendingDetails = (type: string, scope: Scope) =>
    getList<PendingDocument>('Purchase/GetSNPPendingDetails', { Type: type, ...scoped(scope) });

// ---- Project -----------------------------------------------------------------------------

export interface ProjectDashboardSummary {
    ActiveCostCenterCount?: number;
    LabourCount?: number;
    OpenPOCount?: number;
    ExpensesCurrentMonth?: number;
    ExpensesPreviousMonth?: number;
    CashVoucherCurrentMonth?: number | null;
    VendorInvoiceCurrentMonth?: number | null;
    BudgetAssigned?: number;
    BudgetUtilized?: number;
    BudgetBalance?: number;
    CostCentersNearLimit?: { CCCode?: string; CCName: string; UtilizedPct?: number }[];
}

export const getProjectDashboardSummary = (scope: Scope) =>
    getData<ProjectDashboardSummary>('Reports/GetProjectDashboardSummary', scoped(scope));

// ---- Finance / Top Level -----------------------------------------------------------------

export interface ReceivablesSummary {
    TotalBalance?: number;
    InvoiceBalBelow?: number;
    InvoiceBalBetween91to120?: number;
    InvoiceBalBetween121to180?: number;
    InvoiceBalAbove?: number;
    RetentionBalance?: number;
    HoldBalance?: number;
}

export interface PayablesSummary {
    TotalBalance?: number;
    Below30Days?: number;
    Between31And60Days?: number;
    Between61And90Days?: number;
    Between91And120Days?: number;
    Above120Days?: number;
    RetentionBalance?: number;
    HoldBalance?: number;
}

export interface GSTSummary {
    FromDate?: string;
    ClientGSTTotal?: number;
    VendorGSTTotal?: number;
    ClientInvoiceGST?: number;
    ClientDebitNoteGST?: number;
    ClientCreditNoteGST?: number;
    ClientIGST?: number;
    ClientCGST?: number;
    ClientSGST?: number;
    VendorIGST?: number;
    VendorCGST?: number;
    VendorSGST?: number;
    GSTPaid?: number;
    GSTPaidDate?: string | null;
}

export const getClientOutStandingSummary = (scope: Scope) =>
    getData<ReceivablesSummary>('Reports/GetClientOutStandingSummary', scoped(scope));

export const getVendorOutStandingSummary = (scope: Scope) =>
    getData<PayablesSummary>('Reports/GetVendorOutStandingSummary', scoped(scope));

export const getStockPurchaseConsolidateSummary = (scope: Scope) =>
    getData<GSTSummary>('Reports/GetStockPurchaseConsolidateSummary', scoped(scope));

// ---- Transaction log (recent activity + sales / purchase this month) ---------------------

export interface TransactionLogRow {
    EntryDate?: string;
    VoucherDate?: string;
    NameofAccount?: string;
    VoucherType?: string;
    VoucherNo?: string;
    DebitValue?: number;
    CreditValue?: number;
    Status?: string;
}

// FromDate / ToDate are YYYY-MM-DD; TranType is 'Select All', 'Client Invoice', 'Vendor Invoice', ...
export const getTransactionLog = (fromDate: string, toDate: string, tranType: string, scope: Scope) =>
    getList<TransactionLogRow>('Reports/ViewTransactionLogGrid', {
        FromDate: fromDate,
        ToDate: toDate,
        TranType: tranType,
        ...scoped(scope),
    });

// ---- Approvals (pending tracking + rejected) ---------------------------------------------

export interface TrackingValue {
    MOID: number;
    Value: string;
}

export interface TrackingNo {
    UserRoleID: number;
    UserRoleCode: string;
    No: number;
}

export interface TrackingRow {
    Date?: string;
    CCCode?: string;
    TransactionNo?: string;
    Name?: string;
    Amount?: number;
}

export interface RejectedRow {
    Refno?: string;
    MCode?: string;
    CCName?: string;
    RejectedBy?: string;
    Rejectedate?: string;
    Remarks?: string;
}

export const getTrackingValues = (roleId: string | number) =>
    getList<TrackingValue>('Accounts/GetTrackingValues', { Roleid: roleId });

export const getTrackingNos = (moid: number, ccCodes: string, scope: Scope) =>
    getList<TrackingNo>('Accounts/GetTrackingNos', {
        Roleid: scope.roleId,
        Moid: moid,
        CCCodes: ccCodes,
        Userid: scope.userId,
    });

export const getTrackingData = (roleId: number, moid: number, ccCodes: string, groupId: number) =>
    getList<TrackingRow>('Accounts/GetTrackingData', { Roleid: roleId, Moid: moid, CCCodes: ccCodes, GroupId: groupId });

export const getRejectedData = (scope: Scope) =>
    getList<RejectedRow>('Accounts/GetRejectedData', { UserId: scope.userId, RoleId: scope.roleId });
