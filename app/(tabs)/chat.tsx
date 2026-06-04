import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { TH2 } from '../../constants/Colors';
import { PlanetOrb } from '../../components/PlanetOrb';
import { Typewriter } from '../../components/Typewriter';
import { ThinkingDots } from '../../components/ThinkingDots';
import { useApp, GENERAL_Q, GOALS2 } from '../../contexts/AppContext';

interface Msg {
  role: 'ai' | 'user';
  text: string;
  id?: number;
}

export default function GeneralChatScreen() {
  const router = useRouter();
  const { accent } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [phase, setPhase] = useState('start');
  const [input, setInput] = useState('');
  const [qIdx, setQIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([{ role: 'ai', text: GENERAL_Q[0], id: 0 }]);
      setPhase('typing0');
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase]);

  const handleAIDone = (idx: number) => {
    if (idx < GENERAL_Q.length - 1) setPhase(`wait${idx}`);
    else setPhase('done');
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input;
    setInput('');
    const nextQ = qIdx + 1;
    setMsgs(prev => [...prev, { role: 'user', text: txt }]);
    setPhase('thinking');
    setTimeout(() => {
      if (nextQ < GENERAL_Q.length) {
        setMsgs(prev => [...prev, { role: 'ai', text: GENERAL_Q[nextQ], id: nextQ }]);
        setPhase(`typing${nextQ}`);
        setQIdx(nextQ);
      } else {
        setPhase('done');
      }
    }, 1200);
  };

  const isTyping = phase.startsWith('typing');
  const isWaiting = phase.startsWith('wait');
  const showInput = isWaiting || phase === 'done';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TH2.bg0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 1, marginBottom: 2 }}>
            整体反思
          </Text>
          <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 18, color: TH2.t0 }}>今天</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {GOALS2.slice(0, 3).map((g, i) => (
            <View key={g.id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
              <PlanetOrb goal={g} size={26} mini />
            </View>
          ))}
        </View>
      </View>

      {/* Messages */}
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
                <Typewriter text={msg.text} speed={30} onDone={() => handleAIDone(msg.id!)} />
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
        {phase === 'done' && (
          <View style={{ padding: 18, borderRadius: 16, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 10 }}>本周模式</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1, lineHeight: 21, marginBottom: 16 }}>
              三个目标里，你最常回避的时刻都发生在一天的开始。
            </Text>
            <Pressable
              onPress={() => router.navigate('/(tabs)/settle')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TH2.accSoft, borderWidth: 1, borderColor: 'rgba(196,120,58,0.3)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: ac }}>保存洞察</Text>
              <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <Path d="M2 5h6M5 2l3 3-3 3" stroke={ac} strokeWidth={1.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={{ borderTopWidth: 1, borderTopColor: TH2.bdr, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 70, opacity: showInput ? 1 : 0 }} pointerEvents={showInput ? 'auto' : 'none'}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="随便说说……"
            placeholderTextColor={TH2.t2}
            multiline
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              borderWidth: 0,
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
              color: TH2.t0,
              lineHeight: 22,
              paddingTop: 2,
              maxHeight: 100,
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: input.trim() ? ac : TH2.bg2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
