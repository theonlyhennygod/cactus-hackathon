# 🩺 Pocket Doctor

**Private, Offline Wellness Checks Powered by On-Device AI**

Built for the **Cactus x Nothing x Hugging Face Mobile AI Hackathon** 🌵

<p align="center">
  <img src="assets/images/icon.png" alt="Pocket Doctor" width="120" />
</p>

## 🎯 What is Pocket Doctor?

Pocket Doctor is a mobile wellness app that runs **60-second health check-ins** using only your phone's sensors and on-device AI. No cloud, no data sharing, complete privacy.

### Key Features

- **📸 Face Scan** - Analyzes skin condition and captures PPG signals
- **🎤 Lung Sound Check** - Records and analyzes breathing patterns
- **🌬️ Breathing Exercise** - Guided 4-4-4 box breathing with haptic feedback
- **✋ Tremor Detection** - Measures hand stability via accelerometer
- **🤖 AI Triage** - Local LLM generates personalized wellness recommendations
- **📊 Trend Tracking** - Memory system tracks baselines and shows progress

## 🏆 Hackathon Tracks

### Track 1: Memory Master ✅
- Persistent wellness session storage with MMKV
- Baseline calculation from last 7 sessions
- Trend insights comparing current vs. historical data
- "Your HRV improved 15% this week!" style feedback

### Track 2: Hybrid Hero ✅
- **Primary**: Local Qwen3-0.6B model via Cactus SDK
- **Fallback**: Gemini 2.0 Flash cloud inference when offline model unavailable
- **Offline Guarantee**: Rule-based triage when both unavailable

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo |
| AI Inference | **Cactus SDK** (`cactus-react-native`) |
| Local LLM | Qwen3-0.6B (394MB GGUF) |
| Speech-to-Text | Whisper Small via CactusSTT |
| Cloud Fallback | Gemini 2.0 Flash |
| State Management | Zustand |
| Storage | MMKV / AsyncStorage |
| Animations | Reanimated 3 |
| UI | Custom components with Linear Gradients |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pocket-doctor.git
cd pocket-doctor

# Install dependencies
npm install

# Start development server
npx expo start
```

### Running on Device

```bash
# iOS
npm run ios

# Android
npm run android

# With tunnel (for physical devices)
npm run start:tunnel
```

## 📱 Building for Submission

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK
eas build --platform android --profile preview
```

### iOS (TestFlight)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## 🏗️ Architecture

```
pocket-doctor/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Home screen
│   ├── check-in.tsx       # Wellness check flow
│   ├── results.tsx        # Results + trends
│   └── settings.tsx       # App settings
├── agents/                 # AI Agent modules
│   ├── TriageAgent.ts     # LLM-based recommendations
│   ├── VisionAgent.ts     # Face/skin analysis
│   ├── AudioAgent.ts      # Cough/breathing analysis
│   ├── EchoLNNAgent.ts    # Time-series (PPG, accel)
│   ├── MemoryAgent.ts     # Session history & baselines
│   └── Orchestrator.ts    # Coordinates all agents
├── components/             # Reusable UI components
├── utils/
│   ├── modelManager.ts    # Cactus SDK model loading
│   ├── geminiClient.ts    # Cloud fallback
│   └── pdfExport.ts       # Report generation
└── store/                  # Zustand stores
```

## 🔒 Privacy & Security

- **100% On-Device Processing** - No health data ever leaves your phone
- **Local-First AI** - Qwen3 model runs entirely on-device
- **Secure Storage** - MMKV encrypted storage for session history
- **No Analytics** - Zero tracking or telemetry

## 📋 Evaluation Criteria Met

| Criteria | Implementation |
|----------|---------------|
| **Cactus SDK** | ✅ CactusLM for triage, CactusSTT for audio |
| **Edge Capabilities** | ✅ Offline mode, local inference, data stays on-device |
| **Design & UX** | ✅ Polished UI with animations, haptics, guided flows |
| **Utility & Innovation** | ✅ Not a chat app - multi-modal wellness assessment |
| **Completeness** | ✅ Functional APK with all features working |

## 👥 Team

Built with ❤️ for the Cactus Mobile AI Hackathon

## 📄 License

MIT License - See LICENSE for details

---

*Pocket Doctor provides wellness insights only and is not intended for medical diagnosis.*
