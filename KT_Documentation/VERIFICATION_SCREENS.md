# Verification Screens — Mobile Build Tracker

Source of truth: Corex web `RAPP-SLAPP/frontend/src/components/Inbox/InboxRouter.jsx`
(which inbox notification opens which page) and `pages/Accounts/verificationConfigs.jsx`
(config-driven pages). Mobile routing lives in `src/components/inbox/inboxRoutes.ts` —
add each new screen there with the same matching rules as the web.

Status: ✅ built (Corex look) · 🟡 exists, old look · ⬜ not built

**As of 2026-10-03 every row below is built.** None has been tested against real queue data yet
(the test API queues were empty for every role checked).
Size = lines in the web page (rough effort indicator).

## A. Dedicated web pages (81)

### Purchase / Procurement
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 1 | Indent Creation | Purchase/VerifyIndentCreation | 1705 | ✅ `verification/indent` (CSK / PUM incl. trade issue / CC / OTHER) |
| 2 | Indent Amend | Purchase/VerifyIndentAmend | 462 | ✅ `verification/indent-amend` |
| 3 | Supplier PO | SupplierPO/VerifySupplierPO | 1902 | ✅ `verification/supplier-po` |
| 4 | Supplier PO Amend | SupplierPO/VerifySupplierPOAmend | 768 | ✅ `verification/supplier-po-amend` |
| 5 | SPPO (Service Provider PO) | SPPO/VerifySPPO | 790 | ✅ `verification/sppo` |
| 6 | SPPO Amend | SPPO/VerifySPPOAmend | 753 | ✅ `verification/sppo-amend` |
| 7 | SPPO Close | SPPO/VerifySPPOClose | 855 | ✅ `verification/sppo-close` |
| 8 | Supplier Invoice | VendorInvoice/VerifySupplierInvoice | 1234 | ✅ `verification/supplier-invoice` |
| 9 | Vendor Payment | VendorPayment/VerifyVendorPayment | 1189 | ✅ `verification/vendor-payment` (not tested against a real record) |
| 10 | Vendor Payment by Cash | Accounts/VerifyVendorPaymentByCash | 678 | ✅ `verification/vendor-payment-cash` (shares VendorPaymentDetail) |
| 11 | Vendor Creation | Purchase/VerifyVendor | 523 | ✅ config screen `verification/config/<Key>` |
| 12 | Item Code | Purchase/VerifyItemCode | 699 | ✅ `verification/item-code` (name, spec, basic price editable) |
| 13 | New Stock Received | Purchase/VerifyNewStockReceived | 403 | ✅ config screen `verification/config/<Key>` |
| 14 | Transfer Receipt (Others) | Purchase/TransferRecieptOthersVerification | 624 | ✅ config screen `verification/config/<Key>` |

### Stock
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 15 | Daily Issue | Stock/VerifyDailyIssue | 767 | ✅ `verification/daily-issue` |
| 16 | Lost / Damaged Items | Stock/LostDamagedItemsVerification | 778 | ✅ `verification/lost-damaged` (no Return, as web) |
| 17 | Scrap Sale | Stock/VerifyScrapSale | 818 | ✅ `verification/scrap-sale` (not tested against a real record) |

### Budget / Cost Center / Client
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 18 | CC Budget Amendment | Budget/VerifyCCBudgetAmendment | 952 | ✅ `verification/cc-budget-amendment` |
| 19 | DCA (Account Head) Budget Amendment | Budget/VerifyDCABudgetAmendment | 888 | ✅ `verification/dca-budget-amendment` |
| 20 | Cost Center Approval | CostCenter/CostCenterApproval | 1242 | ✅ config screen `verification/config/<Key>` |
| 21 | Client PO | ClientPO/VerifyClientPO | 840 | ✅ config screen `verification/config/<Key>` |
| 22 | General Invoice | GeneralInvoice/GeneralInvoiceApproval | 1007 | ✅ config screen `verification/config/<Key>` |

### Accounts — payments & receipts
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 23 | Cash Voucher | Accounts/VerifyCashVoucher | 511 | ✅ config screen `verification/config/<Key>` |
| 24 | CC Cash Transfer | Accounts/VerifyCCCashTransfer | 562 | ✅ config screen `verification/config/<Key>` |
| 25 | CC Closing | Accounts/VerifyCCClosing | 697 | ✅ config screen `verification/config/<Key>` |
| 26 | Load Wallet | Accounts/VerifyLoadWallet | 517 | ✅ config screen `verification/config/<Key>` |
| 27 | Misc Payment | Accounts/VerifyMiscPayment | 467 | ✅ config screen `verification/config/<Key>` |
| 28 | Misc Invoice | Accounts/VerifyMiscInvoice | 552 | ✅ config screen `verification/config/<Key>` |
| 29 | Advance Payment | Accounts/VerifyAdvancePayment | 472 | ✅ config screen `verification/config/<Key>` |
| 30 | Retention Payment | Accounts/VerifyRetentionPayment | 445 | ✅ config screen `verification/config/<Key>` |
| 31 | Hold Payment | Accounts/VerifyHoldPayment | 445 | ✅ config screen `verification/config/<Key>` |
| 32 | Client Receivable | Accounts/VerifyClientRecievable | 485 | ✅ config screen `verification/config/<Key>` |
| 33 | Receipt Against Scrap Sale | Accounts/VerifyReceiptAgainstScrapSale | 495 | ✅ config screen `verification/config/<Key>` |
| 34 | Refund | Accounts/VerifyRefund | 458 | ✅ config screen `verification/config/<Key>` |
| 35 | Central Day Book | Accounts/VerifyCentralDayBook | 433 | ✅ config screen `verification/config/<Key>` |

### Accounts — bank, FD, loans, shares
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 36 | Bank Accounts | Accounts/VerifyBankAccounts | 529 | ✅ config screen `verification/config/<Key>` |
| 37 | Bank Deposit | Accounts/VerifyBankDeposit | 512 | ✅ config screen `verification/config/<Key>` |
| 38 | Bank Transfer | Accounts/VerifyBankTransfer | 554 | ✅ config screen `verification/config/<Key>` |
| 39 | Bank Withdrawal | Accounts/VerifyBankWithdrawal | 590 | ✅ config screen `verification/config/<Key>` |
| 40 | Cheque | Accounts/VerifyCheque | 540 | ✅ config screen `verification/config/<Key>` |
| 41 | Close Master | Accounts/VerifyCloseMaster | 616 | ✅ config screen `verification/config/<Key>` |
| 42 | Open FD | Accounts/VerifyOpenFD | 560 | ✅ config screen `verification/config/<Key>` |
| 43 | Partial / Close FD | Accounts/VerifyPartialFD | 497 | ✅ config screen `verification/config/<Key>` |
| 44 | FD Interest | Accounts/VerifyFDInterest | 470 | ✅ config screen `verification/config/<Key>` |
| 45 | Term Loan | Accounts/VerifyTermLoan | 437 | ✅ config screen `verification/config/<Key>` |
| 46 | TL Agency | Accounts/VerifyTLAgency | 479 | ✅ config screen `verification/config/<Key>` |
| 47 | TL Payment | Accounts/VerifyTLPayment | 435 | ✅ config screen `verification/config/<Key>` |
| 48 | Unsecured Loan | Accounts/VerifyUnsecuredLoan | 478 | ✅ config screen `verification/config/<Key>` |
| 49 | Unsecured Loan Interest | Accounts/VerifyUnsLoanInterest | 353 | ✅ config screen `verification/config/<Key>` |
| 50 | Share Capital | Accounts/VerifyShareCapital | 468 | ✅ config screen `verification/config/<Key>` |
| 51 | Share Creation | Accounts/VerifyShareCreation | 432 | ✅ config screen `verification/config/<Key>` |
| 52 | Dividend Declaration | shares/DividendDeclarationVerification | 699 | ✅ config screen `verification/config/<Key>` |
| 53 | Dividend Distribution | shares/DividendDistributionVerification | 862 | ✅ config screen `verification/config/<Key>` |
| 54 | Dividend Bank Payment | shares/DividendBankPaymentVerification | 886 | ✅ config screen `verification/config/<Key>` |

### HR — staff
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 55 | Staff Registration | HR/VerifyStaffRegistration | 1491 | ✅ config screen `verification/config/<Key>` |
| 56 | Employee Leave Request | HR/VerifyEmployeeLeaveRequest | 888 | ✅ config screen `verification/config/<Key>` |
| 57 | Staff Daily Attendance | HR/VerifyStaffDailyAttendance | 869 | ✅ config screen `verification/config/<Key>` |
| 58 | Excel Attendance | HR/VerifyExcelAttendance | 923 | ✅ config screen `verification/config/<Key>` |
| 59 | Employee CTC | HR/VerifyEmployeeCTC | 992 | ✅ config screen `verification/config/<Key>` |
| 60 | Staff Pay Revision | HR/VerifyStaffPayRevision | 1128 | ✅ config screen `verification/config/<Key>` |
| 61 | Staff Payroll | HR/VerifyStaffPayroll | 929 | ✅ config screen `verification/config/<Key>` |
| 62 | Staff CMS Pay | HR/VerifyStaffCMSPay | 850 | ✅ config screen `verification/config/<Key>` |
| 63 | Salary Deduction / Arrear | HR/VerifySalaryDeductionArear | 996 | ✅ config screen `verification/config/<Key>` |
| 64 | HR Advance Payment | HR/VerifyHRAdvancePayment | 575 | ✅ config screen `verification/config/<Key>` |
| 65 | Staff Advance | HR/VerifyStaffAdvance | 816 | ✅ config screen `verification/config/<Key>` |
| 66 | Employee Transfer | HR/VerifyEmployeeTransfer | 747 | ✅ config screen `verification/config/<Key>` |
| 67 | Employee Bank Change | HR/VerifyEmpBankChange | 511 | ✅ config screen `verification/config/<Key>` |
| 68 | Staff Objectives & Goals | HR/VerifyStaffObjectivesGoals | 784 | ✅ config screen `verification/config/<Key>` |
| 69 | Staff Appraisal | HR/VerifyStaffAppraisal | 678 | ✅ config screen `verification/config/<Key>` |
| 70 | Staff Full & Final | HR/VerifyStaffFullFinal | 757 | ✅ config screen `verification/config/<Key>` |
| 71 | Employee Exit | HR/VerifyEmployeeExit | 799 | ✅ config screen `verification/config/<Key>` |

### HR — labour
| # | Verification | Web page | Size | Mobile |
|---|---|---|---|---|
| 72 | Worker / Staff Registration | HR/VerifyWorkerStaffReg | 644 | ✅ config screen `verification/config/<Key>` |
| 73 | Bulk Worker | HR/VerifyBulkWorker | 426 | ✅ config screen `verification/config/<Key>` |
| 74 | Labour CTC | HR/VerifyLabourCTC | 995 | ✅ config screen `verification/config/<Key>` |
| 75 | Labour Pay Revision | HR/VerifyLabourPayRevision | 1024 | ✅ config screen `verification/config/<Key>` |
| 76 | Labour Payroll | HR/VerifyLabourPayRoll | 668 | ✅ config screen `verification/config/<Key>` |
| 77 | Labour CMS Pay | HR/VerifyLabourCMSPay | 689 | ✅ config screen `verification/config/<Key>` |
| 78 | Labour Bank Change | HR/VerifyLabourBankChange | 565 | ✅ config screen `verification/config/<Key>` |
| 79 | Labour Type Change | HR/VerifyLabourTypeChange | 637 | ✅ config screen `verification/config/<Key>` |
| 80 | Labour Exit | HR/VerifyLabourExit | 843 | ✅ config screen `verification/config/<Key>` |
| 81 | Labour Objectives & Goals | HR/VerifyLabourObjectivesGoals | 786 | ✅ config screen `verification/config/<Key>` |

## B. Config-driven web types (45) — one generic mobile screen can cover all of these

These use the web's `ConfigVerification.jsx` with a config each (queue route, card, detail
sections, approve route). Plan: build one mobile `ConfigVerification` screen + port configs.

| # | Key | Verification |
|---|---|---|
| C1 | ShareIssuance | Share Issuance — ✅ config |
| C2 | ESOPFaceValueReceipt | ESOP Face Value Receipt — ✅ config |
| C3 | Client | Client — ✅ config |
| C4 | SubClient | Sub Client — ✅ config |
| C5 | ClientInvoice | Client Invoice — ✅ config |
| C6 | ClientManufacturingInvoice | Client Manufacturing Invoice — ✅ config |
| C7 | ClientTradingInvoice | Client Trading Invoice — ✅ config |
| C8 | ClientBadDebt | Client Bad Debt — ✅ config |
| C9 | ClientScrapSaleInvoice | Client Scrap Sale Invoice — ✅ config |
| C10 | ClientPOAmend | Client PO Amendment — ✅ config |
| C11 | DCA | Account Head — ✅ config |
| C12 | SubDCA | Sub Account Head — ✅ config |
| C13 | MasterGroups | Master Group — ✅ config |
| C14 | SubGroups | Sub Group — ✅ config |
| C15 | ChildGroups | Child Group — ✅ config |
| C16 | Ledger | Ledger — ✅ config |
| C17 | TaxGeneral | Tax — ✅ config |
| C18 | ITCode | IT Code — ✅ config |
| C19 | HSNCreation | HSN/SAC Code — ✅ config |
| C20 | CCBudget | Cost Center Budget — ✅ `verification/cc-budget` (incl. returned → update + PDF) |
| C21 | DCABudget | Account Head Budget — ✅ `verification/dca-budget` (incl. returned → re-assign) |
| C22 | WorkInProgress | Work In Progress — ✅ config |
| C23 | GeneralPayment | General Payable — ✅ config |
| C24 | JournalVoucher | Journal Voucher — ✅ config |
| C25 | CCSEPPay | Salary / Wages / PF / ESI Payment — ✅ config |
| C26 | CreditDebitNote | Credit & Debit Note — ✅ config |
| C27 | TDSPayment | Vendor TDS Payment — ✅ config |
| C28 | VendorPayableWriteoff | Vendor Payable Write-off — ✅ config |
| C29 | VendorCMSPayment | Vendor CMS Payment — ✅ config |
| C30 | BOESettlement | BOE Settlement — ✅ config |
| C31 | LCBGCreation | LC / BG Creation — ✅ config |
| C32 | SPPOInvoice | SP Invoice — ✅ `verification/sp-invoice` |
| C33 | NewStockIssue | New Stock Issue — ✅ config |
| C34 | OldStockIssue | Old Stock Issue — ✅ config |
| C35 | OldStockReceived | Old Stock Received — ✅ config |
| C36 | NewStockTransfer | New Stock Transfer — ✅ config |
| C37 | ItemsTransfer | Stock Transfer — ✅ config |
| C38 | ItemsTransferIssue | Stock Transfer Issue — ✅ config |
| C39 | CapitalStockIssue | Stock Conversion — ✅ config |
| C40 | DirectStockUpdation | Direct Stock Updation — ✅ config |
| C41 | StoreClosing | Store Closing — ✅ config |
| C42 | CCStockClose | CC Stock Close — ✅ config |
| C43 | AssetSale | Asset Sale — ✅ config |
| C44 | AssetSaleReceipt | Asset Sale Receipt — ✅ config |
| C45 | ItemCodeUpdation | Item Code Updation — ✅ config |

## Config engine (most screens)

Everything not given its own folder runs on one generic screen: `app/(inbox)/verification/config/[key]/{list,[id]}.tsx`
→ `src/components/verification/config/ConfigQueue.tsx` / `ConfigDetail.tsx`, driven by a `VerificationConfig`
(`config/types.ts`) per web page. Configs live in `config/configs/*.tsx`, grouped by department
(accountMasters, clientBilling, payments, stock, accountsPayments, accountsReceipts, accountsBank,
accountsFinance, dividends, purchase, budgetClient, hrStaff, hrLabour); shared blocks are in `config/parts.tsx`
and `config/configs/hrParts.tsx`. The inbox maps a notification to a config with `viaConfig(key, …)` in
`src/components/inbox/inboxRoutes.ts`. A config can merge several queues (`queue.more`, rows tagged `_type`).

New config-driven screen = one config entry (queue / detail / sections / extra / approve, copied from the web
page + its slice + API) + a `viaConfig` matcher.

## Shared mobile pieces (built with the budget screens)

- `src/components/verification/kit/` — `VerificationQueueScreen` (list), `VerificationKit` (QueueCard,
  DetailHero, FieldGrid, Section, CheckList, DocumentLinks, RemarksTimeline, ActionPanel), `useVerifier`
  (role / uid / userName + the tapped `row` param).
- `src/api/verification/verificationCommonAPI.ts` — GetStatuslist actions, Purchase/Remarks history, S3 upload.
- New screen = API functions + a `list.tsx` on VerificationQueueScreen + an `[id].tsx` using the kit,
  then a matcher in `src/components/inbox/inboxRoutes.ts`.

## Suggested order

1. **Shared mobile verification shell** — Corex-styled list → detail → remarks history →
   status-driven action buttons (Verify / Approve / Return / Reject) as reusable pieces,
   by restyling the existing `GenericVerificationList` / `GenericVerificationDetail`.
2. **Restyle the 3 existing screens** on that shell: Indent Creation, CC Budget Amendment, DCA Budget Amendment.
3. **Procurement chain** (most common approvals for project roles): Indent Amend → Supplier PO →
   SPPO → Supplier Invoice → Vendor Payment.
4. **Mobile ConfigVerification** — one screen that unlocks the 45 config-driven types (section B).
5. Remaining dedicated pages by department, prioritised by what actually shows up in the inbox.
