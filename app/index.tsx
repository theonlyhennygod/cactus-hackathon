import { Stack } from 'expo-router';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import CaptureFlow from '../components/CaptureFlow';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen 
                options={{ 
                    title: 'Pocket Wellness',
                    headerShown: false
                }} 
            />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pocket Wellness</Text>
                <Text style={styles.headerSubtitle}>Your AI Health Companion</Text>
            </View>
            <CaptureFlow />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        backgroundColor: '#667eea',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#ffffff',
        opacity: 0.9,
    },
});
