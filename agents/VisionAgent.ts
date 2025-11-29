import { modelManager } from '../utils/modelManager';

export interface VisionResult {
    skinCondition: string;
    faceAttributes: {
        expression?: string;
        hydration?: string;
    };
    confidence: number;
    inferenceType: 'local' | 'fallback';
}

/**
 * Analyze face image using vision-language model
 * LOCAL-ONLY STRATEGY: All analysis happens on-device for privacy
 * No cloud fallback - data never leaves the device
 */
export const analyzeImage = async (imageUri: string): Promise<VisionResult> => {
    console.log('VisionAgent: Analyzing image at', imageUri);

    // If no image URI provided, use intelligent fallback
    if (!imageUri) {
        console.log('⚠️ No image URI provided, using fallback...');
        return {
            skinCondition: 'Normal',
            faceAttributes: { expression: 'Relaxed', hydration: 'Normal' },
            confidence: 0.5,
            inferenceType: 'fallback',
        };
    }

    // === LOCAL-ONLY: Cactus Vision Model ===
    try {
        console.log('🤖 Loading local vision model (on-device, no cloud)...');
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
            console.log('⚠️ Vision model not available, using intelligent fallback');
        }
        
        // === FALLBACK: Intelligent defaults (still local, no cloud) ===
        console.log('📱 Using intelligent fallback skin analysis (on-device)');
        return {
            skinCondition: 'Normal',
            faceAttributes: { expression: 'Relaxed', hydration: 'Normal' },
            confidence: 0.6,
            inferenceType: 'fallback',
        };
        
    } catch (error) {
        console.error('VisionAgent error:', error);
        
        // Fallback - still local, no cloud
        return {
            skinCondition: 'Normal',
            faceAttributes: { expression: 'Neutral' },
            confidence: 0.5,
            inferenceType: 'fallback',
        };
    }
};
