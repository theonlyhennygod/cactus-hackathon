import { modelManager } from '../utils/modelManager';

export interface TriageResult {
    summary: string;
    severity: 'green' | 'yellow' | 'red';
    recommendations: string[];
    inferenceType: 'local' | 'cloud' | 'fallback';
}

/**
 * Generate wellness triage using:
 * 1. Local Qwen3-0.6B model (PRIMARY - on-device, always try first)
 * 2. Rule-based fallback (when local model has issues)
 * 
 * LOCAL-ONLY STRATEGY: No cloud API for recommendations - privacy first.
 */
export const generateTriage = async (
    vitals: any,
    visionResult: any,
    audioResult: any
): Promise<TriageResult> => {
    console.log('TriageAgent: Generating recommendations based on', { vitals, visionResult, audioResult });

    // Extract values with defaults - using mood-based data instead of heart rate
    const moodScore = vitals.moodScore ?? 50;
    const overallMood = vitals.overallMood ?? 'neutral';
    const facialEmotion = vitals.facialEmotion ?? 'neutral';
    const voiceEmotion = vitals.voiceEmotion ?? 'neutral';
    const tremor = vitals.tremorIndex ?? 0;
    const breathing = audioResult?.breathingRate ?? vitals.breathingRate ?? 16;
    const coughType = audioResult?.coughType ?? 'none';
    const skinCondition = visionResult?.skinCondition ?? vitals.skinCondition ?? 'Normal';

    // === STRATEGY 1: Local On-Device Inference (PRIMARY) ===
    try {
        console.log('🤖 Loading local Qwen3 model (LOCAL-ONLY strategy)...');
        const lm = await modelManager.loadModel('triage');
        
        if (lm) {
            console.log('✅ Local Qwen3 triage model loaded - running on-device inference!');
            
            // Ultra-simple prompt with pre-filled JSON start to force completion
            const severityHint = moodScore < 30 ? 'yellow' : moodScore < 50 ? 'yellow' : 'green';
            const prompt = `Complete this JSON for mood=${overallMood} score=${moodScore}:
{"summary":"Your wellness is `;

            try {
                const response = await lm.complete({
                    messages: [{ role: 'user', content: prompt }],
                    options: {
                        maxTokens: 150,
                        temperature: 0.3,
                        stopSequences: ['</s>', '<|im_end|>', '<|eot_id|>', '\n\n', '```'],
                    },
                });
                
                console.log('🔮 Local LLM raw response:', response.response?.substring(0, 200));
                
                // Reconstruct the JSON from our prefix + model completion
                let text = '{"summary":"Your wellness is ' + (response.response || '');
                
                // Clean up any thinking blocks or markdown
                text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
                text = text.replace(/```json/gi, '').replace(/```/g, '');
                
                // Try to extract and complete JSON
                const jsonMatch = text.match(/\{[^{}]*"summary"[^{}]*"severity"[^{}]*"recommendations"[^{}]*\}/);
                
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.summary && parsed.severity) {
                            console.log('✅ Successfully parsed local LLM JSON response');
                            return {
                                summary: parsed.summary,
                                severity: ['green', 'yellow', 'red'].includes(parsed.severity) ? parsed.severity : 'green',
                                recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
                                    ? parsed.recommendations.slice(0, 3)
                                    : generateQuickRecommendations(moodScore, tremor),
                                inferenceType: 'local',
                            };
                        }
                    } catch (parseErr) {
                        console.log('⚠️ JSON parse error, trying simple extraction');
                    }
                }
                
                // Try simpler extraction - just get any coherent response
                const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);
                const severityMatch = text.match(/"severity"\s*:\s*"(green|yellow|red)"/);
                
                if (summaryMatch) {
                    console.log('✅ Extracted partial response from local LLM');
                    return {
                        summary: summaryMatch[1],
                        severity: severityMatch ? severityMatch[1] as 'green' | 'yellow' | 'red' : severityHint as 'green' | 'yellow',
                        recommendations: generateQuickRecommendations(moodScore, tremor),
                        inferenceType: 'local',
                    };
                }
                
                console.log('⚠️ Could not extract valid data from LLM response');
            } catch (llmError) {
                console.warn('Local LLM inference failed:', llmError);
            }
        } else {
            console.log('⚠️ Local model not available');
        }
    } catch (error) {
        console.error('TriageAgent model loading error:', error);
    }

    // === STRATEGY 2: Rule-Based Fallback (LOCAL - no cloud) ===
    console.log('📱 Using intelligent rule-based analysis (local processing, no cloud)');
    return generateRuleBasedTriage(moodScore, overallMood, facialEmotion, voiceEmotion, tremor, breathing, skinCondition);
};

/**
 * Quick recommendations based on key metrics
 */
function generateQuickRecommendations(moodScore: number, tremor: number): string[] {
    const recs: string[] = [];
    if (moodScore < 50) {
        recs.push('Take a moment for self-care today');
        recs.push('Connect with someone you trust');
    } else {
        recs.push('Keep up your positive routine');
    }
    if (tremor > 1) {
        recs.push('Consider reducing caffeine intake');
    }
    recs.push('Stay hydrated throughout the day');
    return recs.slice(0, 3);
}

/**
 * Rule-based triage when AI models unavailable
 */
function generateRuleBasedTriage(
    moodScore: number,
    overallMood: string,
    facialEmotion: string,
    voiceEmotion: string,
    tremor: number,
    breathing: number,
    skinCondition: string
): TriageResult {
    let severity: 'green' | 'yellow' | 'red' = 'green';
    const concerns: string[] = [];
    const positives: string[] = [];
    
    // Mood analysis
    if (moodScore < 20) {
        severity = 'red';
        concerns.push('very low mood score indicating significant emotional distress');
    } else if (moodScore < 30) {
        severity = 'yellow';
        concerns.push('low mood score indicating emotional distress');
    } else if (moodScore < 50) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('mood appears somewhat low');
    } else if (moodScore >= 70) {
        positives.push('positive emotional state');
    }
    
    // Facial emotion analysis
    const negativeEmotions = ['sad', 'angry', 'fearful', 'disgusted', 'anxious', 'stressed', 'depressed'];
    if (negativeEmotions.some(e => facialEmotion.toLowerCase().includes(e))) {
        if (severity === 'green') severity = 'yellow';
        concerns.push(`facial expression indicates ${facialEmotion.toLowerCase()}`);
    } else if (facialEmotion.toLowerCase().includes('happy') || facialEmotion.toLowerCase().includes('content')) {
        positives.push('positive facial expression');
    }
    
    // Voice emotion analysis
    if (negativeEmotions.some(e => voiceEmotion.toLowerCase().includes(e))) {
        if (severity === 'green') severity = 'yellow';
        concerns.push(`voice sentiment indicates ${voiceEmotion.toLowerCase()}`);
    } else if (voiceEmotion.toLowerCase().includes('positive') || voiceEmotion.toLowerCase().includes('calm')) {
        positives.push('calm voice tone');
    }
    
    // Tremor analysis
    if (tremor > 3) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('notable hand tremor detected');
    } else if (tremor > 0 && tremor < 0.5) {
        positives.push('excellent motor stability');
    }
    
    // Breathing analysis
    if (breathing < 10 || breathing > 22) {
        if (severity === 'green') severity = 'yellow';
        concerns.push('breathing rate outside normal range');
    } else if (breathing >= 12 && breathing <= 18) {
        positives.push('optimal breathing rate');
    }
    
    // Skin analysis
    if (skinCondition.toLowerCase() !== 'normal' && skinCondition.toLowerCase() !== 'healthy') {
        if (severity === 'green') severity = 'yellow';
        concerns.push(`skin condition noted: ${skinCondition}`);
    }
    
    // Generate summary
    let summary: string;
    if (severity === 'red') {
        summary = 'Some areas need attention. ' + concerns.join(', ') + '. Consider talking to someone or consulting a healthcare provider.';
    } else if (concerns.length > 0) {
        summary = 'Overall wellness is good with some areas to monitor: ' + concerns.join(', ') + '.';
    } else {
        summary = 'Your wellness check looks great! ' + (positives.length > 0 ? positives.join(', ') : 'All metrics normal') + '. Mood score: ' + Math.round(moodScore) + '/100.';
    }
    
    // Generate recommendations based on mood
    const recommendations: string[] = [];
    
    if (moodScore < 50) {
        recommendations.push('Practice self-care and reach out to loved ones');
        recommendations.push('Try mindfulness or meditation for 10 minutes');
    } else {
        recommendations.push('Keep up the positive mindset');
    }
    
    if (tremor > 1) {
        recommendations.push('Reduce caffeine and ensure quality sleep');
    } else {
        recommendations.push('Your motor control is excellent');
    }
    
    if (breathing < 12 || breathing > 20) {
        recommendations.push('Practice deep breathing exercises');
    }
    
    recommendations.push('Stay hydrated with 8 glasses of water daily');
    
    return { summary, severity, recommendations: recommendations.slice(0, 4), inferenceType: 'fallback' };
}
