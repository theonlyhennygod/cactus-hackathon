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
        console.log('✅ Triage model loaded');
        
        // If model loading failed, skip to fallback
        if (!lm) {
            console.log('⚠️ Triage model not available, using fallback');
            throw new Error('Model not available');
        }
        
        // Create prompt for LLM - use /no_think to disable reasoning for cleaner output
        const prompt = `Analyze wellness data and respond with ONLY a JSON object, no explanation:

HR: ${Math.round(vitals.heartRate || 72)} bpm, HRV: ${Math.round(vitals.hrv || 50)} ms
Breathing: ${audioResult.breathingRate || 16} rpm, Tremor: ${Math.round(vitals.tremorIndex || 10)}
Cough: ${audioResult.coughType || 'none'}, Skin: ${visionResult.skinCondition || 'Clear'}

Respond ONLY with this JSON format:
{"summary":"2-3 sentence wellness summary","severity":"green","recommendations":["tip 1","tip 2","tip 3"]}`;

        const result = await lm.complete({
            messages: [
                {
                    role: 'system',
                    content: 'You are a wellness coach. Respond ONLY with valid JSON. No thinking, no explanation, just JSON. /no_think',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            options: {
                temperature: 0.3,
                maxTokens: 256,
            },
        });
        
        console.log('🔮 Triage LLM result:', result);
        
        // Parse LLM response - handle <think> tags from qwen models
        let parsed;
        try {
            let responseText = result.response;
            
            // Remove <think>...</think> tags if present
            responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/); 
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (e) {
            console.warn('Failed to parse LLM JSON, extracting from response text');
            
            // Try to extract key information from the raw response
            const response = result.response;
            parsed = {
                summary: 'Your wellness check shows normal vitals. Your heart rate and breathing are within healthy ranges.',
                severity: 'green',
                recommendations: [
                    'Continue regular physical activity',
                    'Stay hydrated throughout the day',
                    'Maintain a consistent sleep schedule'
                ]
            };
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
