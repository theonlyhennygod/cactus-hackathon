import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, View } from 'react-native';

export default function BreathingCoach() {
    const [isActive, setIsActive] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [instruction, setInstruction] = useState('Press Start to begin');

    const breatheIn = () => {
        setInstruction('Breathe In...');
        Speech.speak('Breathe In');
        Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 4000,
            useNativeDriver: true,
        }).start(() => {
            hold();
        });
    };

    const hold = () => {
        setInstruction('Hold...');
        Speech.speak('Hold');
        setTimeout(() => {
            breatheOut();
        }, 4000);
    };

    const breatheOut = () => {
        setInstruction('Breathe Out...');
        Speech.speak('Breathe Out');
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
        }).start(() => {
            if (isActive) {
                breatheIn();
            }
        });
    };

    const toggleSession = () => {
        if (isActive) {
            setIsActive(false);
            Speech.stop();
            setInstruction('Session Paused');
            scaleAnim.stopAnimation();
        } else {
            setIsActive(true);
            breatheIn();
        }
    };

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Breathing Coach</Text>

            <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.instruction}>{instruction}</Text>
            </Animated.View>

            <Button title={isActive ? "Stop" : "Start"} onPress={toggleSession} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginVertical: 20,
        backgroundColor: '#f0f8ff',
        borderRadius: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#87ceeb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    instruction: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
