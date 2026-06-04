# RN_TRANSLATION.md — 把 Web 原型翻译到 Expo / React Native

> **设计文件日期：2026-06-04**（最新版本）
>
> 配合 `README.md` 使用。本文件专门讲**怎么把 HTML+React-DOM 的写法换成 React Native**。原型里没有一行能直接跑在 RN 上 —— 它们是"长什么样、怎么动"的规格,不是要移植的代码。

---

## 0. 心智模型

| Web 原型 | React Native |
|---|---|
| `<div>` | `<View>` |
| `<span>` / 任何裸文字 | `<Text>`(**RN 里所有文字必须包在 `<Text>` 里,否则报错**) |
| `<button onClick>` | `<Pressable onPress>` / `<TouchableOpacity>` |
| `<textarea>` / `<input>` | `<TextInput>` |
| 滚动容器 `overflowY:auto` | `<ScrollView>` 或 `<FlatList>` |
| CSS `style={{...}}` 字符串值 | RN 数字值 + `StyleSheet.create`,**无单位**(`fontSize:16` 不是 `'16px'`) |
| `className` / 全局 CSS / `@keyframes` | 没有 CSS —— 用 StyleSheet + reanimated |
| Google Fonts `<link>` | `expo-font` + `@expo-google-fonts/*` |
| SVG `<svg>` 内联 | `react-native-svg`(同名标签,JS 导入) |
| `position:absolute; inset:0` | `StyleSheet.absoluteFill` |
| `transform:'scale(...)'` 字符串 | `transform:[{ scale: ... }]` 数组 |
| `boxShadow` | iOS:`shadowColor/Offset/Opacity/Radius`;Android:`elevation` |
| `backdropFilter:blur` | `expo-blur` 的 `<BlurView>` |
| 线性/径向渐变 | `expo-linear-gradient` / `react-native-svg` 的 `RadialGradient` |
| `:hover` | 无悬停 —— 用 `Pressable` 的 `pressed` 态 / `onPressIn/Out` |

**关键差异提醒**
- RN 默认 **flex 方向是 `column`**(Web 是 row)。每个 `View` 都是 flex 容器,横排要显式 `flexDirection:'row'`。
- 没有 `gap` 的旧版本要注意 —— RN 0.71+ 支持 `gap`,Expo SDK 50+ 没问题,可放心用。
- 颜色支持 `rgba()` 字符串,可直接照搬原型的 `rgba(...)`。
- 百分比定位(目标板星球的 `cx/cy`)在 RN 里:父容器 `onLayout` 拿到实际宽高,再把百分比换算成绝对像素 `left/top`。

---

## 1. 推荐技术栈

```bash
npx create-expo-app@latest rushi-app   # 选 expo-router (TypeScript) 模板
cd rushi-app

# 字体
npx expo install expo-font @expo-google-fonts/lora @expo-google-fonts/dm-sans @expo-google-fonts/dm-mono

# 绘图 / 动画 / 视效
npx expo install react-native-svg
npx expo install react-native-reanimated
npx expo install expo-linear-gradient
npx expo install expo-blur
npx expo install react-native-safe-area-context
```

- **路由**:`expo-router`。`(tabs)/` 组放目标板/对话/沉淀三个 tab;计划页、目标对话、新建目标做成 stack 内的独立路由(或 modal presentation)。
- **动画**:`react-native-reanimated`(星球转场、坠入/升起、爆裂、轨道漂浮、打字机推进)。
- **字体加载**:在根 `_layout` 里 `useFonts(...)`,加载完再渲染。

建议的目录:
```
app/
  _layout.tsx            # 字体加载 + 主题 Provider + Stack
  index.tsx              # 屏1 开始
  onboarding.tsx         # 屏2 引导
  (tabs)/
    _layout.tsx          # 自定义 PillTabBar
    board.tsx            # 屏3 目标板
    chat.tsx             # 屏6 全局对话
    settle.tsx           # 屏7 沉淀
  goal/[id].tsx          # 屏4 计划页
  goal/[id]/chat.tsx     # 屏5 目标对话
  add-goal.tsx           # 屏8 新建目标 (modal)
components/
  PlanetOrb.tsx          # 星球 (react-native-svg)
  Typewriter.tsx
  ThinkingDots.tsx
theme/
  tokens.ts              # TH2 / PALS2 / 字体名常量
data/
  goals.ts               # GOALS2 / SETTLE_CARDS / TIMELINE_DATA ...
```

---

## 2. 主题 token → `theme/tokens.ts`
直接照搬 README 第二节的值即可:

```ts
export const TH2 = {
  bg0:'#0F0E0D', bg1:'#1A1917', bg2:'#242220',
  acc:'#C4783A', accSoft:'rgba(196,120,58,0.13)',
  t0:'#F0EDE8', t1:'#8A8480', t2:'#4A4744',
  bdr:'#2A2825', success:'#6B9E78',
};
export const PALS2 = [
  ['#E8944A','#8B3A0E','#1E0B03','#C4783A'],
  ['#4ABCD4','#0E5A6E','#021820','#3AACCB'],
  ['#9A70D4','#4A1A7A','#0F0520','#8A60C4'],
  ['#70C490','#1A6A40','#041510','#60B480'],
];
export const FONT = {
  serif:'Lora_500Medium', serifItalic:'Lora_500Medium_Italic',
  sans:'DMSans_400Regular', sansMedium:'DMSans_500Medium',
  mono:'DMMono_400Regular',
};
```
> 中文回退:iOS 用系统 PingFang 自动兜底,无需额外处理;Android 建议打包思源黑体并设为 `fontFamily` 链。中文用 Lora 时,英文走 Lora、汉字走系统字 —— 这是预期效果。

---

## 3. PlanetOrb → `react-native-svg`
原型的 `<svg>` 几乎可 1:1 搬到 `react-native-svg`(标签名相同:`Svg/Defs/RadialGradient/Stop/Circle/Ellipse/ClipPath/G`)。要点:
- `react-native-svg` 的 `RadialGradient` 用 `cx/cy/r` 百分比字符串(同 Web)。
- 高斯模糊外发光:`react-native-svg` 的 `<FeGaussianBlur>` 在部分平台支持不稳 —— **更稳的做法**是用一个比星球略大的 `<Circle>` 填光晕色 + RN `View` 的 `shadow`/`elevation`,或叠一层低透明度发光圈。
- 进度环:`<Circle>` + `strokeDasharray` + `transform="rotate(-90 cx cy)"` —— RN-svg 支持。
- 文字编号叠加:用绝对定位的 `<Text>` 盖在 `<Svg>` 上(不要用 svg `<Text>`,RN 排版更可控)。

---

## 4. 动画 → reanimated

| 原型 CSS | reanimated 实现 |
|---|---|
| `planet-to-plan`(涟漪放大淡出) | `useSharedValue` 驱动 `scale` 0→38、`opacity` 0.28→0,`withTiming 400ms`,Easing.bezier(0.22,1,0.36,1);结束 `runOnJS` 跳路由 |
| `planet-drop` / `planet-rise` | 共享值驱动 `translateY` + `scale` + `opacity`,`withTiming 720/540ms` |
| `planet-appear`(爆裂过冲) | `withSequence(withTiming(scale 1.18), withTiming(1))` 或 `withSpring` |
| `orbit-float-1..4`(常驻漂浮) | `withRepeat(withSequence(...), -1, true)`,每颗不同时长/相位/位移 |
| `rushi-blink`(光标) | `withRepeat` opacity 1↔0 |
| `rushi-fadein` / `chat-content-enter` | 入场 `FadeInDown`(reanimated 内置 Entering)或共享值 |
| 打字机 | 不用动画库,用 `setInterval`/`setTimeout` 逐字 `setState`(同原型逻辑) |
| 思考点 | `setInterval` 切换 active index(同原型) |

> Easing 统一用 `Easing.bezier(0.22, 1, 0.36, 1)` 对应原型的 `cubic-bezier(0.22,1,0.36,1)`。

> reanimated 需要在 `babel.config.js` 加 `'react-native-reanimated/plugin'`(必须是 plugins 数组最后一个)。

---

## 5. 对话引擎(屏 5/6/8 通用)
原型的对话状态机可几乎原样保留(纯 React state,不依赖 DOM):
- `msgs`(数组)、`phase`(`start`/`typing{n}`/`wait{n}`/`thinking`/`done` 等)、`input`、`qIdx`。
- 自动滚到底:用 `<ScrollView ref>` 的 `scrollToEnd({animated:true})` 替代原型的 `scrollTop = scrollHeight`。
- 回车发送:RN 的 `<TextInput onSubmitEditing>` 或自定义发送钮(移动端通常只保留发送钮)。
- 键盘遮挡:用 `<KeyboardAvoidingView>` 包输入区(iOS `behavior="padding"`)。

**AI 真实化(可选,生产方向)**:原型的 AI 提问是写死的数组(`CHAT_Q`/`GENERAL_Q`/`ADD_GOAL_QS`),新建目标的 `synthesizeGoal` 是截字符占位。要接真模型,把这些换成调用后端 / Claude,保持同样的"逐字打出 + 思考停顿"的节奏即可。先用写死文案跑通 UI,再接 API。

---

## 6. 布局换算备忘
- 设备画布原型按 **393×852** 设计 —— RN 里不要写死,用 `useWindowDimensions()` + `SafeAreaView`,按比例适配。
- 目标板星球用百分比定位:父 `View` 加 `onLayout` 取 `width/height`,`left = cx% * width`,`top = cy% * height`,星球容器再 `marginLeft/Top: -size/2` 居中。
- 原型里 `IOSDevice` 外框、`useScale` 缩放、`tweaks-panel`、底部"屏导航圆点" **都只是网页预览用的脚手架,RN 一律不要**。
- `position:'absolute'` 元素:RN 同样支持 `absolute` + `top/left/right/bottom`,可照搬。

---

## 7. 验收清单
- [ ] 4 颗主星球径向受光 + 进度环 + 漂浮,观感接近原型截图
- [ ] 点星球 → 涟漪 → 计划页;计划页星球进度环高亮
- [ ] 目标对话:底部大星球只露顶部、坠入/升起动画、打字机 + 思考点、结束总结卡
- [ ] 沉淀:卡片/时间线双视图切换,时间线发光圆点用对应星球色
- [ ] 新建目标:6 问引导 + 整理动画 + 合成卡 + 确认后新星球爆裂登场
- [ ] 底部 PillTabBar 三 tab,激活态强调色填充
- [ ] 中文衬线(Lora+PingFang)、等宽(DM Mono)字距观感到位
- [ ] 深色主题在真机(Expo Go)上对比度正常,无纯黑死黑
