// Small helpers the dedicated-page configs share
import type { Rec } from '../types';

// Web pages that only check for an HTTP error (the thunk resolves → success toast)
export const ANY = () => true;
// "Submitted…" / "Submited…" (the "$…" tail is extra info)
export const submitted = (s: string) => /submit/i.test(String(s || '').split('$')[0]);

export const list = (v: unknown): Rec[] => (Array.isArray(v) ? v : []);

// "CODE , Name" / "CODE,Name" pairs some views return
export const splitCoded = (raw: unknown, sep = ',') => {
    const text = String(raw || '');
    const i = text.indexOf(sep);
    return i < 0 ? { code: text.trim(), name: '' } : { code: text.slice(0, i).trim(), name: text.slice(i + sep.length).trim() };
};
export const codeName = (raw: unknown, sep = ',') => {
    const { code, name } = splitCoded(raw, sep);
    return [code, name].filter(Boolean).join(' — ');
};

// Trailing-comma CSV the legacy approve SPs expect ("a,b,c,")
export const csv = (values: unknown[]) => (values.length ? `${values.join(',')},` : '');
