import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

// ─── Perfect Geometric Ring Constants ────────────────────────────────────────
// Derived from icon.png pixel analysis (avg radii across all 12 segments)
// All units in 0-100 coordinate space (viewBox="0 0 100 100")
const SEGMENT_COUNT = 12;
const SEGMENT_SPAN_DEG = 26;   // arc span per segment (leaves ~4 deg gap)
const R_INNER = 25.4;          // inner radius (≈ 260px / 512 * 50)
const R_OUTER = 31.5;          // outer radius (≈ 322px / 512 * 50)
const GLOW_R_INNER = 23.2;     // slightly expanded inner for glow halo
const GLOW_R_OUTER = 33.8;     // slightly expanded outer for glow halo
const CX = 50;
const CY = 50;
const VIEW_BOX = '0 0 100 100';

// ─── Geometry Helpers ─────────────────────────────────────────────────────────
function polarToXY(r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180; // 0° = top of circle
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function buildArcPath(startDeg: number, endDeg: number, r1: number, r2: number): string {
  const a = polarToXY(r2, startDeg);
  const b = polarToXY(r2, endDeg);
  const c = polarToXY(r1, endDeg);
  const d = polarToXY(r1, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(5);
  return (
    `M ${f(a.x)} ${f(a.y)} ` +
    `A ${r2} ${r2} 0 ${large} 1 ${f(b.x)} ${f(b.y)} ` +
    `L ${f(c.x)} ${f(c.y)} ` +
    `A ${r1} ${r1} 0 ${large} 0 ${f(d.x)} ${f(d.y)} Z`
  );
}

// Pre-compute all segment paths once at module load (zero runtime cost)
const SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const midAngle = i * 30; // 0°, 30°, 60°, ... 330°  (clockwise from top)
  const half = SEGMENT_SPAN_DEG / 2;
  const start = midAngle - half;
  const end = midAngle + half;
  return {
    core: buildArcPath(start, end, R_INNER, R_OUTER),
    glow: buildArcPath(start, end, GLOW_R_INNER, GLOW_R_OUTER),
  };
});

// All 12 dark segments rendered in a single SVG path string (most efficient)
const DARK_RING_PATH = SEGMENTS.map(s => s.core).join(' ');

// ─── AnimatedGlowSegment ──────────────────────────────────────────────────────
interface AnimatedGlowSegmentProps {
  index: number;
  progress: SharedValue<number>;
  size: number;
  activeColor: string;
  glowColor: string;
}

const AnimatedGlowSegment: React.FC<AnimatedGlowSegmentProps> = React.memo(
  ({ index, progress, size, activeColor, glowColor }) => {
    // Core bright segment: lights up sharply and fades with quadratic decay
    const coreStyle = useAnimatedStyle(() => {
      'worklet';
      // diff = how many steps clockwise the progress cursor is AHEAD of this segment's peak
      const diff = (progress.value - index + SEGMENT_COUNT) % SEGMENT_COUNT;
      let opacity = 0;
      if (diff > SEGMENT_COUNT - 0.65) {
        // Ramp-up: approaching from behind (last 0.65 steps before peak)
        opacity = (diff - (SEGMENT_COUNT - 0.65)) / 0.65;
      } else if (diff < 1.4) {
        // Decay: after peak (quadratic ease-out)
        const t = 1.0 - diff / 1.4;
        opacity = t * t;
      }
      return { opacity };
    });

    // Glow halo: subtler, slightly wider, with softer fade
    const glowStyle = useAnimatedStyle(() => {
      'worklet';
      const diff = (progress.value - index + SEGMENT_COUNT) % SEGMENT_COUNT;
      let opacity = 0;
      if (diff > SEGMENT_COUNT - 0.55) {
        opacity = ((diff - (SEGMENT_COUNT - 0.55)) / 0.55) * 0.5;
      } else if (diff < 1.1) {
        const t = 1.0 - diff / 1.1;
        opacity = t * t * 0.5;
      }
      return { opacity };
    });

    return (
      <>
        {/* Soft luminous halo (GPU-composited opacity on Animated.View) */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glowStyle]}>
          <Svg viewBox={VIEW_BOX} width={size} height={size}>
            <Path d={SEGMENTS[index].glow} fill={glowColor} />
          </Svg>
        </Animated.View>

        {/* Solid core green segment (GPU-composited opacity on Animated.View) */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, coreStyle]}>
          <Svg viewBox={VIEW_BOX} width={size} height={size}>
            <Path d={SEGMENTS[index].core} fill={activeColor} />
          </Svg>
        </Animated.View>
      </>
    );
  }
);

// ─── AnimatedLogoRing (public API) ────────────────────────────────────────────
export interface AnimatedLogoRingProps {
  size?: number;
  /** Total time for one full clockwise rotation in ms. Default: 1440ms (120ms/segment). */
  duration?: number;
  activeColor?: string;
  inactiveColor?: string;
  glowColor?: string;
  style?: ViewStyle;
}

export const AnimatedLogoRing: React.FC<AnimatedLogoRingProps> = ({
  size = 180,
  duration = 1440,
  activeColor,
  inactiveColor,
  glowColor,
  style,
}) => {
  const { isDark } = useTheme();

  const effectiveActive = activeColor ?? (isDark ? '#34D399' : '#2F523E');
  const effectiveInactive = inactiveColor ?? (isDark ? '#2A2A2A' : '#363636');
  const effectiveGlow = glowColor ?? (isDark ? '#10B981' : '#4A8A65');

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(SEGMENT_COUNT, { duration, easing: Easing.linear }),
      -1,
      false // never reverse — always clockwise
    );
  }, [progress, duration]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>

      {/* ── Layer 1: Static charcoal base ring (one single SVG, zero overhead) ── */}
      <Svg
        viewBox={VIEW_BOX}
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
      >
        <Path d={DARK_RING_PATH} fill={effectiveInactive} />
      </Svg>

      {/* ── Layer 2: 12 GPU-animated green glow segments ── */}
      {SEGMENTS.map((_, index) => (
        <AnimatedGlowSegment
          key={index}
          index={index}
          progress={progress}
          size={size}
          activeColor={effectiveActive}
          glowColor={effectiveGlow}
        />
      ))}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
