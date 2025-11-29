import { CactusSTT } from 'cactus-react-native';

export interface AudioResult {
    breathingRate: number;
    coughType: 'dry' | 'wet' | 'none';
    confidence: number;
    transcription?: string;
}

// Singleton for STT model
let sttInstance: CactusSTT | null = null;
let isDownloaded = false;

const getSTTModel = async (): Promise<CactusSTT> => {
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
};

export const analyzeAudio = async (audioUri: string): Promise<AudioResult> => {
    console.log('AudioAgent: Analyzing audio at', audioUri);

    // If no audio URI provided, return fallback
    if (!audioUri) {
        console.log('⚠️ No audio URI provided, using fallback');
        return {
            breathingRate: 16,
            coughType: 'none',
            confidence: 0.5,
        };
    }

    try {
        const stt = await getSTTModel();
        console.log('✅ Audio model ready');
        
        // Transcribe the audio
        console.log('🎤 Transcribing audio...');
        const result = await stt.transcribe({
            audioFilePath: audioUri,
            options: {
                maxTokens: 256,
            },
        });
        
        console.log('🔮 Transcription result:', result.response);
        
        // Analyze transcription for cough patterns
        const transcription = result.response.toLowerCase();
        let coughType: 'dry' | 'wet' | 'none' = 'none';
        let confidence = 0.8;
        
        if (transcription.includes('cough') || transcription.includes('hack')) {
            coughType = transcription.includes('wet') || transcription.includes('phlegm') ? 'wet' : 'dry';
            confidence = 0.85;
        }

        return {
            breathingRate: 16, // Would need signal processing for real value
            coughType,
            confidence,
            transcription: result.response,
        };
    } catch (error) {
        console.error('AudioAgent error:', error);
        // Fallback to mock data
        return {
            breathingRate: 16,
            coughType: 'dry',
            confidence: 0.5,
        };
    }
};
