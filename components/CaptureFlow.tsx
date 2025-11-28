import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { runWellnessCheck } from '../agents/Orchestrator';
import { useCheckInStore, useVitalsStore } from '../store';
import { AccelerometerData, startAccelerometer, stopAccelerometer } from '../utils/sensorHelpers';

export default function CaptureFlow() {
    const { step, setStep, isCapturing, setIsCapturing, reset } = useCheckInStore();
    const { setVitals } = useVitalsStore();
    const router = useRouter();

    const [permission, requestPermission] = useCameraPermissions();
    const [audioPermission, requestAudioPermission] = Audio.usePermissions();
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [capturedData, setCapturedData] = useState<{
        faceImageUri?: string;
        audioUri?: string;
        skinImageUri?: string;
        accelData?: AccelerometerData[];
    }>({});
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        if (step === 'face' && !permission?.granted) {
            requestPermission();
        }
        if (step === 'cough' && !audioPermission?.granted) {
            requestAudioPermission();
        }
    }, [step, permission, audioPermission]);

    useEffect(() => {
        let interval: any;
        if (isCapturing && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isCapturing) {
            handleStepComplete();
        }
        return () => clearInterval(interval);
    }, [isCapturing, timeLeft]);

    const startCapture = async () => {
        setIsCapturing(true);

        if (step === 'face') {
            // Simulate PPG capture for 10s
            setTimeLeft(10);
        } else if (step === 'cough') {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(recording);
                setTimeLeft(10);
            } catch (err) {
                console.error('Failed to start recording', err);
                setIsCapturing(false);
            }
        } else if (step === 'skin') {
            // Just a photo capture
            if (cameraRef.current) {
                const photo = await cameraRef.current.takePictureAsync();
                console.log('Photo taken:', photo?.uri);
                handleStepComplete();
            }
        } else if (step === 'tremor') {
            startAccelerometer();
            setTimeLeft(10);
        }
    };

    const handleStepComplete = async () => {
        setIsCapturing(false);

        if (step === 'face') {
            // Capture face photo for PPG
            if (cameraRef.current) {
                const photo = await cameraRef.current.takePictureAsync();
                setCapturedData(prev => ({ ...prev, faceImageUri: photo?.uri }));
                console.log('Face photo taken:', photo?.uri);
            }
            setStep('cough');
        } else if (step === 'cough') {
            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                setCapturedData(prev => ({ ...prev, audioUri: uri || undefined }));
                console.log('Recording stopped and stored at', uri);
                setRecording(null);
            }
            setStep('skin');
        } else if (step === 'skin') {
            setStep('tremor');
        } else if (step === 'tremor') {
            const data = stopAccelerometer();
            setCapturedData(prev => ({ ...prev, accelData: data }));
            console.log('Accelerometer data points:', data.length);
            setStep('processing');
            
            // Run orchestrator with all captured data
            try {
                const result = await runWellnessCheck(
                    capturedData.faceImageUri || '',
                    capturedData.audioUri || '',
                    data
                );
                
                setVitals({
                    heartRate: result.vitals.heartRate,
                    hrv: result.vitals.hrv,
                    breathingRate: result.vitals.breathingRate,
                    tremorIndex: result.vitals.tremorIndex,
                    coughType: result.vitals.coughType,
                    triageSummary: result.triage.summary,
                    triageSeverity: result.triage.severity,
                    triageRecommendations: result.triage.recommendations
                });
                
                setStep('results');
                router.push('/results');
            } catch (error) {
                console.error('Wellness check failed:', error);
                // Still show results with partial data
                setStep('results');
                router.push('/results');
            }
        }
    };

    if (!permission || !audioPermission) {
        return <View />;
    }

    if (!permission.granted || !audioPermission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>We need camera and microphone permissions to proceed.</Text>
                <Button onPress={requestPermission} title="Grant Camera Permission" />
                <Button onPress={requestAudioPermission} title="Grant Audio Permission" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Step: {step.toUpperCase()}</Text>
            </View>

            <View style={styles.content}>
                {step === 'face' && (
                    <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                        <View style={styles.overlay}>
                            <Text style={styles.instruction}>Center your face in the circle</Text>
                        </View>
                    </CameraView>
                )}

                {step === 'cough' && (
                    <View style={styles.placeholder}>
                        <Text style={styles.instruction}>Cough 3 times clearly</Text>
                        <Text style={styles.timer}>{timeLeft}s</Text>
                    </View>
                )}

                {step === 'skin' && (
                    <CameraView style={styles.camera} facing="back" ref={cameraRef}>
                        <View style={styles.overlay}>
                            <Text style={styles.instruction}>Take a photo of any skin concern (optional)</Text>
                        </View>
                    </CameraView>
                )}

                {step === 'tremor' && (
                    <View style={styles.placeholder}>
                        <Text style={styles.instruction}>Hold the phone steady in your hand</Text>
                        <Text style={styles.timer}>{timeLeft}s</Text>
                    </View>
                )}

                {step === 'processing' && (
                    <View style={styles.placeholder}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text style={styles.instruction}>Analyzing your wellness data...</Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                {!isCapturing && step !== 'processing' && (
                    <Button title={step === 'skin' ? "Take Photo" : "Start Capture"} onPress={startCapture} />
                )}
                {isCapturing && (
                    <Text style={styles.capturingText}>Capturing... {timeLeft > 0 ? `${timeLeft}s` : ''}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#212529',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    camera: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    instruction: {
        color: '#ffffff',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.9)',
        padding: 16,
        borderRadius: 12,
        fontWeight: '600',
    },
    timer: {
        fontSize: 64,
        fontWeight: '700',
        color: '#667eea',
        letterSpacing: 2,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    text: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        color: '#495057',
    },
    capturingText: {
        fontSize: 16,
        color: '#667eea',
        fontWeight: '600',
    },
});
