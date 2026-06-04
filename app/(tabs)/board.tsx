import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, Alert, LayoutChangeEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TH2 } from '../../constants/Colors';
import { PlanetOrb } from '../../components/PlanetOrb';
import { useApp, GOALS2, POSITION_SLOTS } from '../../contexts/AppContext';
import type { Goal } from '../../types/models';

const TAB_BAR_H = 70;

// ── Animated planet position wrapper ──
function AnimatedPlanet({
  children,
  targetX,
  targetY,
  size,
}: {
  children: React.ReactNode;
  targetX: number;
  targetY: number;
  size: number;
}) {
  const posX = useSharedValue(targetX - size / 2);
  const posY = useSharedValue(targetY - size / 2);

  useEffect(() => {
    posX.value = withTiming(targetX - size / 2, {
      duration: 600,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    posY.value = withTiming(targetY - size / 2, {
      duration: 600,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [targetX, targetY, size]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, animStyle]}>
      {children}
    </Animated.View>
  );
}

// ── Animated background numeral ──
function AnimatedNumeral({
  num,
  targetX,
  targetY,
  size,
}: {
  num: string;
  targetX: number;
  targetY: number;
  size: number;
}) {
  const posX = useSharedValue(targetX + size * 0.38);
  const posY = useSharedValue(targetY - 18);

  useEffect(() => {
    posX.value = withTiming(targetX + size * 0.38, {
      duration: 600,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    posY.value = withTiming(targetY - 18, {
      duration: 600,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [targetX, targetY, size]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, animStyle]} pointerEvents="none">
      <Text
        style={{
          fontFamily: 'Lora_500Medium_Italic',
          fontSize: 60,
          fontWeight: '600',
          color: 'rgba(240,237,232,0.045)',
          letterSpacing: -1,
        }}
      >
        {num}
      </Text>
    </Animated.View>
  );
}

export default function BoardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goals, extraGoals, clearNewFlag, deleteGoal } = useApp();
  const today = new Date();
  const dayStr = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];

  const defaultIds = useRef(new Set(GOALS2.map(g => g.id)));
  const [editMode, setEditMode] = useState(false);
  const [containerW, setContainerW] = useState(393);
  const [containerH, setContainerH] = useState(600);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) setContainerW(width);
    if (height > 0) setContainerH(height);
  };

  // Auto-clear "isNew" flag after burst animation
  useEffect(() => {
    extraGoals.filter(g => g.isNew).forEach(g => {
      const t = setTimeout(() => clearNewFlag(g.id), 1200);
      return () => clearTimeout(t);
    });
  }, [extraGoals]);

  // Merge goals + extra, sort by id. Only assign position (cx/cy) from slot pool.
  // Each goal keeps its original sz (size) and pal (color) — identity follows the goal.
  const allGoals: Goal[] = useMemo(() => {
    return [...goals, ...extraGoals]
      .sort((a, b) => a.id - b.id)
      .map((g, i) => {
        const slot = POSITION_SLOTS[i % POSITION_SLOTS.length];
        return {
          ...g,
          cx: slot.cx,
          cy: slot.cy,
        };
      });
  }, [goals, extraGoals]);

  const handleDeleteGoal = (g: { id: number; name: string }) => {
    Alert.alert('删除目标', `确定要删除「${g.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteGoal(g.id) },
    ]);
  };

  const toPx = (pct: string): number => (parseFloat(pct) / 100);

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <View>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: TH2.t2, letterSpacing: 1, marginBottom: 4 }}>
            {today.getMonth() + 1}月{today.getDate()}日 · 周{dayStr}
          </Text>
          <Text style={{ fontFamily: 'Lora_600SemiBold', fontSize: 22, color: TH2.t0 }}>如实</Text>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <Circle cx={7} cy={7} r={5.5} stroke={TH2.t2} strokeWidth={1.3} />
            <Line x1={7} y1={4.5} x2={7} y2={8} stroke={TH2.t2} strokeWidth={1.3} strokeLinecap="round" />
            <Circle cx={7} cy={9.75} r={0.5} fill={TH2.t2} />
          </Svg>
        </View>
      </View>

      {/* Star field — animated planets */}
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }} onLayout={onLayout}>
        {/* Background stars */}
        <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} viewBox={`0 0 ${containerW} ${containerH}`} preserveAspectRatio="none">
          {Array.from({ length: 36 }).map((_, i) => {
            const x = (i * 113.7) % containerW;
            const y = (i * 77.3) % containerH;
            return <Circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1 : 0.5} fill="rgba(240,237,232,0.18)" />;
          })}
          {/* Connection lines */}
          {allGoals.length > 1 && allGoals.slice(0, -1).map((g, i) => {
            const next = allGoals[i + 1];
            return (
              <Line
                key={i}
                x1={toPx(g.cx) * containerW}
                y1={toPx(g.cy) * containerH}
                x2={toPx(next.cx) * containerW}
                y2={toPx(next.cy) * containerH}
                stroke={TH2.t1} strokeWidth={1} strokeDasharray="3 6" opacity={0.05}
              />
            );
          })}
        </Svg>

        {/* Animated background numerals — number follows position slot */}
        {allGoals.map((g, idx) => (
          <AnimatedNumeral
            key={`num-${g.id}`}
            num={idx < 9 ? `0${idx + 1}` : `${idx + 1}`}
            targetX={toPx(g.cx) * containerW}
            targetY={toPx(g.cy) * containerH}
            size={g.sz}
          />
        ))}

        {/* Animated planets */}
        {allGoals.map((g, idx) => {
          const isDefault = defaultIds.current.has(g.id);
          const px = toPx(g.cx) * containerW;
          const py = toPx(g.cy) * containerH;
          return (
            <AnimatedPlanet key={g.id} targetX={px} targetY={py} size={g.sz}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <PlanetOrb
                  goal={g}
                  size={g.sz}
                  label={idx < 9 ? `0${idx + 1}` : `${idx + 1}`}
                  orbitIndex={idx % 4}
                  isNew={g.isNew}
                  onPress={() => {
                    if (editMode) handleDeleteGoal(g);
                    else router.push(`/goal/${g.id}`);
                  }}
                />
                <View style={{ alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t1, letterSpacing: 0.2 }}>
                      {g.name}
                    </Text>
                    {isDefault && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 9, color: TH2.t2, opacity: 0.6 }}>
                        示例
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: g.isNew ? TH2.acc : TH2.t2, marginTop: 1 }}>
                    {g.isNew ? '新建中' : `${g.progress}%`}
                  </Text>
                </View>
              </View>
            </AnimatedPlanet>
          );
        })}
      </View>

      {/* Bottom actions */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 4, flexShrink: 0, gap: 6 }}>
        <Pressable
          onPress={() => router.push('/add-goal')}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr,
            borderStyle: Platform.OS === 'ios' ? 'dashed' : (('dotted' as any)),
            borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Line x1={6} y1={1} x2={6} y2={11} stroke={TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={1} y1={6} x2={11} y2={6} stroke={TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t2 }}>添加目标</Text>
        </Pressable>

        <Pressable
          onPress={() => setEditMode(m => !m)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: editMode ? 'rgba(196,120,58,0.12)' : 'transparent',
            borderWidth: 1, borderColor: editMode ? TH2.acc : TH2.bdr,
            borderStyle: editMode ? 'solid' : Platform.OS === 'ios' ? 'dashed' : (('dotted' as any)),
            borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Line x1={3} y1={3} x2={9} y2={9} stroke={editMode ? TH2.acc : TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={9} y1={3} x2={3} y2={9} stroke={editMode ? TH2.acc : TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: editMode ? TH2.acc : TH2.t2 }}>
            {editMode ? '点击星球即可删除' : '管理目标'}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: TAB_BAR_H }} />
    </View>
  );
}
