# Cactus SDK Integration Guide

## Overview

This guide shows how to integrate the Cactus React Native SDK for on-device AI inference in the Pocket Wellness app.

## Installation

The `cactus-react-native` package is already in `package.json`. After running `npm install`, you'll need to:

1. Create a development build (Expo Go doesn't support native modules)
2. Download AI models to bundle with the app or load dynamically

## Model Management

### Recommended Models

Based on the PRD, we need:

1. **Vision Model** - Liquid LFM Small (~100MB)
   - Purpose: Face/skin analysis
   - Format: GGUF or ONNX

2. **Audio Classifier** - Tiny Audio Model (~20MB)
   - Purpose: Cough classification, breathing analysis
   - Format: GGUF or TFLite

3. **Triage LLM** - Qwen3-600M (~350MB)
   - Purpose: Generate wellness recommendations
   - Format: GGUF (Q4 or Q8 quantization)

4. **Echo-LNN** - Time-series engine (~50MB)
   - Purpose: PPG, HRV, tremor analysis
   - Format: Custom or GGUF

### Model Storage Options

**Option 1: Bundle with App**
```typescript
// Place models in assets/models/
// Reference in app.json
{
  "expo": {
    "assetBundlePatterns": [
      "**/*",
      "assets/models/*.gguf"
    ]
  }
}
```

**Option 2: Download on First Run**
```typescript
import * as FileSystem from 'expo-file-system';

const downloadModel = async (url: string, filename: string) => {
  const modelUri = FileSystem.documentDirectory + filename;
  await FileSystem.downloadAsync(url, modelUri);
  return modelUri;
};
```

## Agent Integration Examples

### VisionAgent.ts

```typescript
import { Cactus } from 'cactus-react-native';
import * as FileSystem from 'expo-file-system';

let visionModel: any = null;

const loadVisionModel = async () => {
  if (!visionModel) {
    const modelPath = FileSystem.documentDirectory + 'liquid-lfm-small.gguf';
    visionModel = await Cactus.loadModel({
      path: modelPath,
      type: 'vision',
      config: {
        context_length: 512,
        threads: 4,
      }
    });
  }
  return visionModel;
};

export const analyzeImage = async (imageUri: string): Promise<VisionResult> => {
  try {
    const model = await loadVisionModel();
    
    // Preprocess image if needed
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Run inference
    const result = await model.predict({
      image: imageData,
      task: 'face_analysis'
    });
    
    return {
      skinCondition: result.skin_condition || 'Unknown',
      faceAttributes: {
        expression: result.expression || 'Neutral',
      },
      confidence: result.confidence || 0.0,
    };
  } catch (error) {
    console.error('Vision analysis failed:', error);
    // Return mock data as fallback
    return {
      skinCondition: 'Clear',
      faceAttributes: { expression: 'Neutral' },
      confidence: 0.5,
    };
  }
};
```

### AudioAgent.ts

```typescript
import { Cactus } from 'cactus-react-native';
import * as FileSystem from 'expo-file-system';

let audioModel: any = null;

const loadAudioModel = async () => {
  if (!audioModel) {
    const modelPath = FileSystem.documentDirectory + 'audio-classifier-tiny.gguf';
    audioModel = await Cactus.loadModel({
      path: modelPath,
      type: 'audio',
    });
  }
  return audioModel;
};

export const analyzeAudio = async (audioUri: string): Promise<AudioResult> => {
  try {
    const model = await loadAudioModel();
    
    // Load audio file
    const audioData = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Run inference
    const result = await model.predict({
      audio: audioData,
      sample_rate: 44100,
    });
    
    return {
      breathingRate: result.breathing_rate || 16,
      coughType: result.cough_type || 'none',
      confidence: result.confidence || 0.0,
    };
  } catch (error) {
    console.error('Audio analysis failed:', error);
    return {
      breathingRate: 16,
      coughType: 'dry',
      confidence: 0.5,
    };
  }
};
```

### TriageAgent.ts

```typescript
import { Cactus } from 'cactus-react-native';
import * as FileSystem from 'expo-file-system';

let triageModel: any = null;

const loadTriageModel = async () => {
  if (!triageModel) {
    const modelPath = FileSystem.documentDirectory + 'qwen3-600m-q4.gguf';
    triageModel = await Cactus.loadModel({
      path: modelPath,
      type: 'llm',
      config: {
        context_length: 2048,
        temperature: 0.7,
        max_tokens: 512,
      }
    });
  }
  return triageModel;
};

export const generateTriage = async (
  vitals: any,
  visionResult: any,
  audioResult: any
): Promise<TriageResult> => {
  try {
    const model = await loadTriageModel();
    
    const prompt = `You are a wellness coach providing non-diagnostic insights. Analyze the following data and provide guidance:

Heart Rate: ${vitals.heartRate} bpm
HRV: ${vitals.hrv} ms
Breathing Rate: ${audioResult.breathingRate} rpm
Tremor Index: ${vitals.tremorIndex}
Cough Type: ${audioResult.coughType}

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

    const response = await model.generate(prompt);
    const parsed = JSON.parse(response.text);
    
    return {
      summary: parsed.summary,
      severity: parsed.severity,
      recommendations: parsed.recommendations,
    };
  } catch (error) {
    console.error('Triage generation failed:', error);
    // Return safe default
    return {
      summary: 'Your vitals appear normal. Continue monitoring your wellness.',
      severity: 'green',
      recommendations: [
        'Stay hydrated',
        'Practice breathing exercises',
        'Maintain regular check-ins',
      ],
    };
  }
};
```

### EchoLNNAgent.ts

```typescript
import { Cactus } from 'cactus-react-native';
import * as FileSystem from 'expo-file-system';

let echoEngine: any = null;

const loadEchoLNN = async () => {
  if (!echoEngine) {
    const modelPath = FileSystem.documentDirectory + 'echo-lnn-q8.gguf';
    echoEngine = await Cactus.loadModel({
      path: modelPath,
      type: 'time_series',
    });
  }
  return echoEngine;
};

export const analyzeTimeSeries = async (
  ppgData: number[],
  accelData: AccelerometerData[]
): Promise<EchoLNNResult> => {
  try {
    const engine = await loadEchoLNN();
    
    // Prepare time-series data
    const timeSeriesData = {
      ppg: ppgData,
      accelerometer: {
        x: accelData.map(d => d.x),
        y: accelData.map(d => d.y),
        z: accelData.map(d => d.z),
        timestamps: accelData.map(d => d.timestamp),
      }
    };
    
    // Run Echo-LNN analysis
    const result = await engine.analyze(timeSeriesData);
    
    return {
      heartRate: result.heart_rate || 72,
      hrv: result.hrv || 50,
      tremorIndex: result.tremor_index || 0,
      quality: result.quality || 0.9,
    };
  } catch (error) {
    console.error('Echo-LNN analysis failed:', error);
    // Calculate basic metrics as fallback
    const tremorIndex = accelData.length > 0
      ? accelData.reduce((acc, val) => 
          acc + Math.abs(val.x) + Math.abs(val.y) + Math.abs(val.z), 0
        ) / accelData.length
      : 0;
    
    return {
      heartRate: 72,
      hrv: 50,
      tremorIndex: tremorIndex * 10,
      quality: 0.5,
    };
  }
};
```

## Model Initialization Strategy

Create a model manager to handle loading:

```typescript
// utils/modelManager.ts
import { Cactus } from 'cactus-react-native';
import * as FileSystem from 'expo-file-system';

class ModelManager {
  private models: Map<string, any> = new Map();
  
  async loadModel(name: string, config: any) {
    if (this.models.has(name)) {
      return this.models.get(name);
    }
    
    const modelPath = FileSystem.documentDirectory + config.filename;
    const model = await Cactus.loadModel({
      path: modelPath,
      ...config,
    });
    
    this.models.set(name, model);
    return model;
  }
  
  async unloadModel(name: string) {
    const model = this.models.get(name);
    if (model) {
      await model.unload();
      this.models.delete(name);
    }
  }
  
  async unloadAll() {
    for (const [name, model] of this.models) {
      await model.unload();
    }
    this.models.clear();
  }
}

export const modelManager = new ModelManager();
```

## Performance Optimization

### 1. Lazy Loading
Load models only when needed, not at app startup.

### 2. Model Quantization
Use Q4 or Q8 quantized models to reduce size and improve inference speed.

### 3. Thread Management
Configure optimal thread count based on device:
```typescript
const threads = Platform.OS === 'ios' ? 4 : 2;
```

### 4. Memory Management
Unload models when not in use:
```typescript
useEffect(() => {
  return () => {
    modelManager.unloadAll();
  };
}, []);
```

## Testing

Test with and without actual models:

```typescript
const USE_MOCK_INFERENCE = __DEV__ && !process.env.USE_REAL_MODELS;

if (USE_MOCK_INFERENCE) {
  // Return mock data for faster development
} else {
  // Use real Cactus SDK
}
```

## Next Steps

1. Download/acquire model files
2. Place in `assets/models/` or set up download mechanism
3. Replace mock implementations in agents with actual Cactus SDK calls
4. Test inference latency and optimize
5. Handle model loading errors gracefully
