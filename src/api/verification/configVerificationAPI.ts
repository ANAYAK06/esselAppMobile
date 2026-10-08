// Thin GET / POST / PUT wrappers for the config-driven verification screens — same as the Corex web
// api/AccountsAPI/configVerificationAPI.js. Each config (src/components/verification/config/configs)
// names the legacy-backed route (e.g. 'Accounts/VerifyShareIssuanceGrid') and its parameters.
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';

type Params = Record<string, unknown> | undefined;

// The API's error body ({ Message, ErrorDetails }) → a readable message
const fail = (e: any): never => {
    const body = e?.response?.data;
    throw new Error(body?.ErrorDetails?.ErrorMessage || body?.Message || e?.message || 'Request failed');
};

// Whole response body ({ IsSuccessful, Message, Data } — Data is used even when IsSuccessful is false)
export const getRoute = async (route: string, params?: Params) => {
    try {
        return (await axios.get(`${API_BASE_URL}/${route}`, { params })).data;
    } catch (e) {
        return fail(e);
    }
};

export const postRoute = async (route: string, payload?: Params) => {
    try {
        return (await axios.post(`${API_BASE_URL}/${route}`, payload, { timeout: 30000 })).data;
    } catch (e) {
        return fail(e);
    }
};

export const putRoute = async (route: string, payload?: Params) => {
    try {
        return (await axios.put(`${API_BASE_URL}/${route}`, payload, { timeout: 30000 })).data;
    } catch (e) {
        return fail(e);
    }
};

// Data out of a response body (or the body itself when the route answers bare)
export const dataOf = (body: any) => (body && typeof body === 'object' && 'Data' in body ? body.Data : body);
export const listOf = (body: any): any[] => {
    const d = dataOf(body);
    return Array.isArray(d) ? d : [];
};
// Submit routes answer a status string ("Submitted", "Submited+…") as Data or as the body
export const statusOf = (body: any): string => {
    const d = dataOf(body);
    if (typeof d === 'string') return d;
    if (typeof body === 'string') return body;
    return d?.saveStatus ?? d?.Message ?? body?.Message ?? '';
};
