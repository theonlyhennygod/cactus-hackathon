import { useRouter } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import BreathingCoach from '../components/BreathingCoach';
import { useCheckInStore, useVitalsStore } from '../store';
import { generateAndSharePDF } from '../utils/pdfExport';

export default function ResultsScreen() {
  const router = useRouter();
  const vitals = useVitalsStore();
  const { reset } = useCheckInStore();

  const handleDone = () => {
    reset();
    router.replace('/');
  };

  const handleExport = async () => {
    await generateAndSharePDF(vitals);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Wellness Check Results</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Heart Rate</Text>
        <Text style={styles.value}>{vitals.heartRate ? vitals.heartRate.toFixed(0) : '--'} bpm</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>HRV</Text>
        <Text style={styles.value}>{vitals.hrv ? vitals.hrv.toFixed(0) : '--'} ms</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Breathing Rate</Text>
        <Text style={styles.value}>{vitals.breathingRate ? vitals.breathingRate.toFixed(0) : '--'} rpm</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tremor Index</Text>
        <Text style={styles.value}>{vitals.tremorIndex ? vitals.tremorIndex.toFixed(2) : '--'}</Text>
      </View>

      <View style={styles.section}>
        <BreathingCoach />
      </View>

      <View style={styles.buttonGroup}>
        <Button title="Export PDF Summary" onPress={handleExport} />
        <View style={{ height: 10 }} />
        <Button title="Start New Check-In" onPress={handleDone} color="#666" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 20,
  },
  card: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    width: '100%',
    marginVertical: 20,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 20,
  },
});
