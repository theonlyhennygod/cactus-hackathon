# Development Roadmap - Pocket Wellness

## ✅ Completed

### Phase 1: Core Infrastructure
- [x] Zustand store setup (CheckIn, Vitals, Settings)
- [x] MMKV encrypted storage integration
- [x] React Navigation routing structure
- [x] TypeScript configuration

### Phase 2: Capture Flow
- [x] Multi-step capture UI (Face → Cough → Skin → Tremor)
- [x] Camera integration with expo-camera
- [x] Audio recording with expo-av
- [x] Accelerometer data collection
- [x] Permission handling

### Phase 3: Agent System
- [x] Orchestrator agent (coordinates all agents)
- [x] Vision Agent (face/skin analysis stub)
- [x] Audio Agent (cough/breathing analysis stub)
- [x] Echo-LNN Agent (time-series PPG/tremor stub)
- [x] Triage Agent (LLM-based recommendations stub)
- [x] Memory Agent (session storage & baseline tracking)

### Phase 4: Results & Export
- [x] Results screen with vitals display
- [x] Triage summary with severity indicators
- [x] Color-coded recommendations
- [x] PDF export with complete wellness summary
- [x] Breathing coach with TTS and animations

### Phase 5: Documentation
- [x] Setup guide (SETUP.md)
- [x] Cactus SDK integration guide
- [x] PRD reference documentation

## 🚧 In Progress

### Phase 6: Cactus SDK Integration
- [ ] Download/acquire AI models
  - Liquid LFM Small (vision)
  - Audio classifier (cough detection)
  - Qwen3-600M (triage LLM)
  - Echo-LNN engine (time-series)
- [ ] Implement actual Cactus SDK calls in agents
- [ ] Test model loading and inference
- [ ] Optimize model performance

## 📋 Next Steps

### Phase 7: Native Build & Testing
- [ ] Configure EAS Build
- [ ] Create development build for iOS
- [ ] Create development build for Android
- [ ] Test on physical devices
- [ ] Optimize capture quality (lighting, audio, sensors)

### Phase 8: PPG Implementation
- [ ] Extract PPG signal from face video frames
- [ ] Implement bandpass filter
- [ ] Feed time-series to Echo-LNN
- [ ] Validate HR/HRV accuracy

### Phase 9: Polish & UX
- [ ] Add loading states and progress indicators
- [ ] Implement confidence thresholds
- [ ] Add data quality warnings
- [ ] Create onboarding flow
- [ ] Add settings screen (privacy, data deletion)
- [ ] Improve animations and transitions

### Phase 10: Advanced Features
- [ ] Trend graphs and sparklines
- [ ] Baseline comparison with previous sessions
- [ ] History timeline view
- [ ] OCR for medication labels (stretch)
- [ ] Offline model updates (stretch)

### Phase 11: Demo Preparation
- [ ] Create demo script (60-90 seconds)
- [ ] Prepare sample data for consistent demos
- [ ] Test offline mode (airplane mode)
- [ ] Create pitch deck slides
- [ ] Record demo video
- [ ] Test PDF sharing workflow

### Phase 12: Production Readiness
- [ ] Add error boundaries
- [ ] Implement analytics (privacy-safe)
- [ ] Add crash reporting
- [ ] Security audit (encryption keys, storage)
- [ ] Performance profiling
- [ ] Battery usage optimization

## 🎯 Hackathon Demo Checklist

**Must-Have for Demo:**
- [x] Complete capture flow (all 4 steps)
- [x] Offline processing with mock data
- [x] Results screen with recommendations
- [x] PDF export functionality
- [x] Breathing coach feature
- [ ] Native build running on device
- [ ] Professional UI polish

**Nice-to-Have:**
- [ ] Real AI model inference
- [ ] Actual PPG signal processing
- [ ] History/trends view
- [ ] Settings screen

**Demo Flow (60 seconds):**
1. Show app in airplane mode (privacy proof)
2. Start wellness check
3. Capture face (10s)
4. Record cough audio (10s)
5. Take skin photo (optional)
6. Capture tremor data (10s)
7. Show processing animation
8. Display results with color-coded triage
9. Start breathing coach (5 seconds)
10. Export PDF summary
11. Show PDF with all data

## 🐛 Known Issues

1. **TypeScript errors** - Need to run `npm install` to resolve module imports
2. **Cactus SDK** - Stub implementations need real model integration
3. **PPG extraction** - Need to implement frame-by-frame brightness analysis
4. **Model files** - Not yet downloaded/configured

## 🔧 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server (requires dev build)
npx expo start --dev-client

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Run tests (when implemented)
npm test

# Type check
npx tsc --noEmit
```

## 📊 Success Metrics (from PRD)

- **Demo latency:** Full check-in UI results <5s ⏱️
- **Demo completeness:** Capture → inference → triage → coaching in one flow ✅
- **Privacy proof:** No network traffic during demo 🔒
- **Polish:** Clean UI, animations, TTS breathing coach ✨
- **Functionality:** Echo-LNN outputs HR/HRV, breathing rate, tremor index 📈

## 🎓 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Cactus React Native Docs](https://docs.cactus.ai/) (if available)
- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [Zustand State Management](https://github.com/pmndrs/zustand)

## 💡 Tips

1. **Test incrementally** - Don't wait to test everything at once
2. **Mock first, integrate later** - Current mock implementations let you build UI/UX first
3. **Profile performance** - Use React DevTools and Xcode Instruments
4. **Privacy first** - Always emphasize offline-first, local storage, encrypted data
5. **Non-diagnostic language** - Never claim medical diagnosis capabilities
