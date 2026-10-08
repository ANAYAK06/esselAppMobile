// Calls every verification screen shares — same endpoints as the Corex web
// (api/commonAPI/getStatusAPI.js, SupplierPOAPI/supplierPOHelperAPI.js getRemarks,
// commonAPI/awsUploadAPI.js).
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';

export type ActionType = 'Verify' | 'Approve' | 'Return' | 'Reject';

export interface StatusAction {
    type: ActionType;   // what the button does
    value: string;      // what the approve API expects (falls back to type)
    text: string;       // button label
}

const ACTION_TYPES: ActionType[] = ['Approve', 'Verify', 'Return', 'Reject'];

// Actions this role may take at this workflow step (and amount, for approval limits)
export const getStatusActions = async (
    moid: string | number,
    roleId: string | number,
    chkAmt: number,
    showReturn: boolean,
): Promise<StatusAction[]> => {
    const response = await axios.get(`${API_BASE_URL}/Accounts/GetStatuslist`, {
        params: { MOID: moid, ROID: roleId, ChkAmt: chkAmt || 0 },
    });
    const rows: { Type?: string; Value?: string; Text?: string }[] = Array.isArray(response.data?.Data) ? response.data.Data : [];
    return rows
        .map((row) => {
            const type = ACTION_TYPES.find((t) => t.toLowerCase() === (row.Type || '').trim().toLowerCase());
            return type ? { type, value: (row.Value || '').trim() || type, text: (row.Text || '').trim() || type } : null;
        })
        .filter((a): a is StatusAction => !!a && (showReturn || a.type !== 'Return'));
};

export interface RemarkEntry {
    Action?: string;        // "Created By", "Verified By", "Rejected By", ...
    ActionBy?: string;
    ActionRole?: string;
    ActionRemarks?: string;
    ActionDate?: string;
}

export const getRemarksHistory = async (trno: string | number, moid: string | number): Promise<RemarkEntry[]> => {
    const response = await axios.get(`${API_BASE_URL}/Purchase/Remarks`, { params: { Trno: trno, MOID: moid } });
    return Array.isArray(response.data?.Data) ? response.data.Data : [];
};

// Uploads a picked file to S3 under "Upload docs/<folder>/<fileName>" (POST /AWSUpload/UploadFile)
export const uploadFileToS3 = async (
    file: { uri: string; name: string; mimeType?: string },
    folder: string,
    fileName?: string,
) => {
    const form = new FormData();
    // React Native's FormData takes a { uri, name, type } descriptor for files
    form.append('file', { uri: file.uri, name: fileName || file.name, type: file.mimeType || 'application/pdf' } as any);
    form.append('folder', folder);
    form.append('fileName', fileName || file.name);
    const response = await axios.post(`${API_BASE_URL}/AWSUpload/UploadFile`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000,
    });
    return response.data;
};

// Approval comment trail the web appends to ("Role : User : Comment", joined by "||")
export const appendApprovalComment = (existing: string | undefined, role: string, user: string, comment: string) => {
    const entry = `${role} : ${user} : ${comment}`;
    return existing && existing.trim() ? `${existing.trim()}||${entry}` : entry;
};

// Approve / update SPs answer "Submited" / "Submitted" (sometimes with ",…" or "$…" appended)
export const isSubmitted = (status: string) => /^Submitt?ed(,|\$|$)/.test(status || '');
