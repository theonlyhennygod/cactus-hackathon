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
            const hr = vitals.heartRate || 72;
            const hrv = vitals.hrv || 50;
            const tremor = vitals.tremorIndex || 0;
            const breathing = audioResult.breathingRate || 16;
            
            // Determine severity based on vitals
            let severity: 'green' | 'yellow' | 'red' = 'green';
            const concerns: string[] = [];
            
            if (hr > 100 || hr < 50) {
                severity = 'yellow';
                concerns.push('heart rate outside normal range');
            }
            if (hrv < 20) {
                severity = severity === 'green' ? 'yellow' : severity;
                concerns.push('low heart rate variability');
            }
            if (tremor > 2) {
                severity = severity === 'green' ? 'yellow' : severity;
                concerns.push('elevated tremor detected');
            }
            
            // Generate personalized summary
            const summary = concerns.length > 0
                ? `Some metrics need attention: ${concerns.join(', ')}. Consider consulting a healthcare provider if symptoms persist.`
                : `Your vitals look healthy! Heart rate ${Math.round(hr)} bpm, HRV ${Math.round(hrv)} ms, and minimal tremor detected.`;
            
            // Generate personalized recommendations
            const recommendations = [
                hr > 80 ? 'Practice relaxation techniques to lower heart rate' : 'Maintain your current activity level',
                hrv < 40 ? 'Try meditation or deep breathing to improve HRV' : 'Your stress levels appear well-managed',
                tremor > 1 ? 'Reduce caffeine intake and ensure adequate sleep' : 'Your motor control is excellent',
                'Stay hydrated with 8 glasses of water daily',
            ];
            
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
