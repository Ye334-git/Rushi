// ============================================================
// 卡片系统 — 所有对话结算卡片的统一配置
//
// 每个卡片 = 触发条件 + AI Prompt + 内容解析 + 按钮行为
// 添加新卡片：在 CARD_REGISTRY 中新增一个条目即可
// 所有 System Prompt 在 services/prompts.ts 中独立管理
// ============================================================

// ─── 类型定义 ───

/** 卡片触发方式 */
type TriggerType =
  | 'manual'        // 用户手动点击按钮触发（如"结束"、"生成目标"）
  | 'ai_marker'     // AI 在回复中标记某个字符串触发
  | 'auto_exchanges'; // 对话达到一定轮数自动触发

/** 卡片按钮动作 */
interface CardAction {
  /** 按钮文字 */
  label: string;
  /** 动作类型 — 执行后会调用 AppContext 对应函数 */
  action: 'save_insight' | 'add_goal' | 'update_progress' | 'none';
  /** 按钮样式变体 */
  variant: 'primary' | 'secondary';
  /** 动作完成后显示的文字 */
  doneLabel?: string;
}

/** 单张卡片的完整配置 */
export interface CardConfig {
  /** 唯一标识 — 代码中引用 */
  id: string;
  /** 显示名 — 方便工程师识别 */
  name: string;
  /** 所属对话模块 */
  module: 'general-chat' | 'goal-chat' | 'add-goal';
  /** 触发条件 */
  trigger: {
    type: TriggerType;
    /** 触发按钮文字（manual 类型时使用） */
    buttonLabel?: string;
    /** AI 标记字符串（ai_marker 类型时使用） */
    marker?: string;
    /** 标记的正则 — 用于解析数值（如 [PROGRESS:65] → 65） */
    markerRegex?: string;
    /** 最小对话轮数（auto_exchanges / 备选触发） */
    minExchanges?: number;
  };
  /** 生成卡片内容时发给 AI 的额外 Prompt（追加在 System Prompt 后） */
  synthesisPrompt: string;
  /** 卡片上显示的标签文字（如"如实注意到"、"今日打卡总结"） */
  cardLabel: string;
  /** 卡片上的按钮 */
  actions: CardAction[];
  /** 是否需要显示进度调整控件 */
  showProgressControl?: boolean;
}

// ─── 卡片注册表 ───

export const CARD_REGISTRY: Record<string, CardConfig> = {

  // ==========================================
  // 卡片1: 总体对话 → 反思总结卡片
  // 触发：用户点"结束"
  // 行为：AI 总结 → 保存到沉淀库
  // ==========================================
  'general-summary': {
    id: 'general-summary',
    name: '总体反思总结',
    module: 'general-chat',
    trigger: {
      type: 'manual',
      buttonLabel: '结束',
    },
    synthesisPrompt:
      '请根据以上对话，用一段话（80字以内）总结用户此刻的核心状态和一个值得注意的模式。直接输出，不要加"根据对话"之类的引言。',
    cardLabel: '本周模式',
    actions: [
      { label: '保存到沉淀库', action: 'save_insight', variant: 'primary', doneLabel: '已存入沉淀库' },
    ],
  },

  // ==========================================
  // 卡片2: 目标打卡 → 打卡总结 + 进度更新
  // 触发：用户点"结束"
  // AI 标记：[PROGRESS:数字] 用于建议进度
  // 行为：AI 总结 + 进度调整 + 保存到沉淀库
  // ==========================================
  'goal-checkin': {
    id: 'goal-checkin',
    name: '目标打卡总结',
    module: 'goal-chat',
    trigger: {
      type: 'manual',
      buttonLabel: '结束',
      // 同时检测对话中 AI 是否已给出进度建议
      marker: '[PROGRESS:',
      markerRegex: '\\[PROGRESS:(\\d+)\\]',
    },
    synthesisPrompt:
      '请根据以上对话总结：\n1. 用一段话（60字以内）概括用户今日的进展或卡点\n2. 在末尾给出进度建议，格式：[PROGRESS:数字]\n直接输出，不要加引言。',
    cardLabel: '今日打卡总结',
    showProgressControl: true,
    actions: [
      { label: '确认更新', action: 'update_progress', variant: 'primary' },
      { label: '保存到沉淀库', action: 'save_insight', variant: 'secondary', doneLabel: '已存入沉淀库' },
    ],
  },

  // ==========================================
  // 卡片3: 新建目标 → 目标生成卡片
  // 触发：AI 标 [READY] 或 ≥6 条消息 → "生成目标"按钮
  // 行为：AI 转 JSON → 生成 Goal → 确认入库
  // ==========================================
  'goal-synthesis': {
    id: 'goal-synthesis',
    name: '新目标生成',
    module: 'add-goal',
    trigger: {
      type: 'ai_marker',
      marker: '[READY]',
      minExchanges: 6,
      buttonLabel: '生成目标',
    },
    synthesisPrompt:
      '请根据上面的对话，生成一个目标总结。\n\n返回 JSON 格式：\n{\n  "name": "目标名称（最多4个中文字，简洁有力）",\n  "phase": "阶段描述（格式如：现状→突破，用→连接现在和未来）",\n  "summary": "一句话总结用户想达成什么（20字以内）"\n}\n\n只返回 JSON，不要任何其他内容。',
    cardLabel: '如实理解的是这样——',
    actions: [
      { label: '确认，开始追踪', action: 'add_goal', variant: 'primary' },
      { label: '重新描述', action: 'none', variant: 'secondary' },
    ],
  },
};

// ─── 工具函数 ───

/** 检测 AI 文本中是否包含指定标记 */
export function detectMarker(text: string, marker: string): boolean {
  return text.includes(marker);
}

/** 从 AI 文本中提取标记中的数值（如 [PROGRESS:65] → 65） */
export function extractMarkerValue(text: string, pattern: string): number | null {
  const match = text.match(new RegExp(pattern));
  return match ? parseInt(match[1], 10) : null;
}

/** 清理 AI 文本中的标记（显示时去掉标记字符串） */
export function stripMarker(text: string, pattern: string): string {
  return text.replace(new RegExp(pattern), '').trim();
}

/** 根据对话数量判断阶段（新建目标用） */
export function getPhaseByExchanges(count: number): number {
  if (count <= 1) return 0; // 说清楚
  if (count <= 3) return 1; // 找规律
  return 2;                 // 定方向
}
