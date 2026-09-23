import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { RootStackParamList } from '../navigation/types';
import { Habit } from '../types/habit';

import { OnboardingPagination } from '../components/onboarding/OnboardingPagination';
import { OnboardingInteractiveCard1 } from '../components/onboarding/OnboardingInteractiveCard1';
import { OnboardingInteractiveCard2 } from '../components/onboarding/OnboardingInteractiveCard2';
import { OnboardingInteractiveCard3 } from '../components/onboarding/OnboardingInteractiveCard3';
import { OnboardingStarterPack } from '../components/onboarding/OnboardingStarterPack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingScreenRouteProp = RouteProp<RootStackParamList, 'Onboarding'>;

interface SlideData {
  id: string;
  title?: string;
  subtitle?: string;
  isStarterPack?: boolean;
}

const SLIDES: SlideData[] = [
  {
    id: 'slide_1',
    title: 'ابنِ عاداتك بهدوء واستمرارية',
    subtitle: 'رحلة يومية لترسيخ عاداتك بخطوات بسيطة ونتائج عظيمة تعزز صفاء يومك.',
  },
  {
    id: 'slide_2',
    title: 'حافظ على شعلة الزخم والاستمرارية',
    subtitle: 'كل يوم تلتزم فيه يصنع فارقاً حقيقياً.. تتبع إنجازاتك المتواصلة يمنحك دافعاً لا ينطفئ.',
  },
  {
    id: 'slide_3',
    title: 'خصوصية تامة وتحكم مطلق',
    subtitle: 'بياناتك ملكك وحدك، محفوظة محلياً على جهازك بكل أمان وبدون أي إعلانات أو تتبع.',
  },
  {
    id: 'slide_4',
    isStarterPack: true,
  },
];

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<OnboardingScreenRouteProp>();
  const isRevisit = !!route.params?.isRevisit;

  const { theme } = useTheme();
  const completeOnboarding = useHabitStore((state) => state.completeOnboarding);

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, scrollToIndex]);

  const handleSkip = useCallback(() => {
    scrollToIndex(SLIDES.length - 1);
  }, [scrollToIndex]);

  const handleClose = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [navigation]);

  const handleCompleteOnboarding = useCallback(
    async (selectedHabits: Omit<Habit, 'id' | 'createdAt'>[]) => {
      if (!selectedHabits || selectedHabits.length === 0) {
        completeOnboarding();
        if (isRevisit) {
          handleClose();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
        return;
      }

      await completeOnboarding(selectedHabits);
      if (isRevisit) {
        handleClose();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    },
    [completeOnboarding, isRevisit, handleClose, navigation]
  );

  const onScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  }, []);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlideCard = useCallback(
    (index: number) => {
      switch (index) {
        case 0:
          return <OnboardingInteractiveCard1 />;
        case 1:
          return <OnboardingInteractiveCard2 isActive={currentIndex === 1} />;
        case 2:
          return <OnboardingInteractiveCard3 />;
        case 3:
          return (
            <OnboardingStarterPack
              onComplete={handleCompleteOnboarding}
              isRevisit={isRevisit}
            />
          );
        default:
          return null;
      }
    },
    [currentIndex, handleCompleteOnboarding, isRevisit]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
        },
      ]}
    >
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        {/* Back button (only if not on first slide) */}
        {currentIndex > 0 ? (
          <Pressable
            onPress={() => scrollToIndex(currentIndex - 1)}
            hitSlop={12}
            style={styles.headerIconButton}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : (
          <View style={styles.headerIconButtonPlaceholder} />
        )}

        {/* Center Title / Branding */}
        <Text style={[styles.appName, { color: theme.text }]}>إنجاز</Text>

        {/* Skip or Close Button */}
        {isRevisit ? (
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={styles.headerTextButton}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              إغلاق
            </Text>
          </Pressable>
        ) : !isLastSlide ? (
          <Pressable
            onPress={handleSkip}
            hitSlop={12}
            style={styles.headerTextButton}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              تخطي
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerIconButtonPlaceholder} />
        )}
      </View>

      {/* Main Swipable FlatList Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onScroll}
        extraData={currentIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={styles.slidePage}>
            {item.isStarterPack ? (
              renderSlideCard(index)
            ) : (
              <View style={styles.standardSlideContent}>
                {/* 3D Interactive Centerpiece */}
                <View style={styles.interactiveArea}>
                  {renderSlideCard(index)}
                </View>

                {/* Typography and Description */}
                <View style={styles.textContainer}>
                  <Text style={[styles.slideTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.slideSubtitle, { color: theme.textSecondary }]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      />

      {/* Bottom Controls (Only for showcase slides 0, 1, 2) */}
      {!isLastSlide && (
        <View style={styles.bottomControls}>
          <OnboardingPagination
            total={SLIDES.length}
            activeIndex={currentIndex}
            onDotPress={scrollToIndex}
          />

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === SLIDES.length - 2 ? 'ابدأ رحلتك 🌿' : 'متابعة'}
            </Text>
            <Ionicons
              name="arrow-back"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTextButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slidePage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  standardSlideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  interactiveArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  slideSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomControls: {
    paddingHorizontal: 22,
    paddingBottom: 8,
    gap: 16,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginTop: 1,
  },
});
