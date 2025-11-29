import { modelManager } from '../utils/modelManager';
import { generateTriageWithGemini } from '../utils/geminiClient';

export interface TriageResult {
    summary: string;
    severity: 'green' | 'yellow' | 'red';
    recommendations: string[];
    inferenceType: 'local' | 'cloud' | 'fallback';
}

/**
 * Generate wellness triage using:
 * 1. Local Qwen3-0.6B model (primary - on-device)
 * 2. Gemini cloud fallback (hybrid strategy)
 * 3. Rule-based fallback (offline guarantee)
 */
export const generateTriage = async (
    vitals: any,
    visionResult: any,
    audioResult: any
): Promise<TriageResult> => {
    console.log('TriageAgent: Generating recommendations based on', { vitals, visionResult, audioResult });

    // Extract values with defaults
    const hr = vitals.heartRate ?? 72;
    const hrv = vitals.hrv ?? 50;
    const tremor = vitals.tremorIndex ?? 0;
    const breathing = audioResult?.breathingRate ?? 16;
    const coughType = audioResult?.coughType ?? 'none';
    const skinCondition = visionResult?.skinCondition ?? 'Normal';

    try {
        // === STRATEGY 1: Local On-Device Inference (Primary) ===
        console.log('🤖 Attempting to load local Qwen3 model...');
        const lm = await modelManager.loadModel('triage');
        
        if (lm) {
            console.log('✅ Local Qwen3 triage model loaded - running on-device inference!');
            
            const prompt = 'You are a wellness coach. Analyze: HR=' + hr + 'bpm, HRV=' + hrv + 'ms, Breathing=' + breathing + 'rpm, Tremor=' + tremor + ', Cough=' + coughType + '. Respond JSON only: {"summary":"...","severity":"green|yellow|red","recommendations":["...","...","..."]}';

            try {
                const response = await lm.complete({
                    messages: [{ role: 'user', content: prompt }],
                    options: {
                        maxTokens: 256,
                        temperature: 0.7,
                        stopSequences: ['</s>', '<|im_end|>', '<|eot_id|>'],
                    },
                });
                
                console.log('🔮 Local LLM response:', response);
                
                // Parse the response
                const text = response.response || '';
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        summary: parsed.summary || 'Your vitals are within normal range.',
                        severity: parsed.severity || 'green',
                        recommendations: parsed.recommendations || ['Stay hydrated', 'Rest well', 'Monitor regularly'],
                        inferenceType: 'local',
                    };
                }
            } catch (llmError) {
                console.warn('Local LLM inference failed:', llmError);
            }
        }

        // === STRATEGY 2: Gemini Cloud Fallback (Hybrid) ===
        console.log('⚠️ Local model not available, trying Gemini cloud fallback...');
        try {
            const geminiResult = await generateTriageWithGemini(vitals, visionResult, audioResult);
            if (geminiResult) {
                console.log('☁️ Using Gemini cloud inference');
                return { ...geminiResult, inferenceType: 'cloud' };
            }
        } catch (geminiError) {
            console.log('⚠️ Gemini fallback failed:', geminiError);
        }

        // === STRATEGY 3: Rule-Based Fallback (Offline Guarantee) ===
        console.log('📱 Using intelligent rule-based fallback');
        return generateRuleBasedTriage(hr, hrv, tremor, breathing, coughType);
        
    } catch (error) {
        console.error('TriageAgent error:', error);
        return {
            summary: 'Unable to complete analysis. Please try again.',
            severity: 'yellow',
            recommendations: ['Consult a healthcare professional if concerned', 'Try again later'],
            inferenceType: 'fallback',
        };
    }
};

/**
 * Rule-based triage when AI models unavailable
 */
function generateRuleBasedTriage(
    hr: number,
    hrv: number,
    tremor: number,
    breathing: number,
    coughType: string
): TriageResult {
    let severity: 'green' | 'yellow' | 'red' = 'green';
    const concerns: string[] = [];
    const positives: string[] = [];
    
    // Heart rate analysis
    if (hr > 120) {
        severity = 'red';
        concerns.push('significantly elevated heart rate');
    } else if (hr > 100 || hr < 50) {
        severity = 'yellow';
        concerns.push('heart rate outside normal range');
    } else if (hr >= 60 && hr <= 80) {
        positives.push('optimal resting heart rate');
    }
    
    // HRV analysis
    if (hrv < 15) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('very low heart rate variability');
    } else if (hrv < 30) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('low heart rate variability');
    } else if (hrv >= 50) {
        positives.push('excellent HRV indicating good recovery');
    }
    
    // Tremor analysis
    if (tremor > 3) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('notable hand tremor detected');
    } else if (tremor < 0.5) {
        positives.push('excellent motor stability');
    }
    
    // Breathing analysis
    if (breathing < 10 || breathing > 22) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('breathing rate outside normal range');
    }
    
    // Cough analysis
    if (coughType === 'wet') {
        if (severity === 'green') severity = 'yellow';
        concerns.push('productive cough detected');
    }
    
    // Generate summary
    let summary: string;
    if (severity === 'red') {
        summary = 'Some vital signs need attention. ' + concerns.join(', ') + '. Consider consulting a healthcare provider.';
    } else if (concerns.length > 0) {
        summary = 'Overall wellness is good with some areas to monitor: ' + concerns.join(', ') + '.';
    } else {
        summary = 'Your vitals look healthy! Heart rate ' + Math.round(hr) + ' bpm, HRV ' + Math.round(hrv) + ' ms. ' + (positives.length > 0 ? positives.join(', ') : 'All metrics normal') + '.';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (hr > 90) {
        recommendations.push('Practice deep breathing to help lower heart rate');
    } else {
        recommendations.push('Maintain your current activity level');
    }
    
    if (hrv < 40) {
        recommendations.push('Try meditation or yoga to improve HRV');
    } else {
        recommendations.push('Your stress levels appear well-managed');
    }
    
    if (tremor > 1) {
        recommendations.push('Reduce caffeine and ensure quality sleep');
    } else {
        recommendations.push('Your motor control is excellent');
    }
    
    recommendations.push('Stay hydrated with 8 glasses of water daily');
    
    return { summary, severity, recommendations: recommendations.slice(0, 4), inferenceType: 'fallback' };
}
