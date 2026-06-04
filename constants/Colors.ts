/**
 * RUSHI v2 主题色板
 * 来源：design_handoff_rushi/source/rushi-screens-v2.jsx — TH2 + PALS2
 */

// 主色板（深空暖调）
export const TH2 = {
  bg0: '#0F0E0D',
  bg1: '#1A1917',
  bg2: '#242220',
  acc: '#C4783A',
  accSoft: 'rgba(196,120,58,0.13)',
  t0: '#F0EDE8',
  t1: '#8A8480',
  t2: '#4A4744',
  bdr: '#2A2825',
  success: '#6B9E78',
} as const;

// 星球调色板 [高光, 中调, 暗部, 光晕]
export const PALS2: [string, string, string, string][] = [
  ['#E8944A', '#8B3A0E', '#1E0B03', '#C4783A'], // 暖橙星
  ['#4ABCD4', '#0E5A6E', '#021820', '#3AACCB'], // 青蓝星
  ['#9A70D4', '#4A1A7A', '#0F0520', '#8A60C4'], // 紫星
  ['#70C490', '#1A6A40', '#041510', '#60B480'], // 绿星
];

// 强调色备选
export const ACCENT_OPTIONS = ['#C4783A', '#6B9E78', '#4A82C4', '#9B6AC4'] as const;

// 兼容旧代码的 Colors export
export const Colors = {
  light: {
    primary: TH2.acc,
    primaryLight: TH2.accSoft,
    accent: TH2.acc,
    accentLight: TH2.accSoft,
    background: TH2.bg0,
    surface: TH2.bg1,
    text: TH2.t0,
    textSecondary: TH2.t1,
    textMuted: TH2.t2,
    border: TH2.bdr,
    divider: TH2.bdr,
    success: TH2.success,
    warning: TH2.acc,
    error: '#B5504A',
    tabBarBackground: TH2.bg0,
    tabBarBorder: TH2.bdr,
    tabIconDefault: TH2.t2,
    tabIconActive: TH2.acc,
  },
} as const;
