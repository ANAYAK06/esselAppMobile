import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DummyScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>✅ Dummy Screen Loaded</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
});

export default DummyScreen;
