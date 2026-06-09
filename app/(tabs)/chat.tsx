import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { TH2 } from '../../constants/Colors';
import { PlanetOrb } from '../../components/PlanetOrb';
import { Typewriter } from '../../components/Typewriter';
import { ThinkingDots } from '../../components/ThinkingDots';
import { useApp, GOALS2 } from '../../contexts/AppContext';
import { sendChatMessage } from '../../services/chat';
import { buildGeneralPrompt } from '../../services/prompts';
import { loadConversation, saveConversation, clearConversation } from '../../services/storage';
import { CARD_REGISTRY } from '../../services/cards';

interface Msg { role: 'ai' | 'user'; text: string; }

const CONV_KEY = 'general';

// ============================================================
// 总体反思对话 — 卡片配置见 services/cards.ts → general-summary
//   触发: 用户点"结束" → AI 总结 → 卡片 → 保存到沉淀库
// ============================================================
export default function GeneralChatScreen() {
  const router = useRouter();
  const { accent, extraGoals, addSettleCard } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [phase, setPhase] = useState('start');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const allGoals = [...GOALS2, ...extraGoals];
  const systemPrompt = buildGeneralPrompt(
    allGoals.map(g => ({ name: g.name, phase: g.phase, progress: g.progress })),
  );

  useEffect(() => {
    (async () => {
      const saved = await loadConversation(CONV_KEY);
      if (saved && saved.length > 0) {
        // 恢复上次对话
        setMsgs(saved as Msg[]);
        setPhase('waiting');
      } else {
        // 开始新对话
        await startNewConversation();
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase]);

  const startNewConversation = async () => {
    await clearConversation(CONV_KEY);
    setMsgs([]);
    setEnded(false);
    setSaved(false);
    setError('');
    setPhase('thinking');
    try {
      const text = await sendChatMessage([], systemPrompt);
      const firstMsg: Msg[] = [{ role: 'ai', text }];
      setMsgs(firstMsg);
      await saveConversation(CONV_KEY, firstMsg);
      setPhase('typing');
    } catch (e: any) {
      setError(e.message || '连接失败');
      setPhase('waiting');
    }
  };

  const buildApiMessages = (msgsArr: Msg[]) =>
    msgsArr.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    }));

  const handleAIDone = async () => {
    setPhase(ended ? 'done' : 'waiting');
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    const newMsgs: Msg[] = [...msgs, { role: 'user', text: userText }];
    setMsgs(newMsgs);
    await saveConversation(CONV_KEY, newMsgs);
    setPhase('thinking');
    setError('');

    try {
      const text = await sendChatMessage(buildApiMessages(newMsgs), systemPrompt);
      const full: Msg[] = [...newMsgs, { role: 'ai', text }];
      setMsgs(full);
      await saveConversation(CONV_KEY, full);
      setPhase('typing');
    } catch (e: any) {
      setError(e.message || '连接失败');
      setPhase('waiting');
    }
  };

  const handleEnd = async () => {
    setPhase('thinking');
    setEnded(true);
    try {
      const summary = await sendChatMessage(
        buildApiMessages(msgs),
        CARD_REGISTRY['general-summary'].synthesisPrompt,
      );
      const full: Msg[] = [...msgs, { role: 'ai', text: summary }];
      setMsgs(full);
      await saveConversation(CONV_KEY, full);
      setPhase('typing');
    } catch {
      setPhase('done');
    }
  };

  const isTyping = phase === 'typing';
  const showInput = phase === 'waiting';
  const hasSaved = msgs.length > 0;
  const lastAIMsg = hasSaved && msgs[msgs.length - 1].role === 'ai'
    ? msgs[msgs.length - 1].text
    : '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TH2.bg0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 1, marginBottom: 2 }}>
            整体反思
          </Text>
          <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 18, color: TH2.t0 }}>今天</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {allGoals.slice(0, 3).map((g, i) => (
            <View key={g.id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
              <PlanetOrb goal={g} size={26} mini />
            </View>
          ))}
          {hasSaved && (
            <Pressable
              onPress={startNewConversation}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: TH2.bdr }}
            >
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t1 }}>新对话</Text>
            </Pressable>
          )}
          {msgs.length >= 2 && phase !== 'done' && !ended && (
            <Pressable
              onPress={handleEnd}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: TH2.bdr }}
            >
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: TH2.t1 }}>结束</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {msgs.map((msg, i) => {
          const isLastAI = msg.role === 'ai' && i === msgs.length - 1;
          const typeActive = isLastAI && isTyping;
          if (msg.role === 'user') {
            return (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                <View style={{ maxWidth: '78%', backgroundColor: TH2.bg2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderBottomRightRadius: 4 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: TH2.t1, lineHeight: 22 }}>{msg.text}</Text>
                </View>
              </View>
            );
          }
          if (typeActive) {
            return (
              <View key={i} style={{ marginBottom: 16 }}>
                <Typewriter text={msg.text} speed={30} onDone={handleAIDone} />
              </View>
            );
          }
          return (
            <View key={i} style={{ maxWidth: '92%', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 20, color: TH2.t0, lineHeight: 37 }}>{msg.text}</Text>
            </View>
          );
        })}
        {phase === 'thinking' && <ThinkingDots />}
        {error ? (
          <View style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,0,0,0.06)', marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#c44' }}>{error}</Text>
          </View>
        ) : null}
        {phase === 'done' && lastAIMsg ? (
          <View style={{ padding: 18, borderRadius: 16, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 10 }}>本周模式</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1, lineHeight: 21, marginBottom: 16 }}>
              {lastAIMsg}
            </Text>
            {saved ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TH2.accSoft, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: ac }}>已存入沉淀库</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  addSettleCard({
                    id: Date.now(),
                    goal: '整体反思',
                    date: `${new Date().getMonth() + 1}月${new Date().getDate()}日`,
                    title: lastAIMsg.slice(0, 12),
                    text: lastAIMsg,
                  });
                  setSaved(true);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TH2.accSoft, borderWidth: 1, borderColor: 'rgba(196,120,58,0.3)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: ac }}>保存到沉淀库</Text>
                <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                  <Path d="M2 5h6M5 2l3 3-3 3" stroke={ac} strokeWidth={1.4} strokeLinecap="round" />
                </Svg>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{ borderTopWidth: 1, borderTopColor: TH2.bdr, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 70, opacity: showInput ? 1 : 0 }}
        pointerEvents={showInput ? 'auto' : 'none'}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="随便说说……"
            placeholderTextColor={TH2.t2}
            multiline
            style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, fontFamily: 'DMSans_400Regular', fontSize: 15, color: TH2.t0, lineHeight: 22, paddingTop: 2, maxHeight: 100 }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: input.trim() ? ac : TH2.bg2, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <Path d="M6 10V2M3 5l3-3 3 3" stroke={input.trim() ? '#fff' : TH2.t2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
