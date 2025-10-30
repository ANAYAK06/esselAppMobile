// src/api/common/statusAPI.ts
import axios from "axios";
import { API_BASE_URL } from '@/src/service/apiConfig';

export interface StatusItem {
    type: string;
    text: string;
    value: string;
    className: string;
    enabled: boolean;
}

export interface StatusListParams {
    MOID: string | number;
    ROID: string | number;
    ChkAmt?: string | number;
}

export const getStatusList = async (params: StatusListParams) => {
    const { MOID, ROID, ChkAmt = 0 } = params;

    const url = `${API_BASE_URL}/Accounts/GetStatuslist?MOID=${MOID}&ROID=${ROID}&ChkAmt=${ChkAmt}`;

    const response = await axios.get(url);

    return response.data;
};