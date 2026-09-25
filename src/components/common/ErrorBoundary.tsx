import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ErrorBoundaryState,
  initialErrorBoundaryState,
  getDerivedStateFromError as coreGetDerivedState,
} from './errorBoundaryCore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

type State = ErrorBoundaryState;

/**
 * Production-grade Error Boundary component.
 * Catches unhandled JavaScript exceptions in the React tree and displays
 * a graceful Arabic recovery screen instead of crashing to the OS home screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = initialErrorBoundaryState;

  public static getDerivedStateFromError(error: Error): State {
    return coreGetDerivedState(error);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles-outline" size={32} color="#2A4B3A" />
            </View>

            <Text style={styles.title}>حدث خطأ غير متوقع</Text>

            <Text style={styles.description}>
              نعتذر عن هذا الخطأ المؤقت. بيانات عاداتك وإنجازاتك محفوظة بأمان تام في الذاكرة المحلية لجهازك.
            </Text>
            {__DEV__ && this.state.error ? (
              <Text style={{ fontSize: 11, color: '#888', marginTop: 4, marginBottom: 8, textAlign: 'center' }}>
                {this.state.error.message}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={this.handleReset}
              accessibilityRole="button"
              accessibilityLabel="إعادة تشغيل ومحاولة مجددة"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              <Text style={styles.buttonText}>إعادة المحاولة الآن</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A4B3A15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A4B3A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
