// Rejection alerts behind the header bell — same endpoints as the Corex web
// (RAPP-SLAPP frontend: api/RejectionAlertAPI/rejectionAlertAPI.js). userId is the user's UID.
import axios from 'axios';
import { API_BASE_URL } from '@/src/service/apiConfig';

export interface RejectionAlert {
    RejectionAlertId: number;
    ModuleName?: string;
    Refno?: string;
    RejectedBy?: string;
    RejectedOn?: string;
    Remarks?: string;
    AiMessage?: string;
    Status: number; // 0 unread, 1 read, 2 dismissed
    IsRead?: boolean;
}

export const getRejectionAlerts = async (userId: string | number): Promise<RejectionAlert[]> => {
    const response = await axios.get(`${API_BASE_URL}/RejectionAlerts/GetRejectionAlerts`, { params: { userId } });
    const data = response.data?.Data ?? response.data;
    return Array.isArray(data) ? data : [];
};

// Status: 1 = mark read, 2 = dismiss permanently
export const updateRejectionAlertStatus = async (payload: { RejectionAlertId: number; UserId: string | number; Status: 1 | 2 }) => {
    const response = await axios.post(`${API_BASE_URL}/RejectionAlerts/UpdateRejectionAlertStatus`, payload);
    return response.data;
};
