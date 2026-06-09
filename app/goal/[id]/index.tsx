import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { TH2, PALS2 } from '../../../constants/Colors';
import { PlanetOrb } from '../../../components/PlanetOrb';
import { useApp, GOALS2, PLAN_ITEMS } from '../../../contexts/AppContext';

export default function GoalPlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accent, goals: allGoals, extraGoals } = useApp();
  const ac = accent;

  const insets = useSafeAreaInsets();
  const goal = [...allGoals, ...extraGoals].find(g => g.id === Number(id)) || GOALS2[0];
  const pal = PALS2[goal.pal];
  const [vis, setVis] = useState(false);

  useEffect(() => {
    setTimeout(() => setVis(true), 60);
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
            <Path d="M6 1L1 6l5 5" stroke={TH2.t1} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>目标板</Text>
        </Pressable>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t2 }}>{goal.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Planet hero */}
        <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 16, opacity: vis ? 1 : 0 }}>
          <Svg style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -130, marginTop: -45 }} width={260} height={90}>
            <Ellipse cx={130} cy={45} rx={120} ry={38} stroke={pal[3]} strokeWidth={1} fill="none" opacity={0.10} />
          </Svg>
          <PlanetOrb goal={goal} size={150} active />
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 22, color: TH2.t0 }}>{goal.name}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t1, marginTop: 4 }}>{goal.phase}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <View style={{ width: 120, height: 2, backgroundColor: TH2.bdr, borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ width: `${goal.progress}%`, height: '100%', backgroundColor: ac, borderRadius: 2 }} />
              </View>
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: ac }}>{goal.progress}%</Text>
            </View>
          </View>
        </View>

        {/* AI insight */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 14, backgroundColor: 'rgba(196,120,58,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(196,120,58,0.18)' }}>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 8 }}>如实注意到</Text>
          <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 13, color: TH2.t1, lineHeight: 21 }}>
            {'你连续3次，在"动笔"阶段停下来。\n今天是个好时机继续探索。'}
          </Text>
        </View>

        {/* Plan steps */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 1, marginBottom: 8 }}>反思进度</Text>
          <View style={{ gap: 8 }}>
            {PLAN_ITEMS.map((item, i) => (
              <View
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: item.done ? 'rgba(107,158,120,0.08)' : TH2.bg1,
                  borderWidth: 1,
                  borderColor: item.done ? 'rgba(107,158,120,0.2)' : TH2.bdr,
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: item.done ? TH2.success : TH2.bg2,
                    borderWidth: 1.5,
                    borderColor: item.done ? TH2.success : TH2.bdr,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  {item.done && (
                    <Svg width={8} height={6} viewBox="0 0 8 6" fill="none">
                      <Path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
                    </Svg>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: item.done ? TH2.t1 : TH2.t0 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 11, color: TH2.t2, marginTop: 2, lineHeight: 16 }}>
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 8 }}>
        <Pressable
          onPress={() => router.push(`/goal/${goal.id}/chat`)}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            backgroundColor: ac,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path
              d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z"
              stroke="#fff"
              strokeWidth={1.5}
              strokeLinejoin="round"
              fill="rgba(255,255,255,0.2)"
            />
          </Svg>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: '#fff' }}>开始今日对话</Text>
        </Pressable>
      </View>
    </View>
  );
}
