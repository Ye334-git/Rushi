// ============================================================
// AI 响应解析层 — 处理 ---INTERFACE--- 分隔的对话文本和界面指令
// 所有 AI 回复经过这里解析，拆分为展示文本 + 界面 action
// ============================================================

const SEPARATOR = '---INTERFACE---';

export interface ParsedMessage {
  /** 展示给用户的对话文本（已去掉 INTERFACE 部分） */
  text: string;
  /** 解析后的界面指令，无指令时为 { action: "none" } */
  action: InterfaceAction;
}

export interface InterfaceAction {
  action: string;
  data?: Record<string, unknown>;
  value?: number;
  cards?: CauseCard[];
  clusters?: CauseCluster[];
  phases?: PlanPhase[];
  cause_responses?: CauseResponse[];
  split_into?: { id: string; text: string }[];
  node_id?: string;
  status?: string;
  type?: string;
  from_node?: string;
  to_node?: string;
  echo_text?: string;
  cause_text?: string;
  action_question?: string;
  original_quote?: string;
  cause?: string;
  action_direction?: string;
}

export interface CauseCard {
  id: string;
  type: 'self_judgment' | 'ai_excavated';
  cause: string;
  action_direction: string;
  original_quote?: string;
}

export interface CauseCluster {
  id: string;
  label: string;
  nodes: CauseNode[];
}

export interface CauseNode {
  id: string;
  text: string;
  depth: number;
  has_children: boolean;
  is_mixed: boolean;
}

export interface PlanPhase {
  id: string;
  label: string;
  time_range: string;
  milestone: string;
  tasks: PlanTask[];
}

export interface PlanTask {
  id: string;
  text: string;
  granularity: 'day' | 'week' | 'month';
  linked_cause_id?: string;
}

export interface CauseResponse {
  cause_id: string;
  action: string;
}

/** 解析 AI 回复，拆分为对话文本 + 界面指令 */
export function parseAIResponse(raw: string): ParsedMessage {
  // 空响应守卫：API 返回空或纯空白
  if (!raw || !raw.trim()) {
    console.warn('[parser] 收到空响应');
    return { text: '……', action: { action: 'none' } };
  }

  const sepIdx = raw.indexOf(SEPARATOR);

  if (sepIdx === -1) {
    // 无 INTERFACE 分隔符，整段都是文本
    const trimmed = raw.trim();
    if (!trimmed) {
      console.warn('[parser] 无 INTERFACE 且文本为空');
      return { text: '……', action: { action: 'none' } };
    }
    return { text: trimmed, action: { action: 'none' } };
  }

  const text = raw.slice(0, sepIdx).trim();
  const jsonPart = raw.slice(sepIdx + SEPARATOR.length).trim();

  let action: InterfaceAction = { action: 'none' };
  try {
    // 提取第一个 JSON 对象（可能嵌套在其他文本中）
    const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      action = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // JSON 解析失败，保留 none
  }

  // 空文本守卫：AI 可能只输出 INTERFACE 块而无对话文本
  if (!text) {
    console.warn('[parser] INTERFACE 前文本为空，action:', action.action);
    // 根据 action 类型给一个最小占位文本
    if (action.action === 'generate_plan' || action.action === 'skip_to_plan') {
      return { text: '好的，我已经理解了。', action };
    }
    if (action.action === 'generate_cause_cards') {
      return { text: '我整理了一下你提到的。', action };
    }
    return { text: '……', action };
  }

  return { text, action };
}
