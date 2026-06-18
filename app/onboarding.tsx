import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { TH2 } from '../constants/Colors';
import { useApp } from '../contexts/AppContext';
import { SURVEY_QUESTIONS, SURVEY_MODULES, analyzeProfile, buildInitialGoalName, buildInitialGoalPhase } from '../services/profile';
import { synthesizeGoal } from '../services/chat';
import { buildSynthesisPrompt } from '../services/prompts';
import type { SurveyQuestion, UserProfile, Goal, PlanPhase } from '../types/models';

// ─── 提亮后的文字色 ───
const C = {
  heading: '#F0EDE8',   // 标题 — 接近白色
  body: '#C4BFB8',      // 正文 — 比 t1 (#8A8480) 亮两档
  muted: '#78746E',     // 辅助文字 — 比 t2 (#4A4744) 亮两档
  placeholder: '#5A5652',
};

// ─── 辅助：按模块分组可见问题 ───
function getModuleQuestions(moduleId: string, answers: Record<string, any>): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter(q => {
    if (q.module !== moduleId) return false;
    if (!q.condition) return true;
    const { dependsOn, notEqual } = q.condition;
    return answers[dependsOn] !== notEqual;
  });
}

// ─── 子组件：滑杆 ───
function SliderBar({ value, onChange, ac }: { value: number; onChange: (v: number) => void; ac: string }) {
  const barRef = useRef<View>(null);
  const [barW, setBarW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width);
  const handlePress = (ev: any) => {
    barRef.current?.measure((_x, _y, _w, _h, pageX) => {
      const pct = Math.max(0, Math.min(1, (ev.nativeEvent.pageX - pageX) / barW));
      onChange(Math.round(pct * 100));
    });
  };

  return (
    <View style={{ paddingVertical: 12 }}>
      <Pressable ref={barRef as any} onLayout={onLayout} onPress={handlePress} style={{ height: 40, justifyContent: 'center' }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: TH2.bdr, overflow: 'hidden' }}>
          <View style={{ width: `${value}%`, height: '100%', backgroundColor: ac, borderRadius: 4 }} />
        </View>
        <View style={{ position: 'absolute', left: `${value}%`, marginLeft: -12, top: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: ac, borderWidth: 3, borderColor: TH2.bg0, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }} />
      </Pressable>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.muted }}>刚刚开始</Text>
        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 13, color: ac }}>{value}%</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.muted }}>已经非常接近</Text>
      </View>
    </View>
  );
}

// ─── 子组件：单个问题 ───
function QuestionBlock({ q, value, onChange, ac }: { q: SurveyQuestion; value: any; onChange: (v: any) => void; ac: string }) {
  if (q.type === 'text') {
    return (
      <View>
        {q.placeholder ? (
          <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 13, color: C.muted, marginBottom: 16 }}>
            {q.placeholder}
          </Text>
        ) : null}
        <TextInput
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={q.hint || '输入你的答案……'}
          placeholderTextColor={C.placeholder}
          multiline
          autoFocus
          style={{
            backgroundColor: TH2.bg1,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: TH2.bdr,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontFamily: 'DMSans_400Regular',
            fontSize: 16,
            color: C.body,
            lineHeight: 24,
            minHeight: 56,
          }}
        />
      </View>
    );
  }

  if (q.type === 'slider') {
    return <SliderBar value={typeof value === 'number' ? value : 0} onChange={onChange} ac={ac} />;
  }

  const opts = q.options || [];
  const selected = q.type === 'multi'
    ? (Array.isArray(value) ? value : [])
    : (typeof value === 'string' ? [value] : []);

  const toggle = (opt: string) => {
    if (q.type === 'multi') {
      const arr = Array.isArray(value) ? [...value] : [];
      const idx = arr.indexOf(opt);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(opt);
      onChange(arr);
    } else {
      onChange(opt);
    }
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {opts.map((opt) => {
        const on = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => toggle(opt)}
            style={{
              paddingHorizontal: 22,
              paddingVertical: 14,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: on ? ac : TH2.bdr,
              backgroundColor: on ? TH2.accSoft : TH2.bg1,
              transform: [{ scale: on ? 1.03 : 1 }],
            }}
          >
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: on ? ac : C.body }}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================
// 入场问卷主组件
// ============================================================
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accent, completeOnboarding, addExtraGoal, goals, extraGoals } = useApp();
  const ac = accent;

  // moduleIdx: -1=welcome, 0-3=模块, 4=result
  const [moduleIdx, setModuleIdx] = useState(-1);
  // qIdx: 当前模块内的题目索引（切换模块时自动归零）
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generating, setGenerating] = useState(false);

  // 当前模块的可见问题列表
  const currentModule = moduleIdx >= 0 && moduleIdx < SURVEY_MODULES.length
    ? SURVEY_MODULES[moduleIdx]
    : null;
  const currentQuestions = currentModule
    ? getModuleQuestions(currentModule.id, answers)
    : [];
  const currentQ = currentQuestions.length > 0 && qIdx < currentQuestions.length
    ? currentQuestions[qIdx]
    : null;

  // 当前问题是否有答案
  const hasAnswer = (() => {
    if (!currentQ) return false;
    const v = answers[currentQ.id];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return false;
    if (currentQ.type === 'slider' && v === 0) return false;
    return true;
  })();

  // 是否是模块最后一题
  const isLastQ = currentQuestions.length > 0 && qIdx >= currentQuestions.length - 1;
  // 是否是最后一个模块
  const isLastModule = moduleIdx >= SURVEY_MODULES.length - 1;

  // ── 导航 ──
  const goNext = () => {
    if (moduleIdx === -1) {
      // welcome → 第一模块第一题
      setModuleIdx(0);
      setQIdx(0);
      return;
    }

    if (isLastQ) {
      if (isLastModule) {
        // 所有模块完成
        const prof = analyzeProfile(answers);
        setProfile(prof);
        setModuleIdx(SURVEY_MODULES.length); // result
      } else {
        // 下一模块第一题
        setModuleIdx(m => m + 1);
        setQIdx(0);
      }
    } else {
      setQIdx(q => q + 1);
    }
  };

  const goPrev = () => {
    if (moduleIdx === -1) return;

    if (qIdx > 0) {
      setQIdx(q => q - 1);
    } else {
      if (moduleIdx > 0) {
        // 回到上一模块最后一题
        const prevQuestions = getModuleQuestions(SURVEY_MODULES[moduleIdx - 1].id, answers);
        setModuleIdx(m => m - 1);
        setQIdx(Math.max(0, prevQuestions.length - 1));
      } else {
        setModuleIdx(-1); // 回到 welcome
        setQIdx(0);
      }
    }
  };

  // ── 结果页 → 仅更新画像（不创建目标）──
  const handleUpdateProfileOnly = () => {
    if (!profile) return;
    completeOnboarding(profile);
    router.back();
  };

  // ── 结果页 → 创建目标 + 更新画像 ──
  const handleEnter = async () => {
    if (!profile) return;
    setGenerating(true);

    let aiName = buildInitialGoalName(profile);
    let aiPhase = buildInitialGoalPhase(profile);
    let aiInsight = '';
    let aiPlanSteps: { label: string; desc: string }[] = [];
    let aiPhases: PlanPhase[] | undefined;
    try {
      const contextMsg = `用户的目标：${profile.goal}\n领域：${profile.goalArea}\n期限：${profile.timeline}\n尝试次数：${profile.attemptCount}\n启动风格：${profile.dimensions.startupStyle}\n中断恢复：${profile.dimensions.disruptionRecovery}\n复盘习惯：${profile.dimensions.reviewHabit}\n优势：${profile.strengths.join('，')}\n挑战：${profile.challenges.join('，')}`;
      const result = await synthesizeGoal([{ role: 'user', content: contextMsg }], buildSynthesisPrompt());
      aiName = result.name || aiName;
      aiPhase = result.phase || aiPhase;
      aiInsight = result.insight;
      aiPlanSteps = result.planSteps || [];
      aiPhases = result.phases;
    } catch { /* AI 失败时使用规则 fallback */ }

    const existingIds = new Set([...goals.map(g => g.id), ...extraGoals.map(g => g.id)]);
    let newId = 10;
    while (existingIds.has(newId)) newId++;
    const usedPals = [...goals, ...extraGoals].map(g => g.pal);
    const pal = [0, 1, 2, 3].find(p => !usedPals.includes(p)) ?? 0;

    const goal: Goal = {
      id: newId,
      name: aiName,
      phase: aiPhase,
      summary: profile.goal,
      insight: aiInsight || `你倾向于${profile.dimensions.startupStyle}，${profile.dimensions.disruptionRecovery}。${profile.challenges[0] || ''}`,
      planSteps: aiPlanSteps.length > 0
        ? aiPlanSteps.map((s, i) => ({ id: `step_${newId}_${i}`, label: s.label, desc: s.desc, done: false }))
        : [
            { id: `step_${newId}_0`, label: '理解卡点', desc: `找到阻碍你${profile.goalArea}的核心模式`, done: false },
            { id: `step_${newId}_1`, label: '识别触发', desc: '观察什么情况下最容易偏离计划', done: false },
            { id: `step_${newId}_2`, label: '行动实验', desc: '设计一个足够小的第一步', done: false },
            { id: `step_${newId}_3`, label: '复盘调整', desc: '一周后回顾效果并调整方向', done: false },
          ],
      phases: (aiPhases && aiPhases.length > 0) ? aiPhases : [
        { id: 'phase_fb_0', label: '第一阶段：开始行动', time_range: '第1-2周', tasks: [
          { id: 'fb_t0', text: `每天为「${aiName}」做一件小事`, granularity: 'day' as const },
          { id: 'fb_t1', text: '记录每次行动的感受', granularity: 'day' as const },
          { id: 'fb_t2', text: '周末花5分钟回顾本周进展', granularity: 'week' as const },
        ]},
        { id: 'phase_fb_1', label: '第二阶段：建立节奏', time_range: '第3-4周', tasks: [
          { id: 'fb_t3', text: '增加行动的频率或时长', granularity: 'week' as const },
          { id: 'fb_t4', text: '找到最适合自己的执行时间', granularity: 'week' as const },
        ]},
      ],
      createdAt: Date.now(),
      progress: 0, pal, cx: '0%', cy: '0%', sz: 100,
    };

    completeOnboarding(profile);
    addExtraGoal(goal);
    router.replace('/board');
  };

  // ── 进度计算 ──
  const totalModules = SURVEY_MODULES.length;
  // 模块级进度（用于分段进度条）
  const completedModules = Math.max(0, moduleIdx); // 已完成的模块数（不含当前）
  const inModule = moduleIdx >= 0 && moduleIdx < totalModules;
  const currentQInModule = inModule && currentQuestions.length > 0
    ? qIdx / currentQuestions.length
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* ── 顶部导航 ── */}
      <View style={{
        paddingTop: insets.top + 10, paddingHorizontal: 24,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {moduleIdx === -1 ? (
          <View style={{ width: 40 }} />
        ) : (
          <Pressable onPress={goPrev} hitSlop={8} style={{ paddingVertical: 4, paddingRight: 12 }}>
            <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
              <Path d="M7 1L1 7l6 6" stroke={C.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}

        {inModule && currentModule ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: ac, letterSpacing: 1.5 }}>
              {currentModule.title}
            </Text>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: C.muted, marginTop: 2 }}>
              问题 {qIdx + 1}/{currentQuestions.length}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View style={{ width: 40 }} />
      </View>

      {/* ── 分段进度条 ── */}
      {inModule && (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
          {/* 模块标签行 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            {SURVEY_MODULES.map((m, i) => (
              <Text
                key={m.id}
                style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 8,
                  letterSpacing: 0.5,
                  color: i < moduleIdx ? ac : i === moduleIdx ? C.body : C.placeholder,
                }}
              >
                {m.title}
              </Text>
            ))}
          </View>
          {/* 分段进度条 */}
          <View style={{ flexDirection: 'row', gap: 3, height: 4 }}>
            {SURVEY_MODULES.map((_m, i) => {
              let fill = 0;
              if (i < moduleIdx) fill = 1;
              else if (i === moduleIdx) fill = Math.max(0.08, currentQInModule);

              return (
                <View key={i} style={{ flex: 1, borderRadius: 2, backgroundColor: TH2.bdr, overflow: 'hidden' }}>
                  <View style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: ac, borderRadius: 2 }} />
                </View>
              );
            })}
          </View>
          {/* 进度数字 */}
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 4 }}>
            {Math.round(((moduleIdx + currentQInModule) / totalModules) * 100)}%
          </Text>
        </View>
      )}

      {/* ── 内容区 ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ======== 欢迎页 ======== */}
        {moduleIdx === -1 && (
          <View style={{ paddingTop: 48 }}>
            <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 28, color: C.heading, lineHeight: 42, marginBottom: 28 }}>
              每个人都有想实现的目标。
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 16, color: C.body, lineHeight: 28, marginBottom: 6 }}>
              但真正阻碍我们的，往往不是目标本身，
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 16, color: C.body, lineHeight: 28, marginBottom: 32 }}>
              而是那些反复出现却未被察觉的行为模式。
            </Text>
            <View style={{ height: 1, backgroundColor: TH2.bdr, marginBottom: 32 }} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.muted, lineHeight: 26, marginBottom: 6 }}>
              接下来我们会用几分钟时间，
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.muted, lineHeight: 26 }}>
              了解你目前的状态，并生成属于你的第一颗 Planet。
            </Text>
          </View>
        )}

        {/* ======== 问题页 ======== */}
        {inModule && currentQ && (
          <View>
            {/* 模块标题 */}
            <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 13, color: ac, marginBottom: 20, letterSpacing: 0.5 }}>
              {currentModule!.title}
            </Text>

            {/* 问题文本 */}
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 20, color: C.heading, lineHeight: 32, marginBottom: 28 }}>
              {currentQ.question}
            </Text>

            {/* 问题控件 */}
            <QuestionBlock q={currentQ} value={answers[currentQ.id]} onChange={(v) => setAnswers(prev => ({ ...prev, [currentQ.id]: v }))} ac={ac} />
          </View>
        )}

        {/* ======== 结果页 ======== */}
        {moduleIdx === SURVEY_MODULES.length && profile && (
          <View style={{ paddingTop: 20 }}>
            <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 24, color: C.heading, lineHeight: 36, marginBottom: 28 }}>
              你的 Planet 画像
            </Text>

            {/* 核心目标 */}
            <View style={{ padding: 18, backgroundColor: TH2.bg1, borderRadius: 16, borderWidth: 1, borderColor: TH2.bdr, marginBottom: 20 }}>
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1.5, marginBottom: 8 }}>
                当前核心目标
              </Text>
              <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 22, color: C.heading }}>
                {profile.goal || profile.goalArea || '新目标'}
              </Text>
              {profile.timeline ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.body, marginTop: 6 }}>
                  {profile.timeline}
                </Text>
              ) : null}
            </View>

            {/* Planet 观察 */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1.5, marginBottom: 14 }}>
                Planet 观察
              </Text>
              {profile.observations.map((obs, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ac, marginTop: 8 }} />
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.body, lineHeight: 24, flex: 1 }}>
                    {obs}
                  </Text>
                </View>
              ))}
            </View>

            {/* 优势 + 挑战 */}
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
              <View style={{ flex: 1, padding: 16, backgroundColor: 'rgba(107,158,120,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(107,158,120,0.2)' }}>
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.success, letterSpacing: 1.5, marginBottom: 10 }}>
                  当前优势
                </Text>
                {profile.strengths.map((s, i) => (
                  <Text key={i} style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.body, lineHeight: 22, marginBottom: i < profile.strengths.length - 1 ? 10 : 0 }}>
                    {s}
                  </Text>
                ))}
              </View>
              <View style={{ flex: 1, padding: 16, backgroundColor: 'rgba(196,120,58,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(196,120,58,0.18)' }}>
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: ac, letterSpacing: 1.5, marginBottom: 10 }}>
                  潜在挑战
                </Text>
                {profile.challenges.map((c, i) => (
                  <Text key={i} style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.body, lineHeight: 22, marginBottom: i < profile.challenges.length - 1 ? 10 : 0 }}>
                    {c}
                  </Text>
                ))}
              </View>
            </View>

            {/* Planet 寄语 */}
            <View style={{ padding: 20, backgroundColor: TH2.bg1, borderRadius: 16, borderWidth: 1, borderColor: TH2.bdr, marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
              <Text style={{ position: 'absolute', top: -10, left: 10, fontFamily: 'Lora_500Medium', fontSize: 64, color: C.muted, opacity: 0.06 }}>
                {'"'}
              </Text>
              <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 16, color: C.heading, lineHeight: 28 }}>
                {profile.planetMessage}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── 底部按钮 ── */}
      <View style={{
        paddingHorizontal: 24,
        paddingBottom: Math.max(insets.bottom, 32),
        paddingTop: 16,
        borderTopWidth: moduleIdx === -1 ? 0 : 1,
        borderTopColor: TH2.bdr,
      }}>
        {moduleIdx === SURVEY_MODULES.length ? (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={handleEnter}
              disabled={generating}
              style={{ height: 54, borderRadius: 14, backgroundColor: ac, alignItems: 'center', justifyContent: 'center', opacity: generating ? 0.6 : 1 }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 17, color: '#fff' }}>
                {generating ? '正在生成你的 Planet…' : '创建目标，开始追踪'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleUpdateProfileOnly}
              style={{ height: 46, borderRadius: 14, backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.muted }}>
                仅更新画像
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {moduleIdx >= 0 && (
              <Pressable
                onPress={goPrev}
                style={{ height: 54, width: 54, borderRadius: 14, backgroundColor: 'transparent', borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center', justifyContent: 'center' }}
              >
                <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                  <Path d="M7 1L1 7l6 6" stroke={C.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            )}
            <Pressable
              onPress={goNext}
              disabled={moduleIdx >= 0 && !hasAnswer}
              style={{
                flex: 1, height: 54, borderRadius: 14,
                backgroundColor: hasAnswer || moduleIdx === -1 ? ac : TH2.bg2,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 17, color: hasAnswer || moduleIdx === -1 ? '#fff' : C.placeholder }}>
                {moduleIdx === -1 ? '开始扫描' : isLastQ && isLastModule ? '查看结果' : '继续'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
