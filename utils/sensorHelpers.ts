import { Subscription } from 'expo-modules-core';
import { Accelerometer } from 'expo-sensors';

export interface AccelerometerData {
    x: number;
    y: number;
    z: number;
    timestamp: number;
}

let subscription: Subscription | null = null;
let dataBuffer: AccelerometerData[] = [];

export const startAccelerometer = (updateInterval = 20) => {
    Accelerometer.setUpdateInterval(updateInterval);
    dataBuffer = [];

    subscription = Accelerometer.addListener((data) => {
        dataBuffer.push({
            ...data,
            timestamp: Date.now(),
        });
    });
};

export const stopAccelerometer = (): AccelerometerData[] => {
    if (subscription) {
        subscription.remove();
        subscription = null;
    }
    const collectedData = [...dataBuffer];
    dataBuffer = [];
    return collectedData;
};

export const isAccelerometerAvailable = async (): Promise<boolean> => {
    return await Accelerometer.isAvailableAsync();
};
