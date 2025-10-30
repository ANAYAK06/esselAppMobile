// src/components/verification/Actions/DynamicActionButtons.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '@/src/service/apiConfig';

interface DynamicActionButtonsProps {
    moid: string | number;
    roid: string | number;
    chkAmt?: string | number;
    onAction: (action: any) => void;
    disabled?: boolean;
}

const DynamicActionButtons: React.FC<DynamicActionButtonsProps> = ({
                                                                       moid,
                                                                       roid,
                                                                       chkAmt = 0,
                                                                       onAction,
                                                                       disabled = false,
                                                                   }) => {
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    console.log('🔘 Component props:', { moid, roid, chkAmt });

    useEffect(() => {
        // ✅ Check if we have required params
        if (!moid || !roid) {
            console.warn('⚠️ Missing required params');
            setLoading(false);
            return;
        }

        console.log('🔄 Component mounted, fetching data...');
        console.log('📋 Using params:', { moid, roid, chkAmt });

        let isMounted = true;

        const fetchData = async () => {
            try {
                const url = `${API_BASE_URL}/Accounts/GetStatuslist?MOID=${moid}&ROID=${roid}&ChkAmt=${chkAmt}`;
                console.log('🌐 Calling URL:', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('📡 Response status:', response.status);

                const data = await response.json();
                console.log('📦 Response data:', JSON.stringify(data, null, 2));

                if (!isMounted) return;

                if (data?.Data && Array.isArray(data.Data)) {
                    const transformed = data.Data
                        .filter((item: any) => item.Type)
                        .map((item: any) => ({
                            type: item.Type,
                            text: item.Text || item.Type,
                            value: item.Value || item.Type,
                        }));

                    console.log('✅ Transformed actions:', transformed);
                    setActions(transformed);
                } else {
                    console.warn('⚠️ No valid data in response');
                    setActions([]);
                }
            } catch (err: any) {
                console.error('❌ Fetch error:', err);
                if (isMounted) {
                    setError(err.message || 'Failed to load actions');
                }
            } finally {
                if (isMounted) {
                    console.log('🏁 Setting loading to false');
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            console.log('🧹 Component unmounting');
            isMounted = false;
        };
    }, [moid, roid, chkAmt]); // ✅ Now uses actual props

    const handlePress = (action: any) => {
        console.log('👆 Button pressed:', action);

        if (disabled) {
            Alert.alert('Not Available', 'Please complete required fields first.');
            return;
        }

        Alert.alert(
            `Confirm ${action.text}`,
            `Are you sure you want to ${action.text.toLowerCase()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        console.log('✅ Action confirmed');
                        onAction(action);
                    },
                },
            ]
        );
    };

    const getButtonColor = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('verify') || t.includes('approve')) return '#22c55e';
        if (t.includes('reject')) return '#ef4444';
        if (t.includes('return')) return '#f97316';
        return '#3b82f6';
    };

    console.log('🎨 Rendering component, state:', { loading, error, actionsCount: actions.length });

    if (loading) {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
                    Loading actions...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    alignItems: 'center',
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 }}>
                    Failed to Load
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                    {error}
                </Text>
            </View>
        );
    }

    if (actions.length === 0) {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    alignItems: 'center',
                }}
            >
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                    No actions available
                </Text>
            </View>
        );
    }

    return (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
            }}
        >
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                Available Actions ({actions.length})
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {actions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handlePress(action)}
                        disabled={disabled}
                        style={{
                            backgroundColor: getButtonColor(action.type),
                            paddingVertical: 10,
                            paddingHorizontal: 20,
                            borderRadius: 8,
                            opacity: disabled ? 0.5 : 1,
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>
                            {action.text}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {disabled && (
                <Text
                    style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: '#ca8a04',
                        textAlign: 'center',
                    }}
                >
                    ⚠️ Complete required fields to enable actions
                </Text>
            )}
        </View>
    );
};

export default DynamicActionButtons;