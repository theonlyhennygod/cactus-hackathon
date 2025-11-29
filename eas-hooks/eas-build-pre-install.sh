#!/bin/bash

# EAS Build hook to configure Android for 64-bit only (Cactus SDK requirement)

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  echo "🔧 Configuring Android for 64-bit only architectures..."
  
  # Ensure gradle.properties has 64-bit only
  if [ -f "android/gradle.properties" ]; then
    # Replace the reactNativeArchitectures line
    sed -i 's/reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' android/gradle.properties
    echo "✅ Updated gradle.properties"
  fi
  
  # Add subprojects configuration to build.gradle if not present
  if [ -f "android/build.gradle" ] && ! grep -q "abiFilters 'arm64-v8a'" android/build.gradle; then
    # Insert before the last line (apply plugin statements)
    sed -i '/apply plugin: "expo-root-project"/i \
// Force all modules to build only 64-bit architectures (Cactus SDK requirement)\
subprojects {\
    afterEvaluate { project ->\
        if (project.hasProperty('\''android'\'')) {\
            project.android {\
                defaultConfig {\
                    ndk {\
                        abiFilters '\''arm64-v8a'\''\
                    }\
                }\
            }\
        }\
    }\
}\
' android/build.gradle
    echo "✅ Updated build.gradle"
  fi
  
  echo "✅ Android 64-bit configuration complete"
fi
