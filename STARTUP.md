# Pocket Doctor App Startup Guide

## Quick Start Options

### 1. Using Scripts (Recommended)

**macOS/Linux:**
```bash
# Start with tunnel (for phone access)
./start.sh

# Or specify mode
./start.sh web      # Web browser
./start.sh ios      # iOS simulator
./start.sh android  # Android emulator
```

**Windows:**
```cmd
# Start with tunnel (for phone access)
start.bat

# Or specify mode
start.bat web      # Web browser
start.bat ios      # iOS simulator
start.bat android  # Android emulator
```

### 2. Using npm Scripts

```bash
# Tunnel mode (phone access)
npm run start:tunnel

# Web browser
npm run start:web

# iOS simulator
npm run start:ios

# Android emulator
npm run start:android

# Regular start
npm start
```

### 3. Manual Start

```bash
# Clean start with tunnel
npx expo start --tunnel --clear

# Web only
npx expo start --web --clear

# iOS simulator
npx expo start --ios --clear
```

## What Each Mode Does

| Mode | Description | Use Case |
|------|-------------|----------|
| **Tunnel** | Creates public URL for phone access | Testing on physical device |
| **Web** | Opens in browser | Quick UI testing |
| **iOS** | Opens in iOS simulator | iOS-specific testing |
| **Android** | Opens in Android emulator | Android-specific testing |

## Troubleshooting

### Port Already in Use?
The startup scripts automatically kill processes on port 8081. If you still have issues:

```bash
# Kill all expo processes
pkill -f "expo start"

# Or manually kill port 8081
lsof -ti:8081 | xargs kill -9
```

### Dependencies Missing?
```bash
npm install
```

### TypeScript Errors?
```bash
npm run type-check
```

### Metro Cache Issues?
```bash
npx expo start --clear
```

## Development Workflow

1. **Make changes** to your code
2. **Save files** - Metro automatically reloads
3. **Use the app** - Press `r` in terminal to reload manually
4. **Debug** - Press `j` to open debugger
5. **Menu** - Press `m` to toggle developer menu

## Physical Device Setup

1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. Or use tunnel URL if on same network

For development builds (recommended):
1. Build with `npx expo run:ios` or `npx expo run:android`
2. Install the development build on your device
3. Connect via tunnel URL for hot reload
