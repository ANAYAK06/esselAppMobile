// src/store/store.ts - Redux Store Configuration
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import auth slice
import authReducer from '../slice/auth/authSlice';
import inboxNotificationReducer from '../slice/notifications/inboxNotificationsSlice'
import ccBudgetAmendmentReducer from '@/src/slice/budget/ccBudgetAmendmentSlice'
import remarksReducer from '@/src/slice/common/remarksSlice';
import statusReducer from '@/src/slice/common/statusSlice'
import indentReducer from '@/src/slice/indent/indentSlice'
import dcaAmendmentReducer from '@/src/slice/budget/dcaBudgetAmendmentSlice'
// Configure Redux Persist
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['auth'], // Persist auth state only
    blacklist: [], // Don't persist these slices
};

// Root reducer - combining all slices
const rootReducer = combineReducers({
    auth: authReducer,
    inboxnotifications:inboxNotificationReducer,
    ccBudgetAmendment:ccBudgetAmendmentReducer,
    remarks: remarksReducer,
    status: statusReducer,
    indent: indentReducer,
    dcaBudgetAmendment:dcaAmendmentReducer,


});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

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