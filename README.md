# 如实 RUSHI

AI 反思陪伴 App — 通过苏格拉底式对话，帮你面对拖延、发现未完成计划背后真正的原因。

## 技术栈

- **框架**: Expo SDK 54 + React Native 0.81
- **路由**: expo-router (file-based)
- **动画**: react-native-reanimated
- **图形**: react-native-svg
- **字体**: Lora / DM Sans / DM Mono (Google Fonts)

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npx expo start

# 3. 在手机上预览
# - iOS: 用相机扫描终端二维码，或按 i 打开模拟器
# - Android: 用 Expo Go 扫描二维码，或按 a 打开模拟器
```

## 项目结构

```
app/                    # expo-router 页面
  (tabs)/               # 底部 Tab 导航（目标板/对话/沉淀）
  goal/[id]/            # 目标详情 + 对话
  onboarding.tsx        # 新用户引导
  add-goal.tsx          # 新建目标（modal）
components/             # 可复用组件
constants/              # 颜色/字体/间距常量
contexts/               # React Context 全局状态
types/                  # TypeScript 类型定义
design_handoff_rushi/   # 设计源文件（高保真原型）
docs/                   # 项目文档
scripts/                # 工具脚本
```

## 设计规范

设计源文件位于 `design_handoff_rushi/`，包含完整的颜色、字体、间距、动画规格。实现时应以 `README.md` + `RN_TRANSLATION.md` 为准。

## 许可

MIT
