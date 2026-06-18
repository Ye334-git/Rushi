import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Keyboard, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { TH2 } from '../constants/Colors';
import { PlanetOrb } from '../components/PlanetOrb';
import { Typewriter } from '../components/Typewriter';
import { ThinkingDots } from '../components/ThinkingDots';
import { useApp } from '../contexts/AppContext';
import { sendChatMessage, synthesizeGoal } from '../services/chat';
import { buildAddGoalPrompt, buildSynthesisPrompt } from '../services/prompts';
import { CARD_REGISTRY } from '../services/cards';
import { parseAIResponse } from '../services/parser';
import type { InterfaceAction } from '../services/parser';
import type { Goal, PlanPhase } from '../types/models';

interface Msg { role: 'ai' | 'user'; text: string; action?: InterfaceAction; }

const PHASE_LABELS = ['说清楚', '找规律', '定方向'];

// 固定的开场白 — 不经过 AI，直接展示
const FIXED_OPENING = '说说你想建立的目标——完成它之后，你的生活里什么会不一样？';

// ============================================================
// 新建目标 — 卡片由 AI 的 ---INTERFACE--- action 驱动（见 services/cards.ts）
//   generate_plan / skip_to_plan → 弹出目标入库卡片
//   generate_cause_cards → 弹出真因卡片
//   render_cause_tree → 弹出原因层级图
// ============================================================
export default function AddGoalScreen() {
  const router = useRouter();
  const { accent, addExtraGoal, extraGoals, goals, userProfile } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const systemPrompt = buildAddGoalPrompt(userProfile);

  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: FIXED_OPENING, action: { action: 'none' } },
  ]);
  const [phase, setPhase] = useState<'waiting' | 'thinking' | 'typing' | 'synthesizing' | 'done'>('waiting');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [newGoal, setNewGoal] = useState<Goal | null>(null);
  const [planPhases, setPlanPhases] = useState<PlanPhase[]>([]);
  const [cardExpanded, setCardExpanded] = useState(false);
  const [cardVis, setCardVis] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // iOS: willShow/willHide 提供与键盘动画同步的平滑体验
    // Android: 仅支持 didShow/didHide
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase, newGoal]);

  const buildApiMessages = (msgsArr: Msg[]) =>
    msgsArr.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    }));

  // 解析 AI 回复中的界面指令，判断是否弹出卡片
  const handleAIDone = () => {
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'ai' && lastMsg.action) {
      const act = lastMsg.action.action;
      // generate_plan / skip_to_plan → 自动触发目标合成
      if (act === 'generate_plan' || act === 'skip_to_plan') {
        handleSynthesize();
        return;
      }
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
      const raw = await sendChatMessage(buildApiMessages(newMsgs), systemPrompt);
      const parsed = parseAIResponse(raw);
      // 只展示对话文本，界面指令存在 action 字段中
      setMsgs(prev => [...prev, { role: 'ai', text: parsed.text, action: parsed.action }]);
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

      // AI 未返回 phases 时用最小 fallback，确保详情页不落空
      const phases = (result.phases && result.phases.length > 0) ? result.phases : [
        {
          id: 'phase_fb_0',
          label: '第一阶段：开始行动',
          time_range: '第1-2周',
          tasks: [
            { id: 'fb_t0', text: `每天为「${result.name}」做一件小事`, granularity: 'day' as const },
            { id: 'fb_t1', text: '记录每次行动的感受', granularity: 'day' as const },
            { id: 'fb_t2', text: '周末花5分钟回顾本周进展', granularity: 'week' as const },
          ],
        },
        {
          id: 'phase_fb_1',
          label: '第二阶段：建立节奏',
          time_range: '第3-4周',
          tasks: [
            { id: 'fb_t3', text: '增加行动的频率或时长', granularity: 'week' as const },
            { id: 'fb_t4', text: '找到最适合自己的执行时间', granularity: 'week' as const },
          ],
        },
      ];

      const goal: Goal = {
        id: newId,
        name: result.name,
        phase: result.phase,
        summary: result.summary,
        insight: result.insight,
        planSteps: (result.planSteps || []).map((s, i) => ({
          id: `step_${newId}_${i}`,
          label: s.label,
          desc: s.desc,
          done: false,
        })),
        phases,
        createdAt: Date.now(),
        progress: 0,
        pal,
        cx: '0%',
        cy: '0%',
        sz: 100,
      };
      setNewGoal(goal);
      setPlanPhases(phases);
      setCardExpanded(false);
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

        {/* Goal card — expandable with execution plan */}
        {newGoal && phase === 'done' && (
          <View style={{ opacity: cardVis ? 1 : 0 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 14 }}>
              如实理解的是这样——
            </Text>

            <View style={{ backgroundColor: TH2.bg1, borderRadius: 16, borderWidth: 1, borderColor: TH2.bdr, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <Text style={{ position: 'absolute', top: -10, left: 10, fontFamily: 'Lora_500Medium', fontSize: 80, color: TH2.t2, opacity: 0.07 }}>
                {'"'}
              </Text>

              {/* 头部：星球 + 名称 + 阶段 */}
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 14 }}>
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

              {/* 总结 */}
              <View style={{ borderTopWidth: 1, borderTopColor: TH2.bdr, paddingTop: 12, marginBottom: 14 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t0, lineHeight: 21 }}>
                  {newGoal.summary || '正在梳理中……'}
                </Text>
              </View>

              {/* 执行计划（可展开） */}
              {planPhases.length > 0 && (
                <View>
                  <Pressable
                    onPress={() => setCardExpanded(e => !e)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: TH2.bdr }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1 }}>
                        执行计划
                      </Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: TH2.t2 }}>
                        {planPhases.length} 个阶段 · {planPhases.reduce((sum, p) => sum + p.tasks.length, 0)} 个动作
                      </Text>
                    </View>
                    <Svg width={10} height={6} viewBox="0 0 10 6" fill="none" style={{ transform: [{ rotate: cardExpanded ? '180deg' : '0deg' }] }}>
                      <Path d="M1 1l4 4 4-4" stroke={TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
                    </Svg>
                  </Pressable>

                  {cardExpanded && (
                    <View style={{ gap: 14, paddingTop: 12 }}>
                      {planPhases.map((phase, pi) => (
                        <View key={phase.id || pi}>
                          {/* 阶段标题 */}
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: TH2.t0 }}>
                              {phase.label}
                            </Text>
                            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2 }}>
                              {phase.time_range}
                            </Text>
                          </View>

                          {/* 任务列表 */}
                          <View style={{ gap: 6 }}>
                            {phase.tasks.map((task, ti) => (
                              <View key={task.id || ti} style={{
                                flexDirection: 'row', gap: 10, paddingLeft: 4,
                                paddingVertical: 8, paddingRight: 8,
                                borderLeftWidth: 2,
                                borderLeftColor: task.linked_cause ? ac : TH2.bdr,
                              }}>
                                {/* 粒度标签 */}
                                <View style={{
                                  paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
                                  backgroundColor: task.granularity === 'day' ? 'rgba(107,158,120,0.15)' :
                                                   task.granularity === 'week' ? 'rgba(196,120,58,0.12)' :
                                                   'rgba(138,132,128,0.10)',
                                  alignSelf: 'flex-start', marginTop: 1,
                                }}>
                                  <Text style={{
                                    fontFamily: 'DMMono_400Regular', fontSize: 8,
                                    color: task.granularity === 'day' ? TH2.success :
                                           task.granularity === 'week' ? ac : TH2.t2,
                                  }}>
                                    {task.granularity === 'day' ? '每天' : task.granularity === 'week' ? '每周' : '每月'}
                                  </Text>
                                </View>

                                {/* 任务内容 */}
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1, lineHeight: 20 }}>
                                    {task.text}
                                  </Text>
                                  {task.linked_cause ? (
                                    <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 10, color: ac, marginTop: 2, opacity: 0.8 }}>
                                      针对：{task.linked_cause}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => { setNewGoal(null); setPlanPhases([]); setPhase('waiting'); setCardVis(false); }}
                style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>继续对话修改</Text>
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

      </View>
    </View>
  );
}
