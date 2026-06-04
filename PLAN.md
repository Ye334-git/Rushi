# RUSHI v2 重建计划

> 设计来源：`design_handoff_rushi/`（日期 2026-06-04）
> 目标：基于设计源文件 `rushi-screens-v2.jsx` 和 `RUSHI v2.html`，在 Expo (React Native) 中 1:1 还原

---

## 核心差异

| | 现有代码 | 设计规格 |
|---|---|---|
| 主题 | 浅色暖纸 (#FAF8F5) | 深空暗色 (#0F0E0D) |
| 导航 | 4 Tab（首页/目标/方法库/我的） | 3 Tab（目标/对话/沉淀） |
| 核心隐喻 | 无 | 星球（PlanetOrb） |
| 创建流程 | 表单三步（明确/分析/设定） | AI 6 问对话 → 合成卡 |
| 分析工具 | 5Why / 4M1E / 对策 | 苏格拉底对话 |
| 字体 | 系统字 | Lora / DM Sans / DM Mono |
| 动画 | 无 | 星球转场 / 坠入升起 / 爆裂 / 漂浮 |

---

## Phase 0 — 基础设施

### 安装依赖

```bash
npx expo install react-native-svg
npx expo install react-native-reanimated
npx expo install @expo-google-fonts/lora
npx expo install @expo-google-fonts/dm-sans
npx expo install @expo-google-fonts/dm-mono
npx expo install expo-linear-gradient
npx expo install expo-blur
npx expo install react-native-safe-area-context
```

### 重写文件

| 文件 | 说明 |
|---|---|
| `constants/Colors.ts` | 替换为 TH2 深空色板 + PALS2 星球调色板 |
| `constants/Typography.ts` | 替换为 Lora/DM Sans/DM Mono 规格 |
| `types/models.ts` | 新数据模型：Goal(name/phase/progress/pal/cx/cy/sz)、Message、SettleCard、TimelineItem |

### 修改文件

| 文件 | 说明 |
|---|---|
| `app/_layout.tsx` | 加载字体（useFonts）+ 全局 Provider + Stack 容器 |
| `contexts/AppContext.tsx` | 改用新数据模型 + 设计中的状态机 |

### reanimated 配置

`babel.config.js` 添加 `'react-native-reanimated/plugin'`（plugins 数组最后一项）

---

## Phase 1 — 核心组件（新建）

### components/PlanetOrb.tsx
- react-native-svg 绘制
- 径向渐变球体（高光 cx36% cy26%）
- 表面斑块（4 个半透明 ellipse）
- 暗部环形阴影
- 外发光圈
- 进度环（strokeDasharray 按 progress%）
- 圆心编号 0X（DM Mono）
- Props: goal, size, active?, mini?, onClick?

### components/Typewriter.tsx
- setInterval 逐字追加（26-30ms/字）
- 完成回调 onDone
- 尾部闪烁光标（900ms step-end）
- Props: text, speed?, onDone?, style?

### components/ThinkingDots.tsx
- 3 个 5px 圆点
- 每 340ms 轮流点亮（opacity 1 ↔ 0.22）

### components/PillTabBar.tsx
- 胶囊容器（rgba(26,25,23,0.95) + backdropBlur + border + shadow）
- 3 个 tab: 目标 / 对话 / 沉淀
- 激活态：强调色填充 + 白字
- 图标：SVG（同心圆 / 对话气泡 / 堆叠矩形）
- Props: active, onChange

---

## Phase 2 — 8 个屏幕

### 屏 1 — 开始 `app/index.tsx`
- 48 颗斐波那契分布星点背景（SVG）
- 左上品牌：「如实」Lora 46/600 + RUSHI DM Mono 10
- 居中一颗大星球 (size 200, GOALS2[0])
- 身后淡椭圆轨道（强调色 7%）
- 底部两按钮：「继续我的反思」(52 高实心) + 「第一次使用」(44 高描边)
- 进场动画：translateY 16→0 + fade in, 600ms

### 屏 2 — 引导问卷 `app/onboarding.tsx`
- 3 步多选：关注方向 / 描述卡点 / 当前状态
- 顶部 3 段进度条
- 问题 Lora italic 22px
- 选项：圆角 999 capsule chip，选中 = 强调淡底 + scale(1.03)
- 底部按钮：未选禁用；最后一步文案变「进入如实」

### 屏 3 — 目标板 `app/(tabs)/board.tsx`（主屏）
- 日期 + 「如实」标题 + 圆形信息按钮
- 星空区：36 颗背景星点 + 4 颗主星球（百分比定位）
- 装饰性大号斜体编号 0X（Lora italic 60, opacity 4.5%）
- 星球间淡虚线连接
- 轨道漂浮动画（orbit-float-1..4, 7-11s 循环）
- 每颗星球下方：名称 + 进度%
- 新建星球出现 → planet-appear 爆裂动画
- 底部虚线「+ 添加目标」按钮
- PillTabBar（激活「目标」）

### 屏 4 — 目标计划 `app/goal/[id].tsx`
- 顶部导航：‹ 目标板 + 居中目标名
- Hero 星球 size 150 active + 淡椭圆轨道
- 名称 + 阶段 + 进度条（800ms 动画填充）
- AI 洞察卡：「如实注意到」+ Lora italic 正文
- 反思进度列表 4 步（已完成 = 绿底绿边，未完成 = 灰底）
- 底部「开始今日对话」按钮 → chat

### 屏 5 — 目标对话 `app/goal/[id]/chat.tsx`
- 底部大星球 size 360，只露顶部 120px（bottom: -240px）
- 进场：planet-drop 720ms（translateY -460 → 0, scale 0.38 → 1）
- 退场：planet-rise 540ms（反向）
- 对话内容延迟 460ms 淡入
- AI 3 问（CHAT_Q），逐字打出
- 用户气泡（右对齐，bg2，圆角 12 12 4 12）
- 发送后 ThinkingV2 1.2s → 下一问
- 输入区浮在星球可见部分之上
- 渐变遮罩柔化衔接
- 三问答完 → 总结卡 + 「沉淀这个洞察 →」

### 屏 6 — 全局对话 `app/(tabs)/chat.tsx`
- 无底部星球
- 顶部：左「整体反思 / 今天」+ 右 3 颗 mini 星球叠放
- AI 3 问（GENERAL_Q）
- 答完 → 「本周模式」总结卡 + 「保存洞察 →」
- PillTabBar（激活「对话」）

### 屏 7 — 沉淀 `app/(tabs)/settle.tsx`
- 顶部：「沉淀」+ 「N 个对你有效的方法」+ 卡片/时间线切换
- 卡片视图：左边 3px 绿边 + 日期 + 目标标签 + 标题 + 斜体正文（2 行省略，点开展开）
- 时间线视图：按月分组，左侧竖线 + 发光圆点 + 小卡片
- 底部留白文案
- PillTabBar（激活「沉淀」）

### 屏 8 — 新建目标 `app/add-goal.tsx`（modal）
- AI 6 问引导（ADD_GOAL_QS）：说清楚 / 找规律 / 定方向
- 顶部：× 关闭 + 「新目标」+ 阶段名 + 3 阶段圆点
- 进度线随提问推进
- 逐字打出 + 用户回答
- 6 问答完 → 「如实正在整理……」2.4s
- 弹出合成卡：新星球 + 名称 + 核心差距 + 预计周期 + 第一阶段
- 底部：「重新描述」/ 「确认，开始追踪 →」
- 确认 → 回到目标板，新星球爆裂登场

---

## Phase 3 — 导航重构

### app/_layout.tsx
- Stack 模式
- 加载字体完毕再渲染
- Provider 包裹

### app/(tabs)/_layout.tsx
- 使用自定义 PillTabBar
- 隐藏默认 header / tabBar
- 3 个 Screen: board / chat / settle

### app/goal/_layout.tsx
- Stack，含 `[id]`（计划页）+ `[id]/chat`（目标对话）

### 删除的旧路由
- `app/(tabs)/index.tsx`、`goals.tsx`、`methods.tsx`、`profile.tsx`
- `app/onboarding/_layout.tsx`、`questions.tsx`、`profile.tsx`、`index.tsx`
- `app/goal/[id]/why.tsx`、`analysis.tsx`、`review.tsx`、`countermeasures.tsx`
- `app/goal/_layout.tsx`（将用新的替代）

---

## Phase 4 — 动画（react-native-reanimated）

| 动画 | 触发 | 实现 |
|---|---|---|
| 星球涟漪转场 | board 点星球 → plan | scale 0→38, opacity 0.28→0, withTiming 400ms |
| 星球坠入 | plan → chat | translateY -460→0, scale 0.38→1, withTiming 720ms |
| 星球升起 | chat → plan/board | 反向, withTiming 540ms |
| 星球爆裂 | 新目标确认 | scale 0→1.18→1, withSequence |
| 轨道漂浮 | board 常驻 | 4 颗各自 withRepeat, 不同时长/相位/位移 |
| 光标闪烁 | AI 打字时 | opacity 1↔0, withRepeat 900ms |
| 内容淡入 | 卡片/对话出现 | translateY 8→0 + opacity, withTiming 340-400ms |

缓动统一：`Easing.bezier(0.22, 1, 0.36, 1)`

---

## Phase 5 — 清理

### 删除文件
| 类别 | 文件 |
|---|---|
| 旧屏幕 | `app/onboarding/` 整个目录, `app/(tabs)/index.tsx`, `goals.tsx`, `methods.tsx`, `profile.tsx` |
| 旧子页面 | `app/goal/[id]/why.tsx`, `analysis.tsx`, `review.tsx`, `countermeasures.tsx` |
| 旧组件 | `GoalCard.tsx`, `MethodCard.tsx`, `GapChart.tsx`, `StepTag.tsx`, `PrimaryButton.tsx`, `Card.tsx`, `EmptyState.tsx`, `ProgressBar.tsx`, `ChatBubble.tsx` |

### 保留文件
- `constants/Spacing.ts` — 可能微调数值
- `constants/Brand.ts` — 可能调整文案
- `scripts/`、`docs/`、`design_handoff_rushi/`、`assets/`
- `package.json`、`tsconfig.json`、`app.json`（可能微调）

---

## 执行顺序

1. **Phase 0** — 安装依赖、重写主题/类型/字体加载
2. **Phase 1** — PlanetOrb → Typewriter → ThinkingDots → PillTabBar（核心组件）
3. **Phase 2** — 屏3/4（核心循环）→ 屏5/6（对话）→ 屏7（沉淀）→ 屏8（新建）→ 屏1/2（入口）
4. **Phase 3** — 导航串联
5. **Phase 4** — 动画补齐
6. **Phase 5** — 删除旧代码
