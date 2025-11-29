
import { modelManager } from '../utils/modelManager';

export interface TriageResult {
    summary: string;
    severity: 'green' | 'yellow' | 'red';
    recommendations: string[];
    inferenceType: 'local' | 'fallback';
}

/**
 * Generate wellness triage using local Cactus LLM (Qwen)
 * LOCAL-ONLY STRATEGY: All analysis happens on-device for privacy
 * No cloud fallback - data never leaves the device
 */
export const generateTriage = async (
    vitals: any,
    visionResult: any,
    audioResult: any
): Promise<TriageResult> => {
    console.log('TriageAgent: Generating recommendations (on-device)');
    console.log('🔒 Privacy mode: All processing happens locally');
    console.log('Input data:', { vitals, visionResult, audioResult });

    // Extract values with defaults
    const moodScore = vitals.moodScore ?? 50;
    const overallMood = vitals.overallMood ?? 'neutral';
    const facialEmotion = vitals.facialEmotion ?? 'neutral';
    const voiceEmotion = vitals.voiceEmotion ?? 'neutral';
    const tremor = vitals.tremorIndex ?? 0;
    const breathing = audioResult?.breathingRate ?? vitals.breathingRate ?? 16;
    const coughType = audioResult?.coughType ?? 'none';
    const skinCondition = visionResult?.skinCondition ?? vitals.skinCondition ?? 'Normal';

    // === LOCAL-ONLY: Try Cactus LLM (Qwen) first ===
    try {
        console.log('🤖 Loading local Qwen model for triage (on-device)...');
        const lm = await modelManager.loadModel('triage');
        
        if (lm) {
            console.log('✅ Qwen model loaded - running on-device inference!');
            
            // Qwen3 thinks first then outputs - need enough tokens for both
            const prompt = `Input: mood=${moodScore}, tremor=${tremor.toFixed(1)}, breathing=${breathing}
Output JSON: {"summary":"brief health note","severity":"green","recommendations":["tip1","tip2"]}`;

            try {
                const response = await lm.complete({
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    options: {
                        maxTokens: 10000,   // Need enough for thinking + output
                        temperature: 0.0,
                    },
                });
                
                const responseText = response.response || '';
                console.log('🔮 Qwen raw response length:', responseText.length);
                
                // Extract content AFTER </think> tag if present
                let cleanedResponse = responseText;
                const thinkEndIndex = responseText.indexOf('</think>');
                if (thinkEndIndex !== -1) {
                    cleanedResponse = responseText.substring(thinkEndIndex + 8).trim();
                    console.log('🔮 Extracted post-think content:', cleanedResponse.substring(0, 200));
                } else {
                    // No closing think tag - remove opening and everything after
                    cleanedResponse = responseText
                        .replace(/<think>[\s\S]*/gi, '')
                        .trim();
                }
                
                // Clean up markdown code blocks
                cleanedResponse = cleanedResponse
                    .replace(/```json/gi, '')
                    .replace(/```/g, '')
                    .trim();
                
                // Parse JSON from response
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.summary || parsed.severity || parsed.recommendations) {
                            console.log('✅ Qwen JSON parsed successfully (on-device)');
                            return {
                                summary: parsed.summary || 'Wellness check complete.',
                                severity: ['green', 'yellow', 'red'].includes(parsed.severity) ? parsed.severity : 'green',
                                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3) : ['Stay hydrated', 'Get rest'],
                                inferenceType: 'local',
                            };
                        }
                    } catch (parseErr) {
                        console.log('⚠️ JSON parse failed:', parseErr);
                    }
                }
                console.log('⚠️ No valid JSON found in Qwen response, cleaned:', cleanedResponse.substring(0, 100));
            } catch (inferenceError) {
                console.warn('Qwen inference failed:', inferenceError);
            }
        } else {
            console.log('⚠️ Qwen model not available, using intelligent fallback');
        }
    } catch (error) {
        console.warn('Triage model error:', error);
    }

    // === FALLBACK: Rule-based analysis (still local, no cloud) ===
    console.log('📱 Using intelligent rule-based triage (on-device)');
    return generateRuleBasedTriage(moodScore, overallMood, facialEmotion, voiceEmotion, tremor, breathing, skinCondition);
};

/**
 * Quick recommendations based on key metrics
 */
function generateQuickRecommendations(moodScore: number, overallMood: string, tremor: number): string[] {
    const recs: string[] = [];
    
    // Mood-based recommendations
    if (overallMood === 'anxious' || overallMood === 'stressed') {
        recs.push('Try deep breathing exercises for 5 minutes');
        recs.push('Take a short walk to clear your mind');
    } else if (overallMood === 'sad' || moodScore < 40) {
        recs.push('Reach out to someone you trust');
        recs.push('Do something that usually makes you smile');
    } else if (overallMood === 'happy' || overallMood === 'calm') {
        recs.push('Keep up your positive routine');
        recs.push('Share your good energy with others');
    } else {
        recs.push('Take time for activities you enjoy');
    }
    
    // Physical recommendations
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
