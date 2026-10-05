// Every verification the mobile config screen serves: the Corex web's config-driven pages (keyed like
// its VERIFICATION_CONFIGS — Cost Center Budget, Account Head Budget and SP Invoice have their own mobile
// screens instead) plus web dedicated pages whose flow fits a config (accountsPayments, accountsReceipts …).
// Inbox routing for the dedicated ones lives in src/components/inbox/inboxRoutes.ts (web order).
import type { VerificationConfig } from '../types';
import { ACCOUNT_MASTER_CONFIGS } from './accountMasters';
import { ACCOUNTS_BANK_CONFIGS } from './accountsBank';
import { ACCOUNTS_FINANCE_CONFIGS } from './accountsFinance';
import { ACCOUNTS_PAYMENT_CONFIGS } from './accountsPayments';
import { ACCOUNTS_RECEIPT_CONFIGS } from './accountsReceipts';
import { BUDGET_CLIENT_CONFIGS } from './budgetClient';
import { CLIENT_BILLING_CONFIGS } from './clientBilling';
import { DIVIDEND_CONFIGS } from './dividends';
import { HR_LABOUR_CONFIGS } from './hrLabour';
import { HR_STAFF_CONFIGS } from './hrStaff';
import { PAYMENT_CONFIGS } from './payments';
import { PURCHASE_CONFIGS } from './purchase';
import { STOCK_CONFIGS } from './stock';

export const VERIFICATION_CONFIGS: Record<string, VerificationConfig> = {
    ...ACCOUNT_MASTER_CONFIGS,
    ...CLIENT_BILLING_CONFIGS,
    ...PAYMENT_CONFIGS,
    ...STOCK_CONFIGS,
    ...ACCOUNTS_PAYMENT_CONFIGS,
    ...ACCOUNTS_RECEIPT_CONFIGS,
    ...ACCOUNTS_BANK_CONFIGS,
    ...ACCOUNTS_FINANCE_CONFIGS,
    ...DIVIDEND_CONFIGS,
    ...PURCHASE_CONFIGS,
    ...BUDGET_CLIENT_CONFIGS,
    ...HR_STAFF_CONFIGS,
    ...HR_LABOUR_CONFIGS,
};

// Inbox path (anchored — ".../VerifyClient" never catches ".../VerifyClientInvoice") or exact category → config
// key; web verificationConfigs.jsx CONFIG_VERIFICATION_ROUTES, in the same order
export const CONFIG_VERIFICATION_ROUTES: { key: string; path: RegExp; categories: string[] }[] = [
    { key: 'ShareIssuance', path: /\/accountsapproval\/verifyshareissuance(?:$|[?#/])/, categories: ['share issuance verification'] },
    { key: 'ESOPFaceValueReceipt', path: /\/accountsapproval\/verifyesopfacevaluereceipt(?:$|[?#/])/, categories: ['esop facevalue receipt verification'] },
    { key: 'Client', path: /\/accountsapproval\/verifyclient(?:$|[?#/])/, categories: ['client creation'] },
    { key: 'SubClient', path: /\/accountsapproval\/verifysubclient(?:$|[?#/])/, categories: ['subclientcreation'] },
    { key: 'ClientInvoice', path: /\/accountsapproval\/verifyclientinvoice(?:$|[?#/])/, categories: ['client invoice creation'] },
    { key: 'ClientManufacturingInvoice', path: /\/accountsapproval\/verifyclientmanufacturinginvoice(?:$|[?#/])/, categories: ['client manufacturing invoice'] },
    { key: 'ClientTradingInvoice', path: /\/accountsapproval\/verifyclienttradinginvoice(?:$|[?#/])/, categories: ['client trading invoice'] },
    { key: 'ClientBadDebt', path: /\/accountsapproval\/verifyclientbaddebtrecievable(?:$|[?#/])/, categories: ['bad debt'] },
    { key: 'DCA', path: /\/accountsapproval\/verifydca(?:$|[?#/])/, categories: ['accounthead creation'] },
    { key: 'SubDCA', path: /\/accountsapproval\/verifysubdca(?:$|[?#/])/, categories: ['subaccounthead creation'] },
    { key: 'MasterGroups', path: /\/accountsapproval\/verifymastergroups(?:$|[?#/])/, categories: ['group creation'] },
    { key: 'SubGroups', path: /\/accountsapproval\/verifysubgroups(?:$|[?#/])/, categories: ['subgroup creation'] },
    { key: 'ChildGroups', path: /\/accountsapproval\/verifychildgroups(?:$|[?#/])/, categories: ['childgroup creation'] },
    { key: 'Ledger', path: /\/accountsapproval\/verifyledger(?:$|[?#/])/, categories: ['ledger creation'] },
    { key: 'TaxGeneral', path: /\/accountsapproval\/verifytaxgeneral(?:$|[?#/])/, categories: ['gst creation', 'general taxes creation'] },
    { key: 'ITCode', path: /\/accountsapproval\/approveit(?:$|[?#/])/, categories: ['itcode creation'] },
    { key: 'WorkInProgress', path: /\/accounts\/verifyworkinprogress(?:$|[?#/])/, categories: ['work in progress'] },
    { key: 'GeneralPayment', path: /\/accountsapproval\/verifygeneralpayment(?:$|[?#/])/, categories: ['general payable'] },
    { key: 'JournalVoucher', path: /\/accountsapproval\/verifyjournalvoucher(?:$|[?#/])/, categories: ['jv verification'] },
    { key: 'CCSEPPay', path: /\/accounts\/verifyccseppay(?:$|[?#/])/, categories: ['salary/wages/pf/esi payments'] },
    { key: 'NewStockIssue', path: /\/purchase\/verfiynewstockissue(?:$|[?#/])/, categories: ['new stock issue(pcc)', 'new stock issue(npcc)'] },
    { key: 'OldStockIssue', path: /\/purchase\/verifyoldstockissue(?:$|[?#/])/, categories: ['old stock issue'] },
    { key: 'OldStockReceived', path: /\/purchase\/verifyoldstockreceived(?:$|[?#/])/, categories: ['old stock received(pcc)', 'old stock received(npcc)'] },
    { key: 'NewStockTransfer', path: /\/purchase\/verifynewstocktransfer(?:$|[?#/])/, categories: ['new stock transfer'] },
    { key: 'ItemsTransfer', path: /\/purchase\/verifyitemstransfer(?:$|[?#/])/, categories: ['stocktransfer (pcc)', 'stocktransfer (npcc)'] },
    { key: 'ItemsTransferIssue', path: /\/purchase\/verifyitemstransferissue(?:$|[?#/])/, categories: ['stocktransferissue (pcc)', 'stocktransferissue (npcc)'] },
    { key: 'CapitalStockIssue', path: /\/purchase\/verifycapitalstockissue(?:$|[?#/])/, categories: ['stock conversion(capital)', 'stock conversion(pcc)'] },
    { key: 'DirectStockUpdation', path: /\/purchase\/verifydirectstockupdation(?:$|[?#/])/, categories: ['direct stock updation'] },
    { key: 'StoreClosing', path: /\/purchase\/verifystoreclosing(?:$|[?#/])/, categories: ['store closing'] },
    { key: 'CCStockClose', path: /\/purchase\/verifyccstockclose(?:$|[?#/])/, categories: ['cc stock close'] },
    { key: 'AssetSale', path: /\/purchase\/verifyassetsale(?:$|[?#/])/, categories: ['asset sale'] },
    { key: 'AssetSaleReceipt', path: /\/purchase\/verifyassetsalereceipt(?:$|[?#/])/, categories: ['asset sale receipt'] },
    { key: 'HSNCreation', path: /\/purchase\/verifyhsncreation(?:$|[?#/])/, categories: ['hsn/sac code verification'] },
    { key: 'CreditDebitNote', path: /\/purchase\/verifycreditanddebitnote(?:$|[?#/])/, categories: ['credit and debit note'] },
    { key: 'TDSPayment', path: /\/purchase\/verifytdspayment(?:$|[?#/])/, categories: ['vendor tds payment'] },
    { key: 'VendorPayableWriteoff', path: /\/purchase\/verifyvendorpayablewriteoff(?:$|[?#/])/, categories: ['vendor payable writeoff'] },
    { key: 'VendorCMSPayment', path: /\/purchase\/vendorcmspaymentverification(?:$|[?#/])/, categories: ['vendor cms payment'] },
    { key: 'BOESettlement', path: /\/purchase\/boesettelmentverification(?:$|[?#/])/, categories: ['boe settlement'] },
    { key: 'LCBGCreation', path: /\/purchase\/lcbgcreationverification(?:$|[?#/])/, categories: ['lc and bg creation'] },
    { key: 'ClientScrapSaleInvoice', path: /\/accountsapproval\/verifyclientscrapsaleinvoice(?:$|[?#/])/, categories: ['scrap sale invoice'] },
    { key: 'ClientPOAmend', path: /\/accountsapproval\/verifyclientpoamend(?:$|[?#/])/, categories: ['amend client po'] },
    { key: 'ItemCodeUpdation', path: /\/purchase\/verifyitemcodeupdation(?:$|[?#/])/, categories: ['item code updation'] },
];

export const configKeyFor = (path: string, category: string) =>
    CONFIG_VERIFICATION_ROUTES.find((r) => r.path.test(path) || r.categories.includes(category))?.key ?? null;
