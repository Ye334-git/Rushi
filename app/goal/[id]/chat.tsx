import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Dimensions, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withSequence, Easing,
} from 'react-native-reanimated';
import { TH2 } from '../../../constants/Colors';
import { PlanetOrb } from '../../../components/PlanetOrb';
import { Typewriter } from '../../../components/Typewriter';
import { ThinkingDots } from '../../../components/ThinkingDots';
import { useApp } from '../../../contexts/AppContext';
import { sendChatMessage, extractMethodology } from '../../../services/chat';
import type { MethodologyResult } from '../../../services/chat';
import { buildGoalPrompt } from '../../../services/prompts';
import { loadConversation, saveConversation, clearConversation } from '../../../services/storage';
import type { ConversationKey } from '../../../services/storage';
import { CARD_REGISTRY } from '../../../services/cards';
import { parseAIResponse } from '../../../services/parser';
import type { InterfaceAction } from '../../../services/parser';
import type { MethodItem } from '../../../types/models';

const PSIZE = 360;
const PVISIBLE = 130;
const POFFSET = -(PSIZE - PVISIBLE);
const INPUT_GAP = PVISIBLE + 24;
const { height: SCREEN_H } = Dimensions.get('window');

interface Msg { role: 'ai' | 'user'; text: string; action?: InterfaceAction; }

// ============================================================
// ============================================================
// 目标打卡对话 — 卡片配置见 services/cards.ts → goal-checkin
//   触发: 用户点"结束" → AI 总结+[PROGRESS:XX] → 进度调整+保存到沉淀库
// ============================================================
export default function GoalChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accent, goals, extraGoals, addSettleCard, updateGoalProgress, userProfile } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const allGoals = [...goals, ...extraGoals];
  // 回退：目标被删除等极端情况，用一个最小占位对象防止 crash
  const goal = allGoals.find(g => g.id === Number(id)) || {
    id: 0, name: '未知目标', phase: '', progress: 0, pal: 0, cx: '0%', cy: '0%', sz: 100,
  };
  const convKey: ConversationKey = `goal-${goal.id}`;
  const systemPrompt = buildGoalPrompt({
    name: goal.name,
    phase: goal.phase,
    progress: goal.progress,
  }, userProfile);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [phase, setPhase] = useState('start');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const [suggestedProgress, setSuggestedProgress] = useState<number | null>(null);
  const [methodology, setMethodology] = useState<MethodologyResult | null>(null);
  const [pendingSettle, setPendingSettle] = useState<{ signal: string; goal: string } | null>(null);
  const [settleLoading, setSettleLoading] = useState(false);
  const cardConfig = CARD_REGISTRY['goal-checkin'];
  const scrollRef = useRef<ScrollView>(null);

  // Planet drop animation
  const planetTY = useSharedValue(-SCREEN_H * 0.55);
  const planetScl = useSharedValue(0.42);
  const planetOp = useSharedValue(0);
  const contentOp = useSharedValue(0);

  const startNewConversation = async () => {
    await clearConversation(convKey);
    setMsgs([]);
    setEnded(false);
    setSaved(false);
    setError('');
    setPhase('thinking');
    try {
      const raw = await sendChatMessage([], systemPrompt);
      const parsed = parseAIResponse(raw);
      const firstMsg: Msg[] = [{ role: 'ai', text: parsed.text, action: parsed.action }];
      setMsgs(firstMsg);
      await saveConversation(convKey, firstMsg);
      setPhase('typing');
    } catch (e: any) {
      setError(e.message || '连接失败');
      setPhase('waiting');
    }
  };

  useEffect(() => {
    planetTY.value = withTiming(0, { duration: 720, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    planetScl.value = withSequence(
      withTiming(1.03, { duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
      withTiming(1, { duration: 220, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
    );
    planetOp.value = withTiming(1, { duration: 400 });
    const t1 = setTimeout(() => { contentOp.value = withTiming(1, { duration: 340 }); }, 460);
    const t2 = setTimeout(() => {
      (async () => {
        const saved = await loadConversation(convKey);
        if (saved && saved.length > 0) {
          setMsgs(saved as Msg[]);
          setPhase('waiting');
        } else {
          await startNewConversation();
        }
      })();
    }, 720);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase]);

  // Android 键盘避让：KeyboardAvoidingView 在 Android 上 behavior=undefined 不生效
  useEffect(() => {
    if (Platform.OS === 'ios') return; // iOS 由 KeyboardAvoidingView 处理
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const buildApiMessages = (msgsArr: Msg[]) =>
    msgsArr.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    }));

  const planetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: planetTY.value }, { scale: planetScl.value }],
    opacity: planetOp.value,
  }));

  const contentAnim = useAnimatedStyle(() => ({ opacity: contentOp.value }));

  const handleBack = useCallback(() => {
    planetTY.value = withTiming(-SCREEN_H * 0.55, { duration: 540, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    planetScl.value = withTiming(0.42, { duration: 540, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    planetOp.value = withTiming(0, { duration: 400 });
    contentOp.value = withTiming(0, { duration: 300 });
    setTimeout(() => router.back(), 540);
  }, []);

  const handleAIDone = async () => {
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'ai') {
      // AI 主动建议收尾 → 自动弹出结束卡片
      if (lastMsg.action?.action === 'suggest_progress') {
        if (typeof lastMsg.action?.value === 'number') {
          setSuggestedProgress(lastMsg.action.value);
        }
        if (!ended) {
          // 自动触发结束流程，生成总结卡片
          setTimeout(() => handleEnd(), 300);
          return;
        }
      }
      if (lastMsg.action?.action === 'suggest_settle') {
        const signal = (lastMsg.action.data as any)?.signal || '新发现的方法';
        setPendingSettle({ signal, goal: goal.name });
      }
    }
    setPhase(ended ? 'done' : 'waiting');
  };

  const handleAnalyzeSettle = async () => {
    if (!pendingSettle) return;
    setSettleLoading(true);
    try {
      const result = await extractMethodology(
        buildApiMessages(msgs),
        cardConfig.synthesisPrompt!,
      );
      setMethodology(result);
    } catch { /* ignore */ }
    setSettleLoading(false);
  };

  const handleDismissSettle = () => {
    setPendingSettle(null);
    setMethodology(null);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    const newMsgs: Msg[] = [...msgs, { role: 'user', text: userText }];
    setMsgs(newMsgs);
    await saveConversation(convKey, newMsgs);
    setPhase('thinking');
    setError('');

    try {
      const raw = await sendChatMessage(buildApiMessages(newMsgs), systemPrompt);
      const parsed = parseAIResponse(raw);
      const full: Msg[] = [...newMsgs, { role: 'ai', text: parsed.text, action: parsed.action }];
      setMsgs(full);
      await saveConversation(convKey, full);
      setPhase('typing');
    } catch (e: any) {
      setError(e.message || '连接失败');
      setPhase('waiting');
    }
  };

  const handleEnd = async () => {
    setPhase('thinking');
    setEnded(true);
    try {
      const result = await extractMethodology(
        buildApiMessages(msgs),
        cardConfig.synthesisPrompt!,
      );
      setMethodology(result);
      if (typeof result.progress === 'number') {
        setSuggestedProgress(result.progress);
      }
      const displayText = result.insight || '已生成今日总结。';
      const full: Msg[] = [...msgs, { role: 'ai', text: displayText }];
      setMsgs(full);
      await saveConversation(convKey, full);
      setPhase('typing');
    } catch {
      setPhase('done');
    }
  };

  const isTyping = phase === 'typing';
  const showInput = phase === 'waiting';
  const hasSaved = msgs.length > 0;
  const lastAIMsg = hasSaved && msgs[msgs.length - 1].role === 'ai'
    ? msgs[msgs.length - 1].text
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-insets.bottom}
      >
        <View style={{
          paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Pressable onPress={handleBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
            <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
              <Path d="M6 1L1 6l6 6" stroke={TH2.t1} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>{goal.name}</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {hasSaved && (
              <Pressable
                onPress={startNewConversation}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: TH2.bdr }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t1 }}>新对话</Text>
              </Pressable>
            )}
            {phase !== 'done' && !ended && msgs.length >= 2 && (
              <Pressable
                onPress={handleEnd}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: TH2.bdr }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t1 }}>结束</Text>
              </Pressable>
            )}
            {phase === 'start' || phase === 'thinking' || isTyping ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: TH2.accSoft }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: ac }} />
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1 }}>思考中</Text>
              </View>
            ) : (
              <PlanetOrb goal={goal} size={28} mini />
            )}
          </View>
        </View>

        <Animated.View style={[{ flex: 1 }, contentAnim]}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24, paddingTop: 8,
              paddingBottom: showInput || phase === 'done' ? INPUT_GAP + 54 : INPUT_GAP + 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {msgs.map((msg, i) => {
              const isLastAI = msg.role === 'ai' && i === msgs.length - 1;
              if (msg.role === 'user') return (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <View style={{ maxWidth: '78%', backgroundColor: TH2.bg2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderBottomRightRadius: 4 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: TH2.t1, lineHeight: 22 }}>{msg.text}</Text>
                  </View>
                </View>
              );
              if (isLastAI && isTyping) return (
                <View key={i} style={{ marginBottom: 20 }}>
                  <Typewriter text={msg.text} speed={28} onDone={handleAIDone} style={{ fontSize: 19 }} />
                </View>
              );
              return (
                <View key={i} style={{ maxWidth: '92%', marginBottom: 20 }}>
                  <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 19, color: TH2.t0, lineHeight: 35 }}>{msg.text}</Text>
                </View>
              );
            })}
            {phase === 'thinking' && <ThinkingDots />}
            {error ? (
              <View style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,0,0,0.06)', marginBottom: 20 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#c44' }}>{error}</Text>
              </View>
            ) : null}

            {/* AI 主动建议沉淀方法 */}
            {pendingSettle && (
              <View style={{ marginBottom: 20, padding: 16, borderRadius: 14, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: 'rgba(107,158,120,0.25)', borderLeftWidth: 3, borderLeftColor: TH2.success }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.success, letterSpacing: 1 }}>可能要沉淀</Text>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: TH2.success }} />
                </View>
                <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 14, color: TH2.t1, lineHeight: 22, marginBottom: 12 }}>
                  {pendingSettle.signal}
                </Text>
                {!methodology && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable onPress={handleAnalyzeSettle} disabled={settleLoading} style={{ flex: 1, height: 38, borderRadius: 10, backgroundColor: TH2.success, alignItems: 'center', justifyContent: 'center', opacity: settleLoading ? 0.6 : 1 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#fff' }}>{settleLoading ? '分析中…' : '展开分析'}</Text>
                    </Pressable>
                    <Pressable onPress={handleDismissSettle} style={{ height: 38, paddingHorizontal: 18, borderRadius: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t2 }}>忽略</Text>
                    </Pressable>
                  </View>
                )}
                {methodology && methodology.methods.length > 0 && (
                  <View style={{ gap: 8 }}>
                    {methodology.methods.map((m: MethodItem, i: number) => (
                      <View key={i} style={{ padding: 12, borderRadius: 10, backgroundColor: TH2.bg2, borderWidth: 1, borderColor: TH2.bdr }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: TH2.t0 }}>{m.name}</Text>
                          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.success }}>{m.category}</Text>
                        </View>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t1, lineHeight: 18 }}>{m.summary}</Text>
                      </View>
                    ))}
                    {methodology.insight ? (
                      <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 12, color: TH2.t2, lineHeight: 18 }}>{methodology.insight}</Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      <Pressable onPress={() => { addSettleCard({ id: Date.now(), goal: pendingSettle!.goal, date: `${new Date().getMonth() + 1}月${new Date().getDate()}日`, title: methodology.methods[0]?.name || pendingSettle!.signal, text: methodology.insight || '', insight: methodology.insight, methods: methodology.methods }); setPendingSettle(null); setMethodology(null); }} style={{ flex: 1, height: 38, borderRadius: 10, backgroundColor: TH2.success, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#fff' }}>记下来</Text>
                      </Pressable>
                      <Pressable onPress={handleDismissSettle} style={{ height: 38, paddingHorizontal: 18, borderRadius: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t2 }}>忽略</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {phase === 'done' && lastAIMsg ? (
              <View style={{ marginTop: 8, padding: 18, borderRadius: 16, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr }}>
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 10 }}>今日打卡总结</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1, lineHeight: 21, marginBottom: methodology && methodology.methods.length > 0 ? 14 : 14 }}>
                  {lastAIMsg}
                </Text>

                {/* 提取的方法 */}
                {methodology && methodology.methods.length > 0 && (
                  <View style={{ gap: 10, marginBottom: 14 }}>
                    {methodology.methods.map((m: MethodItem, i: number) => (
                      <View key={i} style={{ padding: 12, borderRadius: 12, backgroundColor: TH2.bg2, borderWidth: 1, borderColor: TH2.bdr, borderLeftWidth: 3, borderLeftColor: TH2.success }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: TH2.t0 }}>{m.name}</Text>
                          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: 'rgba(107,158,120,0.12)' }}>
                            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.success }}>{m.category}</Text>
                          </View>
                        </View>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t1, lineHeight: 18, marginBottom: 4 }}>
                          {m.summary}
                        </Text>
                        <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 11, color: TH2.t2, lineHeight: 16 }}>
                          触发：{m.trigger}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 进度更新 */}
                {suggestedProgress !== null && (
                  <View style={{ marginBottom: 14, padding: 12, borderRadius: 10, backgroundColor: TH2.bg2 }}>
                    <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.t2, letterSpacing: 1, marginBottom: 8 }}>更新进度</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Pressable
                        onPress={() => setSuggestedProgress(p => p !== null ? Math.max(0, p - 5) : 0)}
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: TH2.bg0, borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 14, color: TH2.t1 }}>-</Text>
                      </Pressable>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 22, color: ac }}>{suggestedProgress}%</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 9, color: TH2.t2 }}>← {goal.progress}%</Text>
                      </View>
                      <Pressable
                        onPress={() => setSuggestedProgress(p => p !== null ? Math.min(100, p + 5) : 0)}
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: TH2.bg0, borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 14, color: TH2.t1 }}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => {
                        updateGoalProgress(goal.id, suggestedProgress);
                        setSuggestedProgress(null);
                      }}
                      style={{ marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: ac, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#fff' }}>确认更新</Text>
                    </Pressable>
                  </View>
                )}

                {saved ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TH2.accSoft, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: ac }}>已存入沉淀库</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      addSettleCard({
                        id: Date.now(),
                        goal: goal.name,
                        date: `${new Date().getMonth() + 1}月${new Date().getDate()}日`,
                        title: methodology?.methods?.[0]?.name || lastAIMsg.slice(0, 8),
                        text: lastAIMsg,
                        insight: methodology?.insight,
                        methods: methodology?.methods,
                      });
                      setSaved(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TH2.accSoft, borderWidth: 1, borderColor: 'rgba(196,120,58,0.3)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: ac }}>保存到沉淀库</Text>
                    <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                      <Path d="M2 5h6M5 2l3 3-3 3" stroke={ac} strokeWidth={1.4} strokeLinecap="round" />
                    </Svg>
                  </Pressable>
                )}
              </View>
            ) : null}
          </ScrollView>

          {showInput && (
            <View style={{
              borderTopWidth: 1, borderTopColor: TH2.bdr,
              paddingHorizontal: 18, paddingTop: 10,
              paddingBottom: Platform.OS === 'android' ? Math.max(kbHeight, insets.bottom + INPUT_GAP) : Math.max(insets.bottom + INPUT_GAP, INPUT_GAP),
              backgroundColor: TH2.bg0,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <TextInput
                  value={input} onChangeText={setInput} onSubmitEditing={handleSend}
                  placeholder="继续说……" placeholderTextColor={TH2.t2}
                  multiline returnKeyType="send" enablesReturnKeyAutomatically
                  style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, fontFamily: 'DMSans_400Regular', fontSize: 15, color: TH2.t0, lineHeight: 22, paddingVertical: 6, maxHeight: 100 }}
                />
                <Pressable onPress={handleSend} disabled={!input.trim()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: input.trim() ? ac : TH2.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 10V2M3 5l3-3 3 3" stroke={input.trim() ? '#fff' : TH2.t2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, pointerEvents: 'none' }}>
        <Animated.View style={[{ marginBottom: POFFSET, alignSelf: 'center' }, planetAnim]}>
          <PlanetOrb goal={goal} size={PSIZE} />
        </Animated.View>
      </View>
    </View>
  );
}
