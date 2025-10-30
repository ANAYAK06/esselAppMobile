// src/components/debug/NetworkDebug.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { API_BASE_URL } from '../../service/apiConfig';

const NetworkDebug = () => {
    const [debugInfo, setDebugInfo] = useState('');

    const testNetwork = async () => {
        try {
            setDebugInfo(`Testing: ${API_BASE_URL}/Security/GetValidEmployee`);

            const response = await fetch(`${API_BASE_URL}/Security/GetValidEmployee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Username: 'test',
                    Password: 'test'
                })
            });

            setDebugInfo(prev => prev + `\nStatus: ${response.status}\nURL: ${response.url}`);
        } catch (error: any) {  // Add `: any` type annotation
            setDebugInfo(prev => prev + `\nError: ${error.message || 'Unknown error'}\nName: ${error.name || 'Unknown'}`);
        }
    };

    if (__DEV__) return null; // Only show in production APK

    return (
        <View style={{ backgroundColor: 'red', padding: 10, margin: 10 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>DEBUG - APK ONLY</Text>
            <Text style={{ color: 'white' }}>API: {API_BASE_URL}</Text>
            <TouchableOpacity onPress={testNetwork} style={{ backgroundColor: 'blue', padding: 5, marginTop: 5 }}>
                <Text style={{ color: 'white' }}>Test Network</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 200, marginTop: 5 }}>
                <Text style={{ color: 'white', fontSize: 12 }}>{debugInfo}</Text>
            </ScrollView>
        </View>
    );
};

export default NetworkDebug;