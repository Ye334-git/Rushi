/**
 * RUSHI v2 核心数据模型
 * 来源：design_handoff_rushi/source/rushi-screens-v2.jsx
 */

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
}

// ─── 对话消息 ───
export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  /** AI 消息的序号（用于打字机回调） */
  id?: number;
}

// ─── 沉淀卡片 ───
export interface SettleCard {
  id: number;
  goal: string;
  date: string;
  title: string;
  text: string;
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

// ─── 引导问题步骤 ───
export interface OBStep {
  q: string;
  opts: string[];
}

// ─── 计划条目 ───
export interface PlanItem {
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
}
