// src/store/store.ts - Redux Store Configuration
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, createTransform, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import auth slice
import authReducer, { initialState as authInitialState } from '../slice/auth/authSlice';
import inboxNotificationReducer from '../slice/notifications/inboxNotificationsSlice'
import employeePortalReducer from '@/src/slice/hr/employeePortalSlice'
import rejectionAlertsReducer from '@/src/slice/notifications/rejectionAlertsSlice'
// Request flags (loading / errors / success) are per-session: if one was saved mid-request
// (app reloaded or killed), the login sheet came back with every button disabled for good.
const authTransientFlags = createTransform<any, any, any, any>(
    (inbound: any) => inbound,
    (outbound: any) => ({
        ...outbound,
        loading: authInitialState.loading,
        errors: authInitialState.errors,
        success: authInitialState.success,
    }),
    { whitelist: ['auth'] }
);

// Configure Redux Persist
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['auth'], // Persist auth state only
    blacklist: [], // Don't persist these slices
    transforms: [authTransientFlags],
};

// Root reducer - combining all slices
const rootReducer = combineReducers({
    auth: authReducer,
    inboxnotifications:inboxNotificationReducer,
    employeePortal: employeePortalReducer,
    rejectionAlerts: rejectionAlertsReducer,


});

// Create persisted reducer
const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer);

// Configure and create store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore Redux Persist actions
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
            // Additional middleware options
            immutableCheck: __DEV__,
            serializabilityCheck: __DEV__,
        }),
    // Enable Redux DevTools in development
    devTools: __DEV__,
});

// Export TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;