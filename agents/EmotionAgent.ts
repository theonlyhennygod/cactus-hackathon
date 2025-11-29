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
    inferenceType: 'local' | 'fallback';
}

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
            console.log('⬇️ Downloading whisper-small for emotion analysis (on-device)...');
            await sttInstance.download({
                onProgress: (progress) => {
                    if (progress % 0.25 < 0.01) {
                        console.log(`📥 whisper: ${Math.round(progress * 100)}%`);
                    }
                },
            });
            sttDownloaded = true;
            console.log('✅ Whisper model ready (local inference)');
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
 * Analyze facial expression from image using local vision model
 * LOCAL-ONLY STRATEGY: All analysis happens on-device for privacy
 * No cloud fallback - data never leaves the device
 */
export const analyzeFacialEmotion = async (imageUri: string): Promise<{
    emotion: EmotionType;
    confidence: number;
    inferenceType: 'local' | 'fallback';
}> => {
    console.log('😊 Analyzing facial expression (on-device)...');
    console.log('🔒 Privacy mode: All processing happens locally');

    if (!imageUri) {
        return { emotion: 'neutral', confidence: 0.3, inferenceType: 'fallback' };
    }

    try {
        // LOCAL-ONLY: Try local vision model
        const lm = await modelManager.loadModel('vision');
        
        if (lm) {
            console.log('✅ Vision model loaded for emotion detection (on-device)');
            
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
                console.log('🎭 Facial emotion response (local):', text);
                
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
        } else {
            console.log('⚠️ Vision model not available, using intelligent fallback');
        }
        
        // FALLBACK: Intelligent defaults (still local, no cloud)
        console.log('📱 Using facial analysis fallback (on-device)');
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
 * LOCAL-ONLY STRATEGY: All analysis happens on-device for privacy
 * No cloud fallback - data never leaves the device
 */
export const analyzeVoiceEmotion = async (audioUri: string): Promise<{
    emotion: EmotionType;
    confidence: number;
    transcription: string;
    inferenceType: 'local' | 'fallback';
}> => {
    console.log('🎤 Analyzing voice emotion (on-device)...');
    console.log('🔒 Privacy mode: All processing happens locally');

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
        // LOCAL-ONLY: Transcribe audio using CactusSTT (Whisper)
        try {
            const stt = await getSTTModel();
            
            if (stt) {
                console.log('✅ STT model loaded for voice analysis (on-device)');
                
                try {
                    const result = await stt.transcribe({
                        audioFilePath: audioUri,
                        options: { maxTokens: 256 },
                    });
                    transcription = result.response || '';
                    console.log('📝 Voice transcription (local):', transcription);
                } catch (transcribeError) {
                    console.log('ℹ️ Transcription failed:', transcribeError instanceof Error ? transcribeError.message : 'unknown error');
                    transcription = '';
                }
            } else {
                console.log('ℹ️ STT not available, using keyword fallback');
            }
        } catch (sttError) {
            console.log('ℹ️ STT transcription failed, using keyword fallback');
            transcription = '';
        }
        
        // LOCAL-ONLY: Analyze sentiment with local LLM
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
                    console.log('🎭 Voice emotion analysis (local):', text);
                    
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
        }
        
        // FALLBACK: Keyword-based analysis (still local, no cloud)
        console.log('📱 Using voice emotion keyword fallback (on-device)');
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
 * LOCAL-ONLY STRATEGY: All analysis happens on-device for privacy
 */
export const analyzeEmotion = async (
    imageUri: string,
    audioUri: string
): Promise<EmotionResult> => {
    console.log('🧠 Running full emotion analysis (on-device)...');
    console.log('🔒 Privacy mode: No data leaves your device');
    
    // Run both analyses in parallel
    const [facialResult, voiceResult] = await Promise.all([
        analyzeFacialEmotion(imageUri),
        analyzeVoiceEmotion(audioUri),
    ]);
    
    console.log('📊 Facial (local):', facialResult);
    console.log('📊 Voice (local):', voiceResult);
    
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
    
    // Determine inference type: local > fallback (no cloud option)
    let inferenceType: 'local' | 'fallback' = 'fallback';
    if (facialResult.inferenceType === 'local' || voiceResult.inferenceType === 'local') {
        inferenceType = 'local';
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
    
    console.log('✅ Emotion analysis complete (all on-device):', result);
    return result;
};
