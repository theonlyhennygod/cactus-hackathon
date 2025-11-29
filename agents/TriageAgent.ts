import { modelManager } from '../utils/modelManager';

export interface TriageResult {
    summary: string;
    severity: 'green' | 'yellow' | 'red';
    recommendations: string[];
}

export const generateTriage = async (
    vitals: any,
    visionResult: any,
    audioResult: any
): Promise<TriageResult> => {
    console.log('TriageAgent: Generating recommendations based on', { vitals, visionResult, audioResult });

    try {
        // Load the triage LLM (Qwen2.5)
        const lm = await modelManager.loadModel('triage', {
            contextSize: 2048,
        });
        
        if (!lm) {
            console.log('⚠️ Triage model not available, using intelligent fallback');
            
            // Generate personalized recommendations based on actual data
            const hr = vitals.heartRate ?? 72;
            const hrv = vitals.hrv ?? 50;
            const tremor = vitals.tremorIndex ?? 0;
            const breathing = audioResult?.breathingRate ?? 16;
            const coughType = audioResult?.coughType ?? 'none';
            const skinCondition = visionResult?.skinCondition ?? 'Unknown';
            
            // Determine severity based on vitals with comprehensive edge cases
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
            
            // HRV analysis (only escalate, never downgrade)
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
            } else if (tremor > 1.5) {
                concerns.push('mild tremor detected');
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
            } else if (coughType === 'dry') {
                concerns.push('dry cough noted');
            }
            
            // Generate personalized summary
            let summary: string;
            if (severity === 'red') {
                summary = `Some vital signs need immediate attention. ${concerns.join(', ')}. Please consider consulting a healthcare provider soon.`;
            } else if (concerns.length > 0) {
                summary = `Overall wellness is good with some areas to monitor: ${concerns.join(', ')}. ${positives.length > 0 ? `Positives: ${positives.join(', ')}.` : ''}`;
            } else {
                summary = `Your vitals look healthy! Heart rate ${Math.round(hr)} bpm, HRV ${Math.round(hrv)} ms, and ${positives.length > 0 ? positives.join(', ') : 'all metrics within normal range'}.`;
            }
            
            // Generate personalized recommendations based on all data
            const recommendations: string[] = [];
            
            // Heart rate recommendations
            if (hr > 90) {
                recommendations.push('Practice relaxation techniques like deep breathing to help lower heart rate');
            } else if (hr < 55) {
                recommendations.push('Consider light physical activity to maintain healthy circulation');
            } else {
                recommendations.push('Maintain your current activity level - your heart rate is well-balanced');
            }
            
            // HRV recommendations
            if (hrv < 40) {
                recommendations.push('Try meditation or yoga to improve heart rate variability and reduce stress');
            } else {
                recommendations.push('Your stress levels appear well-managed - keep up the good work');
            }
            
            // Tremor recommendations
            if (tremor > 1) {
                recommendations.push('Reduce caffeine intake and ensure 7-8 hours of quality sleep');
            } else {
                recommendations.push('Your motor control is excellent - maintain regular hand exercises');
            }
            
            // General wellness
            recommendations.push('Stay hydrated with 8 glasses of water daily for optimal health');
            
            const result = { summary, severity, recommendations };
            console.log('📊 Triage Analysis Result:', JSON.stringify(result, null, 2));
            return result;
        }
        
        console.log('✅ Triage model loaded');
        
        // Create prompt for LLM
        const prompt = `You are a wellness coach providing non-diagnostic insights. Analyze the following data and provide guidance:

Heart Rate: ${vitals.heartRate || 'N/A'} bpm
HRV: ${vitals.hrv || 'N/A'} ms
Breathing Rate: ${audioResult.breathingRate || 'N/A'} rpm
Tremor Index: ${vitals.tremorIndex || 'N/A'}
Cough Type: ${audioResult.coughType || 'N/A'}
Skin Condition: ${visionResult.skinCondition || 'N/A'}

Provide:
1. A brief summary (2-3 sentences)
2. Severity level (green/yellow/red)
3. 3 actionable recommendations

Format your response as JSON:
{
  "summary": "...",
  "severity": "green|yellow|red",
  "recommendations": ["...", "...", "..."]
}`;

        const result = await lm.complete({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful wellness coach. Always respond in valid JSON format.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            options: {
                temperature: 0.7,
                maxTokens: 512,
            },
        });
        
        console.log('🔮 Triage LLM result:', result);
        
        // Parse LLM response
        let parsed;
        try {
            parsed = JSON.parse(result.response);
        } catch (e) {
            console.warn('Failed to parse LLM JSON, using fallback');
            parsed = {};
        }

        return {
            summary: parsed.summary || 'Your vitals appear normal. Continue monitoring your wellness.',
            severity: parsed.severity || 'green',
            recommendations: parsed.recommendations || [
                'Stay hydrated',
                'Practice breathing exercises',
                'Maintain regular check-ins',
            ],
        };
    } catch (error) {
        console.error('TriageAgent error:', error);
        // Fallback to safe default
        return {
            summary: 'Unable to analyze data. Please try again.',
            severity: 'yellow',
            recommendations: [
                'Consult a healthcare professional if concerned.',
                'Monitor your symptoms.',
            ],
        };
    }
};
