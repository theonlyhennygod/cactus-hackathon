import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import CaptureFlow from '../components/CaptureFlow';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Pocket Doctor' }} />
            <CaptureFlow />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
