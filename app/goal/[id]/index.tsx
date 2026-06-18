import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { TH2, PALS2 } from '../../../constants/Colors';
import { PlanetOrb } from '../../../components/PlanetOrb';
import { useApp } from '../../../contexts/AppContext';
import type { PlanPhase } from '../../../types/models';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── 计算从创建到今天的天数 ───
function daysSince(ts?: number): number {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

// ─── 把 phases 压平成时间线条目 ───
interface TimelineEntry {
  id: string;
  text: string;
  granularity: string;
  linked_cause?: string;
  phaseLabel: string;
  phaseTimeRange: string;
  dayOffset: number; // 从创建日算起的偏移天数
  isToday: boolean;
}

function buildTimeline(phases: PlanPhase[], createdAt?: number): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const today = daysSince(createdAt);
  let dayCursor = 0;

  for (const phase of phases) {
    for (const task of phase.tasks) {
      const days = task.granularity === 'day' ? 1 : task.granularity === 'week' ? 7 : 30;
      entries.push({
        id: task.id || `${phase.id}_${task.text.slice(0, 4)}`,
        text: task.text,
        granularity: task.granularity,
        linked_cause: task.linked_cause,
        phaseLabel: phase.label,
        phaseTimeRange: phase.time_range,
        dayOffset: dayCursor,
        isToday: dayCursor === today || (dayCursor <= today && dayCursor + days > today),
      });
      dayCursor += days;
    }
  }

  return entries;
}

export default function GoalPlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accent, goals: allGoals, extraGoals } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const goal = [...allGoals, ...extraGoals].find(g => g.id === Number(id)) || {
    id: 0, name: '未知目标', phase: '', progress: 0, pal: 0, cx: '0%', cy: '0%', sz: 100,
  };
  const pal = PALS2[goal.pal];
  const [vis, setVis] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => { setTimeout(() => setVis(true), 60); }, [id]);

  // ── 时间线数据 ──
  const timeline = goal.phases && goal.phases.length > 0
    ? buildTimeline(goal.phases, goal.createdAt)
    : [];
  const todayEntry = timeline.find(e => e.isToday) || timeline[0];
  const todayIndex = todayEntry ? timeline.indexOf(todayEntry) : 0;
  const timelineScrollRef = useRef<ScrollView>(null);

  // 打开时间线时滚动到今天
  useEffect(() => {
    if (showTimeline && timeline.length > 0) {
      setTimeout(() => {
        timelineScrollRef.current?.scrollTo({ y: Math.max(0, todayIndex * 72 - 160), animated: true });
      }, 100);
    }
  }, [showTimeline]);

  // ── 洞察：从 insight + phases 中的 linked_cause 提取 ──
  const causes: string[] = [];
  if (goal.insight) causes.push(goal.insight);
  if (goal.phases) {
    for (const phase of goal.phases) {
      for (const task of phase.tasks) {
        if (task.linked_cause && !causes.includes(task.linked_cause)) {
          causes.push(task.linked_cause);
        }
      }
    }
  }
  const uniqueCauses = causes.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
            <Path d="M6 1L1 6l5 5" stroke={TH2.t1} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>目标板</Text>
        </Pressable>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t2 }}>{goal.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ── 时间线模式 ── */}
      {showTimeline ? (
        <View style={{ flex: 1 }}>
          {/* 时间线头部 */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 18, color: TH2.t0 }}>执行计划</Text>
            <Pressable onPress={() => setShowTimeline(false)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: TH2.bdr }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t2 }}>收起</Text>
            </Pressable>
          </View>

          {/* 时间线列表 */}
          <ScrollView
            ref={timelineScrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 时间轴线 */}
            <View style={{ position: 'absolute', left: 36, top: 0, bottom: 0, width: 2, backgroundColor: TH2.bdr }} />

            {timeline.map((entry, i) => {
              const isToday = entry.isToday;

              return (
                <Pressable
                  key={entry.id || i}
                  onPress={() => router.push(`/goal/${goal.id}/chat`)}
                  style={{
                    position: 'relative',
                    marginBottom: 4,
                    paddingLeft: 36,
                    paddingVertical: 10,
                    paddingRight: 14,
                    marginRight: 4,
                    borderRadius: 12,
                    backgroundColor: isToday ? 'rgba(196,120,58,0.06)' : 'transparent',
                    borderWidth: isToday ? 1 : 0,
                    borderColor: isToday ? 'rgba(196,120,58,0.15)' : 'transparent',
                  }}
                >
                  {/* 时间线圆点 */}
                  <View style={{
                    position: 'absolute', left: 29, top: 14,
                    width: isToday ? 14 : 10, height: isToday ? 14 : 10,
                    borderRadius: isToday ? 7 : 5,
                    backgroundColor: isToday ? ac : TH2.bdr,
                    borderWidth: 2, borderColor: TH2.bg0,
                    zIndex: 1,
                  }} />

                  {/* 阶段标签（每个阶段第一条显示） */}
                  {i === 0 || timeline[i - 1]?.phaseLabel !== entry.phaseLabel ? (
                    <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: TH2.t2, letterSpacing: 1, marginBottom: 6 }}>
                      {entry.phaseLabel} · {entry.phaseTimeRange}
                    </Text>
                  ) : null}

                  {/* 任务内容 */}
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: entry.granularity === 'day' ? 'rgba(107,158,120,0.12)' : entry.granularity === 'week' ? 'rgba(196,120,58,0.10)' : 'rgba(138,132,128,0.08)' }}>
                      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: entry.granularity === 'day' ? TH2.success : entry.granularity === 'week' ? ac : TH2.t2 }}>
                        {entry.granularity === 'day' ? '天' : entry.granularity === 'week' ? '周' : '月'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: isToday ? TH2.t0 : TH2.t1, lineHeight: 22 }}>
                        {entry.text}
                      </Text>
                      {entry.linked_cause ? (
                        <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 10, color: ac, marginTop: 3, opacity: 0.7 }}>
                          针对：{entry.linked_cause}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* ── 默认视图 ── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* ── 1. Planet Hero + 进度条 ── */}
          <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 20, opacity: vis ? 1 : 0 }}>
            <Svg style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -130, marginTop: -45 }} width={260} height={90}>
              <Ellipse cx={130} cy={45} rx={120} ry={38} stroke={pal[3]} strokeWidth={1} fill="none" opacity={0.10} />
            </Svg>
            <PlanetOrb goal={goal} size={150} active />
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 22, color: TH2.t0 }}>{goal.name}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t1, marginTop: 4 }}>{goal.phase}</Text>

              {/* 进度条 — 加粗 */}
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <View style={{ width: 200, height: 4, backgroundColor: TH2.bdr, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ width: `${goal.progress}%`, height: '100%', backgroundColor: pal[0], borderRadius: 2 }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 28, color: pal[0] }}>{goal.progress}</Text>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 14, color: TH2.t2 }}>%</Text>
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t2, marginTop: 4 }}>
                  已坚持 {daysSince(goal.createdAt)} 天
                </Text>
              </View>
            </View>
          </View>

          {/* ── 2. 计划栏 ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 1, marginBottom: 10 }}>今日计划</Text>

            {todayEntry ? (
              <Pressable
                onPress={() => setShowTimeline(true)}
                style={{ backgroundColor: TH2.bg1, borderRadius: 14, borderWidth: 1, borderColor: TH2.bdr, padding: 16 }}
              >
                {/* ... same as before ... */}
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <View style={{ alignItems: 'center', paddingRight: 10, borderRightWidth: 1, borderRightColor: TH2.bdr }}>
                    <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 18, color: ac }}>今</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, backgroundColor: todayEntry.granularity === 'day' ? 'rgba(107,158,120,0.12)' : 'rgba(196,120,58,0.10)' }}>
                        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: todayEntry.granularity === 'day' ? TH2.success : ac }}>
                          {todayEntry.granularity === 'day' ? '每天' : todayEntry.granularity === 'week' ? '每周' : '每月'}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2 }}>{todayEntry.phaseLabel}</Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: TH2.t0, lineHeight: 22 }} numberOfLines={2}>
                      {todayEntry.text}
                    </Text>
                    {todayEntry.linked_cause ? (
                      <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 10, color: ac, marginTop: 4, opacity: 0.7 }}>
                        针对：{todayEntry.linked_cause}
                      </Text>
                    ) : null}
                  </View>
                  <Svg width={6} height={10} viewBox="0 0 6 10" fill="none">
                    <Path d="M1 1l4 4-4 4" stroke={TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: TH2.bdr, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t2 }}>
                    点击查看全部 {timeline.length} 项计划
                  </Text>
                  <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2 }}>
                    {timeline.filter(e => e.dayOffset <= daysSince(goal.createdAt)).length}/{timeline.length}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={{ padding: 20, borderRadius: 14, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 13, color: TH2.t2, textAlign: 'center', lineHeight: 22, marginBottom: 12 }}>
                  该目标创建时未生成执行计划
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t2, textAlign: 'center', lineHeight: 18 }}>
                  重新创建目标或进行首次对话打卡后，{'\n'}AI 将自动生成分阶段执行计划
                </Text>
              </View>
            )}
          </View>

          {/* ── 3. 洞察 ── */}
          {uniqueCauses.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 12 }}>如实注意到的卡点</Text>
              <View style={{ gap: 8 }}>
                {uniqueCauses.map((cause, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                    padding: 12, borderRadius: 12,
                    backgroundColor: 'rgba(196,120,58,0.04)',
                    borderWidth: 1, borderColor: 'rgba(196,120,58,0.12)',
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ac, marginTop: 7 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1, lineHeight: 21, flex: 1 }}>
                      {cause}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* CTA */}
      {!showTimeline && (
        <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 24), paddingTop: 8 }}>
          <Pressable
            onPress={() => router.push(`/goal/${goal.id}/chat`)}
            style={{ height: 52, borderRadius: 12, backgroundColor: ac, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" fill="rgba(255,255,255,0.2)" />
            </Svg>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: '#fff' }}>开始今日对话</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
