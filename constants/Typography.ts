/**
 * RUSHI v2 字体常量
 * 来源：design_handoff_rushi/README.md
 */

export const FONT = {
  serif: 'Lora_500Medium',
  serifItalic: 'Lora_500Medium_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  mono: 'DMMono_400Regular',
} as const;

// 兼容旧代码的 Typography export
export const Typography = {
  display: { fontSize: 46, fontWeight: '600' as const, lineHeight: 52, fontFamily: FONT.serif },
  headline: { fontSize: 28, fontWeight: '600' as const, lineHeight: 36, fontFamily: FONT.serif },
  title: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30, fontFamily: FONT.serif },
  subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26, fontFamily: FONT.serif },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, fontFamily: FONT.sans },
  bodyBold: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24, fontFamily: FONT.sansMedium },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, fontFamily: FONT.sans },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, fontFamily: FONT.sans },
  smallBold: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, fontFamily: FONT.sansMedium },
};

export type TypographyKey = keyof typeof Typography;
