import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { TH2 } from '../constants/Colors';
import { PlanetOrb } from '../components/PlanetOrb';
import { useApp } from '../contexts/AppContext';
import type { Goal } from '../types/models';

export default function StartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accent, onboardingComplete } = useApp();
  const ac = accent;
  const [vis, setVis] = useState(false);

  // If already onboarded, skip directly to board
  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/board');
    }
  }, [onboardingComplete]);

  useEffect(() => {
    setTimeout(() => setVis(true), 80);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0, position: 'relative', overflow: 'hidden' }}>
      {/* Star background */}
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} viewBox="0 0 393 780" preserveAspectRatio="none">
        {Array.from({ length: 48 }).map((_, i) => {
          const x = (i * 137.508) % 393;
          const y = (i * 89.3) % 750;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={i % 5 === 0 ? 1.2 : i % 3 === 0 ? 0.9 : 0.5}
              fill="rgba(240,237,232,0.22)"
            />
          );
        })}
      </Svg>

      <View
        style={{
          flex: 1,
          opacity: vis ? 1 : 0,
          transform: [{ translateY: vis ? 0 : 16 }],
        }}
      >
        {/* Brand */}
        <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 28 }}>
          <Text style={{ fontFamily: 'Lora_600SemiBold', fontSize: 46, lineHeight: 52, color: TH2.t0, letterSpacing: -1, marginBottom: 6 }}>
            如实
          </Text>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, fontWeight: '300', color: TH2.t2, letterSpacing: 6, textTransform: 'uppercase' }}>
            {'R U S H I'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Center planet */}
        <View style={{ alignItems: 'center', marginBottom: -20 }}>
          <Svg style={{ position: 'absolute' }} width={300} height={300}>
            <Ellipse cx={150} cy={150} rx={138} ry={48} stroke={ac} strokeWidth={1} fill="none" opacity={0.07} />
          </Svg>
          <PlanetOrb goal={{ id: 0, name: '', phase: '', progress: 0, pal: 0, cx: '0%', cy: '0%', sz: 200 } as Goal} size={200} />
        </View>

        <View style={{ flex: 1 }} />

        {/* Buttons */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 44, gap: 10 }}>
          <Pressable
            onPress={() => router.replace('/board')}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: ac,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: '#fff' }}>继续我的反思</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/onboarding')}
            style={{
              height: 44,
              borderRadius: 12,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: TH2.bdr,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: TH2.t1 }}>第一次使用</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
