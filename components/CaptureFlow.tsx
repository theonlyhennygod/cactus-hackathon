import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCheckInStore, useVitalsStore } from '../store';
import { startAccelerometer, stopAccelerometer } from '../utils/sensorHelpers';

export default function CaptureFlow() {
    const { step, setStep, isCapturing, setIsCapturing, reset } = useCheckInStore();
    const { setVitals } = useVitalsStore();
    const router = useRouter();

    const [permission, requestPermission] = useCameraPermissions();
    const [audioPermission, requestAudioPermission] = Audio.usePermissions();
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
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
            setStep('cough');
        } else if (step === 'cough') {
            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                console.log('Recording stopped and stored at', uri);
                setRecording(null);
            }
            setStep('skin');
        } else if (step === 'skin') {
            setStep('tremor');
        } else if (step === 'tremor') {
            const data = stopAccelerometer();
            console.log('Accelerometer data points:', data.length);
            setVitals({ tremorIndex: Math.random() * 10 }); // Dummy processing
            setStep('processing');
            // Simulate processing delay then go to results
            setTimeout(() => {
                setStep('results');
                router.push('/results');
            }, 2000);
        }
    };

    if (!permission || !audioPermission) {
        return <View />;
    }

    if (!permission.granted || !audioPermission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.text}>We need camera and microphone permissions to proceed.</Text>
                <Button onPress={requestPermission} title="Grant Camera Permission" />
                <Button onPress={requestAudioPermission} title="Grant Audio Permission" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
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
                        <Text style={styles.instruction}>Analyzing your health data...</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        width: '100%',
        height: '100%',
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
        backgroundColor: '#eee',
    },
    instruction: {
        color: '#fff',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 10,
    },
    timer: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    text: {
        textAlign: 'center',
        marginBottom: 20,
    },
    capturingText: {
        fontSize: 18,
        color: 'red',
    },
});
