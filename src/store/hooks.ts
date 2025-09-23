// src/store/hooks.ts - Typed Redux Hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed versions of useDispatch and useSelector hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience hooks for common state selections
export const useAuth = () => {
    return useAppSelector((state) => state.auth);
};

// Add more convenience hooks as needed
// export const useUser = () => useAppSelector((state) => state.user);
// export const useSettings = () => useAppSelector((state) => state.settings);