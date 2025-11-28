# Quick Reference - Pocket Wellness

## Project Structure

```
cactus-hackathon/
├── app/                      # Expo Router screens
│   ├── index.tsx            # Home screen with CaptureFlow
│   ├── results.tsx          # Results & recommendations
│   ├── settings.tsx         # Settings (privacy, data deletion)
│   └── (tabs)/              # Tab navigation
├── agents/                   # AI agent system
│   ├── Orchestrator.ts      # Coordinates all agents
│   ├── VisionAgent.ts       # Face/skin analysis
│   ├── AudioAgent.ts        # Cough/breathing analysis
│   ├── EchoLNNAgent.ts      # PPG/tremor time-series
│   ├── TriageAgent.ts       # LLM recommendations
│   └── MemoryAgent.ts       # Session storage & baselines
├── components/              # React components
│   ├── CaptureFlow.tsx      # Multi-step capture UI
│   └── BreathingCoach.tsx   # TTS breathing exercises
├── store/                   # Zustand state management
│   ├── index.ts             # CheckIn, Vitals, Settings stores
│   └── mmkv.ts              # Encrypted storage adapter
├── utils/                   # Helper utilities
│   ├── pdfExport.ts         # PDF generation & sharing
│   └── sensorHelpers.ts     # Accelerometer data collection
└── docs/                    # Documentation
    ├── prd.md               # Product Requirements Document
    ├── SETUP.md             # Setup instructions
    ├── CACTUS_INTEGRATION.md # Model integration guide
    └── DEVELOPMENT_ROADMAP.md # Progress tracking
```

## Key Files

### Capture Flow
**File:** `components/CaptureFlow.tsx`
- Handles 4-step capture: Face → Cough → Skin → Tremor
- Collects camera frames, audio, accelerometer data
- Triggers orchestrator when complete

### Orchestrator
**File:** `agents/Orchestrator.ts`
- Entry point for wellness check processing
- Coordinates perception agents (Vision, Audio, Echo-LNN)
- Runs triage agent for recommendations
- Saves session via Memory agent

### Results Screen
**File:** `app/results.tsx`
- Displays vitals (HR, HRV, breathing, tremor)
- Shows triage summary with severity color
- Lists actionable recommendations
- Provides breathing coach and PDF export

## State Management

### useCheckInStore
```typescript
{
  step: 'face' | 'cough' | 'skin' | 'tremor' | 'processing' | 'results',
  isCapturing: boolean,
  setStep: (step) => void,
  setIsCapturing: (capturing) => void,
  reset: () => void
}
```

### useVitalsStore
```typescript
{
  heartRate: number | null,
  hrv: number | null,
  breathingRate: number | null,
  tremorIndex: number | null,
  coughType: string | null,
  triageSummary: string | null,
  triageSeverity: 'green' | 'yellow' | 'red' | null,
  triageRecommendations: string[],
  setVitals: (vitals) => void,
  reset: () => void
}
```

### useSettingsStore
```typescript
{
  hasCompletedOnboarding: boolean,
  isPrivacyMode: boolean,
  setHasCompletedOnboarding: (val) => void,
  togglePrivacyMode: () => void
}
```

## Agent Interfaces

### VisionAgent
```typescript
analyzeImage(imageUri: string): Promise<{
  skinCondition?: string,
  faceAttributes?: { expression?: string },
  confidence: number
}>
```

### AudioAgent
```typescript
analyzeAudio(audioUri: string): Promise<{
  breathingRate: number,
  coughType: 'dry' | 'wet' | 'none',
  confidence: number
}>
```

### EchoLNNAgent
```typescript
analyzeTimeSeries(ppgData: number[], accelData: AccelerometerData[]): Promise<{
  heartRate: number,
  hrv: number,
  tremorIndex: number,
  quality: number
}>
```

### TriageAgent
```typescript
generateTriage(vitals, visionResult, audioResult): Promise<{
  summary: string,
  severity: 'green' | 'yellow' | 'red',
  recommendations: string[]
}>
```

### MemoryAgent
```typescript
saveSession(session: WellnessSession): Promise<void>
getHistory(): Promise<WellnessSession[]>
getBaseline(): Promise<any>
```

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server (requires dev build, not Expo Go)
npx expo start --dev-client

# Type check
npx tsc --noEmit

# Clear cache
npx expo start -c

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Run on specific platform
npm run ios
npm run android
```

## Environment Variables

None currently required. All processing is local/offline.

## Permissions Required

Configure in `app.json`:
- Camera (front & back)
- Microphone
- Motion sensors (accelerometer)
- File system (for PDF export)

## Data Flow

```
1. User starts capture
   ↓
2. CaptureFlow collects:
   - Face photo (for PPG)
   - Audio recording (cough/breathing)
   - Skin photo (optional)
   - Accelerometer data (tremor)
   ↓
3. Orchestrator processes:
   - VisionAgent → skin/face features
   - AudioAgent → breathing rate, cough type
   - EchoLNNAgent → HR, HRV, tremor index
   ↓
4. TriageAgent generates:
   - Summary
   - Severity (green/yellow/red)
   - Recommendations
   ↓
5. MemoryAgent saves session
   ↓
6. Results displayed to user
   ↓
7. User can:
   - Start breathing coach
   - Export PDF
   - Start new check-in
```

## Debugging Tips

### Check if model is loading
```typescript
console.log('Model loaded:', !!model);
```

### Inspect captured data
```typescript
console.log('Captured:', {
  faceUri: capturedData.faceImageUri,
  audioUri: capturedData.audioUri,
  accelPoints: capturedData.accelData?.length
});
```

### Verify vitals update
```typescript
const vitals = useVitalsStore.getState();
console.log('Current vitals:', vitals);
```

### Test PDF generation
```typescript
await generateAndSharePDF(mockVitals);
```

## API Reference (Mock)

Currently, all agents return mock data. See `docs/CACTUS_INTEGRATION.md` for integrating real models.

## Privacy Checklist

- [x] No network calls during capture/processing
- [x] MMKV encryption enabled
- [x] Data stored locally only
- [x] PDF export is user-triggered
- [x] Non-diagnostic language used
- [ ] User can delete all data (implement in settings)
- [ ] Consent/disclaimer shown on first use

## Demo Script (60-90s)

1. **Intro (10s)**: "Private wellness check - all offline, all on-device"
2. **Enable airplane mode** to prove privacy
3. **Start capture** (30s total):
   - Face: 10s
   - Cough: 10s  
   - Skin: 5s
   - Tremor: 10s
4. **Processing** (5s): Show animation
5. **Results** (20s):
   - Point out vitals
   - Highlight color-coded triage
   - Read one recommendation
6. **Breathing coach** (10s): Start session, show animation
7. **Export PDF** (10s): Generate and show summary
8. **Conclusion** (5s): "All data stays on your device. No cloud required."

## Troubleshooting

### "Cannot find module 'zustand'"
Run: `npm install`

### "Expo Go is not supported"
Create a development build with `eas build`

### Camera not working
1. Check permissions in `app.json`
2. Grant permissions when prompted
3. Test on physical device (simulator may have issues)

### PDF not exporting
1. Check expo-print and expo-sharing are installed
2. Verify file system permissions
3. Test on physical device

### Models not loading
1. Check model file paths
2. Verify models are bundled or downloaded
3. See `docs/CACTUS_INTEGRATION.md`

## Next Steps

1. Run `npm install` to resolve dependencies
2. Create development build with EAS
3. Test capture flow on device
4. Integrate actual AI models (see CACTUS_INTEGRATION.md)
5. Optimize performance
6. Polish UI/UX
7. Prepare demo
