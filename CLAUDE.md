# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator
npm run ios

# Lint
npm run lint
```

There are no automated tests configured in this project.

## Architecture Overview

**ESSELMOB** is an Expo-based mobile ERP app for Essel Projects, providing enterprise approval and verification workflows (budget amendments, indent/requisitions) with a notification inbox and role-based dashboards.

### Tech Stack

- **Expo ~54** with **Expo Router ~6** (file-based routing)
- **React Native 0.81** / **React 19**
- **NativeWind 4** + **Tailwind CSS 3** for styling
- **Redux Toolkit 2** with **redux-persist** (auth slice only)
- **Axios** for HTTP — development builds hit the test API `http://myesseltestapi.esselprojects.com/api` (HTTP only; its HTTPS is broken), release builds `https://myesselapi.esselprojects.com/api` (see `src/service/apiConfig.ts`)
- **TypeScript** (strict mode, `@/` path alias maps to project root)

### Routing Structure

Expo Router groups under `app/`:
- `(auth)/` — login, login-options, biometric-setup
- `(dashboard)/` — employee-dashboard, role-dashboard
- `(inbox)/` — inbox + `verification/` sub-routes (cc-budget, dca-budget, indent), each with `list.tsx` and `[id].tsx` dynamic detail views

### State Management

Redux store (`src/store/store.ts`) with slices in `src/slice/`:
- `auth/authSlice` — persisted to AsyncStorage
- `budget/ccBudgetAmendmentSlice`, `budget/dcaBudgetAmendmentSlice`
- `indent/indentSlice`
- `notifications/inboxNotificationsSlice`
- `common/remarksSlice`, `common/statusSlice`

Use `useAppDispatch` / `useAppSelector` from `src/store/hooks.ts`.

### API Layer

All API calls live in `src/api/`, mirroring the slice structure. API base URL and endpoint constants are in `src/service/apiConfig.ts`. Standard response shape: `{ IsSuccessful: boolean, Message: string, Data: any }`.

### Key Conventions

- Reusable UI lives in `src/components/`. Verification screens share generic components: `GenericVerificationList`, `GenericVerificationDetail`, `VerificationItemCard`, `DynamicActionButtons`, `RemarksHistory`.
- AWS S3 config for file uploads is in `src/service/s3Config.ts`.
- OTA updates are enabled via `expo-updates`; new features should ship as JS-only updates unless native changes are required.
- Android is the primary target platform; iOS is secondary.
