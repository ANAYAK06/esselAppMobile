// src/store/ReduxProvider.tsx - Redux Provider Component
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { ActivityIndicator, View, Text } from 'react-native';

// Import store
import { store } from './store';

// Create persistor
const persistor = persistStore(store);

// Props interface
interface ReduxProviderProps {
    children: React.ReactNode;
}

// Loading component for PersistGate
const LoadingComponent = () => (
    <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{
            marginTop: 16,
            fontSize: 16,
            color: '#6b7280',
            fontWeight: '500'
        }}>
            Loading...
        </Text>
    </View>
);

// Redux Provider Component
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
    return (
        <Provider store={store}>
            <PersistGate
                loading={<LoadingComponent />}
                persistor={persistor}
            >
                {children}
            </PersistGate>
        </Provider>
    );
};

export default ReduxProvider;