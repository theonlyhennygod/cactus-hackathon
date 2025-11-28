import { analyzeAudio } from './AudioAgent';
import { analyzeTimeSeries } from './EchoLNNAgent';
import { saveSession } from './MemoryAgent';
import { generateTriage } from './TriageAgent';
import { analyzeImage } from './VisionAgent';

export const runWellnessCheck = async (
    imageUri: string,
    audioUri: string,
    accelData: any[]
) => {
    console.log('Orchestrator: Starting wellness check...');

    // 1. Perception
    const [visionResult, audioResult, echoResult] = await Promise.all([
        analyzeImage(imageUri),
        analyzeAudio(audioUri),
        analyzeTimeSeries([], accelData), // Passing empty PPG for now as we don't have frame extraction yet
    ]);

    console.log('Orchestrator: Perception complete');

    // 2. Triage
    const triageResult = await generateTriage(echoResult, visionResult, audioResult);

    // 3. Memory
    const session = {
        timestamp: Date.now(),
        vitals: { ...echoResult, ...audioResult, ...visionResult },
        triage: triageResult,
    };

    await saveSession(session);

    return {
        vitals: session.vitals,
        triage: triageResult,
    };
};
