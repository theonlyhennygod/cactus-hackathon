# Pocket Doctor — PRD
**Codename:** Pocket Doctor / Echo-LNN Edition
**Stack:** Expo React Native (prebuild/EAS), cactus-react-native, Hugging Face models, zustand for state, MMKV/SQLite for local storage
**Purpose:** Private, offline-first multimodal wellness triage app analyzing camera, audio, and inertial sensors on-device using agent workflows and Echo-LNN time-series engine. Hackathon-ready and demo-focused.

## 1 — Vision & Goals
**Vision:** Provide users a private, instant “wellness check” anywhere — offline, zero latency, actionable guidance via coordinated agents.

**Primary Goals**
*   Demonstrate on-device multimodal AI (vision + audio + time-series).
*   Showcase Echo-LNN analytics (PPG, breathing, tremor).
*   Hackathon demo: polished, fast, privacy-first.

**Secondary Goals**
*   Ship reproducible Expo build (.apk / TestFlight).
*   Provide shareable, physician-friendly offline PDF summary.

## 2 — Success Metrics
*   **Demo latency:** Full check-in UI results <5s on target device.
*   **Demo completeness:** Capture → inference → triage → coaching in one flow.
*   **Privacy proof:** No network traffic during demo.
*   **Polish:** Clean UI, animations, TTS breathing coach.
*   **Functionality:** Echo-LNN outputs HR/HRV, breathing rate, tremor index; triage agent returns actionable, non-diagnostic guidance.

## 3 — Product Scope
**MVP**
*   **Single check-in:** face video (PPG), 10s cough/breath audio, accelerometer tremor capture, skin/photo.
*   **On-device agents:** Vision, Audio, Echo-LNN, Analysis, Triage, Memory, Coach.
*   **Local LLM for triage** (Qwen3-600M or similar).
*   **Encrypted local storage** (MMKV/SQLite).
*   **Exportable offline PDF summary.**
*   **zustand state stores:** `useCheckInStore`, `useVitalsStore`, `useSettingsStore`.
*   **UX:** guided overlays, confidence indicators, dashboard, start coaching button.

**Stretch (nice-to-have)**
*   Trend graphs & baseline comparisons.
*   OCR for medication labels.
*   Optional hybrid cloud fallback.
*   Gamification/streaks.
*   Teleconsult share option (opt-in).

## 4 — User Stories
*   **User:** quick wellness check to know self-care vs. medical attention.
*   **User:** privacy-focused, data stays on device.
*   **User:** short guided breathing routine for stress.
*   **Clinician:** shareable, offline PDF summary.

## 5 — High-level Architecture
*   **Frontend:** Expo React Native, zustand, React Navigation
*   **Native Inference:** cactus-react-native + Echo-LNN (gguf/q4/q8)
*   **Models:** Vision (Liquid LFM small), Audio (tiny classifier), Triage LLM (Qwen3-600M), small embedding model
*   **Storage:** MMKV (encrypted) + SQLite/sqlcipher
*   **Agents Orchestration:** Orchestrator → perception agents → Analysis → Triage → Coach → Memory
*   **Export:** React Native PDF library
*   **Dev Flow:** EAS Build (Expo Go cannot host Cactus native SDK)

## 6 — Agent Definitions
*   **Orchestrator Agent:** sequences sub-agents.
*   **Vision Agent:** image analysis → structured features.
*   **Audio Agent:** cough classifier + breathing envelope.
*   **Echo-LNN Agent:** time-series PPG/audio/accelerometer → HR/HRV/tremor.
*   **Analysis Agent:** normalize, baseline compare, composite indicators.
*   **Triage Agent:** LLM-driven summary + severity flag + recommendations.
*   **Coach Agent:** guided exercises (TTS/animation).
*   **Memory Agent:** stores/retrieves personal baseline trends.

## 7 — Features & Implementation
**A. Quick Check-In Capture**
*   UI with guided overlays (camera/mic/accelerometer)
*   Capture bindings → preprocess frames/audio
*   **Acceptance:** Capture completes, quality indicator shown

**B. Vision Analysis**
*   Integrate Liquid LFM via Cactus
*   Crop, normalize, run inference
*   **Acceptance:** Returns structured JSON

**C. Audio & Respiratory**
*   10s audio recorder, preprocess envelope/RMS
*   Run classifier on-device
*   **Acceptance:** Returns breathing rate & cough type

**D. Echo-LNN**
*   PPG pipeline + bandpass filter
*   Feed time-series to Echo-LNN
*   Accelerometer tremor capture → Echo-LNN
*   **Acceptance:** Returns HR/HRV/tremor index with quality ≥ threshold

**E. Triage (LLM)**
*   Setup local Qwen3-600M
*   Non-diagnostic prompt wrappers → recommendations
*   **Acceptance:** Summary + actionable step

**F. Memory & Baseline**
*   MMKV storage, compute baseline
*   Compare subsequent sessions to baseline
*   **Acceptance:** Baseline persists & deviations detected

**G. Export PDF**
*   Collect session → render PDF, include graphs
*   **Acceptance:** PDF contains timestamp, vitals, summary, shareable locally

## 8 — UX / Wireframes
*   **Home:** Start Check-In + recent summary
*   **Capture Guide:** stepper: Face → Cough → Skin → Tremor
*   **Processing:** animated inference status
*   **Results:** Green/Yellow/Red summary, vitals, Echo-LNN waveform, start coaching, export PDF
*   **History:** timeline with trend sparklines
*   **Settings:** privacy, delete data, cloud opt-in, permissions

## 9 — Security & Privacy
*   **Default:** no cloud; encrypted local storage
*   **Explicit opt-in** for sharing/backup
*   **Consent/legal copy:** “Non-diagnostic wellness insights”
*   **“Delete all data”** button
*   **Only structured observations logged**

## 10 — Testing & QA
*   **Devices:** flagship Android + iPhone
*   **Unit tests:** Zustand stores, agent logic, preprocessing
*   **Integration tests:** end-to-end flow
*   **Performance tests:** memory/latency, model load
*   **Edge cases:** poor lighting, noisy audio, partial sensors → graceful handling

## 11 — Risks & Mitigations
*   **Native build issues:** prebuild/EAS early
*   **Memory/OOM:** quantized models, stream smaller models
*   **Regulatory:** no diagnostic language
*   **False positives:** show confidence, instruct next steps
*   **Trust:** privacy-first UI

## 12 — Team Roles
*   **Frontend/UX:** RN screens, Zustand stores, PDF export, demo polish
*   **Native/Cactus:** native SDK integration, Echo-LNN pipeline
*   **ML/Agents:** model selection, agent orchestration, prompt templates, triage tuning

## 13 — Implementation Steps
**Phase A — Setup & Infra**
*   Expo + Git repo
*   Zustand stores skeleton
*   Configure EAS/prebuild
*   Install cactus-react-native

**Phase B — Capture & Preprocessing**
*   Guided capture UI
*   Accelerometer helper
*   Preprocessing utilities

**Phase C — Perception Agents**
*   Vision model integration
*   Audio classifier integration
*   Echo-LNN pipeline

**Phase D — Orchestration & LLM**
*   Orchestrator agent wiring
*   Qwen3-600M integration
*   Memory agent

**Phase E — Results & Coach**
*   Dashboard & graphs
*   Coach agent TTS/animation
*   PDF export

**Phase F — Polish & Demo**
*   Model loading optimization
*   Privacy copy & settings
*   Physical device testing
*   Demo script & slides

## 14 — Demo Script (60–90s)
*   “Private wellness check — offline”
*   Press Start → Face + Cough + Skin + Tremor
*   Processing → model icons animate
*   Results: HR 72, HRV OK, breathing 18, cough dry-like; triage: “Monitor, hydrate, 48hr follow-up”
*   Start Breathing Coach → 60s TTS routine
*   Export PDF → show summary locally

## 15 — Acceptance Criteria
*   Capture → triage flow runs offline
*   Echo-LNN outputs HR/HRV
*   App builds to APK/IPA
*   Data encrypted locally, deletable

## 16 — Next Steps
*   Generate file/folder skeleton with Zustand stores & agent stubs
*   Draft Orchestrator Agent pseudo-code & Echo-LNN I/O schema
*   Prepare 60s pitch deck & demo checklist
