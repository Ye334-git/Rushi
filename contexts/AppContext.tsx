import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { Goal, SettleCard, TimelineMonth, ChatMessage, UserProfile } from '../types/models';
import { loadAppState, saveAppState } from '../services/storage';

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

// @deprecated 旧版引导步骤，已被入场问卷取代
export const OB_STEPS: { q: string; opts: string[] }[] = [];


// ─── Context 类型 ───

interface AppContextType {
  goals: Goal[];
  extraGoals: Goal[];
  addExtraGoal: (g: Goal) => void;
  deleteGoal: (id: number) => void;
  clearNewFlag: (id: number) => void;
  updateGoalProgress: (id: number, progress: number) => void;
  updateGoalPlanStep: (goalId: number, stepId: string, done: boolean) => void;
  accent: string;
  setAccent: (c: string) => void;
  onboardingComplete: boolean;
  completeOnboarding: (profile?: UserProfile) => void;
  settleCards: SettleCard[];
  timelineData: TimelineMonth[];
  addSettleCard: (card: SettleCard) => void;
  userProfile: UserProfile | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [extraGoals, setExtraGoals] = useState<Goal[]>([]);
  const [accent, setAccent] = useState('#C4783A');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [settleCards, setSettleCards] = useState<SettleCard[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineMonth[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const loaded = useRef(false);

  // 启动时从 AsyncStorage 恢复状态
  useEffect(() => {
    (async () => {
      const saved = await loadAppState();
      if (saved) {
        setGoals(saved.goals);
        setExtraGoals(saved.extraGoals);
        // 清除旧版预设沉淀数据（id≤3 或 2025年的旧数据）
        setSettleCards((saved.settleCards || []).filter(c => c.id > 3));
        setTimelineData((saved.timelineData || []).filter(m => !m.month.startsWith('2025')));
        setOnboardingComplete(saved.onboardingComplete);
        if (saved.userProfile) setUserProfile(saved.userProfile);
      }
      loaded.current = true;
    })();
  }, []);

  // 状态变化时自动持久化（跳过首次加载前的空保存）
  useEffect(() => {
    if (!loaded.current) return;
    saveAppState({ goals, extraGoals, settleCards, timelineData, onboardingComplete, userProfile: userProfile || undefined });
  }, [goals, extraGoals, settleCards, timelineData, onboardingComplete, userProfile]);

  const addExtraGoal = useCallback((g: Goal) => {
    setExtraGoals(prev => [...prev, { ...g, isNew: true }]);
  }, []);

  const clearNewFlag = useCallback((id: number) => {
    setExtraGoals(prev => prev.map(g => g.id === id ? { ...g, isNew: false } : g));
  }, []);

  const completeOnboarding = useCallback((profile?: UserProfile) => {
    setOnboardingComplete(true);
    if (profile) setUserProfile(profile);
  }, []);

  const addSettleCard = useCallback((card: SettleCard) => {
    setSettleCards(prev => {
      // 方法合并：同名方法跨卡片出现时，在后出现的卡片中标记为已验证
      const allMethods = prev.flatMap(c => c.methods || []);
      const existingNames = new Set(allMethods.map(m => m.name));
      if (card.methods && card.methods.length > 0) {
        const mergedMethods = card.methods.map(m => ({
          ...m,
          // 如果方法名已存在于之前的卡片中，用 category 后缀标记验证次数
          category: existingNames.has(m.name)
            ? `${m.category} · 已验证`
            : m.category,
        }));
        return [{ ...card, methods: mergedMethods }, ...prev];
      }
      return [card, ...prev];
    });
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

  const updateGoalProgress = useCallback((id: number, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g));
    setExtraGoals(prev => prev.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g));
  }, []);

  const updateGoalPlanStep = useCallback((goalId: number, stepId: string, done: boolean) => {
    const update = (prev: Goal[]) => prev.map(g =>
      g.id === goalId && g.planSteps
        ? { ...g, planSteps: g.planSteps.map(s => s.id === stepId ? { ...s, done } : s) }
        : g
    );
    setGoals(update);
    setExtraGoals(update);
  }, []);

  const deleteGoal = useCallback((id: number) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setExtraGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      goals, extraGoals, addExtraGoal, deleteGoal, clearNewFlag, updateGoalProgress, updateGoalPlanStep,
      accent, setAccent,
      onboardingComplete, completeOnboarding,
      settleCards, timelineData, addSettleCard,
      userProfile,
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
