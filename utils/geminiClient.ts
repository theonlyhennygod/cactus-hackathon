/**
 * Gemini Cloud Client - Hybrid fallback for when local models unavailable
 * 
 * Uses the hackathon-provided Gemini API key for cloud inference
 * Only used when local Cactus models fail to load
 */

const GEMINI_API_KEY = 'AIzaSyBbdAsfYEoNCjGxaWfUj5FWi8peo67-NZI';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeminiTriageResult {
    summary: string;
    severity: 'green' | 'yellow' | 'red';
    recommendations: string[];
}

/**
 * Generate triage using Gemini cloud API
 * Returns null if cloud is unavailable (offline mode)
 */
export async function generateTriageWithGemini(
    vitals: any,
    visionResult: any,
    audioResult: any
): Promise<GeminiTriageResult | null> {
    // Use mood-based data instead of heart rate
    const moodScore = vitals.moodScore ?? 50;
    const overallMood = vitals.overallMood ?? 'neutral';
    const facialEmotion = vitals.facialEmotion ?? 'neutral';
    const voiceEmotion = vitals.voiceEmotion ?? 'neutral';
    const tremor = vitals.tremorIndex ?? 0;
    const breathing = vitals.breathingRate ?? audioResult?.breathingRate ?? 16;
    const skinCondition = vitals.skinCondition ?? visionResult?.skinCondition ?? 'Normal';

    const prompt = `You are a wellness coach providing non-diagnostic insights. Analyze this wellness data:

Mood Score: ${moodScore}/100
Overall Mood: ${overallMood}
Facial Expression: ${facialEmotion}
Voice Sentiment: ${voiceEmotion}
Breathing Rate: ${breathing} rpm
Tremor Index: ${tremor}
Skin Condition: ${skinCondition}

Provide a wellness assessment. Respond with ONLY valid JSON (no markdown, no backticks):
{"summary":"2-3 sentence wellness summary","severity":"green or yellow or red","recommendations":["tip 1","tip 2","tip 3"]}`;

    try {
        console.log('☁️ Calling Gemini API for cloud inference...');
        
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256,
                },
            }),
        });

        if (!response.ok) {
            console.warn('Gemini API error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log('☁️ Gemini response:', text);
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || 'Wellness check complete.',
                severity: parsed.severity || 'green',
                recommendations: parsed.recommendations || ['Stay hydrated', 'Rest well', 'Monitor regularly'],
            };
        }
        
        return null;
    } catch (error) {
        console.warn('Gemini cloud fallback failed:', error);
        return null;
    }
}
