import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { TH2 } from '../constants/Colors';
import { PlanetOrb } from '../components/PlanetOrb';
import { Typewriter } from '../components/Typewriter';
import { ThinkingDots } from '../components/ThinkingDots';
import { useApp, GOALS2 } from '../contexts/AppContext';
import { sendChatMessage, synthesizeGoal } from '../services/chat';
import { buildAddGoalPrompt, buildSynthesisPrompt } from '../services/prompts';
import { CARD_REGISTRY, detectMarker } from '../services/cards';
import type { Goal } from '../types/models';

interface Msg { role: 'ai' | 'user'; text: string; }

// 卡片配置来自 services/cards.ts — 修改触发条件/按钮文字统一在那改
const PHASE_LABELS = ['说清楚', '找规律', '定方向'];
const systemPrompt = buildAddGoalPrompt();
const cardConfig = CARD_REGISTRY['goal-synthesis'];
const READY_MARKER = cardConfig.trigger.marker!;
const MIN_EXCHANGES = cardConfig.trigger.minExchanges!;

// ============================================================
// 新建目标对话 — 卡片弹出流程：
//   1. AI 标 [READY] 或 ≥6 条消息 → "生成目标"按钮出现
//   2. 用户点击 → handleSynthesize() → synthesizeGoal() 调 AI 生成 JSON
//   3. 解析 JSON 创建 Goal 对象 → 显示目标卡片
//   4. 用户确认 → addExtraGoal() 写入目标库 → router.back()
// ============================================================
export default function AddGoalScreen() {
  const router = useRouter();
  const { accent, addExtraGoal, extraGoals, goals } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [phase, setPhase] = useState('start');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [newGoal, setNewGoal] = useState<Goal | null>(null);
  const [cardVis, setCardVis] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    (async () => {
      setPhase('thinking');
      try {
        const text = await sendChatMessage([], systemPrompt);
        setMsgs([{ role: 'ai', text }]);
        setPhase('typing');
      } catch (e: any) {
        setError(e.message || '连接失败');
        setPhase('waiting');
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase, newGoal]);

  const buildApiMessages = (msgsArr: Msg[]) =>
    msgsArr.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    }));

  // 卡片触发条件：AI 标记检测 → 见 services/cards.ts goal-synthesis.trigger
  const checkReady = (text: string) => detectMarker(text, READY_MARKER);

  const handleAIDone = () => {
    // Check if last AI message has [READY]
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'ai' && checkReady(lastMsg.text)) {
      setReady(true);
      // Strip [READY] from displayed text
      setMsgs(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, text: m.text.replace('[READY]', '').trim() } : m,
      ));
    }
    setPhase(newGoal ? 'done' : 'waiting');
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    const newMsgs: Msg[] = [...msgs, { role: 'user', text: userText }];
    setMsgs(newMsgs);
    setPhase('thinking');
    setError('');

    try {
      const text = await sendChatMessage(buildApiMessages(newMsgs), systemPrompt);
      const cleanText = checkReady(text) ? text.replace('[READY]', '').trim() : text;
      setMsgs(prev => [...prev, { role: 'ai', text: cleanText }]);
      if (checkReady(text)) setReady(true);
      setPhase('typing');
    } catch (e: any) {
      setError(e.message || '连接失败');
      setPhase('waiting');
    }
  };

  // 卡片生成：将完整对话发送给 AI，要求输出 JSON 目标总结
  // 解析后的 Goal 对象写入 newGoal state → 渲染卡片
  const handleSynthesize = async () => {
    if (msgs.length < 2) return;
    setPhase('synthesizing');
    try {
      const result = await synthesizeGoal(
        buildApiMessages(msgs),
        buildSynthesisPrompt(),
      );

      const existingIds = new Set([...goals.map(g => g.id), ...extraGoals.map(g => g.id)]);
      let newId = 10;
      while (existingIds.has(newId)) newId++;

      const usedPals = [...goals, ...extraGoals].map(g => g.pal);
      const pal = [0, 1, 2, 3].find(p => !usedPals.includes(p)) ?? 0;

      const goal: Goal = {
        id: newId,
        name: result.name,
        phase: result.phase,
        summary: result.summary,
        progress: 0,
        pal,
        cx: '0%',
        cy: '0%',
        sz: 100,
      };
      setNewGoal(goal);
      setPhase('done');
      setTimeout(() => setCardVis(true), 60);
    } catch (e: any) {
      setError(e.message || '生成失败');
      setPhase('waiting');
    }
  };

  const handleConfirm = () => {
    if (newGoal) {
      addExtraGoal(newGoal);
      router.back();
    }
  };

  const isTyping = phase === 'typing';
  const showInput = phase === 'waiting';
  const exchangeCount = Math.floor(msgs.length / 2);
  const curPhase = Math.min(exchangeCount, 2);
  const progressPct = newGoal ? 100 : Math.min(Math.round((exchangeCount / 5) * 100), 90);

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
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
            {phase === 'done' ? '如实已整理' : PHASE_LABELS[curPhase]}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {PHASE_LABELS.map((_, i) => (
            <View
              key={i}
              style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: i <= curPhase ? ac : TH2.bdr }}
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
                <Typewriter text={msg.text} speed={26} onDone={handleAIDone} />
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

        {error ? (
          <View style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,0,0,0.06)', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#c44' }}>{error}</Text>
          </View>
        ) : null}

        {/* Goal card */}
        {newGoal && phase === 'done' && (
          <View style={{ opacity: cardVis ? 1 : 0 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 14 }}>
              如实理解的是这样——
            </Text>

            <View style={{ backgroundColor: TH2.bg1, borderRadius: 16, borderWidth: 1, borderColor: TH2.bdr, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <Text
                style={{
                  position: 'absolute', top: -10, left: 10,
                  fontFamily: 'Lora_500Medium', fontSize: 80,
                  color: TH2.t2, opacity: 0.07,
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

              <View style={{ borderTopWidth: 1, borderTopColor: TH2.bdr, paddingTop: 14 }}>
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.t2, letterSpacing: 1, marginBottom: 6 }}>
                  如实理解
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t0, lineHeight: 21 }}>
                  {newGoal.summary || '正在梳理中……'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => { setNewGoal(null); setPhase('waiting'); setCardVis(false); }}
                style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>重新描述</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={{ flex: 2, height: 44, borderRadius: 12, backgroundColor: ac, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
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
          borderTopWidth: 1, borderTopColor: TH2.bdr,
          paddingHorizontal: 18, paddingTop: 10,
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
            style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, fontFamily: 'DMSans_400Regular', fontSize: 15, color: TH2.t0, lineHeight: 22, paddingTop: 2, maxHeight: 100 }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: input.trim() ? ac : TH2.bg2, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <Path d="M6 10V2M3 5l3-3 3 3" stroke={input.trim() ? '#fff' : TH2.t2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>

        {/* Synthesize button */}
        {(ready || msgs.length >= MIN_EXCHANGES * 2) && !newGoal && (
          <Pressable
            onPress={handleSynthesize}
            style={{ marginTop: 10, height: 38, borderRadius: 10, backgroundColor: ac, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#fff' }}>生成目标</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
