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

export interface GoalSynthesis {
  name: string;
  phase: string;
  summary: string;
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
    // 普通对话 256 tokens 足够（一两句追问），JSON 模式需要更多空间
    max_tokens: jsonMode ? 512 : 256,
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
  return data.choices?.[0]?.message?.content || '';
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
  return data.text || '';
}

const callAPI = USE_DIRECT ? callDirect : callProxy;

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
      name: (parsed.name || '新目标').slice(0, 4),
      phase: parsed.phase || '现状→突破',
      summary: parsed.summary || '',
    };
  } catch {
    const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
    const phaseMatch = text.match(/"phase"\s*:\s*"([^"]+)"/);
    return {
      name: nameMatch?.[1]?.slice(0, 4) || '新目标',
      phase: phaseMatch?.[1] || '现状→突破',
      summary: '',
    };
  }
}
