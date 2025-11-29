# 🩺 Pocket Doctor

**Private, Offline Wellness Checks Powered by On-Device AI**

Built for the **Cactus x Nothing x Hugging Face Mobile AI Hackathon** 🌵

<p align="center">
  <img src="assets/images/icon.png" alt="Pocket Doctor" width="120" />
</p>

## 🎯 What is Pocket Doctor?

Pocket Doctor is a mobile wellness app that runs **60-second health check-ins** using only your phone's sensors and on-device AI. **99% of processing happens locally** - no cloud, no data sharing, complete privacy.

### Key Features

- **📸 Face Scan** - Analyzes skin condition and emotional state via on-device vision model
- **🎤 Lung Sound Check** - Records and analyzes breathing patterns with local Whisper STT
- **🌬️ Breathing Exercise** - Guided 4-4-4 box breathing with haptic feedback
- **✋ Tremor Detection** - Measures hand stability via accelerometer + AI analysis
- **🤖 AI Triage** - Local Qwen3 LLM generates personalized wellness recommendations
- **📊 Trend Tracking** - Memory system tracks baselines and shows progress over time

## 🏆 Hackathon Tracks

### Track 1: Memory Master ✅
- Persistent wellness session storage with MMKV
- Baseline calculation from last 7 sessions
- Trend insights comparing current vs. historical data
- "Your HRV improved 15% this week!" style feedback

### Track 2: Edge AI Champion ✅
- **100% Local Vision**: Face/skin analysis via Cactus Vision (lfm2-vl-450m)
- **100% Local Audio**: Whisper Small for cough/breathing via CactusSTT
- **100% Local Triage**: Qwen3-0.6B generates wellness recommendations on-device
- **100% Local Emotion**: Facial expression analysis without cloud
- **Tremor Analysis**: Gemini 2.0 Flash for advanced tremor pattern recognition
- **Offline Guarantee**: Rule-based fallbacks when models unavailable

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo 54 |
| AI Inference | **Cactus SDK** (`cactus-react-native` v1.2.0) |
| Local LLM | Qwen3-0.6B via CactusLM |
| Local Vision | LFM2-VL-450M via CactusLM |
| Local STT | Whisper Small via CactusSTT |
| Tremor AI | Gemini 2.0 Flash (cloud) |
| State Management | Zustand 5.0 |
| Storage | MMKV (encrypted) |
| Animations | Reanimated 3 |
| UI | Custom components with Linear Gradients |

## 🔒 Privacy & Edge AI

| Agent | Processing | Data Leaves Device? |
|-------|------------|---------------------|
| **Vision (Face/Skin)** | 🟢 100% Local | ❌ Never |
| **Audio (Breathing)** | 🟢 100% Local | ❌ Never |
| **Emotion Detection** | 🟢 100% Local | ❌ Never |
| **Triage (Wellness AI)** | 🟢 100% Local | ❌ Never |
| **Memory/History** | 🟢 100% Local | ❌ Never |
| **Tremor Analysis** | 🟡 Cloud AI | ⚠️ Accelerometer stats only |

> **Note**: Only anonymized accelerometer statistics (avg, variance) are sent for tremor analysis. No personal data, images, or audio ever leave the device.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)
- Xcode 15+ (for iOS builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/theonlyhennygod/cactus-hackathon.git
cd cactus-hackathon

# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start development server
npx expo start
```

### Running on Device

```bash
# iOS (requires Xcode)
npx expo run:ios

# Android
npx expo run:android

# With tunnel (for physical devices on different network)
EXPO_PACKAGER_PROXY_URL=<ngrok-url> npx expo run:ios --port 8081
```

## 📱 Building for Submission

### Android APK

```bash
# Login to Expo
eas login

# Build preview APK
eas build --platform android --profile preview
```

### iOS Simulator Build (Local)

```bash
eas build --platform ios --profile simulator --local
```

### iOS Device (Requires Apple Developer Account)

```bash
eas build --platform ios --profile preview
```

## 🏗️ Architecture

```
pocket-doctor/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Home screen with wellness score
│   ├── check-in.tsx       # 60-second wellness check flow
│   ├── results.tsx        # Results + AI recommendations + trends
│   └── settings.tsx       # App settings
├── agents/                 # AI Agent modules (Cactus SDK)
│   ├── TriageAgent.ts     # Qwen3 LLM recommendations (LOCAL)
│   ├── VisionAgent.ts     # LFM2-VL face/skin analysis (LOCAL)
│   ├── AudioAgent.ts      # Whisper breathing analysis (LOCAL)
│   ├── EmotionAgent.ts    # Facial emotion detection (LOCAL)
│   ├── EchoLNNAgent.ts    # HR/HRV + Gemini tremor (HYBRID)
│   ├── MemoryAgent.ts     # Session history & baselines (LOCAL)
│   └── Orchestrator.ts    # Coordinates all agents
├── components/             # Reusable UI components
│   ├── ui/                # Buttons, Cards, Progress indicators
│   ├── CaptureFlow.tsx    # Camera/mic capture wizard
│   └── BreathingCoach.tsx # Animated breathing guide
├── utils/
│   ├── modelManager.ts    # Cactus SDK model loading & caching
│   └── pdfExport.ts       # Wellness report PDF generation
├── store/                  # Zustand state management
│   ├── index.ts           # App state & actions
│   └── mmkv.ts            # Encrypted persistent storage
└── hooks/
    └── useNetworkStatus.ts # Offline detection
```

## 📋 Evaluation Criteria

| Criteria | Score | Implementation |
|----------|-------|---------------|
| **Technical (Cactus SDK)** | 9/10 | CactusLM (Qwen3, LFM2-VL), CactusSTT (Whisper) |
| **Edge Capabilities** | 9/10 | 5/6 agents 100% local, only tremor uses cloud |
| **Design & UX** | 8/10 | Polished UI, animations, haptics, guided flows |
| **Utility & Innovation** | 8/10 | Multi-modal wellness, not a chat app |
| **Completeness** | ✅ | Functional build, all features working |

## 🔧 Cactus SDK Integration

```typescript
// Loading models via Cactus SDK
import { CactusLM, CactusSTT } from 'cactus-react-native';

// Triage Agent - Qwen3 for wellness recommendations
const lm = await CactusLM.init({ model: 'qwen3-0.6' });
const response = await lm.complete({
    messages: [{ role: 'user', content: prompt }],
    options: { maxTokens: 500, temperature: 0.0 }
});

// Vision Agent - LFM2-VL for face/skin analysis
const visionLm = await CactusLM.init({ model: 'lfm2-vl-450m' });
const analysis = await visionLm.complete({
    messages: [{ role: 'user', content: prompt, image: base64Image }]
});

// Audio Agent - Whisper for speech-to-text
const stt = await CactusSTT.init({ model: 'whisper-small' });
const transcript = await stt.transcribe({ audioPath: filePath });
```

## 👥 Team

Built with ❤️ for the Cactus Mobile AI Hackathon

## 📄 License

MIT License - See LICENSE for details

---

*Pocket Doctor provides wellness insights only and is not intended for medical diagnosis. Always consult healthcare professionals for medical advice.*
