import { Alert, Button, StyleSheet, Switch, Text, View } from 'react-native';
import { useSettingsStore } from '../store';
import { mmkvStorage } from '../store/mmkv';

export default function SettingsScreen() {
    const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

    const handleDeleteData = () => {
        Alert.alert(
            'Delete All Data',
            'Are you sure? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        mmkvStorage.removeItem('wellness_history');
                        Alert.alert('Data Deleted', 'All local wellness history has been cleared.');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Privacy Mode (Local Only)</Text>
                    <Switch value={isPrivacyMode} onValueChange={togglePrivacyMode} />
                </View>
                <Text style={styles.hint}>
                    When enabled, no data leaves your device. All processing is done locally using on-device models.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <Button title="Delete All Data" onPress={handleDeleteData} color="red" />
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Pocket Doctor v1.0.0 (Hackathon Build)</Text>
                <Text style={styles.footerText}>Powered by Echo-LNN & Cactus</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
    },
    hint: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
});
