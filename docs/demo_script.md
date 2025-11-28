# Pocket Doctor - Demo Script (60-90s)

## Intro (0:00 - 0:15)
"Hi, I'm [Name]. This is **Pocket Doctor**, an offline-first, privacy-focused triage app powered by on-device agents and Echo-LNN."
*Action: Show Home Screen.*
"We solve the problem of 'do I need a doctor?' without sending your data to the cloud."

## The Flow (0:15 - 0:45)
"Let's do a live check-in."
*Action: Tap 'Start Check-In'*

1.  **Face (Vision Agent):** "First, it uses the camera to analyze my face for PPG signals."
    *Action: Show Face UI, wait for circle to complete.*
2.  **Cough (Audio Agent):** "Next, it listens for respiratory markers."
    *Action: Cough 3 times.*
3.  **Tremor (Echo-LNN):** "Finally, it uses the accelerometer to detect tremors."
    *Action: Hold phone steady.*

## Results & Triage (0:45 - 0:60)
*Action: Screen transitions to 'Processing' then 'Results'.*
"All this data is processed locally. Here we see my Heart Rate, HRV, and a Tremor Index."
"The Triage Agent (Qwen3-600M) gives me a summary: 'Monitor hydration, looks good'."

## Coach & Export (1:00 - 1:15)
"If I'm stressed, I can start the Breathing Coach."
*Action: Tap 'Start Breathing Coach'. Show animation.*
"And I can export a PDF to share with my doctor, completely offline."
*Action: Tap 'Export PDF'. Show share sheet.*

## Outro (1:15 - 1:30)
"That's Pocket Doctor. Private, multimodal, and fast. Built with Expo and Cactus. Thank you."
