import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import type { Goal, SettleCard, TimelineMonth, ChatMessage } from '../types/models';

// ─── 初始数据 ───

// Position slots for planets (indexed 0-11). Goals are assigned positions
// in order, so deleting a goal causes remaining goals to shift into new slots.
export const POSITION_SLOTS: { cx: string; cy: string; sz: number }[] = [
  { cx: '21%', cy: '22%', sz: 130 },
  { cx: '67%', cy: '14%', sz: 108 },
  { cx: '60%', cy: '48%', sz: 118 },
  { cx: '15%', cy: '56%', sz: 96 },
  { cx: '44%', cy: '76%', sz: 102 },
  { cx: '76%', cy: '62%', sz: 92 },
  { cx: '52%', cy: '30%', sz: 88 },
  { cx: '80%', cy: '35%', sz: 84 },
  { cx: '35%', cy: '65%', sz: 90 },
  { cx: '90%', cy: '55%', sz: 86 },
  { cx: '30%', cy: '12%', sz: 94 },
  { cx: '68%', cy: '80%', sz: 88 },
];

// Helper: assign position and palette to a goal list by index
export function assignPosition(goals: { id: number; name: string; phase: string; progress: number; pal: number; isNew?: boolean }[], index: number) {
  const slot = POSITION_SLOTS[index % POSITION_SLOTS.length];
  return { ...slot, pal: index % 4 };
}

export const GOALS2: Goal[] = [
  { id: 1, name: '写作卡点', phase: '选题→动笔', progress: 42, pal: 0, cx: '21%', cy: '22%', sz: 130 },
  { id: 2, name: '时间分配', phase: '效率→从容', progress: 67, pal: 1, cx: '67%', cy: '14%', sz: 108 },
  { id: 3, name: '边界设定', phase: '说不→自在', progress: 18, pal: 2, cx: '60%', cy: '48%', sz: 118 },
  { id: 4, name: '早起习惯', phase: '意志→执行', progress: 85, pal: 3, cx: '15%', cy: '56%', sz: 96 },
];

export const SETTLE_CARDS: SettleCard[] = [
  { id: 1, goal: '写作卡点', date: '5月21日', title: '启动仪式', text: '发现自己在打开文档前总会做同一个动作——倒水、戴耳机。把这个仪式刻意化，让开始变得容易了。' },
  { id: 2, goal: '时间分配', date: '5月18日', title: '25分钟法则', text: '不是"我要写完这篇"，而是"我要专注25分钟"。目标变小了，阻力也变小了。' },
  { id: 3, goal: '边界设定', date: '5月14日', title: '3秒空间', text: '在答应别人之前，给自己3秒。不是用来拒绝，而是用来感受自己真正的意愿。' },
];

export const TIMELINE_DATA: TimelineMonth[] = [
  {
    month: '2025年5月', items: [
      { date: '5月21日', goal: '写作卡点', pal: 0, title: '启动仪式', text: '发现自己在打开文档前总会做同一个动作——倒水、戴耳机。把这个仪式刻意化，让开始变得容易了。' },
      { date: '5月18日', goal: '时间分配', pal: 1, title: '25分钟法则', text: '不是"我要写完这篇"，而是"我要专注25分钟"。目标变小了，阻力也变小了。' },
      { date: '5月14日', goal: '边界设定', pal: 2, title: '3秒空间', text: '在答应别人之前，给自己3秒。不是用来拒绝，而是用来感受自己真正的意愿。' },
    ],
  },
  {
    month: '2025年4月', items: [
      { date: '4月28日', goal: '时间分配', pal: 1, title: '深工作时段', text: '把"困难任务"放在上午10点前。不是因为意志力，而是因为那时干扰最少。' },
      { date: '4月15日', goal: '早起习惯', pal: 3, title: '5分钟锚点', text: '不用"早起"这个目标压自己，只需在闹钟响起后，做一件5分钟的事。' },
    ],
  },
];

export const CHAT_Q = [
  '上次你说卡在"开始"。\n\n今天，是什么让你停下来的？',
  '你注意到那个停顿的感觉了。\n\n它像什么？',
  '每次这样停下来时，\n你通常告诉自己什么？',
];

export const GENERAL_Q = [
  '最近，\n\n整体感觉怎么样？',
  '在所有进行中的目标里，\n\n哪一个最让你有感觉？',
  '我注意到你在时间分配上已经走了很远。\n\n是什么让你今天还在这里？',
];

export const ADD_GOAL_QS = [
  '说说看——\n\n什么让你想到这件事的？',
  '嗯。\n\n现在是什么状态？你觉得，差距在哪里？',
  '这种感觉，\n\n在什么时候最明显？',
  '大概多久出现一次？\n\n每次会持续多久？',
  '如果三个月后，这件事有了改变——\n\n你会看到什么不同？',
  '你怎么知道自己在进步？\n\n有没有一个可以感受到的信号？',
];

export const OB_STEPS = [
  { q: '你想关注的方向？', opts: ['工作效率', '情绪管理', '人际边界', '创造力', '自我认知', '习惯养成', '拖延执行', '压力应对'] },
  { q: '你通常怎么描述卡点？', opts: ['说不清楚', '知道但做不到', '反复放弃', '想太多', '太分散', '拒绝开始'] },
  { q: '你现在处于？', opts: ['刚刚意识到', '卡了一段时间', '想重新开始', '寻找突破口'] },
];

export const PLAN_ITEMS = [
  { label: '理解卡点', done: true, desc: '已找到：从"完美开头"的执念出发' },
  { label: '识别模式', done: true, desc: '每次卡住前，都在等待某种"确定感"' },
  { label: '行动实验', done: false, desc: '本周试：先写烂草稿，不回头看' },
  { label: '复盘总结', done: false, desc: '完成3次实验后开启' },
];


export const ADD_PHASE_MAP = [0, 0, 1, 1, 2, 2];
export const ADD_PHASE_LABELS = ['说清楚', '找规律', '定方向'];

// ─── Context 类型 ───

interface AppContextType {
  goals: Goal[];
  extraGoals: Goal[];
  addExtraGoal: (g: Goal) => void;
  deleteGoal: (id: number) => void;
  clearNewFlag: (id: number) => void;
  accent: string;
  setAccent: (c: string) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  settleCards: SettleCard[];
  timelineData: TimelineMonth[];
  addSettleCard: (card: SettleCard) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(GOALS2);
  const [extraGoals, setExtraGoals] = useState<Goal[]>([]);
  const [accent, setAccent] = useState('#C4783A');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [settleCards, setSettleCards] = useState<SettleCard[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineMonth[]>([]);

  const addExtraGoal = useCallback((g: Goal) => {
    setExtraGoals(prev => [...prev, { ...g, isNew: true }]);
  }, []);

  const clearNewFlag = useCallback((id: number) => {
    setExtraGoals(prev => prev.map(g => g.id === id ? { ...g, isNew: false } : g));
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  const addSettleCard = useCallback((card: SettleCard) => {
    setSettleCards(prev => [card, ...prev]);
    const month = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;
    setTimelineData(prev => {
      const existing = prev.find(m => m.month === month);
      if (existing) {
        return prev.map(m =>
          m.month === month
            ? { ...m, items: [{ date: card.date, goal: card.goal, pal: 0, title: card.title, text: card.text }, ...m.items] }
            : m
        );
      }
      return [{ month, items: [{ date: card.date, goal: card.goal, pal: 0, title: card.title, text: card.text }] }, ...prev];
    });
  }, []);

  const deleteGoal = useCallback((id: number) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setExtraGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      goals, extraGoals, addExtraGoal, deleteGoal, clearNewFlag,
      accent, setAccent,
      onboardingComplete, completeOnboarding,
      settleCards, timelineData, addSettleCard,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
