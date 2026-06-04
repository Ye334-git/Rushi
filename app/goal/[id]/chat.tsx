import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { TH2 } from '../../../constants/Colors';
import { PlanetOrb } from '../../../components/PlanetOrb';
import { Typewriter } from '../../../components/Typewriter';
import { ThinkingDots } from '../../../components/ThinkingDots';
import { useApp, GOALS2, CHAT_Q } from '../../../contexts/AppContext';

const PSIZE = 360;
const PVISIBLE = 130;
const POFFSET = -(PSIZE - PVISIBLE);
const INPUT_GAP = PVISIBLE + 24; // input bar sits above planet
const { height: SCREEN_H } = Dimensions.get('window');

interface Msg { role: 'ai' | 'user'; text: string; id?: number; }

export default function GoalChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accent, extraGoals } = useApp();
  const ac = accent;
  const insets = useSafeAreaInsets();

  const allGoals = [...GOALS2, ...extraGoals];
  const goal = allGoals.find(g => g.id === Number(id)) || GOALS2[0];

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [phase, setPhase] = useState('start');
  const [input, setInput] = useState('');
  const [qIdx, setQIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // ── Planet drop: starts from ~upper third (board area), grows to bottom ──
  const planetTY = useSharedValue(-SCREEN_H * 0.55);
  const planetScl = useSharedValue(0.42);
  const planetOp = useSharedValue(0);
  const contentOp = useSharedValue(0);

  useEffect(() => {
    planetTY.value = withTiming(0, { duration: 720, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    planetScl.value = withSequence(
      withTiming(1.03, { duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
      withTiming(1, { duration: 220, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
    );
    planetOp.value = withTiming(1, { duration: 400 });
    const t1 = setTimeout(() => { contentOp.value = withTiming(1, { duration: 340 }); }, 460);
    const t2 = setTimeout(() => {
      setMsgs([{ role: 'ai', text: CHAT_Q[0], id: 0 }]);
      setPhase('typing0');
    }, 720);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, phase]);

  const planetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: planetTY.value }, { scale: planetScl.value }],
    opacity: planetOp.value,
  }));

  const contentAnim = useAnimatedStyle(() => ({ opacity: contentOp.value }));

  const handleBack = useCallback(() => {
    planetTY.value = withTiming(-SCREEN_H * 0.55, { duration: 540, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    planetScl.value = withTiming(0.42, { duration: 540, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    planetOp.value = withTiming(0, { duration: 400 });
    contentOp.value = withTiming(0, { duration: 300 });
    setTimeout(() => router.back(), 540);
  }, []);

  const handleAIDone = (idx: number) => {
    if (idx < CHAT_Q.length - 1) setPhase(`wait${idx}`);
    else setPhase('done');
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input; setInput('');
    const nextQ = qIdx + 1;
    setMsgs(prev => [...prev, { role: 'user', text: txt }]);
    setPhase('thinking');
    setTimeout(() => {
      if (nextQ < CHAT_Q.length) {
        setMsgs(prev => [...prev, { role: 'ai', text: CHAT_Q[nextQ], id: nextQ }]);
        setPhase(`typing${nextQ}`); setQIdx(nextQ);
      } else { setPhase('done'); }
    }, 1200);
  };

  const isTyping = phase.startsWith('typing');
  const isWaiting = phase.startsWith('wait');
  const showInput = isWaiting || phase === 'done';

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* ── Keyboard-aware content: nav + messages + input ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-insets.bottom}
      >
        {/* Nav */}
        <View style={{
          paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Pressable onPress={handleBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
            <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
              <Path d="M6 1L1 6l5 5" stroke={TH2.t1} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1 }}>目标计划</Text>
          </Pressable>
          {phase === 'start' || isTyping ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: TH2.accSoft }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: ac }} />
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1 }}>思考中</Text>
            </View>
          ) : (
            <PlanetOrb goal={goal} size={28} mini />
          )}
        </View>

        {/* Messages + Input — in flex layout, input sits ABOVE planet visible area */}
        <Animated.View style={[{ flex: 1 }, contentAnim]}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24, paddingTop: 8,
              paddingBottom: showInput ? INPUT_GAP + 54 : INPUT_GAP + 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {msgs.map((msg, i) => {
              const isLastAI = msg.role === 'ai' && i === msgs.length - 1;
              if (msg.role === 'user') return (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <View style={{ maxWidth: '78%', backgroundColor: TH2.bg2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderBottomRightRadius: 4 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: TH2.t1, lineHeight: 22 }}>{msg.text}</Text>
                  </View>
                </View>
              );
              if (isLastAI && isTyping) return (
                <View key={i} style={{ marginBottom: 20 }}>
                  <Typewriter text={msg.text} speed={28} onDone={() => handleAIDone(msg.id!)} style={{ fontSize: 19 }} />
                </View>
              );
              return (
                <View key={i} style={{ maxWidth: '92%', marginBottom: 20 }}>
                  <Text style={{ fontFamily: 'Lora_500Medium', fontSize: 19, color: TH2.t0, lineHeight: 35 }}>{msg.text}</Text>
                </View>
              );
            })}
            {phase === 'thinking' && <ThinkingDots />}
            {phase === 'done' && (
              <View style={{ marginTop: 8, padding: 18, borderRadius: 16, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr }}>
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: ac, letterSpacing: 1, marginBottom: 10 }}>如实注意到</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: TH2.t1, lineHeight: 21, marginBottom: 16 }}>
                  你描述的那个停顿，在这两周里出现了4次。每次都在"开始动笔"之前。
                </Text>
                <Pressable
                  onPress={() => router.navigate('/(tabs)/settle')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TH2.accSoft, borderWidth: 1, borderColor: 'rgba(196,120,58,0.3)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }}
                >
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: ac }}>沉淀这个洞察</Text>
                  <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                    <Path d="M2 5h6M5 2l3 3-3 3" stroke={ac} strokeWidth={1.4} strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Input bar — sits above the planet, moves with keyboard */}
          {showInput && (
            <View style={{
              borderTopWidth: 1, borderTopColor: TH2.bdr,
              paddingHorizontal: 18, paddingTop: 10,
              paddingBottom: Math.max(insets.bottom + INPUT_GAP, INPUT_GAP),
              backgroundColor: TH2.bg0,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <TextInput
                  value={input} onChangeText={setInput} onSubmitEditing={handleSend}
                  placeholder="继续说……" placeholderTextColor={TH2.t2}
                  multiline returnKeyType="send" enablesReturnKeyAutomatically
                  style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, fontFamily: 'DMSans_400Regular', fontSize: 15, color: TH2.t0, lineHeight: 22, paddingVertical: 6, maxHeight: 100 }}
                />
                <Pressable onPress={handleSend} disabled={!input.trim()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: input.trim() ? ac : TH2.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 10V2M3 5l3-3 3 3" stroke={input.trim() ? '#fff' : TH2.t2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Planet: rendered AFTER content so it appears on TOP; fixed, never moves with keyboard ── */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, pointerEvents: 'none' }}>
        <Animated.View style={[{ marginBottom: POFFSET, alignSelf: 'center' }, planetAnim]}>
          <PlanetOrb goal={goal} size={PSIZE} />
        </Animated.View>
      </View>
    </View>
  );
}
