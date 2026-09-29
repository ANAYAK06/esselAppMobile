# ESSELMOB — Mobile App (React Native / Expo Frontend) Documentation

**Repository:** `esselAppMobile` (github.com/ANAYAK06/esselAppMobile)
**App name:** ESSELMOB — Essel Projects Mobile ERP
**Platform:** Android (primary), iOS (secondary)
**Version:** 1.0.5 (app.json) / 1.0.0 (package.json)
**Last updated:** July 2026

This document describes the architecture, structure, and conventions of the ESSELMOB React Native frontend, so it can be read alongside the existing backend and web frontend documentation for the Essel Projects ERP system.

---

## 1. Overview

ESSELMOB is an Expo-based mobile client for the Essel Projects ERP backend. It gives field/office staff a mobile interface for approval and verification workflows — CC budget amendments, DCA budget amendments, and purchase indent/requisitions — plus a notification inbox with badge counts and two role-based dashboards (employee and role/approver).

The app talks to a single REST API (`https://myesselapi.esselprojects.com/api`) using the same backend that powers the web frontend, so business logic, response shapes, and endpoint names should be consistent with that documentation.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo ~54, React Native 0.81, React 19 |
| Routing | Expo Router ~6 (file-based, typed routes enabled) |
| Styling | NativeWind 4 (Tailwind CSS 3 for React Native) |
| State management | Redux Toolkit 2 + redux-persist (AsyncStorage) |
| Forms & validation | Formik + Yup |
| HTTP client | Axios |
| Icons | lucide-react-native |
| Local auth | expo-local-authentication (biometric setup scaffolded, not wired up) |
| Push/local notifications | expo-notifications (used for app badge counts) |
| File storage | AWS S3 (read-only access to uploaded documents) |
| OTA updates | expo-updates |
| Language | TypeScript, strict mode |
| Linting | ESLint (`eslint-config-expo`) |

There are no automated tests configured in this project.

### Key npm scripts

```bash
npm install       # install dependencies
npm start         # expo start (dev server)
npm run android   # expo run:android
npm run ios       # expo run:ios
npm run lint       # expo lint
```

---

## 3. Project Structure

```
ESSELMOB/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout (Redux provider, gesture handler, Stack)
│   ├── index.tsx                # Animated splash screen → routes to /login
│   ├── globals.css              # Tailwind entry (used by NativeWind)
│   ├── (auth)/                  # Login flow
│   ├── (dashboard)/             # Post-login dashboards
│   └── (inbox)/                 # Notifications + verification workflows
├── src/
│   ├── api/                    # Axios calls, grouped by domain
│   ├── slice/                  # Redux Toolkit slices, grouped by domain
│   ├── store/                  # Store config, typed hooks, Redux provider
│   ├── components/             # Reusable UI, grouped by feature
│   ├── service/                # apiConfig.ts, s3Config.ts
│   ├── hooks/                  # Custom hooks (e.g. useAppBadge)
│   └── utils/                  # Standalone utilities (e.g. notificationBadge)
├── android/                     # Native Android project (Gradle)
├── assets/                      # Images, icons, fonts
├── app.json / eas.json          # Expo config + EAS build profiles
└── CLAUDE.md                    # AI-assistant guidance for this repo
```

The `@/` path alias maps to the project root (configured in `tsconfig.json`), so imports typically look like `@/src/slice/auth/authSlice`.

---

## 4. Routing (Expo Router)

Routing is file-based under `app/`, grouped into three route groups. Group folder names in parentheses do not appear in the URL.

### `(auth)/` — Login flow
| Route | File | Purpose |
|---|---|---|
| `/login` | `login.tsx` | Employee ID + password sign-in. Validates via `Security/GetValidEmployee`. |
| `/login-options` | `login-options.tsx` | Post-employee-validation screen offering **Employee Portal** (personal access) or **Role Portal** (role/approver access, requires a second role password validated via `Security/GetValidUser`). |
| `/biometric-setup` | `biometric-setup.tsx` | Placeholder/dummy screen — not yet implemented (renders a static "Dummy Screen Loaded" view). |

### `(dashboard)/` — Post-login dashboards
| Route | File | Purpose |
|---|---|---|
| `/employee-dashboard` | `employee-dashboard.tsx` | Placeholder/dummy screen — not yet implemented. Reached after employee-only login. |
| `/role-dashboard` | `role-dashboard.tsx` | Fully implemented dashboard for role/approver logins: metrics carousel, quick-access grid, tab navigation, pull-to-refresh, and background loading of inbox notifications to drive the app icon badge (`useAppBadge`). |

Note: `app/(dashboard)/_layout.tsx` currently contains leftover code copied from the auth layout (function is named `AuthLayout` and has no dashboard-specific behavior) — functionally it still renders a headerless `Stack`, but should be renamed/cleaned up for clarity.

### `(inbox)/` — Notifications & verification workflows
| Route | File | Purpose |
|---|---|---|
| `/inbox` | `inbox.tsx` | Thin wrapper that renders `InboxScreen`, showing categorized/summarized notifications. |
| `/verification/cc-budget/list` | `verification/cc-budget/list.tsx` | List of pending CC Budget Amendments awaiting the user's approval. |
| `/verification/cc-budget/[id]` | `verification/cc-budget/[id].tsx` | CC Budget Amendment detail: line-item comparison, document preview/download (S3), approve/reject with remarks. |
| `/verification/dca-budget/list` | `verification/dca-budget/list.tsx` | List of pending DCA Budget Amendments. |
| `/verification/dca-budget/[id]` | `verification/dca-budget/[id].tsx` | DCA Budget Amendment detail: remarks history, dynamic action buttons, keyboard-aware layout. |
| `/verification/indent/list` | `verification/indent/list.tsx` | List of pending purchase indents/requisitions for verification. |
| `/verification/indent/[id]` | `verification/indent/[id].tsx` | Indent detail: item breakdown, remarks history, verify action. |

Each verification sub-module (`cc-budget`, `dca-budget`, `indent`) has its own `_layout.tsx` defining a headerless `Stack` with `list` and `[id]` screens.

### Navigation flow summary

```
index (splash)
  → (auth)/login
    → (auth)/login-options
       ├─ Employee Portal → (dashboard)/employee-dashboard
       └─ Role Portal (role password) → (dashboard)/role-dashboard
                                            → (inbox)/inbox
                                               → verification/{cc-budget,dca-budget,indent}/list
                                                  → verification/{...}/[id]  (approve / reject / return)
```

---

## 5. State Management (Redux Toolkit)

Store is configured in `src/store/store.ts` using `combineReducers` + `redux-persist`, persisted to `AsyncStorage`. Only the `auth` slice is whitelisted for persistence; all other slices reset on app restart.

Typed hooks live in `src/store/hooks.ts`: use `useAppDispatch()` and `useAppSelector()` instead of the raw `react-redux` hooks. A convenience `useAuth()` hook is also provided.

### Slices

| Slice (state key) | File | Responsibility |
|---|---|---|
| `auth` | `src/slice/auth/authSlice.ts` | Employee ID validation, role/user validation, employee details, role menu, session load/persist/logout. Persisted. |
| `inboxnotifications` | `src/slice/notifications/inboxNotificationsSlice.ts` | Fetches and filters inbox notifications by user/role; powers notification summary cards and the app icon badge count. |
| `ccBudgetAmendment` | `src/slice/budget/ccBudgetAmendmentSlice.ts` | CC Budget Amendment list, detail, document-existence check, approval. |
| `dcaBudgetAmendment` | `src/slice/budget/dcaBudgetAmendmentSlice.ts` | DCA Budget Amendment list, detail, grid data, approval/update-approval. |
| `indent` | `src/slice/indent/indentSlice.ts` | Indent levels, verification grid, item details, remarks, full details, verify action. |
| `remarks` | `src/slice/common/remarksSlice.ts` | Generic remarks/history fetch, shared across modules. |
| `status` | `src/slice/common/statusSlice.ts` | Fetches the dynamic list of allowed actions (approve/reject/return/etc.) for a given module/role/amount, driving `DynamicActionButtons`. |

Each slice follows the same pattern: `createAsyncThunk` calls into the matching `src/api/**` module, `extraReducers` track `pending`/`fulfilled`/`rejected` with dedicated `loading`/`errors` sub-objects, and memoized `select*` selectors are exported for components to consume.

### Auth state shape (representative example)

```ts
interface AuthState {
  isAuthenticated: boolean;
  employeeValidated: boolean;
  loginType: 'employee' | 'role' | null;
  employeeId: string | null;
  employeeData: EmployeeDetailsData | null;
  userData: UserData | null;      // role-login profile (firstName, roleCode, ccCodes, uid, ...)
  roleId: string | null;
  menuData: MenuData[] | null;    // role-based menu returned by backend
  loading: { validateEmployee, validateUser, getEmployeeDetails, getMenu };
  errors:  { validateEmployee, validateUser, getEmployeeDetails, getMenu };
  success: { validateEmployee, validateUser, getEmployeeDetails, getMenu };
}
```

`loadFromStorage` thunk rehydrates auth state from `AsyncStorage` on cold start (used by the login screen to detect an existing session and skip straight to the right dashboard).

---

## 6. API Layer

All HTTP calls live under `src/api/`, mirroring the slice folder structure 1:1. Every API module uses `axios` directly (no shared client instance) and imports `API_BASE_URL` from `src/service/apiConfig.ts`.

**Base URL:** `https://myesselapi.esselprojects.com/api` (same for dev and production builds — `apiConfig.ts` currently returns the production URL in both branches).

**Standard response envelope**, consistent with the backend/web documentation:

```json
{ "IsSuccessful": boolean, "Message": string, "Data": any }
```

Several slices defensively also check for a `Success` flag or presence of non-empty `Data` as a fallback, to tolerate inconsistent backend responses across endpoints.

### Endpoint reference

| Domain | Function | Method | Endpoint |
|---|---|---|---|
| Auth | `validateEmployee` | POST | `/Security/GetValidEmployee` |
| Auth | `validateUser` | POST | `/Security/GetValidUser` |
| Auth | `getEmployeeDetails` | GET | `/Accounts/GetEmployeeDetailsbyUser?UserName=` |
| Auth | `getMenu` | GET | `/Accounts/GetMenu?roleId=` |
| Notifications | `getUserInboxNotifications` | GET | `/Accounts/GetUserInboxNotifications?userId=&roleId=` |
| CC Budget Amendment | `getApprovalCCAmendBudgetDetails` | GET | `/Accounts/GetApprovalCCAmendBudgetCDetails?Roleid=&UID=` |
| CC Budget Amendment | `getApprovalCCAmendBudgetById` | GET | `/Accounts/GetApprovalCCAmendBudgetById?AmendId=&AmendType=` |
| CC Budget Amendment | `getCCUploadDocsExists` | GET | `/Accounts/Getccuploadocsexists?CCCode=&UID=` |
| CC Budget Amendment | `approveCostCenterBudgetAmend` | PUT | `/Accounts/ApproveCostCenterBudgetAmend` |
| CC Budget Amendment | `saveCCAmendBudget` | POST | `/Accounts/SaveCCAmendBudget` |
| CC Budget Amendment | `updateCCAmendBudget` | PUT | `/Accounts/UpdateCCAmendBudget` |
| DCA Budget Amendment | `getVerificationDCAAmends` | GET | `/Accounts/GetVerificationDCAAmends?Roleid=&Userid=` |
| DCA Budget Amendment | `getVerifyDCABudgetAmendById` | GET | `/Accounts/GetVerifyDCABudgetAmendbyId?CCCode=&Fyear=&Ctype=&Status=` |
| DCA Budget Amendment | `getDCABudgetAmendGrid` | GET | `/Accounts/GetDCABudgetAmendgrid?CCCode=&Fyear=&Status=` |
| DCA Budget Amendment | `updateApprovalDCABudgetAmend` | PUT | `/Accounts/UpdateApprovalDCABudgetAmend` |
| DCA Budget Amendment | `approveDCABudgetAmend` | PUT | `/Accounts/ApproveDCABudgetAmend` |
| Indent | `getIndentLevels` | GET | `/Purchase/GetIndentLevels?MOID=&Roleid=` |
| Indent | `viewIndentItemsDetails` | GET | `/Purchase/ViewIndentItemsDetails?Indno=` |
| Indent | `getIndentVerificationGrid` | GET | `/Purchase/VerifyIndentCreationGrid?Roleid=&Created=&Userid=` |
| Indent | `verifyIndent` | PUT | `/Purchase/VerifyIndent` |
| Indent | `viewIndentRemarks` | GET | `/Purchase/ViewIndentRemarks?Indno=` |
| Common | `getRemarks` | GET | `/Purchase/Remarks?Trno=&MOID=` |
| Common | `getStatusList` (dynamic actions) | GET | `/Accounts/GetStatuslist?MOID=&ROID=&ChkAmt=` |

---

## 7. Component Library

Reusable UI lives under `src/components/`, organized by feature area (24 component files total).

### Generic / shared verification components
- **`GenericVerificationList`** — reusable list screen: fetches data via an injected `fetchDataFunction`, handles loading/error/refresh states, renders `VerificationItemCard`s.
- **`GenericVerificationDetail`** — reusable detail screen: renders labeled sections/fields, remarks input, and Approve/Reject/Return actions with confirmation dialogs.
- **`VerificationItemCard`** / **`indentItemCard`** — list-row cards for verification items.
- **`DynamicActionButtons`** — fetches the allowed action set from `/Accounts/GetStatuslist` (MOID/ROID/ChkAmt-driven) and renders buttons dynamically rather than hardcoding Approve/Reject.
- **`VerificationActions`** / **`VerificationChecklist`** — supporting action/checklist UI for the generic detail screen.
- **`RemarksHistorySection`** / **`IndentRemarksHistory`** — remarks/audit-trail display components.

### Dashboard components (`src/components/dashboard/`)
- `Header/DashboardHeader`, `Header/SearchBar` — dashboard top bar and search.
- `Cards/MetricCard`, `Cards/MetricsCarousel`, `Cards/ComparisonIndicator` — KPI cards with a swipeable carousel.
- `QuickAcces/QuickAccessGrid`, `QuickAcces/QuickAccessItem` — icon grid shortcuts (folder name has a typo, kept as-is in code).
- `Footer/TabNavigation` — bottom tab bar.

### Inbox components (`src/components/inbox/`)
- `InboxScreen` — main notification inbox container.
- `Header/InboxHeader`, `Card/NotificationCard`, `Card/NotificationSummaryCard` — notification list UI.
- `Utils/notificationUtils.ts` — formatting/categorization helpers for notifications.

### Common / misc
- `common/AppHeader` — shared screen header with back button, optional refresh button, and slot for a right-aligned custom component. Falls back to `router.push('/(dashboard)/role-dashboard')` if there's no back history.
- `debug/NetworkDebug` — dev-only network diagnostics component, used on the login screen.

---

## 8. Services & Configuration

### `src/service/apiConfig.ts`
Exports `API_BASE_URL`, currently hardcoded to the production API (`https://myesselapi.esselprojects.com/api`) for both dev and release builds. Includes console logging of the resolved URL for debugging.

### `src/service/s3Config.ts`
Central configuration for building URLs to files stored in AWS S3 (bucket: `sltouch-rdsbackup-bucket`, region `us-east-2`), used to preview/download uploaded documents (budget amendment attachments, purchase orders, staff documents, leave attachments). Provides:
- `buildS3Url` / module-specific helpers (`buildCCBudgetAmendmentUrl`, `buildPurchaseOrderUrl`, etc.)
- File helpers: `getFileName`, `getFileExtension`, `getMimeType`, `isImageFile`, `isPdfFile`, `canPreviewFile`.

### Styling
NativeWind 4 + Tailwind CSS 3. Tailwind scans `app/**/*`, `components/**/*`, and `src/**/*`. Entry stylesheet is `app/globals.css`, wired into Metro via `withNativeWind` in `metro.config.js`. Screens mix Tailwind `className` utility props with inline `style` objects (particularly for gradients, shadows, and dynamic/conditional styling).

### Notifications & app badge
- `src/utils/notificationBadge.ts` — `NotificationBadgeManager` wraps `expo-notifications` to request permission and set the OS app-icon badge count (badge-only, no alerts/sounds).
- `src/hooks/useAppBadge.ts` — hook that watches `selectTotalPendingCount` from the notifications slice and keeps the badge count in sync, used on the role dashboard.

---

## 9. Authentication Flow (detail)

1. **Employee ID validation** (`login.tsx`) — user enters employee ID + password, validated via Formik/Yup, dispatched to `validateEmployee` (`Security/GetValidEmployee`). On success, `employeeId` is cached to `AsyncStorage` and the user is routed to `/login-options`.
2. **Access type selection** (`login-options.tsx`) — user picks:
   - **Employee Portal** → `getEmployeeDetails(employeeId)` → `Accounts/GetEmployeeDetailsbyUser` → routes to `/employee-dashboard` (currently a placeholder screen).
   - **Role Portal** → requires a second "role password" (min 6 chars) → `validateUser` (`Security/GetValidUser`) to obtain `roleId` and profile fields (name, role code, cost-center codes, UID) → `getMenu(roleId)` (`Accounts/GetMenu`) to fetch the role-based menu → routes to `/role-dashboard`.
3. Session data (`userData`, `roleId`, `menuData`, `loginType`) is cached to `AsyncStorage` on success and rehydrated via `loadFromStorage` on subsequent app opens, letting the login screen skip directly to the correct dashboard if a valid session exists.
4. `logout()` clears role/session data from Redux and storage but retains the cached `employeeId` so the user doesn't have to retype it.

Biometric login (`expo-local-authentication` is installed, and a `biometric-setup` route exists) is scaffolded but not implemented — the route currently renders a placeholder screen.

---

## 10. Build & Deployment

- **Build system:** EAS Build (`eas.json`), Android as the primary target.
  - `development` profile — internal distribution, dev client enabled.
  - `preview` profile — internal distribution, produces an APK, `preview` update channel.
  - `production` profile — auto-incrementing version, `production` update channel.
- **OTA updates:** `expo-updates` is configured with a fixed update URL and `sdkVersion` runtime policy — per project convention (see `CLAUDE.md`), new features should ship as JS-only OTA updates unless native module changes require a full rebuild.
- **Android package:** `com.anayak06.ESSELMOB`.
- **New Architecture:** enabled (`newArchEnabled: true`), React Compiler experiment enabled, typed routes experiment enabled.

---

## 11. Known Gaps / Placeholder Areas

For accuracy, the following are not fully implemented as of this documentation:

- `(dashboard)/employee-dashboard.tsx` — placeholder/dummy screen only.
- `(auth)/biometric-setup.tsx` — placeholder/dummy screen; biometric login is not wired into the auth flow.
- `(dashboard)/_layout.tsx` — contains a copy-pasted `AuthLayout` function name/comment from the auth layout; functionally works (renders a headerless Stack) but should be renamed for clarity.
- `apiConfig.ts` — `__DEV__` branch currently resolves to the same production URL as release builds; there is no separate local/staging API target configured.

---

## 12. Suggested Cross-References

When reading this alongside the backend and web frontend documentation, pay attention to:
- Matching endpoint names/response shapes under `/Accounts/*` and `/Purchase/*` (this app assumes the same `{ IsSuccessful, Message, Data }` envelope used elsewhere).
- The `GetStatuslist` (MOID/ROID/ChkAmt) dynamic-actions endpoint, since it drives which approve/reject/return buttons render across CC Budget, DCA Budget, and Indent verification screens — any backend change to that endpoint's action set affects all three flows.
- The S3 bucket/folder conventions in `s3Config.ts`, which must stay in sync with wherever the backend/web app uploads documents.
