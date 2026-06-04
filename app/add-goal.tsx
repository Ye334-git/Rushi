import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { TH2 } from '../constants/Colors';
import { PlanetOrb } from '../components/PlanetOrb';
import { Typewriter } from '../components/Typewriter';
import { ThinkingDots } from '../components/ThinkingDots';
import { useApp, ADD_GOAL_QS, ADD_PHASE_MAP, ADD_PHASE_LABELS, GOALS2 } from '../contexts/AppContext';
import type { Goal } from '../types/models';

interface Msg {
  role: 'ai' | 'user';
  text: string;
  id?: number;
}

export default function AddGoalScreen() {
  const router = useRouter();
  const { accent, addExtraGoal, extraGoals, goals } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [phase, setPhase] = useState('start');
  const [input, setInput] = useState('');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState<Goal | null>(null);
  const [cardVis, setCardVis] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Keyboard tracking
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([{ role: 'ai', text: ADD_GOAL_QS[0], id: 0 }]);
      setPhase('typing0');
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase, newGoal]);

  const handleAIDone = (idx: number) => setPhase(`wait${idx}`);

  const synthesizeGoal = (ans: string[]): Goal => {
    const raw0 = ans[0] || '';
    const cleaned = raw0.replace(/[，。！？、\s]/g, '');
    const name = cleaned.slice(0, 4) || '新目标';

    // Find a new id that doesn't conflict with existing goals
    const existingIds = new Set([...goals.map(g => g.id), ...extraGoals.map(g => g.id)]);
    let newId = 10;
    while (existingIds.has(newId)) newId++;

    // Pick next free palette (each goal keeps its palette permanently)
    const usedPals = [...goals, ...extraGoals].map(g => g.pal);
    const pal = [0, 1, 2, 3].find(p => !usedPals.includes(p)) ?? 0;

    // Board assigns cx/cy from POSITION_SLOTS; sz is fixed, pal is permanent
    return {
      id: newId,
      name,
      phase: '现状→突破',
      progress: 0,
      pal,
      cx: '0%',
      cy: '0%',
      sz: 100,
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input;
    setInput('');
    const newAns = [...answers, txt];
    setAnswers(newAns);
    setMsgs(prev => [...prev, { role: 'user', text: txt }]);

    const nextQ = qIdx + 1;
    if (nextQ < ADD_GOAL_QS.length) {
      setPhase('thinking');
      setTimeout(() => {
        setMsgs(prev => [...prev, { role: 'ai', text: ADD_GOAL_QS[nextQ], id: nextQ }]);
        setPhase(`typing${nextQ}`);
        setQIdx(nextQ);
      }, 1400);
    } else {
      setPhase('synthesizing');
      setTimeout(() => {
        const g = synthesizeGoal(newAns);
        setNewGoal(g);
        setPhase('done');
        setTimeout(() => setCardVis(true), 60);
      }, 2400);
    }
  };

  const handleConfirm = () => {
    if (newGoal) {
      addExtraGoal(newGoal);
      router.back();
    }
  };

  const isTyping = phase.startsWith('typing');
  const isWaiting = phase.startsWith('wait');
  const showInput = isWaiting;
  const curPhase = ADD_PHASE_MAP[qIdx] || 0;
  const progressPct = Math.round((qIdx / ADD_GOAL_QS.length) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Path d="M1 1l10 10M11 1L1 11" stroke={TH2.t1} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 1 }}>
            新目标
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: phase === 'done' ? ac : TH2.t1, marginTop: 1 }}>
            {phase === 'done' ? '如实已整理' : ADD_PHASE_LABELS[curPhase]}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {ADD_PHASE_LABELS.map((_, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: i <= curPhase ? ac : TH2.bdr,
              }}
            />
          ))}
        </View>
      </View>

      {/* Progress line */}
      <View style={{ height: 1, backgroundColor: TH2.bdr, marginTop: 8 }}>
        <View style={{ height: '100%', backgroundColor: ac, width: `${progressPct}%` }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {msgs.map((msg, i) => {
          const isLastAI = msg.role === 'ai' && i === msgs.length - 1;
          const typeActive = isLastAI && isTyping;
          if (msg.role === 'user') {
            return (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
                <View style={{ maxWidth: '78%', backgroundColor: TH2.bg2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderBottomRightRadius: 4 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: TH2.t1, lineHeight: 22 }}>{msg.text}</Text>
                </View>
              </View>
            );
          }
          if (typeActive) {
            return (
              <View key={i} style={{ marginBottom: 20 }}>
                <Typewriter text={msg.text} speed={26} onDone={() => handleAIDone(msg.id!)} />
              </View>
            );
          }
          return (
            <View key={i} style={{ maxWidth: '92%', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 20, color: TH2.t0, lineHeight: 37 }}>{msg.text}</Text>
            </View>
          );
        })}

        {/* Synthesizing */}
        {phase === 'synthesizing' && (
          <View style={{ gap: 10 }}>
            <ThinkingDots />
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 1 }}>
              如实正在整理……
            </Text>
          </View>
        )}

        {/* Goal card */}
        {newGoal && phase === 'done' && (
          <View style={{ opacity: cardVis ? 1 : 0 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 14 }}>
              如实理解的是这样——
            </Text>

            <View style={{ backgroundColor: TH2.bg1, borderRadius: 16, borderWidth: 1, borderColor: TH2.bdr, padding: 20, position: 'relative', overflow: 'hidden' }}>
              {/* Decorative quote */}
              <Text
                style={{
                  position: 'absolute',
                  top: -10,
                  left: 10,
                  fontFamily: 'Lora_500Medium',
                  fontSize: 80,
                  color: TH2.t2,
                  opacity: 0.07,
                }}
              >
                {'"'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <PlanetOrb goal={{ id: 99, progress: 0, pal: newGoal.pal }} size={52} />
                <View>
                  <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 20, color: TH2.t0, marginBottom: 3 }}>
                    {newGoal.name}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t1 }}>
                    {newGoal.phase}
                  </Text>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: TH2.bdr, paddingTop: 14, gap: 10 }}>
                <View>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.t2, letterSpacing: 1, marginBottom: 4 }}>
                    预计周期
                  </Text>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 13, color: TH2.t0 }}>12周</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.t2, letterSpacing: 1, marginBottom: 4 }}>
                    第一阶段
                  </Text>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 13, color: TH2.t0 }}>澄清现状</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => router.back()}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: TH2.bdr,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>重新描述</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={{
                  flex: 2,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: ac,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#fff' }}>
                  确认，开始追踪
                </Text>
                <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <Path d="M2 6h8M7 3l3 3-3 3" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
                </Svg>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: TH2.bdr,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: Math.max(kbHeight > 0 ? kbHeight - 20 : Math.max(insets.bottom, 28), Math.max(insets.bottom, 28)),
          opacity: showInput ? 1 : 0,
        }}
        pointerEvents={showInput ? 'auto' : 'none'}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="随便说……"
            placeholderTextColor={TH2.t2}
            multiline
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              borderWidth: 0,
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
              color: TH2.t0,
              lineHeight: 22,
              paddingTop: 2,
              maxHeight: 100,
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: input.trim() ? ac : TH2.bg2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <Path d="M6 10V2M3 5l3-3 3 3" stroke={input.trim() ? '#fff' : TH2.t2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
