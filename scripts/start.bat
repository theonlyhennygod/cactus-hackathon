@echo off
REM Pocket Doctor App Startup Script for Windows
REM Usage: start.bat [web|ios|android|tunnel]

echo 🌵 Pocket Doctor App Startup
echo ============================

REM Check if we're in the right directory
if not exist package.json (
    echo Error: Not in the project directory. Please run from project root.
    exit /b 1
)

REM Kill any existing expo processes on port 8081
echo 🔄 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8081" ^| find "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

REM Parse command line argument
set MODE=%1
if "%MODE%"=="" set MODE=tunnel

echo 🚀 Starting in %MODE% mode...

if "%MODE%"=="web" (
    npx expo start --web --clear
) else if "%MODE%"=="ios" (
    npx expo start --ios --clear
) else if "%MODE%"=="android" (
    npx expo start --android --clear
) else if "%MODE%"=="tunnel" (
    npx expo start --tunnel --clear
) else (
    echo Usage: %0 [web^|ios^|android^|tunnel]
    echo   web     - Start in web browser
    echo   ios     - Start in iOS simulator
    echo   android - Start in Android emulator
    echo   tunnel  - Start with tunnel (default)
    exit /b 1
)
