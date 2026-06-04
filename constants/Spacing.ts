/**
 * 间距规范
 *
 * 为什么需要统一的间距？
 * - 页面元素间距随意写（比如 13、17）会让界面看起来不整齐
 * - 固定几个间距值，所有地方都从这选，整体更协调
 * - 4 的倍数体系（4-point grid）是移动端最常用的做法
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type SpacingKey = keyof typeof Spacing;
