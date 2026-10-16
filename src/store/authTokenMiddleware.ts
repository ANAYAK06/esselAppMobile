// src/store/authTokenMiddleware.ts - every logout path in the app ends in auth/logout or
// auth/resetAuth; this ends the login session on the server too (refresh token revoked).
import type { Middleware } from '@reduxjs/toolkit';
import { serverLogout } from '@/src/service/authToken';

const LOGOUT_ACTIONS = ['auth/logout', 'auth/resetAuth'];

export const authTokenMiddleware: Middleware = () => (next) => (action) => {
    const result = next(action);
    if (LOGOUT_ACTIONS.includes((action as { type?: string })?.type ?? '')) {
        serverLogout();
    }
    return result;
};

export default authTokenMiddleware;
