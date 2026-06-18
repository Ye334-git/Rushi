// ============================================================
// 卡片系统 — 所有对话结算卡片的统一配置
//
// 触发方式分两种：
//   1. manual — 用户点击按钮触发（"结束"、"生成目标"）
//   2. interface_action — AI 在 ---INTERFACE--- 中输出指定 action 时自动触发
//
// interface_action 映射表（AI 输出 → 卡片渲染）：
//   suggest_progress   → 弹出进度建议控件
//   generate_cause_cards → 弹出真因卡片列表
//   generate_plan      → 弹出行动计划卡片
//   render_cause_tree  → 弹出原因层级图
//   skip_to_plan       → 跳过卡点挖掘，直接进入计划生成
// ============================================================

/** AI 界面指令 → 前端卡片动作映射 */
export const INTERFACE_CARD_MAP: Record<string, string> = {
  suggest_progress: 'goal-checkin-progress',
  generate_cause_cards: 'add-goal-cause-cards',
  generate_plan: 'add-goal-plan',
  render_cause_tree: 'add-goal-cause-tree',
  skip_to_plan: 'add-goal-plan',
  listening: 'none',
  update_node: 'none',
  split_node: 'none',
  show_echo: 'none',
  flip_node: 'none',
  mark_node_done: 'none',
  suggest_settle: 'suggest-settle',
};

/** 卡片触发方式 */
type TriggerType = 'manual' | 'interface_action';

/** 卡片按钮动作 */
interface CardAction {
  label: string;
  action: 'save_insight' | 'add_goal' | 'update_progress' | 'none';
  variant: 'primary' | 'secondary';
  doneLabel?: string;
}

export interface CardConfig {
  id: string;
  name: string;
  module: 'general-chat' | 'goal-chat' | 'add-goal';
  trigger: {
    type: TriggerType;
    buttonLabel?: string;
    /** interface_action 触发时，匹配 AI 的 action 字段 */
    interfaceAction?: string;
    /** 最小对话轮数（备选触发） */
    minExchanges?: number;
  };
  /** 手动触发时发给 AI 的结语 Prompt */
  synthesisPrompt?: string;
  cardLabel: string;
  actions: CardAction[];
  showProgressControl?: boolean;
}

export const CARD_REGISTRY: Record<string, CardConfig> = {

  // ==========================================
  // 卡片1: 总体对话 → 反思总结（手动触发）
  // ==========================================
  'general-summary': {
    id: 'general-summary',
    name: '总体反思总结',
    module: 'general-chat',
    trigger: { type: 'manual', buttonLabel: '结束' },
    synthesisPrompt:
      '请根据以上对话，分析用户的状态并提取方法。返回 JSON：\n{\n  "insight": "核心洞察（60字内，第二人称）",\n  "methods": [\n    {\n      "name": "方法名称（≤6字）",\n      "summary": "一句话概括（15字内）",\n      "detail": "具体怎么做（30字内）",\n      "trigger": "什么时候用这个方法",\n      "category": "启动策略 / 执行技巧 / 中断恢复 / 复盘方法 / 情绪调节 / 其他"\n    }\n  ]\n}\n如果没有可提炼的方法，methods 返回空数组。只返回 JSON。',
    cardLabel: '本周模式',
    actions: [
      { label: '保存到沉淀库', action: 'save_insight', variant: 'primary', doneLabel: '已存入沉淀库' },
    ],
  },

  // ==========================================
  // 卡片2: 目标打卡 → 手动结束 + suggest_progress 触发进度控件
  // ==========================================
  'goal-checkin': {
    id: 'goal-checkin',
    name: '目标打卡总结',
    module: 'goal-chat',
    trigger: {
      type: 'manual',
      buttonLabel: '结束',
    },
    synthesisPrompt:
      '请根据以上对话，分析用户今日进展并提取方法。返回 JSON：\n{\n  "insight": "今日核心洞察（60字内，第二人称）",\n  "progress": 数字（0-100，基于今日进展的建议值，如果用户没有进展则保持对话中最后提到的值）,\n  "methods": [\n    {\n      "name": "方法名称（≤6字）",\n      "summary": "一句话概括（15字内）",\n      "detail": "具体怎么做（30字内）",\n      "trigger": "什么时候用这个方法",\n      "category": "启动策略 / 执行技巧 / 中断恢复 / 复盘方法 / 情绪调节 / 其他"\n    }\n  ]\n}\n如果没有可提炼的方法，methods 返回空数组。只返回 JSON。',
    cardLabel: '今日打卡总结',
    showProgressControl: true,
    actions: [
      { label: '确认更新', action: 'update_progress', variant: 'primary' },
      { label: '保存到沉淀库', action: 'save_insight', variant: 'secondary', doneLabel: '已存入沉淀库' },
    ],
  },

  // ==========================================
  // 卡片3: 新建目标 → 卡点挖掘 + 真因卡片 + 行动计划
  // ==========================================
  'add-goal-cause-tree': {
    id: 'add-goal-cause-tree',
    name: '原因层级图',
    module: 'add-goal',
    trigger: { type: 'interface_action', interfaceAction: 'render_cause_tree' },
    cardLabel: '你的卡点结构',
    actions: [],
  },

  'add-goal-cause-cards': {
    id: 'add-goal-cause-cards',
    name: '真因卡片',
    module: 'add-goal',
    trigger: { type: 'interface_action', interfaceAction: 'generate_cause_cards' },
    cardLabel: '核心阻碍',
    actions: [
      { label: '生成行动计划', action: 'none', variant: 'primary' },
    ],
  },

  'add-goal-plan': {
    id: 'add-goal-plan',
    name: '行动计划 + 目标入库',
    module: 'add-goal',
    trigger: { type: 'interface_action', interfaceAction: 'generate_plan' },
    cardLabel: '你的目标档案',
    actions: [
      { label: '确认，开始追踪', action: 'add_goal', variant: 'primary' },
      { label: '重新描述', action: 'none', variant: 'secondary' },
    ],
  },

  // ==========================================
  // 卡片4: 自动方法检测 → 轻量提示（AI 主动触发）
  // ==========================================
  'suggest-settle': {
    id: 'suggest-settle',
    name: '方法检测',
    module: 'general-chat',
    trigger: { type: 'interface_action', interfaceAction: 'suggest_settle' },
    cardLabel: '可能要沉淀',
    actions: [
      { label: '展开分析', action: 'save_insight', variant: 'primary' },
      { label: '忽略', action: 'none', variant: 'secondary' },
    ],
  },
};
