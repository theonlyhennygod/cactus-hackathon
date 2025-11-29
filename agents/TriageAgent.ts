
export interface TriageResult {
    summary: string;
    severity: 'green' | 'yellow' | 'red';
    recommendations: string[];
    inferenceType: 'local' | 'cloud' | 'fallback';
}

/**
 * Generate wellness triage using local rule-based analysis
 * LOCAL-ONLY STRATEGY: No cloud API for recommendations - privacy first.
 * All analysis happens on-device for consistent, reliable results.
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
    // Note: Qwen3 has a thinking mode that's hard to disable, so we use
    // rule-based analysis which is also fully local and provides consistent results
    console.log('🤖 Using local rule-based analysis (on-device, no cloud)...');
    
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
    
    return { summary, severity, recommendations: recommendations.slice(0, 4), inferenceType: 'local' };
}
