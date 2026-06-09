// ============================================================
// 对话持久化层 — 总体对话和目标对话退出后恢复
// 新建目标不需要持久化（创建完即结束）
// 存储 Key: conv_general / conv_goal-{id}
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../types/models';

export type ConversationKey = 'general' | `goal-${number}`;

interface SavedConv {
  messages: ChatMessage[];
  updatedAt: string;
}

function makeKey(key: ConversationKey): string {
  return `conv_${key}`;
}

export async function loadConversation(key: ConversationKey): Promise<ChatMessage[] | null> {
  try {
    const raw = await AsyncStorage.getItem(makeKey(key));
    if (!raw) return null;
    const data: SavedConv = JSON.parse(raw);
    return data.messages;
  } catch {
    return null;
  }
}

export async function saveConversation(key: ConversationKey, messages: ChatMessage[]): Promise<void> {
  try {
    const data: SavedConv = { messages, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(makeKey(key), JSON.stringify(data));
  } catch {
    // persistence is best-effort, never block on failure
  }
}

export async function clearConversation(key: ConversationKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(makeKey(key));
  } catch {
    // silently fail
  }
}

// ============================================================
// App 状态持久化 — 目标进度、新建的目标、沉淀卡片、引导状态
// 存储 Key: app_state
// ============================================================

import type { Goal, SettleCard, TimelineMonth } from '../types/models';

interface SavedAppState {
  goals: Goal[];
  extraGoals: Goal[];
  settleCards: SettleCard[];
  timelineData: TimelineMonth[];
  onboardingComplete: boolean;
}

const APP_STATE_KEY = 'app_state';

export async function loadAppState(): Promise<SavedAppState | null> {
  try {
    const raw = await AsyncStorage.getItem(APP_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedAppState;
  } catch {
    return null;
  }
}

export async function saveAppState(state: SavedAppState): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
}
