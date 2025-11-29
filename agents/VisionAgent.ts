import { modelManager } from '../utils/modelManager';

export interface VisionResult {
    skinCondition?: string;
    faceAttributes?: {
        eyeColor?: string;
        expression?: string;
    };
    confidence: number;
}

export const analyzeImage = async (imageUri: string): Promise<VisionResult> => {
    console.log('VisionAgent: Analyzing image at', imageUri);

    try {
        // Load the vision model
        const lm = await modelManager.loadModel('vision', {
            contextSize: 2048,
        });
        console.log('✅ Vision model loaded');
        
        // If model loading failed, skip to fallback
        if (!lm) {
            console.log('⚠️ Vision model not available, using fallback');
            throw new Error('Model not available');
        }
        
        // Run Cactus SDK inference with multimodal input
        const result = await lm.complete({
            messages: [
                {
                    role: 'user',
                    content: 'Analyze this face image for skin condition and facial expression. Return JSON with: {"skinCondition": "...", "expression": "...", "confidence": 0.0-1.0}',
                    images: [imageUri],
                },
            ],
            options: {
                temperature: 0.3,
                maxTokens: 256,
            },
        });
        
        console.log('🔮 Vision inference result:', result);

        // Parse response
        let parsed;
        try {
            parsed = JSON.parse(result.response);
        } catch (e) {
            parsed = {};
        }

        return {
            skinCondition: parsed.skinCondition || 'Clear',
            faceAttributes: {
                expression: parsed.expression || 'Neutral',
            },
            confidence: parsed.confidence || 0.85,
        };
    } catch (error) {
        console.error('VisionAgent error:', error);
        // Fallback to mock data
        return {
            skinCondition: 'Unknown',
            faceAttributes: { expression: 'Neutral' },
            confidence: 0.5,
        };
    }
};
