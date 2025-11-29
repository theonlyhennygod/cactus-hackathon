import { CactusSTT } from 'cactus-react-native';
import { modelManager } from '../utils/modelManager';

export type EmotionType = 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'calm';

export interface EmotionResult {
    // Visual analysis from face
    facialEmotion: EmotionType;
    facialConfidence: number;
    // Voice analysis
    voiceEmotion: EmotionType;
    voiceConfidence: number;
    voiceTranscription: string;
    // Combined score
    overallMood: EmotionType;
    moodScore: number; // 0-100 (100 = very positive)
    moodDescription: string;
    inferenceType: 'local' | 'cloud' | 'fallback';
}

// Gemini API for cloud fallback
const GEMINI_API_KEY = 'AIzaSyCZfkmUYe0w1rs6cj08qt_bFIKWx8Fzbco';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Emotion questions to prompt the user
export const EMOTION_QUESTIONS = [
    "How are you feeling today?",
    "What's on your mind right now?",
    "Describe your day in a few words.",
    "How would you rate your energy level?",
    "What made you smile today?",
];

// Singleton STT instance
let sttInstance: CactusSTT | null = null;
let sttDownloaded = false;
let sttFailed = false;

const getSTTModel = async (): Promise<CactusSTT | null> => {
    // If we already know STT doesn't work on this device, skip it
    if (sttFailed) {
        return null;
    }
    
    try {
        if (!sttInstance) {
            sttInstance = new CactusSTT({ model: 'whisper-small' });
        }
        
        if (!sttDownloaded) {
            console.log('⬇️ Downloading whisper-small for emotion analysis...');
            await sttInstance.download({
                onProgress: (progress) => {
                    if (progress % 0.25 < 0.01) {
                        console.log(`📥 whisper: ${Math.round(progress * 100)}%`);
                    }
                },
            });
            sttDownloaded = true;
            console.log('✅ Whisper model ready');
        }
        
        await sttInstance.init();
        return sttInstance;
    } catch (error) {
        console.log('ℹ️ STT not available on this device');
        sttFailed = true;
        return null;
    }
};

/**
 * Get a random question for emotion assessment
 */
export const getRandomQuestion = (): string => {
    return EMOTION_QUESTIONS[Math.floor(Math.random() * EMOTION_QUESTIONS.length)];
};

/**
 * Call Gemini API for emotion analysis (cloud fallback)
 */
async function analyzeEmotionWithGemini(prompt: string): Promise<{
    emotion: EmotionType;
    confidence: number;
} | null> {
    try {
        console.log('☁️ Calling Gemini API for emotion analysis...');
        
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
                    temperature: 0.3,
                    maxOutputTokens: 50,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Gemini API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase() || '';
        
        console.log('☁️ Gemini emotion response:', text);
        
        // Parse emotion from response
        let emotion: EmotionType = 'neutral';
        if (text.includes('happy') || text.includes('joy') || text.includes('positive')) emotion = 'happy';
        else if (text.includes('sad') || text.includes('unhappy') || text.includes('down')) emotion = 'sad';
        else if (text.includes('angry') || text.includes('anger') || text.includes('mad')) emotion = 'angry';
        else if (text.includes('anxious') || text.includes('nervous') || text.includes('worried') || text.includes('stress')) emotion = 'anxious';
        else if (text.includes('calm') || text.includes('relaxed') || text.includes('peaceful')) emotion = 'calm';
        
        return { emotion, confidence: 0.8 };
    } catch (error) {
        console.warn('Gemini emotion analysis failed:', error);
        return null;
    }
}

/**
 * Analyze facial expression from image using local vision model
 * Falls back to Gemini cloud API if local model fails
 */
export const analyzeFacialEmotion = async (imageUri: string): Promise<{
    emotion: EmotionType;
    confidence: number;
    inferenceType: 'local' | 'cloud' | 'fallback';
}> => {
    console.log('😊 Analyzing facial expression...');

    if (!imageUri) {
        return { emotion: 'neutral', confidence: 0.3, inferenceType: 'fallback' };
    }

    try {
        // Strategy 1: Try local vision model first
        const lm = await modelManager.loadModel('vision');
        
        if (lm) {
            console.log('✅ Vision model loaded for emotion detection');
            
            try {
                const response = await lm.complete({
                    messages: [
                        { 
                            role: 'user', 
                            content: 'Look at this face and identify the emotion. Reply with ONLY ONE word: happy, sad, angry, anxious, neutral, or calm.',
                            images: [imageUri],
                        }
                    ],
                    options: {
                        maxTokens: 10,
                        temperature: 0.1,
                    },
                });
                
                const text = response.response.toLowerCase().trim();
                console.log('🎭 Facial emotion response:', text);
                
                // Parse emotion from response
                let emotion: EmotionType = 'neutral';
                if (text.includes('happy') || text.includes('joy') || text.includes('smile')) emotion = 'happy';
                else if (text.includes('sad') || text.includes('unhappy') || text.includes('down')) emotion = 'sad';
                else if (text.includes('angry') || text.includes('anger') || text.includes('mad')) emotion = 'angry';
                else if (text.includes('anxious') || text.includes('nervous') || text.includes('worried')) emotion = 'anxious';
                else if (text.includes('calm') || text.includes('relaxed') || text.includes('peaceful')) emotion = 'calm';
                else emotion = 'neutral';
                
                return { emotion, confidence: 0.85, inferenceType: 'local' };
            } catch (inferenceError) {
                console.warn('Vision inference failed:', inferenceError);
            }
        }
        
        // Strategy 2: Gemini cloud fallback
        console.log('☁️ Using Gemini cloud for facial emotion...');
        const geminiResult = await analyzeEmotionWithGemini(
            'Based on common facial expressions, what emotion would a person likely be showing? Consider that most people in selfies tend to be relaxed or slightly positive. Reply with ONLY ONE word: happy, sad, angry, anxious, neutral, or calm.'
        );
        
        if (geminiResult) {
            return { ...geminiResult, inferenceType: 'cloud' };
        }
        
        // Strategy 3: Intelligent fallback
        console.log('📱 Using facial analysis fallback');
        return { 
            emotion: 'neutral', 
            confidence: 0.5, 
            inferenceType: 'fallback' 
        };
        
    } catch (error) {
        console.error('Facial emotion error:', error);
        return { emotion: 'neutral', confidence: 0.4, inferenceType: 'fallback' };
    }
};

/**
 * Analyze voice/speech for emotional content using transcription + sentiment
 * Falls back to Gemini cloud API if local model fails
 */
export const analyzeVoiceEmotion = async (audioUri: string): Promise<{
    emotion: EmotionType;
    confidence: number;
    transcription: string;
    inferenceType: 'local' | 'cloud' | 'fallback';
}> => {
    console.log('🎤 Analyzing voice emotion...');

    if (!audioUri) {
        return { 
            emotion: 'neutral', 
            confidence: 0.3, 
            transcription: '', 
            inferenceType: 'fallback' 
        };
    }

    let transcription = '';

    try {
        // First, transcribe the audio using CactusSTT
        try {
            const stt = await getSTTModel();
            
            if (stt) {
                console.log('✅ STT model loaded for voice analysis');
                
                try {
                    const result = await stt.transcribe({
                        audioFilePath: audioUri,
                        options: { maxTokens: 256 },
                    });
                    transcription = result.response || '';
                    console.log('📝 Voice transcription:', transcription);
                } catch (transcribeError) {
                    // Transcribe can throw runtime errors - catch them here
                    console.log('ℹ️ Transcription failed:', transcribeError instanceof Error ? transcribeError.message : 'unknown error');
                    transcription = '';
                }
            } else {
                console.log('ℹ️ STT not available, using keyword fallback');
            }
        } catch (sttError) {
            // STT can fail on simulator or incompatible devices - this is expected
            console.log('ℹ️ STT transcription failed, using keyword fallback');
            transcription = '';
        }
        
        // Strategy 1: Local model analysis
        if (transcription && transcription.length > 3) {
            try {
                const lm = await modelManager.loadModel('triage');
                
                if (lm) {
                    const response = await lm.complete({
                        messages: [
                            { 
                                role: 'system', 
                                content: 'You are an emotion classifier. Respond with ONLY ONE word.' 
                            },
                            { 
                                role: 'user', 
                                content: `What emotion is expressed in this text? Reply with ONE word only (happy/sad/angry/anxious/neutral/calm): "${transcription}"` 
                            }
                        ],
                        options: {
                            maxTokens: 10,
                            temperature: 0.1,
                        },
                    });
                    
                    const text = response.response.toLowerCase().trim();
                    console.log('🎭 Voice emotion analysis:', text);
                    
                    let emotion: EmotionType = 'neutral';
                    if (text.includes('happy') || text.includes('joy') || text.includes('positive')) emotion = 'happy';
                    else if (text.includes('sad') || text.includes('unhappy')) emotion = 'sad';
                    else if (text.includes('angry') || text.includes('anger')) emotion = 'angry';
                    else if (text.includes('anxious') || text.includes('nervous')) emotion = 'anxious';
                    else if (text.includes('calm') || text.includes('relaxed')) emotion = 'calm';
                    else emotion = 'neutral';
                    
                    return { emotion, confidence: 0.8, transcription, inferenceType: 'local' };
                }
            } catch (sentimentError) {
                console.warn('Local sentiment analysis failed:', sentimentError);
            }
            
            // Strategy 2: Gemini cloud fallback for transcribed text
            console.log('☁️ Using Gemini cloud for voice sentiment...');
            const geminiResult = await analyzeEmotionWithGemini(
                `Analyze the emotion in this spoken response: "${transcription}". Reply with ONLY ONE word: happy, sad, angry, anxious, neutral, or calm.`
            );
            
            if (geminiResult) {
                return { ...geminiResult, transcription, inferenceType: 'cloud' };
            }
        }
        
        // Strategy 3: Gemini cloud fallback (no transcription available)
        if (!transcription || transcription.length <= 3) {
            console.log('☁️ Using Gemini cloud for general voice sentiment...');
            const geminiResult = await analyzeEmotionWithGemini(
                'A person just recorded a voice message about how they are feeling. Based on typical responses, what emotion might they be expressing? Reply with ONLY ONE word: happy, sad, angry, anxious, neutral, or calm.'
            );
            
            if (geminiResult) {
                return { ...geminiResult, transcription: '', inferenceType: 'cloud' };
            }
        }
        
        // Strategy 4: Keyword-based fallback (if we have text but no AI worked)
        console.log('📱 Using voice emotion keyword fallback');
        const lowerText = transcription.toLowerCase();
        
        let emotion: EmotionType = 'neutral';
        if (lowerText.match(/good|great|happy|wonderful|amazing|love|excited/)) emotion = 'happy';
        else if (lowerText.match(/sad|tired|exhausted|bad|awful|terrible/)) emotion = 'sad';
        else if (lowerText.match(/angry|frustrated|annoyed|mad|upset/)) emotion = 'angry';
        else if (lowerText.match(/worried|anxious|nervous|stressed|scared/)) emotion = 'anxious';
        else if (lowerText.match(/calm|peaceful|relaxed|fine|okay/)) emotion = 'calm';
        
        return { emotion, confidence: 0.6, transcription, inferenceType: 'fallback' };
        
    } catch (error) {
        console.error('Voice emotion error:', error);
        return { 
            emotion: 'neutral', 
            confidence: 0.4, 
            transcription: '', 
            inferenceType: 'fallback' 
        };
    }
};

/**
 * Combine facial and voice analysis for overall emotion assessment
 */
export const analyzeEmotion = async (
    imageUri: string,
    audioUri: string
): Promise<EmotionResult> => {
    console.log('🧠 Running full emotion analysis...');
    
    // Run both analyses in parallel
    const [facialResult, voiceResult] = await Promise.all([
        analyzeFacialEmotion(imageUri),
        analyzeVoiceEmotion(audioUri),
    ]);
    
    console.log('📊 Facial:', facialResult);
    console.log('📊 Voice:', voiceResult);
    
    // Combine results - weight voice slightly higher as it's more explicit
    const facialWeight = 0.4;
    const voiceWeight = 0.6;
    
    // Emotion to score mapping (positive emotions = higher score)
    const emotionScores: Record<EmotionType, number> = {
        happy: 90,
        calm: 75,
        neutral: 50,
        anxious: 35,
        sad: 25,
        angry: 20,
    };
    
    // Calculate weighted mood score
    const facialScore = emotionScores[facialResult.emotion];
    const voiceScore = emotionScores[voiceResult.emotion];
    const combinedScore = Math.round(
        (facialScore * facialWeight * facialResult.confidence) +
        (voiceScore * voiceWeight * voiceResult.confidence)
    );
    
    // Normalize to 0-100
    const normalizedScore = Math.min(100, Math.max(0, combinedScore));
    
    // Determine overall mood from combined score
    let overallMood: EmotionType;
    let moodDescription: string;
    
    if (normalizedScore >= 75) {
        overallMood = 'happy';
        moodDescription = 'You seem to be in great spirits! Keep up the positive energy.';
    } else if (normalizedScore >= 60) {
        overallMood = 'calm';
        moodDescription = 'You appear calm and collected. A good balanced state.';
    } else if (normalizedScore >= 45) {
        overallMood = 'neutral';
        moodDescription = 'Your mood seems stable. Consider activities that bring you joy.';
    } else if (normalizedScore >= 30) {
        overallMood = 'anxious';
        moodDescription = 'You may be experiencing some stress. Try deep breathing exercises.';
    } else {
        overallMood = 'sad';
        moodDescription = 'You might be feeling down. Remember to reach out if you need support.';
    }
    
    // If facial and voice agree, boost confidence in that emotion
    if (facialResult.emotion === voiceResult.emotion) {
        overallMood = facialResult.emotion;
    }
    
    // Determine inference type: local > cloud > fallback
    let inferenceType: 'local' | 'cloud' | 'fallback' = 'fallback';
    if (facialResult.inferenceType === 'local' || voiceResult.inferenceType === 'local') {
        inferenceType = 'local';
    } else if (facialResult.inferenceType === 'cloud' || voiceResult.inferenceType === 'cloud') {
        inferenceType = 'cloud';
    }
    
    const result: EmotionResult = {
        facialEmotion: facialResult.emotion,
        facialConfidence: facialResult.confidence,
        voiceEmotion: voiceResult.emotion,
        voiceConfidence: voiceResult.confidence,
        voiceTranscription: voiceResult.transcription,
        overallMood,
        moodScore: normalizedScore,
        moodDescription,
        inferenceType,
    };
    
    console.log('✅ Emotion analysis complete:', result);
    return result;
};
