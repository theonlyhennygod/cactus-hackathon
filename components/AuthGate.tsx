import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';

// Dynamic import for local authentication (not available in Expo Go)
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  console.log('LocalAuthentication not available');
}

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    // If LocalAuthentication is not available (Expo Go), skip auth
    if (!LocalAuthentication) {
      console.log('🔓 LocalAuthentication not available, skipping auth');
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        // No biometric available, allow access
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Get biometric type
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      }

      // Auto-prompt on launch
      authenticate();
    } catch (err) {
      console.log('Biometric check error:', err);
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    if (!LocalAuthentication) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Pocket Doctor - Your health data is protected',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        console.log('🔓 Authentication successful');
      } else {
        setError('Authentication failed. Please try again.');
        console.log('🔒 Authentication failed:', result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[palette.primary[50], palette.primary[100]]}
        style={styles.gradient}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
          {/* Lock Icon */}
          <Animated.View 
            entering={FadeInUp.delay(100).duration(500).springify()}
            style={styles.iconContainer}
          >
            <LinearGradient
              colors={[palette.primary[400], palette.primary[600]]}
              style={styles.iconGradient}
            >
              <Ionicons name="shield-checkmark" size={48} color={palette.white} />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Animated.Text 
            entering={FadeInUp.delay(200).duration(500).springify()}
            style={styles.title}
          >
            Pocket Doctor
          </Animated.Text>

          <Animated.Text 
            entering={FadeInUp.delay(300).duration(500).springify()}
            style={styles.subtitle}
          >
            Your health data is protected with {biometricType}
          </Animated.Text>

          {/* Error Message */}
          {error && (
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={styles.errorContainer}
            >
              <Ionicons name="alert-circle" size={16} color={palette.danger[500]} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Unlock Button */}
          <Animated.View 
            entering={FadeInUp.delay(400).duration(500).springify()}
            style={styles.buttonContainer}
          >
            <Button
              title={isLoading ? 'Authenticating...' : `Unlock with ${biometricType}`}
              icon={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
              variant="primary"
              size="lg"
              onPress={authenticate}
              disabled={isLoading}
              fullWidth
            />
          </Animated.View>

          {/* Privacy Badge */}
          <Animated.View 
            entering={FadeInUp.delay(500).duration(500).springify()}
            style={styles.privacyBadge}
          >
            <Ionicons name="lock-closed" size={14} color={Colors.light.textTertiary} />
            <Text style={styles.privacyText}>
              100% Private • All data stays on your device
            </Text>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.danger[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  errorText: {
    marginLeft: spacing.sm,
    color: palette.danger[600],
    fontSize: typography.size.sm,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  privacyText: {
    marginLeft: spacing.sm,
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
  },
});
