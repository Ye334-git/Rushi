// ============================================================
// API 调用层 — 封装 DeepSeek API 请求
// - 模型和参数在这里改（model / temperature / max_tokens）
// - 直连/中转模式由 .env 中的环境变量自动选择
// ============================================================

// 直连模式: 设置 EXPO_PUBLIC_DEEPSEEK_API_KEY=sk-xxx → 直接调 DeepSeek，最快
// 中转模式: 设置 EXPO_PUBLIC_API_URL=https://xxx → 走 Vercel/本地代理，保护 Key

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
const PROXY_URL = process.env.EXPO_PUBLIC_API_URL;

const USE_DIRECT = !!DEEPSEEK_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

import type { PlanPhase } from '../types/models';

export interface GoalSynthesis {
  name: string;
  phase: string;
  summary: string;
  insight: string;
  planSteps: { label: string; desc: string }[];
  phases?: PlanPhase[];
}

async function callDirect(
  messages: Message[],
  system: string,
  jsonMode: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    // 模型切换：改这里即可（如 deepseek-chat / deepseek-reasoner 等）
    model: 'deepseek-v4-flash',
    messages: [{ role: 'system', content: system }, ...messages],
    temperature: 0.7,
    // System prompt + 画像 + 对话历史已占 ~800 tokens，需留足空间给 AI 回复
    // 普通对话：追问文本 + INTERFACE JSON；合成模式：phases 计划 + insight
    max_tokens: jsonMode ? 2048 : 1024,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const resp = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`DeepSeek error ${resp.status}: ${err.slice(0, 100)}`);
  }

  const data = await resp.json();
  const content: string = data.choices?.[0]?.message?.content || '';
  if (!content) {
    console.warn('[chat] API 返回空 content，finish_reason:', data.choices?.[0]?.finish_reason);
  }
  return content;
}

async function callProxy(
  messages: Message[],
  system: string,
  jsonMode: boolean,
): Promise<string> {
  const base = PROXY_URL || 'http://localhost:3000';
  const resp = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system, jsonMode }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `API error: ${resp.status}`);
  }

  const data = await resp.json();
  const content: string = data.text || '';
  if (!content) {
    console.warn('[chat] 代理返回空 text');
  }
  return content;
}

const callAPI = USE_DIRECT ? callDirect : callProxy;

export interface MethodologyResult {
  insight: string;
  progress?: number;
  methods: { name: string; summary: string; detail: string; trigger: string; category: string }[];
}

export async function extractMethodology(
  messages: Message[],
  system: string,
): Promise<MethodologyResult> {
  const text = await callAPI(messages, system, true);
  try {
    const parsed = JSON.parse(text);
    return {
      insight: parsed.insight || '',
      progress: typeof parsed.progress === 'number' ? parsed.progress : undefined,
      methods: Array.isArray(parsed.methods) ? parsed.methods : [],
    };
  } catch {
    // 解析失败时，把整段文本当 insight 返回
    return { insight: text.slice(0, 80), methods: [] };
  }
}

export async function sendChatMessage(
  messages: Message[],
  system: string,
): Promise<string> {
  return callAPI(messages, system, false);
}

export async function synthesizeGoal(
  messages: Message[],
  system: string,
): Promise<GoalSynthesis> {
  const text = await callAPI(messages, system, true);

  try {
    const parsed = JSON.parse(text);
    return {
      name: (parsed.name || '新目标').slice(0, 8),
      phase: parsed.phase || '现状→突破',
      summary: parsed.summary || '',
      insight: parsed.insight || '',
      planSteps: Array.isArray(parsed.plan_steps) ? parsed.plan_steps : [],
      phases: Array.isArray(parsed.phases) ? parsed.phases.map((p: any, pi: number) => ({
        id: `phase_${pi}`,
        label: p.label || '',
        time_range: p.time_range || '',
        milestone: p.milestone,
        tasks: Array.isArray(p.tasks) ? p.tasks.map((t: any, ti: number) => ({
          id: `task_${pi}_${ti}`,
          text: t.text || '',
          granularity: t.granularity || 'day',
          linked_cause: t.linked_cause,
        })) : [],
      })) : undefined,
    };
  } catch {
    const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
    const phaseMatch = text.match(/"phase"\s*:\s*"([^"]+)"/);
    return {
      name: nameMatch?.[1]?.slice(0, 8) || '新目标',
      phase: phaseMatch?.[1] || '现状→突破',
      summary: '',
      insight: '',
      planSteps: [],
    };
  }
}
