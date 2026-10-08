// Which mobile verification screen handles an inbox module. The list is the Corex web InboxRouter.jsx
// (RAPP-SLAPP frontend: components/Inbox/InboxRouter.jsx) getVerificationComponent, in the same order
// and with the same matching rules, so both apps open the same page for the same notification — order
// matters because several web matchers are loose ("advance", "refund", "objective"…).
// href null = no mobile screen yet; the entry still stops a later, looser matcher from taking the item.
import type { NotificationsSummaryItem } from '@/src/slice/notifications/inboxNotificationsSlice';
import { configKeyFor } from '@/src/components/verification/config/configs';

// path / category … are lower-cased for matching; rawPath / rawCategory keep the inbox item's own spelling
type Fields = { path: string; category: string; title: string; displayName: string; workflowType: string; rawPath: string; rawCategory: string };

// href is a plain path string (typed-route unions get too large to compare)
type InboxRoute = {
    key: string;
    label: string;
    href: string | null;
    match: (f: Fields) => boolean;
    query?: (f: Fields) => string;   // appended to href (e.g. "?type=…")
};

type Field = 'path' | 'category' | 'title' | 'displayName' | 'workflowType';
const ALL: Field[] = ['path', 'category', 'title', 'displayName', 'workflowType'];
const META: Field[] = ['category', 'title', 'displayName', 'workflowType'];

// Any of `needles` in any of `fields`
const has = (f: Fields, needles: string[], fields: Field[] = ALL) => fields.some((k) => needles.some((n) => f[k].includes(n)));
const anyIncludes = (f: Fields, needles: string[]) => has(f, needles);
// The common web shape: path fragments, or the same words in category / title / display name / workflow type
const web = (f: Fields, paths: string[], words: string[]) => has(f, paths, ['path']) || has(f, words, META);

const CONFIG_HREF = '/(inbox)/verification/config/';
const configQuery = (key: string) => (f: Fields) =>
    `${key}/list?path=${encodeURIComponent(f.rawPath)}&category=${encodeURIComponent(f.rawCategory)}`;
// A dedicated web page served by the mobile config screen
const viaConfig = (key: string, label: string, match: (f: Fields) => boolean): InboxRoute =>
    ({ key, label, href: CONFIG_HREF, match, query: configQuery(key) });

const CLOSE_PATH_TYPES: Record<string, string> = {
    bank: 'Bank', it: 'IT', costcenter: 'CostCenter', dca: 'DCA', subdca: 'SubDCA', client: 'Client', subclient: 'SubClient', tlagency: 'TermLoanAgency',
};
const CLOSE_CATEGORY_TYPES: Record<string, string> = {
    'close bankaccount': 'Bank', 'close it': 'IT', 'close cost center(pcc)': 'CostCenter', 'close cost center(npcc)': 'CostCenter',
    'close accounthead': 'DCA', 'close subaccounthead': 'SubDCA', 'close client': 'Client', 'close subclient': 'SubClient', 'close tlagency': 'TermLoanAgency',
};
const closeMasterType = (f: Fields) => {
    const m = /\/home\/verifyclose([a-z]+)(?:$|[?#/])/.exec(f.path);
    return (m && CLOSE_PATH_TYPES[m[1]]) || CLOSE_CATEGORY_TYPES[f.category] || null;
};
const UNSECURED_LOAN_CATEGORY_TYPES: Record<string, string> = { 'unsecuredloan(new)': 'New', 'unsecuredloan(existing)': 'Existing', 'unsecuredloan(return)': 'Return' };
const unsecuredLoanType = (f: Fields) => {
    const m = /\/accountsapproval\/verifyunsecuredloan(existing|return)?(?:$|[?#/])/.exec(f.path);
    if (m) return m[1] === 'existing' ? 'Existing' : m[1] === 'return' ? 'Return' : 'New';
    return UNSECURED_LOAN_CATEGORY_TYPES[f.category] || null;
};
const anchored = (f: Fields, page: string) => new RegExp(`/accountsapproval/${page}(?:$|[?#/])`).test(f.path);

export const INBOX_ROUTES: InboxRoute[] = [
    viaConfig('StaffRegistration', 'Staff Registration', (f) => f.path.includes('/hr/verifystaffregistration')),
    viaConfig('VendorCreation', 'Vendor Creation', (f) =>
        /\/purchase\/verifyvendor(?:$|[?#/])/.test(f.path) || has(f, ['vendor verification'], META)),
    {
        key: 'vendor-payment-cash',
        label: 'Vendor Payment by Cash',
        href: '/(inbox)/verification/vendor-payment-cash/list',
        match: (f) => f.path.includes('/purchase/verifyvendorpayment?paytype=cash'),
    },
    {
        key: 'vendor-payment',
        label: 'Vendor Payment',
        href: '/(inbox)/verification/vendor-payment/list',
        match: (f) => !f.path.includes('paytype=cash') &&
            web(f, ['/purchase/verifyvendorpayment?paytype=bank', '/vendorpayment/verifyvendorpayment', 'verifyvendorpayment', 'vendor payment'], ['vendor payment', 'vendorpayment']),
    },
    {
        key: 'supplier-invoice',
        label: 'Supplier Invoice',
        href: '/(inbox)/verification/supplier-invoice/list',
        match: (f) => anyIncludes(f, ['verifysupplierinvoice', 'supplier invoice']),
    },
    {
        key: 'supplier-po-amend',
        label: 'Supplier PO Amendment',
        href: '/(inbox)/verification/supplier-po-amend/list',
        match: (f) =>
            anyIncludes(f, ['verifysupplierpoamend']) ||
            META.some((k) => f[k].includes('supplier po') && f[k].includes('amend')),
    },
    {
        key: 'supplier-po',
        label: 'Supplier PO',
        href: '/(inbox)/verification/supplier-po/list',
        match: (f) => !anyIncludes(f, ['amend']) && anyIncludes(f, ['verifysupplierpo', 'supplier po']),
    },
    viaConfig('CostCenterApproval', 'Cost Center Approval', (f) => anyIncludes(f, ['approvecostcenter', 'cost center approval', 'costcenterapproval'])),
    viaConfig('GeneralInvoice', 'General Invoice', (f) => anyIncludes(f, ['approvegeneralinvoice', 'general invoice approval', 'generalinvoiceapproval', 'general invoice', 'generalinvoice'])),
    {
        key: 'cc-budget-amendment',
        label: 'CC Budget Amendment',
        href: '/(inbox)/verification/cc-budget-amendment/list',
        match: (f) =>
            ['/budget/verifyccbudgetamendment', '/accounts/verifyccbudgetamendment', '/accountsapproval/verifyccamendbudget']
                .some((p) => f.path.includes(p)) ||
            anyIncludes(f, ['verifyccbudgetamendment', 'cc budget amendment']) ||
            f.displayName.includes('cost center budget amend(pcc)'),
    },
    {
        key: 'dca-budget-amendment',
        label: 'DCA Budget Amendment',
        href: '/(inbox)/verification/dca-budget-amendment/list',
        match: (f) =>
            ['/accountsapproval/verifydcabudgetamend', '/accountsapproval/verifydcaamendbudget'].some((p) => f.path.includes(p)) ||
            anyIncludes(f, ['verifydcabudgetamendment', 'dca budget amendment']) ||
            f.title.includes('account head amend') ||
            f.displayName.includes('account head amend(pcc)'),
    },
    viaConfig('ClientPO', 'Client PO', (f) =>
        !(f.path.includes('verifyclientpoamend') || f.category.includes('amend client po')) && anyIncludes(f, ['verifyclientpo', 'client po'])),
    viaConfig('MiscPayment', 'Misc Payment', (f) =>
        web(f, ['verifymiscpayment', 'miscellaneous payment', 'misc payment', 'miscpayment'], ['misc payment', 'miscpayment'])),
    viaConfig('MiscInvoice', 'Misc Invoice', (f) =>
        web(f, ['verifymisc', 'miscellaneous invoice', 'misc invoice', 'miscinvoice'], ['misc invoice', 'miscinvoice']) ||
        has(f, ['miscellaneous'], ['category', 'title', 'displayName'])),
    viaConfig('ClientRecievable', 'Client Receipt', (f) =>
        web(f, ['verifyclientrecievable', 'client receipt verification'], ['client receipt', 'clientrecievable'])),
    viaConfig('AdvancePayment', 'Advance Payment', (f) =>
        web(f, ['verifyadvancepayment', 'advance payment verification'], ['advance payment verification', 'verifyadvancepayment', 'advancepaymentverification'])),
    viaConfig('RetentionPayment', 'Retention Payment', (f) =>
        web(f, ['verifyretentionpayment', 'retention payment verification'], ['retention payment', 'verifyretentionpayment', 'retentionpayment'])),
    viaConfig('HoldPayment', 'Hold Payment', (f) =>
        web(f, ['verifyholdpayment', 'hold payment verification'], ['hold payment', 'verifyholdpayment', 'holdpayment'])),
    viaConfig('ScrapSaleReceipt', 'Receipt against Scrap Sale', (f) =>
        web(f, ['verifyreceiptagainstscrapsale', 'receipt against scrap sale'], ['receipt against scrap sale', 'scrap sale receipt', 'receiptagainstscrapsale'])),
    viaConfig('Refund', 'Refund', (f) => f.path.includes('verifyrefund') || has(f, ['refund'], META)),
    viaConfig('CentralDayBook', 'Central Day Book', (f) =>
        web(f, ['verifycentraldaybook', 'central day book'], ['central day book', 'centraldaybook'])),
    {
        key: 'lost-damaged',
        label: 'Lost / Damaged Items',
        href: '/(inbox)/verification/lost-damaged/list',
        match: (f) =>
            ['/stock/verifylostdamageditems', '/purchase/verifylostordamageditems', '/stock/lostordamageditemsverification',
                '/stock/lostdamageditemsverification', 'lost or scrapped items'].some((p) => f.path.includes(p)) ||
            has(f, ['lost damaged items', 'verifylostdamageditems'], META),
    },
    {
        key: 'daily-issue',
        label: 'Daily Issue',
        href: '/(inbox)/verification/daily-issue/list',
        match: (f) => anyIncludes(f, ['daily issue', 'verifydailyissue']),
    },
    {
        key: 'scrap-sale',
        label: 'Scrap Sale',
        href: '/(inbox)/verification/scrap-sale/list',
        match: (f) =>
            !f.path.includes('scrapsaleinvoice') && !f.category.includes('scrap sale invoice') &&
            anyIncludes(f, ['scrap sale', 'verifyscrapsale']),
    },
    viaConfig('ExcelAttendance', 'Excel Attendance', (f) => anyIncludes(f, ['verifyexcelattendance', 'excel attendance'])),
    // SPPO Close, then SPPO Amend, then SPPO ("/purchase/verifysppo" is a prefix of both)
    {
        key: 'sppo-close',
        label: 'SPPO Close',
        href: '/(inbox)/verification/sppo-close/list',
        match: (f) =>
            f.path.startsWith('/purchase/verifysppoclose') || f.path.startsWith('/sppo/verifysppoclose') ||
            f.path.includes('verifysppoclose') || f.category.includes('sppo close') ||
            f.title.includes('sppo close verification') || f.displayName.includes('sppo close verification') ||
            f.workflowType.includes('sppoclose'),
        // closetype=non-performing (the web reads it) or closetype=nonperforming (the web's matcher lists it)
        query: (f) => (/closetype=non-?performing/.test(f.path) ? '?type=Non-Performing' : '?type=Performing'),
    },
    {
        key: 'sppo-amend',
        label: 'SPPO Amendment',
        href: '/(inbox)/verification/sppo-amend/list',
        match: (f) => anyIncludes(f, ['verifysppoamend', 'sppo amend']),
    },
    {
        key: 'sppo',
        label: 'Service Provider PO',
        href: '/(inbox)/verification/sppo/list',
        match: (f) =>
            (['/sppo/verifysppo', '/purchase/verifysppo'].some((p) => f.path.includes(p)) && !f.path.includes('close') && !f.path.includes('invoice')) ||
            [f.category, f.title, f.displayName].some((v) => v.includes('newsppo') && !v.includes('close')) ||
            (f.workflowType.includes('sppoverify') && !f.workflowType.includes('close')),
    },
    viaConfig('StaffAttendance', 'Staff Daily Attendance', (f) =>
        f.path.includes('/hr/verifystaffattendance') || f.path.includes('verifystaffattendance') || f.path.includes('staff daily attendance') ||
        f.category.includes('/hr/verifystaffattendance') || f.title.includes('verifystaffattendance') ||
        has(f, ['staff daily attendance', 'verifystaffattendance'], ['displayName', 'workflowType'])),
    viaConfig('LabourObjectivesGoals', 'Labour Objectives & Goals', (f) => f.path.includes('/hr/verifylbobjectivesgoals')),
    viaConfig('StaffObjectivesGoals', 'Staff Objectives & Goals', (f) => f.path.includes('/hr/verifyobjectivesandgoals')),
    viaConfig('EmployeeCTC', 'Employee CTC', (f) => f.path.includes('/hr/verifypayrollstructurenew')),
    viaConfig('LabourCTC', 'Labour CTC', (f) => f.path.includes('/hr/verifynewlabourctc') || f.path.includes('/hr/verifylabourctc')),
    viaConfig('LabourPayroll', 'Labour Payroll', (f) => f.path.includes('/hr/verifylabourpayroll') || f.path.includes('/hr/approvelabourpayroll')),
    viaConfig('LabourPayRevision', 'Labour Pay Revision', (f) => f.path.includes('/hr/verifylbpayrevision')),
    viaConfig('StaffPayRevision', 'Staff Pay Revision', (f) => f.path.includes('/hr/verifypayrevision')),
    viaConfig('LeaveRequest', 'Employee Leave Request', (f) => f.path.includes('/hr/verifyhrleaverequest')),
    viaConfig('DividendDeclaration', 'Dividend Declaration', (f) => f.path.includes('/shares/dividenddeclarationverification')),
    viaConfig('DividendDistribution', 'Dividend Distribution', (f) => f.path.includes('/shares/dividenddistributionverification')),
    viaConfig('DividendBankPayment', 'Dividend Bank Payment', (f) =>
        f.path.includes('/shares/dividendpaymentverification') || f.path.includes('/shares/dividendbankpaymentverification')),
    viaConfig('LabourCMSPay', 'Labour CMS Pay', (f) => anyIncludes(f, ['/hr/verifylabourcmspay', '/hr/verifylabourcms', 'verifylabourcmspay', 'labour cms', 'labourcms'])),
    viaConfig('StaffCMSPay', 'Staff CMS Pay', (f) => f.path.includes('/hr/verifycmspaygeneration')),
    viaConfig('StaffPayroll', 'Staff Payroll', (f) => f.path.includes('/hr/verifyccpayroll')),
    viaConfig('SalaryDeductionArear', 'Salary Deduction / Arrear', (f) => f.path.includes('/hr/verifysalarydeduction')),
    viaConfig('EmployeeTransfer', 'Employee Transfer', (f) => f.path.includes('/hr/verifyemployeetransfer')),
    viaConfig('EmployeeExit', 'Employee Exit', (f) => f.path.includes('/hr/verifyempexit')),
    viaConfig('LabourExit', 'Labour Exit', (f) => anyIncludes(f, ['/hr/verifylbexit', '/hr/verifylaborexit', '/hr/verifylabourexit', 'verifylbexit', 'labour exit', 'labourexit', 'lbexit'])),
    viaConfig('StaffFullFinal', 'Staff Full & Final', (f) =>
        has(f, ['finalsalary', 'fullfinal', 'full & final', 'full&final', 'fullfinalsalary'], ['path']) ||
        has(f, ['full & final', 'finalsalary'], ['title', 'displayName']) || f.category.includes('finalsalary')),
    viaConfig('HRAdvancePayment', 'HR Advance Payment', (f) => f.path.includes('/hr/verifyhradvancepayment') || f.path.includes('/hr/verifyhradpayment')),
    // HR advance request (LTA / salary advance) — the web's broad "advance" catch-all
    viaConfig('StaffAdvance', 'Staff Advance', (f) =>
        has(f, ['advance', 'hradvance', 'lta', 'salaryadvance'], ['path']) || has(f, ['advance'], ['title', 'displayName', 'category'])),
    viaConfig('StaffAppraisal', 'Staff Appraisal', (f) =>
        ['/hr/verifyappraisalobjectives', '/hr/verifyempobjectivesgoals', '/hr/verifyempobjectandgoals', '/hr/verifyappraisa', 'appraisalobjective', 'verifyempobject']
            .some((p) => f.path.includes(p)) ||
        has(f, ['appraisal', 'objective'], ['title', 'displayName', 'category'])),
    viaConfig('CCCashTransfer', 'CC Cash Transfer', (f) => anyIncludes(f, ['cccashtransfer', 'cc cash transfer', 'verifycccashtransfer'])),
    viaConfig('CCClosing', 'CC Closing', (f) =>
        anyIncludes(f, ['ccclosing', 'cc closing']) || has(f, ['verifyccclosing', 'ccsuspend', 'cc suspend'], ['path'])),
    viaConfig('LoadWallet', 'Load Wallet', (f) => anyIncludes(f, ['loadwallet', 'load wallet', 'verifyloadwallet'])),
    viaConfig('CashVoucher', 'Cash Voucher', (f) =>
        has(f, ['/accounts/verifycashvoucher', 'verifygeneralpayablebycash', 'verifycashvoucher', 'cashvoucher', 'cash voucher', 'generalpayablebycash', 'cashpayment', 'cash payment'], ['path']) ||
        has(f, ['cash voucher', 'cashvoucher'], META) || f.category.includes('generalpayablebycash')),
    viaConfig('WorkerStaffReg', 'Worker / Staff Registration', (f) => anyIncludes(f, ['/hr/verifyworkerstaffreg', 'verifyworkerstaffreg', 'worker staff reg', 'workerstaffreg'])),
    viaConfig('LabourBankChange', 'Labour Bank Change', (f) => anyIncludes(f, ['/hr/verifylabourbankchange', '/hr/approvelabourbankchange', 'verifylabourbankchange', 'labour bank change', 'labourbankchange'])),
    viaConfig('EmpBankChange', 'Employee Bank Change', (f) => anyIncludes(f, ['/hr/verifyeditempbank', '/hr/verifyempbankchange', '/hr/approveempbankchange', 'verifyeditempbank', 'employee bank change', 'empbankchange'])),
    viaConfig('BulkWorker', 'Bulk Worker', (f) => anyIncludes(f, ['/hr/verifybulkworker', '/hr/approvebulkworker', 'verifybulkworker', 'bulk worker', 'bulkworker'])),
    viaConfig('LabourTypeChange', 'Labour Type Change', (f) => anyIncludes(f, ['/hr/verifylabourtypechange', '/hr/labourtypechange', 'verifylabourtypechange', 'labour type change', 'labourtypechange'])),
    {
        key: 'indent-amend',
        label: 'Indent Amend',
        href: '/(inbox)/verification/indent-amend/list',
        match: (f) => anyIncludes(f, ['verifyindentamend', 'indent amend', 'indentamend']),
    },
    {
        key: 'indent',
        label: 'Indent Creation',
        href: '/(inbox)/verification/indent/list',
        match: (f) =>
            !anyIncludes(f, ['amend']) &&
            (['/purchase/verifyindentcreation', '/purchase/verifyindent', '/indent/verifyindent'].some((p) => f.path.includes(p)) ||
                anyIncludes(f, ['verifyindentcreation', 'indent creation', 'indentcreation']) ||
                f.category.includes('verifyindent') || f.title.includes('verifyindent') || f.workflowType.includes('verifyindent')),
    },
    // Item Code Updation (/purchase/verifyitemcodeupdation) is a separate config page — keep it out of this loose match
    {
        key: 'item-code',
        label: 'Item Code',
        href: '/(inbox)/verification/item-code/list',
        match: (f) =>
            !f.path.includes('verifyitemcodeupdation') && !f.category.includes('item code updation') &&
            anyIncludes(f, ['item code', 'itemcode']),
    },
    viaConfig('TransferReceiptOthers', 'Transfer Receipt (Others)', (f) =>
        has(f, ['transferrecieptothers', 'transferreciptothers', 'mrr verification', 'mrr others'], ['path']) ||
        has(f, ['transfer reciept', 'mrr'], ['category', 'title', 'displayName']) || has(f, ['transferrecieptothers', 'mrr'], ['workflowType'])),
    viaConfig('NewStockReceived', 'New Stock Received', (f) => anyIncludes(f, ['verifynewstockreceived', 'new stock received', 'newstockreceived'])),
    viaConfig('BankAccounts', 'Bank Accounts', (f) => anchored(f, 'verifybankaccounts') || f.category === 'bank account creation'),
    viaConfig('BankDeposit', 'Bank Deposit', (f) => anchored(f, 'verifybankdeposit') || f.category === 'deposit'),
    viaConfig('BankTransfer', 'Bank Transfer', (f) => anchored(f, 'verifybanktransfer') || f.category === 'bank to bank transfer'),
    viaConfig('BankWithdrawal', 'Bank Withdrawal', (f) => anchored(f, 'verifybankwithdrawn') || f.category === 'bank withdrawal'),
    viaConfig('Cheque', 'Cheque', (f) => anchored(f, 'verifycheque') || f.category === 'bank cheque verification'),
    // One web page keyed by close type → one mobile config per type (CloseBank, CloseIT, …)
    {
        key: 'close-master',
        label: 'Close Master',
        href: CONFIG_HREF,
        match: (f) => !!closeMasterType(f),
        query: (f) => configQuery(`Close${closeMasterType(f)}`)(f),
    },
    viaConfig('OpenFD', 'Open FD', (f) => anchored(f, 'verifyopenfd') || f.category === 'fdopen'),
    viaConfig('PartialFD', 'Partial FD', (f) => anchored(f, 'verifypartialfd') || f.category === 'fdpartial'),
    viaConfig('CloseFD', 'Close FD', (f) => anchored(f, 'verifyclosefd') || f.category === 'fdclose'),
    viaConfig('FDInterest', 'FD Interest', (f) => anchored(f, 'verifyfdinterest') || f.category === 'fd interest'),
    viaConfig('TermLoan', 'Term Loan', (f) => anchored(f, 'verifytermloan') || f.category === 'term loan verification'),
    viaConfig('TLAgency', 'TL Agency', (f) => anchored(f, 'verifytermloanagency') || f.category === 'tl agency verification'),
    viaConfig('TLPayment', 'TL Payment', (f) => anchored(f, 'verifytermloanpayment') || f.category === 'tlpayment verification'),
    // One web page keyed by loan type → UnsecuredLoanNew / …Existing / …Return
    {
        key: 'unsecured-loan',
        label: 'Unsecured Loan',
        href: CONFIG_HREF,
        match: (f) => !!unsecuredLoanType(f),
        query: (f) => configQuery(`UnsecuredLoan${unsecuredLoanType(f)}`)(f),
    },
    viaConfig('UnsLoanInterest', 'Unsecured Loan Interest', (f) =>
        /\/accounts\/verifyunsloaninterest(?:$|[?#/])/.test(f.path) || f.category === 'updateunsloan interest'),
    viaConfig('ShareCapital', 'Share Capital', (f) => anchored(f, 'verifysharecapital') || f.category === 'share capital verification'),
    viaConfig('ShareCreation', 'Share Creation', (f) => anchored(f, 'verifysharecreation') || f.category === 'share detail verification'),
    // Config-driven on the web (verificationConfigs.jsx CONFIG_VERIFICATION_ROUTES). Three of them have their own
    // mobile screens; the rest open the generic config screen at verification/config/<key>.
    {
        key: 'cc-budget',
        label: 'Cost Center Budget',
        href: '/(inbox)/verification/cc-budget/list',
        match: (f) => configKeyFor(f.path, f.category) === null &&
            (/\/accountsapproval\/costcenterbudgetapproval(?:$|[?#/])/.test(f.path) ||
                ['cost center budget(pcc)', 'cost center budget(npcc/other capital)'].includes(f.category)),
    },
    {
        key: 'dca-budget',
        label: 'Account Head Budget',
        href: '/(inbox)/verification/dca-budget/list',
        match: (f) => configKeyFor(f.path, f.category) === null &&
            (/\/accountsapproval\/verifydcabudget(?:$|[?#/])/.test(f.path) ||
                ['account head budget(pcc)', 'account head budget(npcc/other capital)'].includes(f.category)),
    },
    {
        key: 'sp-invoice',
        label: 'SP Invoice',
        href: '/(inbox)/verification/sp-invoice/list',
        match: (f) => configKeyFor(f.path, f.category) === null &&
            (/\/purchase\/verifysppoinvoice(?:$|[?#/])/.test(f.path) || f.category === 'sp invoice(pcc)'),
    },
    {
        key: 'config',
        label: 'Verification',
        href: CONFIG_HREF,
        match: (f) => !!configKeyFor(f.path, f.category),
        query: (f) => configQuery(configKeyFor(f.path, f.category)!)(f),
    },
];

const lower = (v: unknown) => String(v ?? '').toLowerCase();

// Returns the route to open, or null when this module has no mobile screen yet
export function inboxRouteFor(item: NotificationsSummaryItem): { key: string; label: string; href: string } | null {
    const f: Fields = {
        path: lower(item.NavigationPath),
        category: lower(item.ModuleCategory),
        title: lower(item.InboxTitle),
        displayName: lower(item.ModuleDisplayName),
        workflowType: lower((item as { WorkflowType?: string }).WorkflowType ?? item.Items?.[0]?.WorkflowType),
        rawPath: String(item.NavigationPath ?? ''),
        rawCategory: String(item.ModuleCategory ?? ''),
    };
    const route = INBOX_ROUTES.find((r) => r.match(f));
    return route?.href ? { key: route.key, label: route.label, href: route.href + (route.query ? route.query(f) : '') } : null;
}
