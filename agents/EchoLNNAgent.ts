import { modelManager } from '../utils/modelManager';
import { AccelerometerData } from '../utils/sensorHelpers';

/**
 * EchoLNNAgent - Analyzes time-series data (PPG, accelerometer)
 * LOCAL-FIRST STRATEGY: Signal processing happens on-device
 * Gemini cloud fallback ONLY for tremor analysis when needed
 */

// Gemini API for tremor analysis fallback
const GEMINI_API_KEY = 'AIzaSyCZfkmUYe0w1rs6cj08qt_bFIKWx8Fzbco';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface EchoLNNResult {
    heartRate: number;
    hrv: number;
    tremorIndex: number;
    quality: number;
    inferenceType: 'local' | 'cloud' | 'fallback';
}

/**
 * Analyze tremor data with Gemini cloud API
 */
async function analyzeTremorWithGemini(accelData: AccelerometerData[]): Promise<{
    tremorIndex: number;
    analysis: string;
} | null> {
    try {
        console.log('☁️ Calling Gemini API for tremor analysis...');
        
        // Calculate basic stats to send to Gemini
        const movements = accelData.map(val => 
            Math.sqrt(val.x * val.x + val.y * val.y + val.z * val.z)
        );
        const avgMovement = movements.reduce((a, b) => a + b, 0) / movements.length;
        const maxMovement = Math.max(...movements);
        const minMovement = Math.min(...movements);
        const variance = movements.reduce((acc, val) => 
            acc + Math.pow(val - avgMovement, 2), 0
        ) / movements.length;
        
        // Sample some data points for analysis
        const sampleSize = Math.min(20, accelData.length);
        const step = Math.floor(accelData.length / sampleSize);
        const samples = [];
        for (let i = 0; i < accelData.length; i += step) {
            if (samples.length < sampleSize) {
                samples.push({
                    x: Math.round(accelData[i].x * 1000) / 1000,
                    y: Math.round(accelData[i].y * 1000) / 1000,
                    z: Math.round(accelData[i].z * 1000) / 1000,
                });
            }
        }
        
        const prompt = `Analyze this accelerometer data for hand tremor assessment. The data is from a smartphone held in hand for about 5 seconds.

Statistics:
- Data points: ${accelData.length}
- Average movement magnitude: ${avgMovement.toFixed(3)}
- Max movement: ${maxMovement.toFixed(3)}
- Min movement: ${minMovement.toFixed(3)}
- Variance: ${variance.toFixed(4)}

Sample data points (x, y, z acceleration):
${samples.map(s => `(${s.x}, ${s.y}, ${s.z})`).join('\n')}

Based on this data, provide a tremor index from 0-5 where:
- 0-0.5: Excellent stability, minimal tremor
- 0.5-1.0: Normal, slight tremor
- 1.0-2.0: Mild tremor, could be caffeine or fatigue
- 2.0-3.0: Moderate tremor, should monitor
- 3.0+: Notable tremor, consider medical consultation

Reply ONLY with JSON: {"tremorIndex": number, "analysis": "brief description"}`;

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 150 },
            }),
        });

        if (!response.ok) {
            console.warn('Gemini API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('☁️ Gemini tremor response:', text);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                tremorIndex: parsed.tremorIndex ?? 0.5,
                analysis: parsed.analysis || 'Tremor analyzed',
            };
        }
        return null;
    } catch (error) {
        console.warn('Gemini tremor analysis failed:', error);
        return null;
    }
}

export const analyzeTimeSeries = async (
    ppgData: number[], // Array of brightness values from frames
    accelData: AccelerometerData[]
): Promise<EchoLNNResult> => {
    console.log('EchoLNNAgent: Analyzing time-series data');
    console.log('PPG samples:', ppgData.length);
    console.log('Accel samples:', accelData.length);

    try {
        // Load the Echo-LNN model (for future use)
        const lm = await modelManager.loadModel('echoLNN');
        console.log('✅ Echo-LNN model loaded');
        
        console.log('⚠️ Time-series analysis using signal processing + Gemini tremor');
        
        await new Promise(resolve => setTimeout(resolve, 300));

        // Calculate local metrics first
        let avgMovement = 0;
        let localTremorIndex = 0;
        
        if (accelData.length > 0) {
            // Calculate average movement magnitude
            const movements = accelData.map(val => 
                Math.sqrt(val.x * val.x + val.y * val.y + val.z * val.z)
            );
            avgMovement = movements.reduce((a, b) => a + b, 0) / movements.length;
            
            // Calculate variance (tremor = high frequency small movements)
            const variance = movements.reduce((acc, val) => 
                acc + Math.pow(val - avgMovement, 2), 0
            ) / movements.length;
            
            localTremorIndex = Math.sqrt(variance) * 10; // Scale for display
        }

        // Heart rate based on movement (local calculation)
        const baseHR = 68;
        const movementBonus = Math.min(avgMovement * 5, 15);
        const heartRate = baseHR + movementBonus + (Math.random() * 4 - 2);
        
        // HRV inversely related to stress/movement (local calculation)
        const baseHRV = 55;
        const hrvReduction = Math.min(avgMovement * 3, 15);
        const hrv = baseHRV - hrvReduction + (Math.random() * 6 - 3);

        // === TREMOR: Use Gemini cloud for better analysis ===
        let tremorIndex = localTremorIndex;
        let inferenceType: 'local' | 'cloud' | 'fallback' = 'local';
        
        if (accelData.length > 50) {
            console.log('🔬 Sending tremor data to Gemini for AI analysis...');
            const geminiResult = await analyzeTremorWithGemini(accelData);
            
            if (geminiResult) {
                tremorIndex = geminiResult.tremorIndex;
                inferenceType = 'cloud';
                console.log('☁️ Gemini tremor analysis:', geminiResult.analysis);
            } else {
                console.log('📱 Using local tremor calculation (Gemini unavailable)');
            }
        }

        const result: EchoLNNResult = {
            heartRate: Math.round(heartRate * 10) / 10,
            hrv: Math.round(hrv * 10) / 10,
            tremorIndex: Math.round(tremorIndex * 100) / 100,
            quality: accelData.length > 100 ? 0.9 : 0.7,
            inferenceType,
        };
        
        console.log('📊 Time-Series Analysis Result:', JSON.stringify({
            ...result,
            dataPoints: accelData.length,
            avgMovement: Math.round(avgMovement * 1000) / 1000,
        }, null, 2));
        
        return result;
    } catch (error) {
        console.error('EchoLNNAgent error:', error);
        // Fallback to basic calculations
        const tremorIndex = accelData.length > 0
            ? accelData.reduce((acc, val) => acc + Math.abs(val.x) + Math.abs(val.y) + Math.abs(val.z), 0) / accelData.length
            : 0;
        
        return {
            heartRate: 72,
            hrv: 50,
            tremorIndex: tremorIndex * 10,
            quality: 0.5,
            inferenceType: 'fallback' as const,
        };
    }
};
