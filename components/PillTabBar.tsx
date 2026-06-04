import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { TH2 } from '../constants/Colors';

const TabIcon = ({ type, color }: { type: string; color: string }) => {
  if (type === 'board') {
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Circle cx={8} cy={8} r={5} stroke={color} strokeWidth={1.4} />
        <Circle cx={8} cy={8} r={2} fill={color} opacity={0.6} />
      </Svg>
    );
  }
  if (type === 'chat') {
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Rect x={2} y={3} width={12} height={4} rx={1.5} stroke={color} strokeWidth={1.4} />
      <Rect x={2} y={9} width={8} height={4} rx={1.5} stroke={color} strokeWidth={1.4} />
    </Svg>
  );
};

const TABS = [
  { id: 'board', label: '目标' },
  { id: 'chat', label: '对话' },
  { id: 'settle', label: '沉淀' },
];

export function PillTabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 28,
        paddingTop: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: 'transparent',
        pointerEvents: 'box-none',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(26,25,23,0.92)',
          borderWidth: 1,
          borderColor: 'rgba(42,40,37,0.6)',
          borderRadius: 999,
          padding: 4,
          gap: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        {TABS.map(t => {
          const on = active === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: on ? TH2.acc : 'transparent',
              }}
            >
              <TabIcon type={t.id} color={on ? '#fff' : TH2.t2} />
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 13,
                  color: on ? '#fff' : TH2.t2,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default PillTabBar;
