/**
 * RUSHI v2 核心数据模型
 * 来源：design_handoff_rushi/source/rushi-screens-v2.jsx
 */

// ─── 执行计划（分阶段，粒度递减） ───
export interface PlanTask {
  id: string;
  text: string;
  granularity: 'day' | 'week' | 'month';
  linked_cause_id?: string;
  linked_cause?: string; // 关联的卡点描述（展示用）
}

export interface PlanPhase {
  id: string;
  label: string;
  time_range: string;
  milestone?: string;
  tasks: PlanTask[];
}

// ─── 星球（目标） ───
export interface Goal {
  id: number;
  name: string;
  phase: string;
  progress: number; // 0-100
  /** 调色板索引 (对应 PALS2) */
  pal: number;
  /** 在目标板的百分比定位 */
  cx: string;
  cy: string;
  /** 星球尺寸 */
  sz: number;
  /** 是否为新创建的（播放爆裂动画） */
  isNew?: boolean;
  /** AI 生成的总结 */
  summary?: string;
  /** AI 生成的洞察文案（展示在目标详情页） */
  insight?: string;
  /** AI 生成的计划步骤 */
  planSteps?: PlanItem[];
  /** AI 生成的执行计划（分阶段，粒度递减） */
  phases?: PlanPhase[];
  /** 目标创建时间戳（用于计算时间线位置） */
  createdAt?: number;
}

// ─── 对话消息 ───
export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  /** AI 消息的序号（用于打字机回调） */
  id?: number;
}

// ─── 方法卡片（从对话中提取的方法论） ───
export interface MethodItem {
  name: string;        // 方法名称（≤6字）
  summary: string;     // 一句话概括
  detail: string;      // 具体怎么做
  trigger: string;     // 触发条件
  category: string;    // 分类
}

// ─── 沉淀卡片 ───
export interface SettleCard {
  id: number;
  goal: string;
  date: string;
  title: string;
  text: string;
  /** 从对话中提取的方法论（新版） */
  insight?: string;
  methods?: MethodItem[];
}

// ─── 时间线条目 ───
export interface TimelineItem {
  date: string;
  goal: string;
  pal: number;
  title: string;
  text: string;
}

export interface TimelineMonth {
  month: string;
  items: TimelineItem[];
}

// ─── 入场问卷 ───
export type SurveyQuestionType = 'single' | 'multi' | 'text' | 'slider';

export interface SurveyQuestion {
  id: string;
  module: string;
  type: SurveyQuestionType;
  question: string;
  hint?: string;
  placeholder?: string;
  options?: string[];
  condition?: {
    dependsOn: string;
    notEqual?: string;
  };
}

export interface SurveyModule {
  id: string;
  title: string;
  subtitle?: string;
}

/** 用户执行人格维度（后台计算，暂不展示） */
export interface ExecutionDimensions {
  startupStyle: string;
  disruptionRecovery: string;
  reviewHabit: string;
  goalClarity: string;
  actionExperience: string;
}

/** 入场问卷结果，影响后续 AI 对话行为 */
export interface UserProfile {
  answers: Record<string, string | string[] | number>;
  goal: string;
  goalArea: string;
  timeline: string;
  attemptCount: string;
  observations: string[];
  strengths: string[];
  challenges: string[];
  planetMessage: string;
  aiPreferences: string[];
  aiDislikes: string[];
  dimensions: ExecutionDimensions;
}

// @deprecated 旧版引导步骤，已被入场问卷取代
export interface OBStep {
  q: string;
  opts: string[];
}

// ─── 计划条目 ───
export interface PlanItem {
  id: string;
  label: string;
  done: boolean;
  desc: string;
}

// ─── App 全局状态 ───
export interface AppState {
  onboardingComplete: boolean;
  goals: Goal[];
  extraGoals: Goal[];
  settleCards: SettleCard[];
  timelineData: TimelineMonth[];
  userProfile?: UserProfile;
}
