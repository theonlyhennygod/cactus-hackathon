<div align="center">

# 🩺 Pocket Doctor

### Private, Offline Wellness Checks Powered by On-Device AI

**60-second health check-ins using your phone's sensors and local AI — no cloud, no data sharing, complete privacy.**

[![Built for Cactus Hackathon](https://img.shields.io/badge/Built%20for-Cactus%20x%20Nothing%20x%20HuggingFace%20Hackathon-green?style=for-the-badge)](https://cactus.dev)
[![React Native](https://img.shields.io/badge/React%20Native-Expo%2054-blue?style=for-the-badge&logo=react)](https://expo.dev)
[![On-Device AI](https://img.shields.io/badge/AI-100%25%20On--Device-purple?style=for-the-badge)](https://cactus.dev)

<img src="assets/images/icon.png" alt="Pocket Doctor" width="140" />

[Features](#-features) • [Demo](#-demo) • [Tech Stack](#️-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture)

</div>

---

## 🎯 The Problem

*"Do I need to see a doctor, or can I manage this at home?"*

People often wonder about their health status but face barriers:
- **Privacy concerns** — Don't want health data in the cloud
- **Accessibility** — No immediate access to healthcare professionals
- **Cost** — Unnecessary doctor visits are expensive
- **Time** — Waiting rooms and appointments take hours

## 💡 Our Solution

**Pocket Doctor** is a mobile wellness app that runs comprehensive health check-ins in **under 60 seconds** using only your phone's built-in sensors and **100% on-device AI**. Your health data never leaves your phone.

<div align="center">

### ✨ Key Highlights

| 🔒 **Privacy-First** | ⚡ **Fast** | 🤖 **Smart** | 📊 **Insightful** |
|:---:|:---:|:---:|:---:|
| All processing happens locally | Results in <60 seconds | Multi-modal AI analysis | Track trends over time |

</div>

---

## 🚀 Features

### 📸 Face Scan & PPG Analysis
Captures facial video to analyze skin condition and extract photoplethysmography (PPG) signals for heart rate estimation.

### 🎤 Respiratory Sound Check
Records 10 seconds of breathing/coughing sounds and analyzes patterns using on-device audio classification.

### ✋ Tremor Detection
Uses the accelerometer to measure hand stability and detect potential tremor patterns.

### 🌬️ Guided Breathing Exercise
4-4-4 box breathing routine with haptic feedback and voice guidance to help manage stress.

### 🤖 AI-Powered Triage
Local Qwen3-0.6B LLM generates personalized, non-diagnostic wellness recommendations based on all collected data.

### 📊 Memory & Trend Tracking
Persistent session storage tracks your baseline metrics and shows progress over time with insights like *"Your HRV improved 15% this week!"*

### 📄 PDF Export
Generate shareable wellness reports that can be reviewed offline or shared with healthcare providers.

---

## � Demo

### The 60-Second Wellness Check Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   📸 Face   │ → │   🎤 Audio  │ → │  ✋ Tremor  │ → │  🤖 Triage  │
│    Scan     │    │    Check    │    │  Detection  │    │   Results   │
│   (15s)     │    │   (10s)     │    │   (10s)     │    │   (5s)      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**What you get:**
- Heart Rate & HRV estimates
- Breathing rate analysis
- Tremor index score
- Skin condition assessment
- AI-generated wellness summary
- Severity indicator (Green/Yellow/Red)
- Actionable recommendations

---

## �🏆 Hackathon Tracks

### Track 1: Memory Master ✅
- **Persistent Storage** — MMKV-backed session history
- **Baseline Calculation** — Rolling 7-session averages
- **Trend Insights** — Compare current vs. historical data
- **Smart Feedback** — Contextual messages about your progress

### Track 2: Hybrid Hero ✅
- **Primary** — Local Qwen3-0.6B via Cactus SDK (fully offline)
- **Fallback** — Gemini 2.0 Flash cloud inference when model unavailable
- **Offline Guarantee** — Rule-based triage ensures results even without AI

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:------|:-----------|
| **Framework** | React Native + Expo 54 |
| **Navigation** | Expo Router |
| **AI Inference** | Cactus SDK (`cactus-react-native`) |
| **Local LLM** | Qwen3-0.6B (394MB GGUF) |
| **Cloud Fallback** | Gemini 2.0 Flash |
| **State Management** | Zustand |
| **Storage** | MMKV + AsyncStorage |
| **Animations** | React Native Reanimated 3 |
| **Charts** | Victory Native |
| **UI** | Custom components + Expo Linear Gradient |
| **Sensors** | Expo Camera, Sensors, AV |

</div>

---

## � Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator (or physical device)
- EAS CLI for builds (`npm install -g eas-cli`)

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
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Physical device (via tunnel)
npm run start:tunnel
```

### Building for Distribution

```bash
# Android APK (Preview)
eas build --platform android --profile preview

# iOS (Production/TestFlight)
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 🏗️ Architecture

```
pocket-doctor/
├── app/                        # Expo Router screens
│   ├── _layout.tsx            # Root layout with navigation
│   ├── index.tsx              # Home screen - start check-in
│   ├── check-in.tsx           # Multi-step wellness check flow
│   ├── results.tsx            # Results dashboard + trends
│   └── settings.tsx           # Privacy settings & data management
│
├── agents/                     # AI Agent modules (Agentic Architecture)
│   ├── Orchestrator.ts        # Coordinates all agents
│   ├── VisionAgent.ts         # Face/skin analysis via camera
│   ├── AudioAgent.ts          # Respiratory sound classification
│   ├── EchoLNNAgent.ts        # Time-series analysis (PPG, accelerometer)
│   ├── TriageAgent.ts         # LLM-based recommendations
│   ├── MemoryAgent.ts         # Session history & baseline tracking
│   └── index.ts               # Agent exports
│
├── components/                 # Reusable UI components
│   ├── FaceScan.tsx           # Camera-based face capture
│   ├── AudioRecorder.tsx      # Breathing/cough recorder
│   ├── TremorTest.tsx         # Accelerometer-based tremor detection
│   ├── BreathingExercise.tsx  # Guided breathing with haptics
│   └── ...                    # Additional UI components
│
├── store/                      # Zustand state stores
│   ├── useCheckInStore.ts     # Check-in flow state
│   └── useSettingsStore.ts    # App settings & preferences
│
├── utils/                      # Utility functions
│   ├── modelManager.ts        # Cactus SDK model loading
│   ├── geminiClient.ts        # Cloud fallback client
│   ├── pdfExport.ts           # Report generation
│   └── ...                    # Additional utilities
│
└── docs/                       # Documentation
    ├── prd.md                 # Product Requirements Document
    ├── CACTUS_INTEGRATION.md  # Cactus SDK integration guide
    └── ...                    # Additional docs
```

### Agent Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                            │
│                  (Coordinates all agents)                    │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Vision Agent  │    │ Audio Agent   │    │ EchoLNN Agent │
│ (Face/Skin)   │    │ (Respiratory) │    │ (Time-series) │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────┐
                    │ Triage Agent  │
                    │ (LLM Summary) │
                    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ Memory Agent  │
                    │ (Persistence) │
                    └───────────────┘
```

---

## 🔒 Privacy & Security

<div align="center">

| Feature | Implementation |
|:--------|:---------------|
| **On-Device Processing** | All AI inference runs locally via Cactus SDK |
| **No Cloud Uploads** | Health data never leaves your device |
| **Encrypted Storage** | MMKV with encryption for session history |
| **Zero Telemetry** | No analytics, tracking, or data collection |
| **User Control** | Delete all data anytime from settings |

</div>

---

## ✅ Hackathon Evaluation Criteria

| Criteria | Status | Implementation |
|:---------|:------:|:---------------|
| **Cactus SDK Usage** | ✅ | CactusLM for triage, model management |
| **Edge Capabilities** | ✅ | Offline-first, local inference, data stays on-device |
| **Design & UX** | ✅ | Polished UI, animations, haptics, guided flows |
| **Utility & Innovation** | ✅ | Multi-modal wellness assessment (not a chat app) |
| **Completeness** | ✅ | Functional app with all features working |
| **Memory Track** | ✅ | Persistent storage, baselines, trend insights |
| **Hybrid Track** | ✅ | Local-first with cloud fallback |

---

## 📚 Documentation

- [Product Requirements Document](docs/prd.md)
- [Cactus SDK Integration Guide](docs/CACTUS_INTEGRATION.md)
- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Demo Script](docs/demo_script.md)

---

## 👥 Team

Built with ❤️ for the **Cactus x Nothing x Hugging Face Mobile AI Hackathon** 🌵

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**⚠️ Disclaimer**

*Pocket Doctor provides wellness insights only and is not intended for medical diagnosis, treatment, or professional medical advice. Always consult a qualified healthcare provider for medical concerns.*

</div>
