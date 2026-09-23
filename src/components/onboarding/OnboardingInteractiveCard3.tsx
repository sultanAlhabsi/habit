import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Vibration,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export const OnboardingInteractiveCard3: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isLocked, setIsLocked] = useState(true);

  // Pure 2D gentle ambient floating (zero touch matrix conflicts)
  const floatTranslateY = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Shield glow & gleam
  const shieldScale = useSharedValue(1);
  const shieldRotate = useSharedValue(0);

  useEffect(() => {
    floatTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [floatTranslateY]);

  const handleShieldTap = useCallback(() => {
    try {
      Vibration.vibrate(24);
    } catch {}
    setIsLocked((prev) => !prev);
    shieldScale.value = withSequence(
      withTiming(1.18, { duration: 120 }),
      withSpring(1, { damping: 10, stiffness: 160 })
    );
    shieldRotate.value = withSequence(
      withTiming(-6, { duration: 80 }),
      withTiming(6, { duration: 80 }),
      withSpring(0, { damping: 8, stiffness: 140 })
    );
  }, [shieldRotate, shieldScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateY: floatTranslateY.value },
        { scale: cardScale.value },
      ],
    };
  });

  const shieldAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: shieldScale.value },
        { rotate: `${shieldRotate.value}deg` },
      ],
    };
  });

  return (
    <View style={styles.outerContainer}>
      <Animated.View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? '#1C1C1A' : '#FFFFFF',
            borderColor: isDark ? '#2B2B28' : '#ECEAE4',
            shadowColor: isDark ? '#000000' : '#2A4B3A',
          },
          cardAnimatedStyle,
        ]}
      >
        {/* Top Shield Emblem */}
        <View style={styles.shieldWrapper}>
          <Pressable onPress={handleShieldTap} hitSlop={15}>
            <Animated.View
              style={[
                styles.shieldCircle,
                {
                  backgroundColor: isDark ? '#1E2C23' : '#EDF6F0',
                  borderColor: isDark ? '#31543E' : '#C7E4D1',
                },
                shieldAnimatedStyle,
              ]}
            >
              <Ionicons
                name={isLocked ? 'shield-checkmark' : 'shield-outline'}
                size={38}
                color={theme.primary}
              />
            </Animated.View>
          </Pressable>

          <Text style={[styles.shieldTitle, { color: theme.text }]}>
            بياناتك في أمان مطلق 🔒
          </Text>
          <Text style={[styles.shieldSubtitle, { color: theme.textSecondary }]}>
            محفوظة محلياً على جهازك في SQLite ولا تغادره
          </Text>
        </View>

        {/* Privacy Value Points */}
        <View style={styles.pointsList}>
          <View
            style={[
              styles.pointRow,
              { backgroundColor: isDark ? '#232320' : '#FAF9F6' },
            ]}
          >
            <View
              style={[
                styles.pointIconCircle,
                { backgroundColor: isDark ? '#1A2920' : '#EBF5EF' },
              ]}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={theme.primary} />
            </View>
            <View style={styles.pointTextContainer}>
              <Text style={[styles.pointHeader, { color: theme.text }]}>
                قاعدة بيانات محلية ١٠٠٪
              </Text>
              <Text style={[styles.pointDescription, { color: theme.textMuted }]}>
                تطبيقك يعمل بدون إنترنت ولا يتطلب إنشاء حساب
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.pointRow,
              { backgroundColor: isDark ? '#232320' : '#FAF9F6' },
            ]}
          >
            <View
              style={[
                styles.pointIconCircle,
                { backgroundColor: isDark ? '#1A2920' : '#EBF5EF' },
              ]}
            >
              <Ionicons name="ban-outline" size={16} color={theme.primary} />
            </View>
            <View style={styles.pointTextContainer}>
              <Text style={[styles.pointHeader, { color: theme.text }]}>
                صفر إعلانات وصفر تتبّع
              </Text>
              <Text style={[styles.pointDescription, { color: theme.textMuted }]}>
                واجهة هادئة خالية من التشتيت تركز على أهدافك
              </Text>
            </View>
          </View>
        </View>

        {/* Hint at Bottom */}
        <View style={styles.hintContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={12}
            color={theme.textMuted}
          />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>
            المس الدرع للتفاعل واستشعار الأمان
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  shieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shieldCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shieldTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  shieldSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  pointsList: {
    gap: 8,
    marginBottom: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  pointIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointTextContainer: {
    flex: 1,
  },
  pointHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'left',
  },
  pointDescription: {
    fontSize: 10,
    textAlign: 'left',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
