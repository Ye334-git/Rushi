import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { TH2, PALS2 } from '../../constants/Colors';
import { useApp } from '../../contexts/AppContext';

export default function SettlementScreen() {
  const insets = useSafeAreaInsets();
  const { settleCards, timelineData } = useApp();
  const [view, setView] = useState<'cards' | 'timeline'>('cards');
  const [expanded, setExpanded] = useState<number | null>(null);

  const totalCount = settleCards.length +
    timelineData.reduce((sum, m) => sum + m.items.length, 0);

  const isEmpty = settleCards.length === 0 && timelineData.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: TH2.bg0 }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ fontFamily: 'Lora_600SemiBold', fontSize: 22, color: TH2.t0, marginBottom: 2 }}>沉淀</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t1 }}>
              {isEmpty ? '还没有方法沉淀' : `${totalCount} 个对你有效的方法`}
            </Text>
          </View>
          {/* View toggle — only show when there's data */}
          {!isEmpty && (
            <View style={{ flexDirection: 'row', backgroundColor: TH2.bg1, borderRadius: 8, borderWidth: 1, borderColor: TH2.bdr, padding: 2, gap: 1 }}>
              {[
                ['cards', '卡片'] as const,
                ['timeline', '时间线'] as const,
              ].map(([v, l]) => (
                <Pressable
                  key={v}
                  onPress={() => setView(v)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: view === v ? TH2.bg2 : 'transparent',
                  }}
                >
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: view === v ? TH2.t0 : TH2.t2 }}>
                    {l}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Empty state */}
      {isEmpty && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 16, color: TH2.t2, lineHeight: 28, textAlign: 'center' }}>
            {'每完成一段对话，\n新的方法会在这里沉淀'}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: TH2.t2, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
            去「目标」页选择一个星球，{'\n'}开始一次自我反思的对话
          </Text>
        </View>
      )}

      {/* Cards view */}
      {!isEmpty && view === 'cards' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 80 }}>
          {settleCards.map(card => {
            const isExp = expanded === card.id;
            return (
              <Pressable
                key={card.id}
                onPress={() => setExpanded(isExp ? null : card.id)}
                style={{
                  padding: 18,
                  paddingRight: 16,
                  paddingLeft: 20,
                  borderRadius: 16,
                  backgroundColor: TH2.bg1,
                  borderWidth: 1,
                  borderColor: TH2.bdr,
                  borderLeftWidth: 3,
                  borderLeftColor: TH2.success,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2, letterSpacing: 0.5 }}>
                        {card.date}
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(107,158,120,0.12)', borderWidth: 1, borderColor: 'rgba(107,158,120,0.2)' }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: TH2.success }}>{card.goal}</Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: TH2.t0, marginBottom: isExp ? 10 : 0 }}>
                      {card.title}
                    </Text>
                    {!isExp ? (
                      <Text
                        numberOfLines={2}
                        style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 12, color: TH2.t2, marginTop: 4, lineHeight: 18 }}
                      >
                        {card.text}
                      </Text>
                    ) : (
                      <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 13, color: TH2.t1, lineHeight: 22 }}>
                        {card.text}
                      </Text>
                    )}
                  </View>
                  <Svg
                    width={10}
                    height={10}
                    viewBox="0 0 10 10"
                    fill="none"
                    style={{
                      marginLeft: 12,
                      transform: [{ rotate: isExp ? '180deg' : '0deg' }],
                    }}
                  >
                    <Path d="M2 3.5l3 3 3-3" stroke={TH2.t2} strokeWidth={1.5} strokeLinecap="round" />
                  </Svg>
                </View>
              </Pressable>
            );
          })}
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 13, color: TH2.t2, lineHeight: 24, textAlign: 'center' }}>
              {'每完成一段对话，\n新的方法会在这里沉淀'}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Timeline view */}
      {!isEmpty && view === 'timeline' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}>
          {timelineData.map((month, mi) => (
            <View key={mi} style={{ marginBottom: 4 }}>
              <View style={{ paddingHorizontal: 24, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: TH2.t2, letterSpacing: 1 }}>
                  {month.month}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: TH2.bdr }} />
              </View>
              <View style={{ position: 'relative', paddingLeft: 52, paddingRight: 20 }}>
                <View style={{ position: 'absolute', left: 27, top: 0, bottom: 0, width: 1, backgroundColor: TH2.bdr }} />
                {month.items.map((item, ii) => {
                  const pal = PALS2[item.pal];
                  return (
                    <View key={ii} style={{ position: 'relative', marginBottom: 14 }}>
                      <View
                        style={{
                          position: 'absolute',
                          left: -25,
                          top: 10,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: pal[3],
                          borderWidth: 2,
                          borderColor: TH2.bg0,
                          shadowColor: pal[3],
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.4,
                          shadowRadius: 8,
                          elevation: 4,
                          zIndex: 1,
                        }}
                      />
                      <View style={{ padding: 12, borderRadius: 12, backgroundColor: TH2.bg1, borderWidth: 1, borderColor: TH2.bdr }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: TH2.t2 }}>
                            {item.date}
                          </Text>
                          <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, backgroundColor: `${pal[3]}18`, borderWidth: 1, borderColor: `${pal[3]}30` }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: pal[3] }}>{item.goal}</Text>
                          </View>
                        </View>
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: TH2.t0, marginBottom: 4 }}>
                          {item.title}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={{ fontFamily: 'Lora_500Medium_Italic', fontSize: 11, color: TH2.t2, lineHeight: 17 }}
                        >
                          {item.text}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
