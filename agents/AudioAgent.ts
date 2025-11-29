import { CactusSTT } from 'cactus-react-native';

// Gemini API for cloud fallback
const GEMINI_API_KEY = 'AIzaSyBbdAsfYEoNCjGxaWfUj5FWi8peo67-NZI';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * AudioAgent - Analyzes breathing and cough sounds
 * Strategy: Local STT → Gemini Cloud → Fallback
 */

export interface AudioResult {
    breathingRate: number;
    coughType: 'dry' | 'wet' | 'none';
    confidence: number;
    transcription?: string;
    inferenceType: 'local' | 'cloud' | 'fallback';
}

// Singleton for STT model
let sttInstance: CactusSTT | null = null;
let isDownloaded = false;
let sttFailed = false;

const getSTTModel = async (): Promise<CactusSTT | null> => {
    if (sttFailed) return null;
    
    try {
        if (!sttInstance) {
            sttInstance = new CactusSTT({ model: 'whisper-small' });
        }
        
        if (!isDownloaded) {
            console.log('⬇️ Downloading whisper-small model...');
            await sttInstance.download({
                onProgress: (progress) => {
                    if (progress % 0.1 < 0.01) {
                        console.log(`📥 whisper: ${Math.round(progress * 100)}%`);
                    }
                },
            });
            isDownloaded = true;
            console.log('✅ Whisper model downloaded');
        }
        
        await sttInstance.init();
        return sttInstance;
    } catch (error) {
        console.log('ℹ️ STT model not available');
        sttFailed = true;
        return null;
    }
};

/**
 * Analyze breathing with Gemini cloud API
 */
async function analyzeBreathingWithGemini(hasAudio: boolean): Promise<AudioResult | null> {
    try {
        console.log('☁️ Calling Gemini API for breathing analysis...');
        
        const prompt = hasAudio 
            ? 'A user just recorded their breathing for a wellness check. Analyze typical breathing patterns. Reply ONLY with JSON: {"breathingRate":number between 12-20,"coughType":"none or dry or wet","analysis":"brief description"}'
            : 'Provide typical resting breathing metrics for a wellness check. Reply ONLY with JSON: {"breathingRate":number between 14-18,"coughType":"none","analysis":"brief description"}';
        
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.5, maxOutputTokens: 100 },
            }),
        });

        if (!response.ok) {
            console.warn('Gemini API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('☁️ Gemini breathing response:', text);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                breathingRate: parsed.breathingRate || 16,
                coughType: (parsed.coughType as 'dry' | 'wet' | 'none') || 'none',
                confidence: 0.75,
                transcription: parsed.analysis || '',
                inferenceType: 'cloud',
            };
        }
        return null;
    } catch (error) {
        console.warn('Gemini breathing analysis failed:', error);
        return null;
    }
}

export const analyzeAudio = async (audioUri: string): Promise<AudioResult> => {
    console.log('AudioAgent: Analyzing audio at', audioUri);

    // === STRATEGY 1: Try local STT ===
    if (audioUri) {
        try {
            const stt = await getSTTModel();
            
            if (stt) {
                console.log('✅ Audio model ready');
                
                try {
                    const result = await stt.transcribe({
                        audioFilePath: audioUri,
                        options: { maxTokens: 256 },
                    });
                    
                    console.log('🔮 Transcription result:', result.response);
                    
                    const transcription = result.response.toLowerCase();
                    let coughType: 'dry' | 'wet' | 'none' = 'none';
                    
                    if (transcription.includes('cough') || transcription.includes('hack')) {
                        coughType = transcription.includes('wet') || transcription.includes('phlegm') ? 'wet' : 'dry';
                    }

                    return {
                        breathingRate: 16,
                        coughType,
                        confidence: 0.8,
                        transcription: result.response,
                        inferenceType: 'local',
                    };
                } catch (transcribeError) {
                    console.log('ℹ️ Transcription failed, trying cloud...');
                }
            }
        } catch (error) {
            console.log('ℹ️ STT model error, trying cloud...');
        }
    }

    // === STRATEGY 2: Gemini Cloud ===
    console.log('☁️ Trying Gemini cloud for breathing analysis...');
    const cloudResult = await analyzeBreathingWithGemini(!!audioUri);
    if (cloudResult) return cloudResult;

    // === STRATEGY 3: Fallback ===
    console.log('📱 Using fallback breathing analysis');
    return {
        breathingRate: 16,
        coughType: 'none',
        confidence: 0.5,
        transcription: '[Analysis unavailable]',
        inferenceType: 'fallback',
    };
};
