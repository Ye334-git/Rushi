import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TH2 } from '../constants/Colors';
import { useApp, OB_STEPS } from '../contexts/AppContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accent, completeOnboarding } = useApp();
  const ac = accent;

  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<number[][]>([[], [], []]);

  const toggle = (i: number) => {
    setSel(prev => {
      const s = prev.map(a => [...a]);
      const idx = s[step].indexOf(i);
      if (idx >= 0) s[step].splice(idx, 1);
      else s[step].push(i);
      return s;
    });
  };

  const canNext = sel[step].length > 0;
  const cur = OB_STEPS[step];

  const handleDone = () => {
    completeOnboarding();
    router.replace('/board');
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Header with skip button */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Progress */}
        <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
          {OB_STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                height: 2,
                flex: 1,
                borderRadius: 2,
                backgroundColor: i <= step ? ac : TH2.bdr,
              }}
            />
          ))}
        </View>
        {/* Skip */}
        <Pressable onPress={handleDone} style={{ marginLeft: 16 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t2 }}>跳过</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={{ paddingTop: 32, paddingHorizontal: 28, paddingBottom: 24 }}>
        <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 22, color: TH2.t0, lineHeight: 33 }}>
          {cur.q}
        </Text>
      </View>

      {/* Options */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingBottom: 20 }}>
          {cur.opts.map((opt, i) => {
            const on = sel[step].includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => toggle(i)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: on ? ac : TH2.bdr,
                  backgroundColor: on ? TH2.accSoft : TH2.bg1,
                  transform: [{ scale: on ? 1.03 : 1 }],
                }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: on ? ac : TH2.t1 }}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom buttons */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 44, flexDirection: 'row', gap: 10 }}>
        {/* Back button (step > 0) */}
        {step > 0 && (
          <Pressable
            onPress={handlePrev}
            style={{
              height: 52,
              paddingHorizontal: 24,
              borderRadius: 12,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: TH2.bdr,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: TH2.t1 }}>上一步</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            if (step === OB_STEPS.length - 1) handleDone();
            else setStep(s => s + 1);
          }}
          disabled={!canNext}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            backgroundColor: canNext ? ac : TH2.bg2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: canNext ? '#fff' : TH2.t2 }}>
            {step === OB_STEPS.length - 1 ? '进入如实' : '下一步'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
