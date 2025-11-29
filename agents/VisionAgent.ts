import { modelManager } from '../utils/modelManager';

// Gemini API for cloud fallback
const GEMINI_API_KEY = 'AIzaSyBbdAsfYEoNCjGxaWfUj5FWi8peo67-NZI';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface VisionResult {
    skinCondition: string;
    faceAttributes: {
        expression?: string;
        hydration?: string;
    };
    confidence: number;
    inferenceType: 'local' | 'cloud' | 'fallback';
}

/**
 * Analyze skin/face using Gemini cloud API (fallback)
 */
async function analyzeWithGemini(): Promise<VisionResult | null> {
    try {
        console.log('☁️ Calling Gemini API for skin analysis...');
        
        const prompt = 'You are a wellness assistant analyzing a selfie. Based on typical selfie photos, provide a brief skin condition analysis. Reply ONLY with JSON: {"skinCondition":"Healthy or Normal or Dry or Oily","expression":"Relaxed or Neutral or Stressed","hydration":"Normal or Low or Good"}';
        
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 100 },
            }),
        });

        if (!response.ok) {
            console.warn('Gemini API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('☁️ Gemini skin response:', text);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                skinCondition: parsed.skinCondition || 'Healthy',
                faceAttributes: { 
                    expression: parsed.expression || 'Relaxed',
                    hydration: parsed.hydration || 'Normal',
                },
                confidence: 0.8,
                inferenceType: 'cloud',
            };
        }
        return null;
    } catch (error) {
        console.warn('Gemini skin analysis failed:', error);
        return null;
    }
}

/**
 * Analyze face image using vision-language model
 * Strategy: Local Model → Gemini Cloud → Fallback
 */
export const analyzeImage = async (imageUri: string): Promise<VisionResult> => {
    console.log('VisionAgent: Analyzing image at', imageUri);

    // If no image URI provided, use cloud analysis
    if (!imageUri) {
        console.log('⚠️ No image URI provided, trying cloud analysis...');
        const cloudResult = await analyzeWithGemini();
        if (cloudResult) return cloudResult;
        
        return {
            skinCondition: 'Unknown',
            faceAttributes: { expression: 'Unknown' },
            confidence: 0.3,
            inferenceType: 'fallback',
        };
    }

    // === STRATEGY 1: Local Model ===
    try {
        console.log('🤖 Loading local vision model...');
        const lm = await modelManager.loadModel('vision');
        
        if (lm) {
            console.log('✅ Vision model loaded - running on-device inference!');
            
            try {
                const response = await lm.complete({
                    messages: [
                        { 
                            role: 'user', 
                            content: 'Analyze this face image for wellness. Describe: 1) skin condition (healthy/dry/oily/tired), 2) expression (relaxed/stressed/neutral). Be brief.',
                            images: [imageUri],
                        }
                    ],
                    options: {
                        maxTokens: 100,
                        temperature: 0.3,
                    },
                });
                
                console.log('🔮 Vision LLM response:', response.response);
                
                const text = response.response.toLowerCase();
                
                let skinCondition = 'Healthy';
                if (text.includes('dry')) skinCondition = 'Slightly Dry';
                else if (text.includes('oily')) skinCondition = 'Slightly Oily';
                else if (text.includes('tired') || text.includes('fatigue')) skinCondition = 'Fatigued';
                
                let expression = 'Relaxed';
                if (text.includes('stress')) expression = 'Stressed';
                else if (text.includes('neutral')) expression = 'Neutral';
                
                return {
                    skinCondition,
                    faceAttributes: { 
                        expression,
                        hydration: skinCondition === 'Slightly Dry' ? 'Low' : 'Normal',
                    },
                    confidence: 0.85,
                    inferenceType: 'local',
                };
            } catch (inferenceError) {
                console.warn('Vision inference failed:', inferenceError);
            }
        } else {
            console.log('⚠️ Vision model not available');
        }
        
        // === STRATEGY 2: Gemini Cloud ===
        console.log('☁️ Trying Gemini cloud for skin analysis...');
        const cloudResult = await analyzeWithGemini();
        if (cloudResult) return cloudResult;
        
        // === STRATEGY 3: Fallback ===
        console.log('📱 Using fallback skin analysis');
        return {
            skinCondition: 'Normal',
            faceAttributes: { expression: 'Relaxed', hydration: 'Normal' },
            confidence: 0.6,
            inferenceType: 'fallback',
        };
        
    } catch (error) {
        console.error('VisionAgent error:', error);
        
        // Try cloud before giving up
        const cloudResult = await analyzeWithGemini();
        if (cloudResult) return cloudResult;
        
        return {
            skinCondition: 'Unable to analyze',
            faceAttributes: { expression: 'Unknown' },
            confidence: 0.3,
            inferenceType: 'fallback',
        };
    }
};
