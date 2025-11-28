# Pocket Wellness - Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI** (`npm install -g expo-cli`)
3. **EAS CLI** (`npm install -g eas-cli`)
4. **iOS Simulator** (Mac only) or **Android Studio** with emulator

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Native Build (Required for Cactus SDK)

The app uses `cactus-react-native` which requires native modules. Expo Go won't work - you need a development build.

```bash
# Login to Expo
eas login

# Configure the project
eas build:configure

# Create a development build for iOS (Mac only)
eas build --profile development --platform ios

# OR create a development build for Android
eas build --profile development --platform android
```

### 3. Install the Development Build

- **iOS**: Download the build from EAS and install on your device/simulator
- **Android**: Download the APK and install on your device/emulator

### 4. Start the Development Server

```bash
npx expo start --dev-client
```

## Cactus SDK Integration

The app is configured to use `cactus-react-native` for on-device AI inference:

### Models to Download

Place these models in your app's assets or load them dynamically:

1. **Vision Model**: Liquid LFM Small (for face/skin analysis)
2. **Audio Classifier**: Tiny audio classifier (for cough detection)
3. **Triage LLM**: Qwen3-600M or similar small model
4. **Echo-LNN Engine**: For time-series analysis (PPG, tremor)

### Configuration

Update `agents/VisionAgent.ts`, `agents/AudioAgent.ts`, and `agents/TriageAgent.ts` with actual Cactus SDK calls once models are available.

Example:
```typescript
import { Cactus } from 'cactus-react-native';

const model = await Cactus.loadModel('path/to/model.gguf');
const result = await model.predict(input);
```

## Privacy & Storage

- All data is stored locally using MMKV with encryption
- No network calls during capture/processing
- Users can delete all data from settings

## Running the App

1. Start the dev server: `npx expo start --dev-client`
2. Scan QR code with your development build
3. Grant camera, microphone, and sensor permissions
4. Follow the capture flow: Face → Cough → Skin → Tremor
5. View results and export PDF

## Troubleshooting

### MMKV Errors
Ensure you've created a development build with native modules.

### Camera Permission Issues
Check `app.json` for proper permissions configuration.

### Model Loading Fails
Verify model files are accessible and paths are correct in agent files.

## Next Steps

1. Integrate actual Cactus SDK calls in agent files
2. Download and configure AI models
3. Test on physical devices for sensor accuracy
4. Optimize model loading and inference times
5. Add baseline tracking and trend analysis

## Demo Flow

For hackathon demo:
1. Complete one full capture cycle
2. Show offline operation (airplane mode)
3. Export PDF summary
4. Use breathing coach feature
5. Emphasize privacy-first approach
