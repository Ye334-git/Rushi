// ============================================================
// 入场问卷 — 问题定义 + 分析引擎
// 首次使用时的问卷，结果存入 UserProfile，影响后续 AI 行为
// ============================================================

import type { SurveyQuestion, SurveyModule, UserProfile, ExecutionDimensions } from '../types/models';

// ─── 问卷模块定义 ───

export const SURVEY_MODULES: SurveyModule[] = [
  {
    id: 'goal_focus',
    title: '目标聚焦',
    subtitle: '确定当前最重要的目标',
  },
  {
    id: 'action_history',
    title: '行动历史',
    subtitle: '了解你与目标的关系',
  },
  {
    id: 'exec_style',
    title: '执行风格',
    subtitle: '识别你的行为模式',
  },
  {
    id: 'ai_prefs',
    title: 'AI 合作偏好',
    subtitle: '确定 AI 如何与你协作',
  },
];

// ─── 问卷题目定义 ───

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // ── 模块一：目标聚焦 ──
  {
    id: 'q1',
    module: 'goal_focus',
    type: 'single',
    question: '如果未来半年只能取得一个突破，你最希望是：',
    options: [
      '身体健康',
      '学习成长',
      '职业发展',
      '财务改善',
      '人际关系',
      '情绪管理',
      '个人项目',
      '其他',
    ],
  },
  {
    id: 'q2',
    module: 'goal_focus',
    type: 'text',
    question: '请用一句话描述这个目标',
    placeholder: '例如：通过雅思7分、减重10公斤、完成毕业论文……',
  },
  {
    id: 'q3',
    module: 'goal_focus',
    type: 'single',
    question: '你希望多久实现它？',
    options: [
      '1个月内',
      '3个月内',
      '半年内',
      '1年内',
      '暂时没有明确期限',
    ],
  },

  // ── 模块二：行动历史 ──
  {
    id: 'q4',
    module: 'action_history',
    type: 'single',
    question: '你以前尝试过实现这个目标吗？',
    options: [
      '第一次尝试',
      '尝试过几次',
      '已经尝试很多次',
    ],
  },
  {
    id: 'q5',
    module: 'action_history',
    type: 'slider',
    question: '你觉得自己目前距离目标有多远？',
    condition: { dependsOn: 'q4', notEqual: '第一次尝试' },
  },
  {
    id: 'q6',
    module: 'action_history',
    type: 'text',
    question: '过去一年中，你最接近成功的一次是什么时候？',
    hint: '选填',
    placeholder: '例如：坚持健身两个月、连续学习英语100天……',
    condition: { dependsOn: 'q4', notEqual: '第一次尝试' },
  },

  // ── 模块三：执行风格扫描 ──
  {
    id: 'q7',
    module: 'exec_style',
    type: 'single',
    question: '当你决定开始一件重要的事情时，你通常：',
    options: [
      '立刻行动',
      '先做很多准备',
      '容易拖到最后',
      '要等状态来了再开始',
    ],
  },
  {
    id: 'q8',
    module: 'exec_style',
    type: 'single',
    question: '当计划被打乱时，你更可能：',
    options: [
      '迅速调整',
      '暂停几天再继续',
      '重新制定计划',
      '干脆放弃',
    ],
  },
  {
    id: 'q9',
    module: 'exec_style',
    type: 'single',
    question: '完成计划后，你通常会：',
    options: [
      '记录经验',
      '直接进入下一件事',
      '奖励自己',
      '很少回顾',
    ],
  },

  // ── 模块四：AI 合作偏好 ──
  {
    id: 'q10',
    module: 'ai_prefs',
    type: 'multi',
    question: '当你偏离计划时，你希望 AI：',
    options: [
      '温和提醒',
      '主动追问',
      '帮我分析原因',
      '重新调整计划',
      '给出具体行动建议',
    ],
  },
  {
    id: 'q11',
    module: 'ai_prefs',
    type: 'multi',
    question: '你最不希望 AI 做什么？',
    options: [
      '频繁提醒',
      '说教',
      '强行制定计划',
      '过度分析',
      '情绪安慰过多',
    ],
  },
];

// ============================================================
// 分析引擎：根据问卷答案生成 Planet 洞察
// ============================================================

function getStartupObs(answers: Record<string, any>): string {
  const v = answers.q7;
  const map: Record<string, string> = {
    '立刻行动': '倾向于快速启动，不依赖外部推力',
    '先做很多准备': '启动前需要充分的信息和规划',
    '容易拖到最后': '启动阶段存在明显的拖延倾向',
    '要等状态来了再开始': '依赖内在状态驱动，等待"感觉对了"',
  };
  return map[v] || '有独特的启动节奏';
}

function getDisruptionObs(answers: Record<string, any>): string {
  const v = answers.q8;
  const map: Record<string, string> = {
    '迅速调整': '面对中断时能灵活调整方向',
    '暂停几天再继续': '中断后需要一段恢复期再出发',
    '重新制定计划': '倾向于通过重新规划来应对变化',
    '干脆放弃': '中断后容易彻底离开当前轨道',
  };
  return map[v] || '有自己的中断应对方式';
}

function getReviewObs(answers: Record<string, any>): string {
  const v = answers.q9;
  const map: Record<string, string> = {
    '记录经验': '善于从完成中提取经验和方法',
    '直接进入下一件事': '行动导向，完成即进入下一目标',
    '奖励自己': '重视仪式感和自我肯定',
    '很少回顾': '较少进行系统性复盘',
  };
  return map[v] || '有独特的收尾习惯';
}

function computeStrengths(answers: Record<string, any>): string[] {
  const s: string[] = [];
  if (answers.q1 && answers.q1 !== '其他') s.push('方向明确，知道自己要什么');
  if (answers.q3 && ['1个月内', '3个月内'].includes(answers.q3)) s.push('有清晰的时间意识');
  if (answers.q6 && typeof answers.q6 === 'string' && answers.q6.trim()) s.push('有过接近目标的成功经验');
  if (answers.q7 === '立刻行动') s.push('行动力强，敢于直接开始');
  if (answers.q8 === '迅速调整') s.push('适应力强，计划变动后能快速恢复');
  if (answers.q9 === '记录经验') s.push('有复盘意识，能从经验中学习');
  if (s.length < 2) s.push('愿意面对自己的模式，这是改变的第一步');
  return s.slice(0, 3);
}

function computeChallenges(answers: Record<string, any>): string[] {
  const c: string[] = [];
  if (answers.q7 === '容易拖到最后' || answers.q7 === '要等状态来了再开始') {
    c.push('启动依赖内在状态，缺乏外部触发机制');
  }
  if (answers.q8 === '暂停几天再继续' || answers.q8 === '干脆放弃') {
    c.push('中断后恢复困难，容易从暂停走向停滞');
  }
  if (answers.q8 === '重新制定计划') {
    c.push('可能陷入"计划-打乱-重新计划"的循环');
  }
  if (answers.q9 === '很少回顾' || answers.q9 === '直接进入下一件事') {
    c.push('缺乏系统复盘，相似模式可能重复出现');
  }
  if (answers.q4 === '已经尝试很多次') {
    c.push('多次尝试未果，需要识别反复卡住的关键节点');
  }
  if (c.length < 2) c.push('对自身模式的觉察还在积累中');
  return c.slice(0, 3);
}

function computePlanetMessage(answers: Record<string, any>): string {
  const startup = answers.q7;
  const disruption = answers.q8;
  const review = answers.q9;

  // 组合模式匹配
  if (startup === '要等状态来了再开始' && disruption === '干脆放弃') {
    return '你最大的风险不是能力不足，而是在等待"对的时刻"中，让时间悄悄流走。Planet 会帮你把"状态"变成"行动"。';
  }
  if (startup === '先做很多准备' && disruption === '重新制定计划') {
    return '你善于规划，但可能把大量时间花在准备上。Planet 会在你过度准备时轻轻提醒：已经够了，可以开始了。';
  }
  if (startup === '容易拖到最后' && disruption === '暂停几天再继续') {
    return '你的节奏容易被外部事件打乱。Planet 会帮你在偏离轨道后，找到最小的那个重新入轨的动作。';
  }
  if (startup === '立刻行动' && review === '很少回顾') {
    return '你擅长出发，但很少回头看看走过的路。Planet 会帮你把行动的经验，沉淀为可持续的方法。';
  }
  if (answers.q4 === '已经尝试很多次') {
    return '这一次不是"再试一次"，而是带着对过去模式的觉察，换一种方式前进。Planet 会陪你找到那个不同的切入点。';
  }
  if (startup === '立刻行动' && disruption === '迅速调整') {
    return '你有很强的执行力基础。Planet 的角色不是推你，而是帮你把零散的行动编织成稳定的系统。';
  }
  // 默认
  return '每一个目标背后，都藏着一个关于你自己的线索。Planet 会陪你一起，在行动中发现它们。';
}

function computeDimensions(answers: Record<string, any>): ExecutionDimensions {
  return {
    startupStyle: answers.q7 || '未知',
    disruptionRecovery: answers.q8 || '未知',
    reviewHabit: answers.q9 || '未知',
    goalClarity: answers.q3 && answers.q3 !== '暂时没有明确期限' ? '有期限意识' : '开放探索中',
    actionExperience: answers.q4 === '第一次尝试' ? '新手' : answers.q4 === '已经尝试很多次' ? '多次经验' : '有经验',
  };
}

/** 根据问卷答案生成完整的 UserProfile */
export function analyzeProfile(answers: Record<string, any>): UserProfile {
  return {
    answers,
    goal: (answers.q2 as string) || '',
    goalArea: (answers.q1 as string) || '',
    timeline: (answers.q3 as string) || '',
    attemptCount: (answers.q4 as string) || '',
    observations: [
      getStartupObs(answers),
      getDisruptionObs(answers),
      getReviewObs(answers),
    ],
    strengths: computeStrengths(answers),
    challenges: computeChallenges(answers),
    planetMessage: computePlanetMessage(answers),
    aiPreferences: Array.isArray(answers.q10) ? answers.q10 : (answers.q10 ? [answers.q10] : []),
    aiDislikes: Array.isArray(answers.q11) ? answers.q11 : (answers.q11 ? [answers.q11] : []),
    dimensions: computeDimensions(answers),
  };
}

// ============================================================
// 将 UserProfile 转换为 AI 行为指令
// 核心原则：用户画像不是让 AI "了解"用户，而是让 AI "调整自己"
// ============================================================

export function buildProfileContext(profile?: UserProfile | null): string {
  if (!profile) return '';

  const rules: string[] = [];
  rules.push('## 用户画像 → 你的行为调整（必须遵守）');
  rules.push('');

  // ── AI 偏好 → 行为指令 ──
  const prefs = profile.aiPreferences;
  const dislikes = profile.aiDislikes;

  if (prefs.includes('主动追问')) {
    rules.push('- 追问强度上调：用户希望你深挖，在ta含糊或回避时不要轻易放过，可以多问一轮');
  }
  if (prefs.includes('帮我分析原因')) {
    rules.push('- 可以帮用户连接因果关系，指出ta可能没意识到的模式。但用提问句式而非陈述句式（"有没有可能是因为…？"而非"这是因为…"）');
  }
  if (prefs.includes('给出具体行动建议')) {
    rules.push('- 在用户明确卡住时，可以给一个具体可执行的下一步。但以提问包装（"试过…这种方式吗？"而非"你应该…"）');
  }
  if (prefs.includes('温和提醒')) {
    rules.push('- 推进节奏放慢，多用试探性语气（"如果准备好了的话…"），不催促');
  }
  if (prefs.includes('重新调整计划')) {
    rules.push('- 当用户偏离计划时，帮ta重新审视计划是否合理，而非追问为什么偏离');
  }

  // ── AI 禁区 → 禁止指令 ──
  if (dislikes.includes('说教')) {
    rules.push('- 严禁说教。删除所有"你应该""你需要""最好的方式是"句式，改用"有些人试过…你怎么看？"');
  }
  if (dislikes.includes('过度分析')) {
    rules.push('- 分析点到为止。一次只指出一个模式，不要层层递进地解剖。用户说"知道了"就立刻停');
  }
  if (dislikes.includes('频繁提醒')) {
    rules.push('- 不要主动推进流程。每次对话让用户发起方向，你只跟随');
  }
  if (dislikes.includes('强行制定计划')) {
    rules.push('- 计划由用户主导。你的角色是帮ta想清楚，不是替ta决定。任何计划草案都要以"你觉得这样行吗？"结尾');
  }
  if (dislikes.includes('情绪安慰过多')) {
    rules.push('- 不做情绪安抚。用户说难受时，接住但不要转向安慰。平静地停留在ta的感受旁边');
  }

  // ── 执行风格 → 追问策略调整 ──
  const dim = profile.dimensions;

  if (dim.startupStyle === '容易拖到最后' || dim.startupStyle === '要等状态来了再开始') {
    rules.push('- 用户有启动困难。当ta说"等会儿""改天"时，好奇地问一句"在等什么条件？"而不是催促');
  }
  if (dim.startupStyle === '先做很多准备') {
    rules.push('- 用户容易过度准备。当ta反复描述计划而非行动时，轻轻问"现在最小的一步可以是什么？"');
  }
  if (dim.startupStyle === '立刻行动') {
    rules.push('- 用户启动快。不需要帮他开始，而是帮ta在行动后停下来想一想"这次和上次有什么不同？"');
  }

  if (dim.disruptionRecovery === '干脆放弃' || dim.disruptionRecovery === '暂停几天再继续') {
    rules.push('- 用户中断后恢复困难。不问"为什么停了"，问"如果要重新开始，最小的动作是什么？"');
  }
  if (dim.disruptionRecovery === '重新制定计划') {
    rules.push('- 用户可能陷入计划-打乱-重计划的循环。当ta说要重新规划时，先问"现在的计划哪里还管用？"');
  }

  if (dim.reviewHabit === '很少回顾') {
    rules.push('- 用户不习惯复盘。在对话末尾自然地帮ta总结观察到的模式，不要问"你学到了什么"');
  }
  if (dim.reviewHabit === '记录经验') {
    rules.push('- 用户善于复盘。可以适当深入，问"这次的经验可以用到其他目标上吗？"');
  }

  if (dim.actionExperience === '已经尝试很多次' || dim.actionExperience === '多次经验') {
    rules.push('- 用户有反复尝试的历史。关注"这次和之前有什么不同"，而非"这次打算怎么做"');
  }

  // ── Planet 观察 → 个性化切入点 ──
  if (profile.challenges.length > 0) {
    rules.push(`- 已知挑战：${profile.challenges.slice(0, 2).join('；')}。这些不需要重新挖掘，可以直接作为对话的出发点`);
  }
  if (profile.strengths.length > 0) {
    rules.push(`- 已知优势：${profile.strengths.slice(0, 2).join('；')}。在用户自我怀疑时可以轻轻提醒ta有过这些资源`);
  }

  // ── 当前目标 ──
  if (profile.goal) {
    rules.push(`- 用户的核心目标是「${profile.goal}」（${profile.timeline || '期限未定'}）。所有对话最终要帮ta向这个目标靠近`);
  }

  rules.push('');
  rules.push('以上指令优先级高于默认追问技巧。当默认技巧与用户画像冲突时，以画像为准。');

  return rules.join('\n');
}

// ============================================================
// 根据问卷答案生成初始目标（供自动创建 Goal 使用）
// ============================================================

export function buildInitialGoalName(profile: UserProfile): string {
  const raw = profile.goal.trim();
  if (!raw) return profile.goalArea || '新目标';

  // AI 调用失败时的 fallback：取前 8 个字符
  const cleaned = raw.replace(/[^一-龥a-zA-Z0-9]/g, '');
  if (cleaned.length <= 8) return cleaned || '新目标';
  return cleaned.slice(0, 8);
}

export function buildInitialGoalPhase(profile: UserProfile): string {
  const area = profile.goalArea || '目标';
  const timeline = profile.timeline || '探索中';
  if (timeline.includes('1个月') || timeline.includes('3个月')) {
    return `${area}→快速突破`;
  }
  if (timeline.includes('半年') || timeline.includes('1年')) {
    return `${area}→稳步推进`;
  }
  return `${area}→探索方向`;
}
