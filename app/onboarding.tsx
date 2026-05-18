import colors from '@/constants/Colors';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Slide = {
  key: string;
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ICON_SIZE = 96;

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    title: 'Witaj w Fortivo!',
    description: 'Twój osobisty tracker treningowy. Sprawdź co potrafi.',
    image: require('../assets/images/icon.png'),
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    description:
      'Twój punkt startowy — statystyki, historia treningów i szybkie akcje.',
    icon: 'bar-chart',
  },
  {
    key: 'workouts',
    title: 'Treningi',
    description: 'Twórz treningi, zarządzaj planami i organizuj swoje sesje.',
    icon: 'clipboard-outline',
  },
  {
    key: 'exercises',
    title: 'Ćwiczenia',
    description: 'Przeglądaj bazę ćwiczeń, filtruj i twórz własne.',
    icon: 'list-outline',
  },
  {
    key: 'active-workout',
    title: 'Aktywny Trening',
    description:
      'Wykonuj trening live — zaznaczaj serie, śledź postęp w czasie rzeczywistym.',
    icon: 'barbell-outline',
  },
  {
    key: 'start',
    title: 'Zaczynamy!',
    description:
      'Rozpocznij swój pierwszy trening i osiągnij swoje cele z Fortivo!',
    icon: 'rocket',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const completeOnboarding = useOnboardingStore((state) => state.complete);

  const isLastSlide = index === SLIDES.length - 1;

  const finish = useCallback(async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding, router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // Never let the back button drop the user onto a blank screen —
        // treat it as completing onboarding.
        finish();
        return true;
      });
      return () => sub.remove();
    }, [finish]),
  );

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [index, isLastSlide, finish]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (next !== index) setIndex(next);
    },
    [index],
  );

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<Slide>) => (
      <View style={styles.slide}>
        <View style={styles.iconArea}>
          {item.image ? (
            <Image
              source={item.image}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name={item.icon} size={ICON_SIZE} color={colors.accent} />
          )}
        </View>
        <View style={styles.textArea}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    ),
    [],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {!isLastSlide && (
        <Pressable
          style={[styles.skipButton, { top: insets.top }]}
          onPress={finish}
          hitSlop={12}
        >
          <Text style={styles.skipText}>Pomiń</Text>
        </Pressable>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              i === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {isLastSlide ? 'Zaczynamy!' : 'Dalej'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  skipButton: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 40,
  },
  iconArea: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logo: {
    width: ICON_SIZE + 32,
    height: ICON_SIZE + 32,
  },
  textArea: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 48,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  dot: {
    borderRadius: 5,
  },
  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: colors.muted,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
