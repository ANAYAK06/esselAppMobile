// Config contract for the config-driven verification screens — the mobile port of the Corex web
// pages/Accounts/ConfigVerification.jsx contract (see the comment block at the top of that file).
// One config per legacy "queue → detail → verify / approve" screen; rows and details are the raw
// API records, so they are loosely typed.
import type React from 'react';
import type { LucideIcon } from 'lucide-react-native';
import type { SheetContent } from '@/src/components/common/DetailSheet';
import type { SelectOption } from '@/src/components/employee/FormControls';
import type { RemarkEntry } from '@/src/api/verification/verificationCommonAPI';

export type Rec = Record<string, any>;

// Who is verifying + the inbox item the screen was opened from (path / category lower-cased)
export type Ctx = { roleId: string; userId: string; user: string; path: string; category: string };

export type FieldSpec = [label: string, value: unknown, wide?: boolean] | false | null | undefined | '' | 0;
export type SectionSpec = { title?: string; fields: FieldSpec[] };

export type ExtraCtx = {
    aux: Rec;
    ext: Rec;                                           // per-record scratch state (ticks, edits, …)
    setExt: (update: (prev: Rec) => Rec) => void;
    openSheet: (sheet: SheetContent) => void;          // the screen's one bottom sheet (pop-ups)
    reload: () => void;                                 // reload the record (after an inline edit)
    roleId: string;
    userId: string;
    user: string;                                       // userName, posted as Createdby
};

export type ResubmitField = {
    key: string;
    label: string;
    type?: 'text' | 'textarea' | 'date' | 'select';
    options?: SelectOption[] | ((aux: Rec) => SelectOption[]);
    required?: boolean;
    readOnly?: boolean;
    filter?: RegExp;                                    // keystrokes that do not match are ignored
    maxLength?: number;
    numeric?: boolean;                                  // numeric keyboard
    show?: (values: Rec) => boolean;
};

type Route = string | ((row: Rec) => string);
export type BeforeResult = string[] | null | { errors?: string[]; data?: Rec };

export interface VerificationConfig {
    title: string;
    successLabel?: string;
    noun: string;
    icon: LucideIcon;
    searchPlaceholder?: string;
    // route may hold {roleId} / {userId}; `more` merges further queues, each row tagged with its queue's _type
    queue: { route: string; params: (ctx: Ctx) => Rec; tag?: string; more?: { route: string; params: (ctx: Ctx) => Rec; tag: string }[] };
    itemKey: (row: Rec) => string | number;
    card: {
        title: (row: Rec) => unknown;
        subtitle: (row: Rec) => unknown;
        amount?: (row: Rec) => string | null;
        meta?: (row: Rec) => unknown;
    };
    searchText?: (row: Rec) => string;
    detail?: { route: Route; params: (row: Rec, ctx: Ctx) => Rec; select?: (data: any, row: Rec) => Rec | null; method?: 'post' };
    aux?: { name: string; route: string; params?: (ctx: Ctx) => Rec }[];
    rowAux?: { name: string; route: string; params: (row: Rec, d: Rec, ctx: Ctx) => Rec; when?: (row: Rec, d: Rec) => boolean }[];
    moid: (row: Rec, d: Rec) => string | number | null | undefined;
    chkAmt?: (row: Rec, d: Rec) => unknown;
    remarksKey?: (row: Rec, d: Rec) => string | number | null | undefined;
    remarks?: (row: Rec, d: Rec) => Promise<RemarkEntry[]>;     // own history source instead of Purchase/Remarks
    confirmLabel?: string;                                      // "I have verified…" tick before acting
    showReturn: 'Yes' | 'No';
    excludeActions?: (row: Rec, d: Rec) => string[];     // lower-case action types to hide
    isReturned?: (row: Rec) => boolean;
    returnedNotice?: string;
    resubmit?: {
        fields: ResubmitField[];
        initial: (row: Rec, d: Rec, aux: Rec) => Rec;     // re-run until the first edit, so lookups can fill it
        derive?: (values: Rec) => Rec;
        validate?: (values: Rec, row: Rec, d: Rec) => (string | false | null | undefined)[];
        render?: (row: Rec, d: Rec, x: { aux: Rec; values: Rec; setValues: (update: (prev: Rec) => Rec) => void }) => React.ReactNode;
        route: Route;
        method?: 'post';
        payload: (row: Rec, d: Rec, values: Rec, x: { user: string; roleCode: string; roleId: string; userId: string }) => Rec;
        ok?: string[] | ((status: string, row: Rec, d: Rec) => boolean);
    };
    header: {
        title: (row: Rec, d: Rec) => unknown;
        subtitle: (row: Rec, d: Rec) => unknown;
        chips?: (row: Rec, d: Rec) => unknown[];
    };
    sections?: (row: Rec, d: Rec) => (SectionSpec | false | null | undefined | '')[];
    extra?: (row: Rec, d: Rec, x: ExtraCtx) => React.ReactNode;
    // Own decision UI in place of the status-list action panel (e.g. Close Master's status / date form);
    // done(message) shows the success alert and goes back to the queue
    actions?: (row: Rec, d: Rec, x: ExtraCtx & { done: (message: string) => void }) => React.ReactNode;
    // Extra checks before acting: errors to show, null to cancel quietly (the user said no to a
    // confirm), or { errors, data } where data reaches approve.payload as `pre`
    beforeAction?: (action: string, row: Rec, d: Rec, x: { aux: Rec; ext: Rec }) => BeforeResult | Promise<BeforeResult>;
    approve: {
        route: Route;
        method?: 'post';                                        // routes the API exposes as HttpPost (default PUT)
        // action = the type (Verify / Approve / Return / Reject); value = GetStatuslist's Value for it
        payload: (row: Rec, d: Rec, x: { action: string; value: string; note: string; user: string; roleCode: string; roleId: string; userId: string; aux: Rec; ext: Rec; pre: Rec }) => Rec;
        ok?: string[] | ((status: string, row: Rec, d: Rec, body: any) => boolean);   // body = the raw response
        afterOk?: (status: string, row: Rec, d: Rec, x: { action: string }) => Promise<string | void>;   // returns an extra note
    };
}

export const routeOf = (route: Route, row: Rec) => (typeof route === 'function' ? route(row) : route);

// ok: success literals (default Submitted / Submited) or a predicate for SPs that append data
export const isOk = (ok: VerificationConfig['approve']['ok'], status: string, row: Rec, d: Rec, body?: any) =>
    typeof ok === 'function' ? ok(status, row, d, body) : (ok || ['Submitted', 'Submited']).includes(status);
