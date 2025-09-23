import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={18} color="#6b7280" />
            <TextInput
                className="flex-1 ml-2 text-gray-700"
                placeholder="Search transactions, reports..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9ca3af"
            />
        </View>
    );
}