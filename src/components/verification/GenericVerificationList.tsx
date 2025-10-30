// src/components/verification/GenericVerificationList.tsx
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react-native';
import AppHeader from '../common/AppHeader';
import VerificationItemCard from './Card/VerificationItemCard';

interface GenericVerificationListProps {
    title: string;
    moduleType: string;
    fetchDataFunction: (roleId: string, uid: string) => Promise<any>;
    userData: any;
    roleId: string;
    detailRoute: string;
    summaryGradient?: string[];
    leftBorderColor?: string;
}

const GenericVerificationList: React.FC<GenericVerificationListProps> = ({
                                                                             title,
                                                                             moduleType,
                                                                             fetchDataFunction,
                                                                             userData,
                                                                             roleId,
                                                                             detailRoute,
                                                                             leftBorderColor = '#f59e0b',
                                                                         }) => {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [userData, roleId,]);

    const loadData = async () => {
        if (!userData || !roleId) {
            console.warn('⚠️ User data or roleId not available');
            setError('Authentication data missing');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('📋 Fetching data with params:', {
                roleId,
                uid: userData.UID,
                userName: userData.UserName
            });

            const response = await fetchDataFunction(roleId, userData.UID);

            console.log('📦 API Response:', response);

            // Check if response has the expected structure
            if (!response) {
                throw new Error('No response from server');
            }

            // Handle different response structures
            if (response.IsSuccessful === true || response.Success === true) {
                const data = response.Data || [];
                console.log('✅ Data loaded successfully:', data.length, 'items');
                setItems(Array.isArray(data) ? data : []);
            } else {
                const errorMsg = response.Message || response.ErrorDetails?.ErrorMessage || 'Failed to load data';
                console.error('❌ API returned error:', errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error('❌ Load data error:', error);

            let errorMessage = 'Failed to load data';

            if (error.response) {
                // Axios error with response
                errorMessage = error.response.data?.Message ||
                    error.response.data?.ErrorDetails?.ErrorMessage ||
                    `Server error: ${error.response.status}`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);

            Alert.alert(
                'Error Loading Data',
                errorMessage,
                [
                    { text: 'Retry', onPress: () => loadData() },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadData();
        } finally {
            setRefreshing(false);
        }
    };

    const handleItemPress = (item: any) => {
        console.log('📱 Opening item:', item);
        router.push({
            pathname: detailRoute as any,
            params: {
                id: item.AmendId || item.POId || item.InvoiceId || item.Id,
                type: item.AmendType || item.Type || moduleType,
            }
        });
    };

    const renderEmptyState = () => (
        <View className="flex-1 items-center justify-center px-8 mt-20">
            <CheckCircle size={64} color="#22c55e" />
            <Text className="text-gray-900 text-xl font-semibold mt-4 text-center">
                All Verified!
            </Text>
            <Text className="text-gray-500 text-base mt-2 text-center">
                No items pending verification.
            </Text>
            <TouchableOpacity
                onPress={loadData}
                className="bg-green-500 px-6 py-3 rounded-lg mt-6"
            >
                <View className="flex-row items-center">
                    <RefreshCw size={16} color="#fff" />
                    <Text className="text-white font-medium ml-2">Refresh</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    if (isLoading && items.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <AppHeader
                    title={title}
                    showBackButton={true}
                    showRefreshButton={true}
                    isLoading={isLoading}
                    onRefresh={loadData}
                />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-4">Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <AppHeader
                title={title}
                showBackButton={true}
                showRefreshButton={true}
                isLoading={isLoading}
                onRefresh={loadData}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#22c55e']}
                        tintColor="#22c55e"
                    />
                }
            >
                {/* Summary Card */}
                <View className="mx-4 mt-4 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-green-400 to-green-600">
                    <View className="p-6 bg-green-500">
                        <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
                        <Text className="text-white/80 text-sm mb-4">Pending Verification</Text>
                        <View className="items-center pt-4 border-t border-white/20">
                            <Text className="text-white text-5xl font-bold">{items.length}</Text>
                            <Text className="text-white/90 text-base mt-2">Items Awaiting Action</Text>
                        </View>
                    </View>
                </View>

                {/* Items List */}
                {items.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View className="pb-20">
                        {items.map((item: any, index: number) => (
                            <VerificationItemCard
                                key={`${item.AmendId || item.Id}-${index}`}
                                id={item.AmendId || item.POId || item.InvoiceId || item.Id || `ITEM-${index}`}
                                title={item.CCName || item.Description || item.Title || 'No Title'}
                                amount={item.AmendedAmount || item.Amount || item.BudgetAmount}
                                priority={item.Priority}
                                dueDate={item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString('en-IN') : undefined}
                                requestedBy={item.CreatedBy}
                                badge={item.AmendType || item.Type}
                                leftBorderColor={leftBorderColor}
                                onPress={() => handleItemPress(item)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Error State */}
            {error && (
                <View className="absolute bottom-20 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <View className="flex-row items-center">
                        <AlertCircle size={20} color="#ef4444" />
                        <Text className="text-red-800 ml-2 flex-1">{error}</Text>
                        <TouchableOpacity onPress={loadData}>
                            <Text className="text-red-600 font-medium">Retry</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default GenericVerificationList;