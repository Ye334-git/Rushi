import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
  ClipPath,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { PALS2, TH2 } from '../constants/Colors';

interface Props {
  goal: { id: number; progress: number; pal: number };
  size: number;
  active?: boolean;
  mini?: boolean;
  onPress?: () => void;
  orbitIndex?: number;
  isNew?: boolean;
  /** Position-based display number (e.g. "01", "02") */
  label?: string;
}

const ORBIT_DURATIONS = [7000, 8400, 9800, 8400];
const ORBIT_DISPLACEMENTS = [
  { x: 7, y: -9 },
  { x: -8, y: 7 },
  { x: 9, y: 6 },
  { x: -6, y: -8 },
];

export function PlanetOrb({ goal, size, active = false, mini = false, onPress, orbitIndex, isNew, label }: Props) {
  const { id, progress, pal } = goal;
  const displayNum = label ?? `0${id}`;
  const p = PALS2[pal] || PALS2[0];
  const r = size / 2;
  const ir = r * 0.83;
  const rr = r * 0.95;
  const circ = 2 * Math.PI * rr;
  const dash = (progress / 100) * circ;
  const gid = `pg-${id}-${pal}-${size}`;
  const cid = `pc-${id}-${pal}-${size}`;

  const hasAnimation = (orbitIndex !== undefined && orbitIndex >= 0 && !mini) || isNew;

  // ── Burst animation ──
  const burstScale = useSharedValue(isNew ? 0 : 1);

  useEffect(() => {
    if (isNew) {
      burstScale.value = withSequence(
        withTiming(1.18, { duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(1, { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
      );
    }
  }, [isNew]);

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
  }));

  // ── Orbit float ──
  const orbitPhase = useSharedValue(0);

  useEffect(() => {
    if (orbitIndex !== undefined && orbitIndex >= 0 && !mini && !isNew) {
      const dur = ORBIT_DURATIONS[orbitIndex % 4];
      orbitPhase.value = withRepeat(
        withTiming(1, { duration: dur, easing: Easing.linear }),
        -1,
        false,
      );
    }
    return () => cancelAnimation(orbitPhase);
  }, [orbitIndex, mini, isNew]);

  const orbitStyle = useAnimatedStyle(() => {
    if (orbitIndex === undefined || orbitIndex < 0 || mini || isNew) return {};
    const disp = ORBIT_DISPLACEMENTS[orbitIndex % 4];
    const t = orbitPhase.value;
    return {
      transform: [
        { translateX: disp.x * Math.sin(t * Math.PI * 2) },
        { translateY: disp.y * Math.sin(t * Math.PI * 2 + 1.2) },
      ],
    };
  });

  const animStyle = isNew ? burstStyle : orbitStyle;

  const svgContent = (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <Defs>
        <RadialGradient id={gid} cx="36%" cy="26%" r="72%">
          <Stop offset="0%" stopColor={p[0]} />
          <Stop offset="48%" stopColor={p[1]} />
          <Stop offset="100%" stopColor={p[2]} />
        </RadialGradient>
        <ClipPath id={cid}>
          <Circle cx={r} cy={r} r={ir} />
        </ClipPath>
      </Defs>

      <Circle cx={r} cy={r} r={ir + 5} fill={p[3]} opacity={active ? 0.24 : mini ? 0.06 : 0.12} />
      <Circle cx={r} cy={r} r={ir} fill={`url(#${gid})`} />

      <G clipPath={`url(#${cid})`} opacity={mini ? 0.5 : 1}>
        <Ellipse cx={r * 0.54} cy={r * 1.22} rx={ir * 0.30} ry={ir * 0.13} fill="rgba(0,0,0,0.30)" />
        <Ellipse cx={r * 1.28} cy={r * 0.74} rx={ir * 0.22} ry={ir * 0.10} fill="rgba(0,0,0,0.22)" />
        <Ellipse cx={r * 0.78} cy={r * 0.50} rx={ir * 0.14} ry={ir * 0.06} fill="rgba(255,255,255,0.06)" />
        <Ellipse cx={r * 0.32} cy={r * 0.68} rx={ir * 0.10} ry={ir * 0.05} fill="rgba(0,0,0,0.16)" />
      </G>

      <Circle cx={r} cy={r} r={ir} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={ir * 0.14} />

      {!mini && <Circle cx={r} cy={r} r={rr} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />}

      {!mini && progress > 0 && (
        <Circle
          cx={r} cy={r} r={rr} fill="none"
          stroke={active ? TH2.acc : p[3]}
          strokeWidth={active ? 2 : 1.5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${r}, ${r}`}
          opacity={active ? 0.95 : 0.45}
        />
      )}

      {active && !mini && (
        <Circle cx={r} cy={r} r={rr + 4} fill="none" stroke={TH2.acc} strokeWidth={0.8} opacity={0.25} />
      )}
    </Svg>
  );

  const innerContent = (
    <>
      {svgContent}
      {!mini && (
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: size * 0.17,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 0.5,
            }}
          >
            {displayNum}
          </Text>
        </View>
      )}
    </>
  );

  const baseStyle = {
    position: 'relative' as const,
    width: size,
    height: size,
    flexShrink: 0,
  };

  // Only use Animated.View when animation is active;
  // otherwise use plain View to avoid reanimated ref issues.
  if (hasAnimation) {
    return (
      <Pressable onPress={onPress} style={baseStyle}>
        <Animated.View style={animStyle}>
          {innerContent}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={baseStyle}>
      {innerContent}
    </Pressable>
  );
}

export default PlanetOrb;
