// rushi-screens-v2.jsx — Planet Board redesign for 如实 RUSHI

// ── Theme ────────────────────────────────────────────────────
const TH2 = {
  bg0: '#0F0E0D', bg1: '#1A1917', bg2: '#242220',
  acc: '#C4783A', accSoft: 'rgba(196,120,58,0.13)',
  t0: '#F0EDE8', t1: '#8A8480', t2: '#4A4744',
  bdr: '#2A2825', success: '#6B9E78',
};

// ── Planet palettes: [highlight, mid, shadow, glow] ──────────
const PALS2 = [
  ['#E8944A','#8B3A0E','#1E0B03','#C4783A'],
  ['#4ABCD4','#0E5A6E','#021820','#3AACCB'],
  ['#9A70D4','#4A1A7A','#0F0520','#8A60C4'],
  ['#70C490','#1A6A40','#041510','#60B480'],
];

// ── Goal data ─────────────────────────────────────────────────
const GOALS2 = [
  { id:1, name:'写作卡点', phase:'选题→动笔', progress:42, pal:0, cx:'21%', cy:'22%', sz:130 },
  { id:2, name:'时间分配', phase:'效率→从容', progress:67, pal:1, cx:'67%', cy:'14%', sz:108 },
  { id:3, name:'边界设定', phase:'说不→自在', progress:18, pal:2, cx:'60%', cy:'48%', sz:118 },
  { id:4, name:'早起习惯', phase:'意志→执行', progress:85, pal:3, cx:'15%', cy:'56%', sz: 96 },
];

const SETTLE_CARDS = [
  { id:1, goal:'写作卡点', date:'5月21日', title:'启动仪式',    text:'发现自己在打开文档前总会做同一个动作——倒水、戴耳机。把这个仪式刻意化，让开始变得容易了。' },
  { id:2, goal:'时间分配', date:'5月18日', title:'25分钟法则',  text:'不是"我要写完这篇"，而是"我要专注25分钟"。目标变小了，阻力也变小了。' },
  { id:3, goal:'边界设定', date:'5月14日', title:'3秒空间',     text:'在答应别人之前，给自己3秒。不是用来拒绝，而是用来感受自己真正的意愿。' },
];

// ── TypewriterText ────────────────────────────────────────────
function TypewriterV2({ text, speed=28, onDone, style={} }) {
  const [shown, setShown] = React.useState('');
  const [done, setDone]   = React.useState(false);
  React.useEffect(() => {
    setShown(''); setDone(false); let i = 0;
    const id = setInterval(() => {
      i++; setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); onDone && onDone(); }
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return (
    <div style={{ fontFamily:"'Lora','PingFang SC',serif", fontSize:20, lineHeight:1.85,
      color:TH2.t0, whiteSpace:'pre-wrap', ...style }}>
      {shown}
      {!done && <span style={{ display:'inline-block', width:2, height:'1em',
        background:TH2.acc, marginLeft:1, verticalAlign:'text-top',
        animation:'rushi-blink 900ms step-end infinite' }} />}
    </div>
  );
}

// ── ThinkingDots ──────────────────────────────────────────────
function ThinkingV2() {
  const [f, setF] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setF(x => (x+1)%6), 340);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center', padding:'8px 0' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:TH2.t2,
          opacity:(f%3)===i ? 1 : 0.22, transition:'opacity 200ms ease' }} />
      ))}
    </div>
  );
}

// ── PlanetOrb ─────────────────────────────────────────────────
function PlanetOrb2({ goal, size, active=false, mini=false, onClick }) {
  const { id, progress, pal } = goal;
  const p  = PALS2[pal] || PALS2[0];
  const r  = size/2, ir = r*0.83, rr = r*0.95;
  const circ = 2*Math.PI*rr, dash = (progress/100)*circ;
  const gid = `pg2-${id}`, fid = `pf2-${id}`, cid = `pc2-${id}`;
  return (
    <div onClick={onClick} style={{ cursor:onClick?'pointer':'default',
      position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        <defs>
          <radialGradient id={gid} cx="36%" cy="26%" r="72%">
            <stop offset="0%"   stopColor={p[0]} />
            <stop offset="48%"  stopColor={p[1]} />
            <stop offset="100%" stopColor={p[2]} />
          </radialGradient>
          <filter id={fid} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={size*0.09} />
          </filter>
          <clipPath id={cid}><circle cx={r} cy={r} r={ir} /></clipPath>
        </defs>
        <circle cx={r} cy={r} r={ir+5} fill={p[3]}
          opacity={active ? 0.24 : mini ? 0.06 : 0.12} filter={`url(#${fid})`} />
        <circle cx={r} cy={r} r={ir} fill={`url(#${gid})`} />
        <g clipPath={`url(#${cid})`} opacity={mini ? 0.5 : 1}>
          <ellipse cx={r*0.54} cy={r*1.22} rx={ir*0.30} ry={ir*0.13} fill="rgba(0,0,0,0.30)" />
          <ellipse cx={r*1.28} cy={r*0.74} rx={ir*0.22} ry={ir*0.10} fill="rgba(0,0,0,0.22)" />
          <ellipse cx={r*0.78} cy={r*0.50} rx={ir*0.14} ry={ir*0.06} fill="rgba(255,255,255,0.06)" />
          <ellipse cx={r*0.32} cy={r*0.68} rx={ir*0.10} ry={ir*0.05} fill="rgba(0,0,0,0.16)" />
        </g>
        <circle cx={r} cy={r} r={ir} fill="none" stroke="rgba(0,0,0,0.55)"
          strokeWidth={ir*0.14} style={{ filter:'blur(3px)' }} />
        {!mini && <circle cx={r} cy={r} r={rr} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />}
        {!mini && progress > 0 && (
          <circle cx={r} cy={r} r={rr} fill="none"
            stroke={active ? TH2.acc : p[3]}
            strokeWidth={active ? 2 : 1.5}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${r} ${r})`}
            opacity={active ? 0.95 : 0.45} />
        )}
        {active && !mini && (
          <circle cx={r} cy={r} r={rr+4} fill="none"
            stroke={TH2.acc} strokeWidth="0.8" opacity="0.25" />
        )}
      </svg>
      {!mini && (
        <div style={{ position:'absolute', inset:0, display:'flex',
          alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:size*0.17,
            color:'rgba(255,255,255,0.5)', letterSpacing:'0.02em' }}>0{id}</span>
        </div>
      )}
    </div>
  );
}

// ── PillTabBar ────────────────────────────────────────────────
function PillTabBar({ active, onChange }) {
  const tabs = [
    { id:'board',  label:'目标',
      icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.6"/></svg> },
    { id:'chat',   label:'对话',
      icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
    { id:'settle', label:'沉淀',
      icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="9" width="8" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg> },
  ];
  return (
    <div style={{ flexShrink:0, padding:'10px 20px 28px', display:'flex', justifyContent:'center' }}>
      <div style={{ display:'flex', background:'rgba(26,25,23,0.95)',
        border:`1px solid ${TH2.bdr}`, borderRadius:999, padding:4, gap:2,
        backdropFilter:'blur(20px)', boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
        {tabs.map(t => {
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 18px', borderRadius:999, border:'none',
              background: on ? TH2.acc : 'transparent',
              color: on ? '#fff' : TH2.t2,
              fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500,
              cursor:'pointer', transition:'all 200ms cubic-bezier(0.22,1,0.36,1)',
            }}>
              {t.icon}{t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Screen: Start ─────────────────────────────────────────────
function StartScreenV2({ onEnter, onNewUser, accent }) {
  const ac = accent || TH2.acc;
  const [vis, setVis] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setVis(true), 80); }, []);
  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex',
      flexDirection:'column', position:'relative', overflow:'hidden' }}>
      <svg style={{ position:'absolute', inset:0, pointerEvents:'none' }} width="393" height="780">
        {Array.from({length:48}).map((_,i) => {
          const x=(i*137.508)%393, y=(i*89.3)%750;
          return <circle key={i} cx={x} cy={y} r={i%5===0?1.2:i%3===0?0.9:0.5}
            fill="rgba(240,237,232,0.22)" />;
        })}
      </svg>
      <div style={{ opacity:vis?1:0, transform:vis?'none':'translateY(16px)',
        transition:'all 600ms cubic-bezier(0.22,1,0.36,1)',
        flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'48px 28px 0' }}>
          <div style={{ fontFamily:"'Lora','PingFang SC',serif", fontSize:46,
            fontWeight:600, lineHeight:1, color:TH2.t0, letterSpacing:'-0.02em',
            marginBottom:6 }}>如实</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:300,
            color:TH2.t2, letterSpacing:'0.38em', textTransform:'uppercase' }}>R U S H I</div>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', justifyContent:'center', marginBottom:-20 }}>
          <svg style={{ position:'absolute', opacity:0.07 }} width="300" height="300">
            <ellipse cx="150" cy="150" rx="138" ry="48" stroke={ac} strokeWidth="1" fill="none"/>
          </svg>
          <PlanetOrb2 goal={GOALS2[0]} size={200} />
        </div>
        <div style={{ flex:1 }} />
        <div style={{ padding:'0 24px 44px', display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={onEnter} style={{ height:52, borderRadius:12, background:ac,
            border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:16,
            fontWeight:500, color:'#fff', cursor:'pointer' }}>继续我的反思</button>
          <button onClick={onNewUser} style={{ height:44, borderRadius:12,
            background:'transparent', border:`1px solid ${TH2.bdr}`,
            fontFamily:"'DM Sans',sans-serif", fontSize:14, color:TH2.t1, cursor:'pointer' }}>
            第一次使用
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screen: Onboarding ────────────────────────────────────────
const OB_STEPS = [
  { q:'你想关注的方向？', opts:['工作效率','情绪管理','人际边界','创造力','自我认知','习惯养成','拖延执行','压力应对'] },
  { q:'你通常怎么描述卡点？', opts:['说不清楚','知道但做不到','反复放弃','想太多','太分散','拒绝开始'] },
  { q:'你现在处于？',   opts:['刚刚意识到','卡了一段时间','想重新开始','寻找突破口'] },
];
function OnboardingScreenV2({ onDone, accent }) {
  const ac = accent || TH2.acc;
  const [step, setStep]     = React.useState(0);
  const [sel, setSel]       = React.useState([[],[],[]]);
  const toggle = (i) => setSel(prev => {
    const s=[...prev], a=[...s[step]], idx=a.indexOf(i);
    if(idx>=0) a.splice(idx,1); else a.push(i);
    s[step]=a; return s;
  });
  const canNext = sel[step].length > 0;
  const cur     = OB_STEPS[step];
  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 28px 0', display:'flex', gap:6 }}>
        {OB_STEPS.map((_,i) => (
          <div key={i} style={{ height:2, flex:1, borderRadius:2,
            background:i<=step ? ac : TH2.bdr, transition:'background 300ms ease' }} />
        ))}
      </div>
      <div style={{ padding:'32px 28px 24px' }}>
        <div style={{ fontFamily:"'Lora','PingFang SC',serif", fontStyle:'italic',
          fontSize:22, color:TH2.t0, lineHeight:1.5 }}>{cur.q}</div>
      </div>
      <div style={{ flex:1, padding:'0 20px', display:'flex', flexWrap:'wrap',
        gap:12, alignContent:'flex-start', justifyContent:'center', overflowY:'auto' }}>
        {cur.opts.map((opt,i) => {
          const on = sel[step].includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} style={{
              padding:'14px 20px', borderRadius:999,
              border:`1px solid ${on ? ac : TH2.bdr}`,
              background: on ? TH2.accSoft : TH2.bg1,
              fontFamily:"'DM Sans',sans-serif", fontSize:14,
              color: on ? ac : TH2.t1, cursor:'pointer',
              transition:'all 200ms cubic-bezier(0.22,1,0.36,1)',
              transform: on ? 'scale(1.03)' : 'scale(1)',
            }}>{opt}</button>
          );
        })}
      </div>
      <div style={{ padding:'20px 24px 44px' }}>
        <button onClick={() => { if(step===OB_STEPS.length-1) onDone(); else setStep(s=>s+1); }}
          disabled={!canNext} style={{
          width:'100%', height:52, borderRadius:12,
          background: canNext ? ac : TH2.bg2, border:'none',
          fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500,
          color: canNext ? '#fff' : TH2.t2, cursor: canNext?'pointer':'default',
          transition:'all 200ms ease',
        }}>{step===OB_STEPS.length-1 ? '进入如实' : '下一步'}</button>
      </div>
    </div>
  );
}

// ── Screen: Planet Board ──────────────────────────────────────
function PlanetBoardScreen({ onSelectGoal, onAddGoal, extraGoals, activeTab, onTabChange, accent }) {
  const ac = accent || TH2.acc;
  const today = new Date();
  const dayStr = ['日','一','二','三','四','五','六'][today.getDay()];
  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 24px 0', display:'flex',
        alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
            color:TH2.t2, letterSpacing:'0.06em', marginBottom:4 }}>
            {today.getMonth()+1}月{today.getDate()}日 · 周{dayStr}
          </div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:600, color:TH2.t0 }}>如实</div>
        </div>
        <button style={{ width:32, height:32, borderRadius:'50%',
          background:TH2.bg1, border:`1px solid ${TH2.bdr}`,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke={TH2.t2} strokeWidth="1.3"/>
            <path d="M7 4.5v3.5M7 9.5v.2" stroke={TH2.t2} strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <svg style={{ position:'absolute', inset:0, pointerEvents:'none' }} width="393" height="700">
          {Array.from({length:36}).map((_,i) => {
            const x=(i*113.7)%393, y=(i*77.3)%700;
            return <circle key={i} cx={x} cy={y} r={i%4===0?1:0.5} fill="rgba(240,237,232,0.18)"/>;
          })}
        </svg>
        {/* Editorial numerals */}
        {GOALS2.map(g => (
          <div key={g.id} style={{
            position:'absolute',
            left:`calc(${g.cx} + ${g.sz*0.38}px)`,
            top:`calc(${g.cy} - 18px)`,
            fontFamily:"'Lora',serif", fontStyle:'italic',
            fontSize:60, fontWeight:600, lineHeight:1,
            color:'rgba(240,237,232,0.045)',
            letterSpacing:'-0.04em', pointerEvents:'none', userSelect:'none',
          }}>0{g.id}</div>
        ))}
        {/* Connection lines */}
        <svg style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.05 }} width="393" height="700">
          {GOALS2.map((g,i) => i < GOALS2.length-1 ? (
            <line key={i}
              x1={parseFloat(g.cx)/100*393} y1={parseFloat(g.cy)/100*700}
              x2={parseFloat(GOALS2[i+1].cx)/100*393} y2={parseFloat(GOALS2[i+1].cy)/100*700}
              stroke={TH2.t1} strokeWidth="1" strokeDasharray="3 6" />
          ) : null)}
        </svg>
        {/* Planets — orbital float + zoom callback */}
        {GOALS2.map((g, gi) => (
          <div key={g.id} onClick={() => {
            const bx = parseFloat(g.cx)/100*393;
            const by = parseFloat(g.cy)/100*640 + 68;
            onSelectGoal(g.id, bx, by);
          }} style={{
            position:'absolute',
            left:`calc(${g.cx} - ${g.sz/2}px)`,
            top:`calc(${g.cy} - ${g.sz/2}px)`,
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            cursor:'pointer',
            animation:`orbit-float-${gi+1} ${7+gi*1.4}s ease-in-out infinite`,
            animationDelay:`${gi*-1.8}s`,
          }}>
            <PlanetOrb2 goal={g} size={g.sz} />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:TH2.t1, letterSpacing:'0.01em' }}>{g.name}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
                color:TH2.t2, marginTop:1 }}>{g.progress}%</div>
            </div>
          </div>
        ))}
        {/* Extra goals (newly created) — appear with burst animation */}
        {(extraGoals || []).map((g, gi) => (
          <div key={g.id} onClick={() => {
            const bx = parseFloat(g.cx)/100*393;
            const by = parseFloat(g.cy)/100*640 + 68;
            onSelectGoal(g.id, bx, by);
          }} style={{
            position:'absolute',
            left:`calc(${g.cx} - ${g.sz/2}px)`,
            top:`calc(${g.cy} - ${g.sz/2}px)`,
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            cursor:'pointer',
            animation: g.isNew
              ? 'planet-appear 900ms cubic-bezier(0.22,1,0.36,1) both'
              : `orbit-float-${(gi%4)+1} ${8+gi*1.3}s ease-in-out infinite`,
          }}>
            <PlanetOrb2 goal={g} size={g.sz} />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:TH2.t1 }}>{g.name}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
                color:ac, marginTop:1 }}>新建中</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:'0 24px 8px', flexShrink:0 }}>
        <button onClick={onAddGoal} style={{ display:'flex', alignItems:'center', gap:8,
          background:'none', border:`1px dashed ${TH2.bdr}`, borderRadius:12,
          padding:'10px 16px', cursor:'pointer',
          fontFamily:"'DM Sans',sans-serif", fontSize:13, color:TH2.t2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          添加目标
        </button>
      </div>
      <PillTabBar active={activeTab} onChange={onTabChange} />
    </div>
  );
}

// ── Screen: Goal Plan (no tab bar — drill-down) ───────────────
const PLAN_ITEMS = [
  { label:'理解卡点', done:true,  desc:'已找到：从"完美开头"的执念出发' },
  { label:'识别模式', done:true,  desc:'每次卡住前，都在等待某种"确定感"' },
  { label:'行动实验', done:false, desc:'本周试：先写烂草稿，不回头看' },
  { label:'复盘总结', done:false, desc:'完成3次实验后开启' },
];
function GoalPlanScreen({ goalId, onChat, onBack, accent }) {
  const ac = accent || TH2.acc;
  const goal = GOALS2.find(g => g.id===goalId) || GOALS2[0];
  const pal  = PALS2[goal.pal];
  const [vis, setVis] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setVis(true), 60); }, [goalId]);

  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex', flexDirection:'column' }}>
      {/* Nav */}
      <div style={{ padding:'8px 20px 0', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer',
          color:TH2.t1, display:'flex', alignItems:'center', gap:6,
          fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          目标板
        </button>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:TH2.t2 }}>
          {goal.name}
        </span>
        <div style={{ width:44 }} />
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Planet hero */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          padding:'20px 0 16px', position:'relative',
          opacity:vis?1:0, transform:vis?'none':'translateY(16px)',
          transition:'all 380ms cubic-bezier(0.22,1,0.36,1)' }}>
          <svg style={{ position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)', opacity:0.10 }} width="260" height="90">
            <ellipse cx="130" cy="45" rx="120" ry="38"
              stroke={pal[3]} strokeWidth="1" fill="none"/>
          </svg>
          <PlanetOrb2 goal={goal} size={150} active={true} />
          <div style={{ marginTop:16, textAlign:'center' }}>
            <div style={{ fontFamily:"'Lora',serif", fontSize:22, color:TH2.t0 }}>{goal.name}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:TH2.t1, marginTop:4 }}>
              {goal.phase}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8,
              marginTop:12, justifyContent:'center' }}>
              <div style={{ width:120, height:2, background:TH2.bdr, borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${goal.progress}%`, height:'100%', background:ac,
                  borderRadius:2, transition:'width 800ms cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:ac }}>
                {goal.progress}%
              </span>
            </div>
          </div>
        </div>

        {/* AI insight */}
        <div style={{ margin:'0 20px 16px', padding:'14px 16px',
          background:'rgba(196,120,58,0.08)', borderRadius:12,
          border:'1px solid rgba(196,120,58,0.18)' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:ac,
            letterSpacing:'0.12em', marginBottom:8 }}>如实注意到</div>
          <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
            fontSize:13, color:TH2.t1, lineHeight:1.65 }}>
            你连续3次，在"动笔"阶段停下来。<br />今天是个好时机继续探索。
          </div>
        </div>

        {/* Plan steps */}
        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column',
          gap:8, marginBottom:16 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:TH2.t2,
            letterSpacing:'0.10em', marginBottom:4 }}>反思进度</div>
          {PLAN_ITEMS.map((item,i) => (
            <div key={i} style={{ padding:'12px 14px', borderRadius:12,
              background:item.done?'rgba(107,158,120,0.08)':TH2.bg1,
              border:`1px solid ${item.done?'rgba(107,158,120,0.2)':TH2.bdr}`,
              display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                background:item.done?TH2.success:TH2.bg2,
                border:`1.5px solid ${item.done?TH2.success:TH2.bdr}`,
                display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                {item.done && <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                  color:item.done?TH2.t1:TH2.t0, fontWeight:500 }}>{item.label}</div>
                <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
                  fontSize:11, color:TH2.t2, marginTop:2, lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — no tab bar here */}
      <div style={{ padding:'8px 20px 28px', flexShrink:0 }}>
        <button onClick={onChat} style={{ width:'100%', height:52, borderRadius:12,
          background:ac, border:'none',
          fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500,
          color:'#fff', cursor:'pointer', display:'flex',
          alignItems:'center', justifyContent:'center', gap:8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
              fill="rgba(255,255,255,0.2)"/>
          </svg>
          开始今日对话
        </button>
      </div>
    </div>
  );
}

// ── Screen: Goal Chat (planet at bottom, transition anim) ─────
const CHAT_Q = [
  '上次你说卡在"开始"。\n\n今天，是什么让你停下来的？',
  '你注意到那个停顿的感觉了。\n\n它像什么？',
  '每次这样停下来时，\n你通常告诉自己什么？',
];
const PSIZE    = 360;
const PVISIBLE = 120;   // 1/3 of planet shows
const POFFSET  = -(PSIZE - PVISIBLE); // -240px below screen

function ChatScreenV2({ goalId, onSettle, onBack, accent }) {
  const ac   = accent || TH2.acc;
  const goal = GOALS2.find(g => g.id===goalId) || GOALS2[0];

  const [msgs,    setMsgs]    = React.useState([]);
  const [phase,   setPhase]   = React.useState('start');
  const [input,   setInput]   = React.useState('');
  const [qIdx,    setQIdx]    = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([{ role:'ai', text:CHAT_Q[0], id:0 }]);
      setPhase('typing0');
    }, 720); // slight delay so planet animation plays first
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, phase]);

  const handleAIDone = (idx) => {
    if (idx < CHAT_Q.length - 1) setPhase(`wait${idx}`);
    else setPhase('done');
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input; setInput('');
    const nextQ = qIdx + 1;
    setMsgs(prev => [...prev, { role:'user', text:txt }]);
    setPhase('thinking');
    setTimeout(() => {
      if (nextQ < CHAT_Q.length) {
        setMsgs(prev => [...prev, { role:'ai', text:CHAT_Q[nextQ], id:nextQ }]);
        setPhase(`typing${nextQ}`);
        setQIdx(nextQ);
      } else { setPhase('done'); }
    }, 1200);
  };

  const handleBack = () => {
    setExiting(true);
    setTimeout(() => onBack(), 540);
  };

  const isTyping  = phase.startsWith('typing');
  const isWaiting = phase.startsWith('wait');
  const showInput = isWaiting || phase === 'done';

  // Planet animation: entry vs exit
  const planetAnim = exiting
    ? 'planet-rise 540ms cubic-bezier(0.22,1,0.36,1) forwards'
    : 'planet-drop 720ms cubic-bezier(0.22,1,0.36,1) both';

  // Content animation
  const contentAnim = 'chat-content-enter 340ms 460ms cubic-bezier(0.22,1,0.36,1) both';

  return (
    <div style={{ height:'100%', background:TH2.bg0, position:'relative', overflow:'hidden' }}>

      {/* Nav bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:44,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 20px', zIndex:10,
        animation: contentAnim }}>
        <button onClick={handleBack} style={{ background:'none', border:'none', cursor:'pointer',
          color:TH2.t1, display:'flex', alignItems:'center', gap:6,
          fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {goal.name}
        </button>
        {(phase==='start' || isTyping) ? (
          <div style={{ display:'flex', alignItems:'center', gap:6,
            padding:'4px 10px', borderRadius:999, background:TH2.accSoft }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:ac,
              animation:'rushi-blink 1.2s ease-in-out infinite' }} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
              color:ac, letterSpacing:'0.10em' }}>思考中</span>
          </div>
        ) : (
          <PlanetOrb2 goal={goal} size={28} mini={true} />
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        position:'absolute', top:44, left:0, right:0,
        bottom: PVISIBLE + 56, // above input bar
        overflowY:'auto', padding:'16px 24px',
        animation: contentAnim,
      }}>
        {msgs.map((msg, i) => {
          const isLastAI  = msg.role==='ai' && i===msgs.length-1;
          const typeActive = isLastAI && isTyping;
          if (msg.role==='user') return (
            <div key={i} style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
              <div style={{ maxWidth:'78%', padding:'10px 14px',
                background:TH2.bg2, borderRadius:'12px 12px 4px 12px',
                fontFamily:"'DM Sans',sans-serif", fontSize:14,
                color:TH2.t1, lineHeight:1.6 }}>{msg.text}</div>
            </div>
          );
          if (typeActive) return (
            <div key={i} style={{ marginBottom:20 }}>
              <TypewriterV2 text={msg.text} speed={28}
                onDone={() => handleAIDone(msg.id)}
                style={{ fontSize:19, lineHeight:1.85 }} />
            </div>
          );
          return (
            <div key={i} style={{ maxWidth:'92%', marginBottom:20,
              fontFamily:"'Lora','PingFang SC',serif",
              fontSize:19, color:TH2.t0, whiteSpace:'pre-wrap', lineHeight:1.85 }}>
              {msg.text}
            </div>
          );
        })}
        {phase==='thinking' && <ThinkingV2 />}
        {phase==='done' && (
          <div style={{ marginTop:8, padding:'18px 16px', borderRadius:16,
            background:TH2.bg1, border:`1px solid ${TH2.bdr}`,
            animation:'rushi-fadein 400ms cubic-bezier(0.22,1,0.36,1)' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
              color:ac, letterSpacing:'0.12em', marginBottom:10 }}>如实注意到</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
              color:TH2.t1, lineHeight:1.65, marginBottom:16 }}>
              你描述的那个停顿，在这两周里出现了4次。每次都在"开始动笔"之前。
            </div>
            <button onClick={onSettle} style={{ background:TH2.accSoft,
              border:'1px solid rgba(196,120,58,0.3)', borderRadius:8,
              padding:'7px 14px', fontFamily:"'DM Sans',sans-serif",
              fontSize:12, color:ac, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6 }}>
              沉淀这个洞察
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor"
                  strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Gradient fade above planet */}
      <div style={{ position:'absolute', bottom: PVISIBLE + 56, left:0, right:0, height:60,
        background:`linear-gradient(to bottom, transparent, ${TH2.bg0})`,
        pointerEvents:'none', zIndex:5 }} />

      {/* Input bar — floats just above the planet's visible portion */}
      <div style={{ position:'absolute', bottom:PVISIBLE, left:0, right:0,
        borderTop:`1px solid ${TH2.bdr}`, padding:'10px 18px',
        background:TH2.bg0, zIndex:8,
        opacity: showInput ? 1 : 0, transition:'opacity 280ms ease',
        pointerEvents: showInput ? 'auto' : 'none',
        animation: contentAnim }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="继续说……" rows={1} style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontFamily:"'DM Sans',sans-serif", fontSize:15, color:TH2.t0,
            resize:'none', lineHeight:1.5, caretColor:ac, paddingTop:2 }} />
          <button onClick={handleSend} disabled={!input.trim()} style={{
            width:32, height:32, borderRadius:'50%',
            background: input.trim() ? ac : TH2.bg2,
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, transition:'background 200ms ease' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M3 5l3-3 3 3"
                stroke={input.trim()?'#fff':TH2.t2}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Planet — animated entry/exit */}
      <div style={{
        position:'absolute',
        bottom:`${POFFSET}px`,
        left:`calc(50% - ${PSIZE/2}px)`,
        animation: planetAnim,
        zIndex:2,
      }}>
        <PlanetOrb2 goal={goal} size={PSIZE} active={false} />
      </div>
    </div>
  );
}

// ── Screen: General Chat (全局 · 对话 tab) ────────────────────
const GENERAL_Q = [
  '最近，\n\n整体感觉怎么样？',
  '在所有进行中的目标里，\n\n哪一个最让你有感觉？',
  '我注意到你在时间分配上已经走了很远。\n\n是什么让你今天还在这里？',
];
function GeneralChatScreen({ onSettle, activeTab, onTabChange, accent }) {
  const ac = accent || TH2.acc;
  const [msgs,  setMsgs]  = React.useState([]);
  const [phase, setPhase] = React.useState('start');
  const [input, setInput] = React.useState('');
  const [qIdx,  setQIdx]  = React.useState(0);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([{ role:'ai', text:GENERAL_Q[0], id:0 }]);
      setPhase('typing0');
    }, 500);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, phase]);

  const handleAIDone = (idx) => {
    if (idx < GENERAL_Q.length-1) setPhase(`wait${idx}`);
    else setPhase('done');
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input; setInput(''); const nextQ = qIdx+1;
    setMsgs(prev => [...prev, { role:'user', text:txt }]);
    setPhase('thinking');
    setTimeout(() => {
      if (nextQ < GENERAL_Q.length) {
        setMsgs(prev => [...prev, { role:'ai', text:GENERAL_Q[nextQ], id:nextQ }]);
        setPhase(`typing${nextQ}`); setQIdx(nextQ);
      } else { setPhase('done'); }
    }, 1200);
  };

  const isTyping  = phase.startsWith('typing');
  const isWaiting = phase.startsWith('wait');
  const showInput = isWaiting || phase === 'done';

  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'12px 24px 0', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:TH2.t2,
            letterSpacing:'0.10em', marginBottom:2 }}>整体反思</div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:18, color:TH2.t0 }}>今天</div>
        </div>
        {/* Stacked mini planets */}
        <div style={{ display:'flex', alignItems:'center' }}>
          {GOALS2.slice(0,3).map((g, i) => (
            <div key={g.id} style={{ marginLeft: i>0 ? -8 : 0 }}>
              <PlanetOrb2 goal={g} size={26} mini={true} />
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto',
        padding:'20px 24px 16px', display:'flex', flexDirection:'column', gap:20 }}>
        {msgs.map((msg, i) => {
          const isLastAI  = msg.role==='ai' && i===msgs.length-1;
          const typeActive = isLastAI && isTyping;
          if (msg.role==='user') return (
            <div key={i} style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ maxWidth:'78%', padding:'10px 14px',
                background:TH2.bg2, borderRadius:'12px 12px 4px 12px',
                fontFamily:"'DM Sans',sans-serif", fontSize:14,
                color:TH2.t1, lineHeight:1.6 }}>{msg.text}</div>
            </div>
          );
          if (typeActive) return (
            <div key={i}>
              <TypewriterV2 text={msg.text} speed={30}
                onDone={() => handleAIDone(msg.id)}
                style={{ fontSize:20, lineHeight:1.85 }} />
            </div>
          );
          return (
            <div key={i} style={{ maxWidth:'92%',
              fontFamily:"'Lora','PingFang SC',serif",
              fontSize:20, color:TH2.t0, whiteSpace:'pre-wrap', lineHeight:1.85 }}>
              {msg.text}
            </div>
          );
        })}
        {phase==='thinking' && <ThinkingV2 />}
        {phase==='done' && (
          <div style={{ padding:'18px 16px', borderRadius:16,
            background:TH2.bg1, border:`1px solid ${TH2.bdr}`,
            animation:'rushi-fadein 400ms cubic-bezier(0.22,1,0.36,1)' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
              color:ac, letterSpacing:'0.12em', marginBottom:10 }}>本周模式</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
              color:TH2.t1, lineHeight:1.65, marginBottom:16 }}>
              三个目标里，你最常回避的时刻都发生在一天的开始。
            </div>
            <button onClick={onSettle} style={{ background:TH2.accSoft,
              border:'1px solid rgba(196,120,58,0.3)', borderRadius:8,
              padding:'7px 14px', fontFamily:"'DM Sans',sans-serif",
              fontSize:12, color:ac, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6 }}>
              保存洞察
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor"
                  strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ borderTop:`1px solid ${TH2.bdr}`, padding:'10px 18px 8px',
        background:TH2.bg0, flexShrink:0,
        opacity: showInput ? 1 : 0, transition:'opacity 280ms ease',
        pointerEvents: showInput ? 'auto' : 'none' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="随便说说……" rows={1} style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontFamily:"'DM Sans',sans-serif", fontSize:15, color:TH2.t0,
            resize:'none', lineHeight:1.5, caretColor:ac, paddingTop:2 }} />
          <button onClick={handleSend} disabled={!input.trim()} style={{
            width:32, height:32, borderRadius:'50%',
            background: input.trim() ? ac : TH2.bg2,
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, transition:'background 200ms ease' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M3 5l3-3 3 3"
                stroke={input.trim()?'#fff':TH2.t2}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <PillTabBar active={activeTab} onChange={onTabChange} />
    </div>
  );
}

// ── Settlement: timeline data ─────────────────────────────────
const TIMELINE_DATA = [
  { month:'2025年5月', items:[
    { date:'5月21日', goal:'写作卡点', pal:0, title:'启动仪式',
      text:'发现自己在打开文档前总会做同一个动作——倒水、戴耳机。把这个仪式刻意化，让开始变得容易了。' },
    { date:'5月18日', goal:'时间分配', pal:1, title:'25分钟法则',
      text:'不是"我要写完这篇"，而是"我要专注25分钟"。目标变小了，阻力也变小了。' },
    { date:'5月14日', goal:'边界设定', pal:2, title:'3秒空间',
      text:'在答应别人之前，给自己3秒。不是用来拒绝，而是用来感受自己真正的意愿。' },
  ]},
  { month:'2025年4月', items:[
    { date:'4月28日', goal:'时间分配', pal:1, title:'深工作时段',
      text:'把"困难任务"放在上午10点前。不是因为意志力，而是因为那时干扰最少。' },
    { date:'4月15日', goal:'早起习惯', pal:3, title:'5分钟锚点',
      text:'不用"早起"这个目标压自己，只需在闹钟响起后，做一件5分钟的事。' },
  ]},
];

// ── Screen: Settlement ────────────────────────────────────────
function SettlementScreen({ activeTab, onTabChange, accent }) {
  const ac = accent || TH2.acc;
  const [view,     setView]     = React.useState('cards');
  const [expanded, setExpanded] = React.useState(null);
  const totalCount = SETTLE_CARDS.length + TIMELINE_DATA[1].items.length;

  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'16px 24px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-end',
          justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:600,
              color:TH2.t0, marginBottom:2 }}>沉淀</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:TH2.t1 }}>
              {totalCount} 个对你有效的方法
            </div>
          </div>
          {/* View toggle */}
          <div style={{ display:'flex', background:TH2.bg1, borderRadius:8,
            border:`1px solid ${TH2.bdr}`, padding:2, gap:1 }}>
            {[['cards','卡片'],['timeline','时间线']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:'5px 10px', borderRadius:6, border:'none',
                background: view===v ? TH2.bg2 : 'transparent',
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color: view===v ? TH2.t0 : TH2.t2,
                cursor:'pointer', transition:'all 180ms ease',
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards view */}
      {view==='cards' && (
        <div style={{ flex:1, overflowY:'auto', padding:'8px 20px 12px',
          display:'flex', flexDirection:'column', gap:12 }}>
          {SETTLE_CARDS.map(card => {
            const isExp = expanded === card.id;
            return (
              <div key={card.id} onClick={() => setExpanded(isExp ? null : card.id)} style={{
                padding:'18px 16px 18px 20px', borderRadius:16,
                background:TH2.bg1, border:`1px solid ${TH2.bdr}`,
                borderLeft:`3px solid ${TH2.success}`, cursor:'pointer',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
                        color:TH2.t2, letterSpacing:'0.06em' }}>{card.date}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                        color:TH2.success, padding:'2px 8px', borderRadius:999,
                        background:'rgba(107,158,120,0.12)',
                        border:'1px solid rgba(107,158,120,0.2)' }}>{card.goal}</span>
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15,
                      color:TH2.t0, fontWeight:500, marginBottom: isExp?10:0 }}>{card.title}</div>
                    {!isExp && (
                      <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
                        fontSize:12, color:TH2.t2, marginTop:4, lineHeight:1.5,
                        overflow:'hidden', display:'-webkit-box',
                        WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{card.text}</div>
                    )}
                    {isExp && (
                      <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
                        fontSize:13, color:TH2.t1, lineHeight:1.7,
                        animation:'rushi-fadein 200ms ease' }}>{card.text}</div>
                    )}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                    style={{ marginLeft:12, flexShrink:0,
                      transform:isExp?'rotate(180deg)':'none', transition:'transform 200ms ease' }}>
                    <path d="M2 3.5l3 3 3-3" stroke={TH2.t2} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            );
          })}
          <div style={{ padding:'24px 0', textAlign:'center' }}>
            <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
              fontSize:13, color:TH2.t2, lineHeight:1.8 }}>
              每完成一段对话，<br/>新的方法会在这里沉淀
            </div>
          </div>
        </div>
      )}

      {/* Timeline view */}
      {view==='timeline' && (
        <div style={{ flex:1, overflowY:'auto', padding:'12px 0 12px' }}>
          {TIMELINE_DATA.map((month, mi) => (
            <div key={mi} style={{ marginBottom:4 }}>
              {/* Month label */}
              <div style={{ padding:'0 24px 10px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
                  color:TH2.t2, letterSpacing:'0.08em' }}>{month.month}</span>
                <div style={{ flex:1, height:1, background:TH2.bdr }} />
              </div>
              {/* Timeline items */}
              <div style={{ position:'relative', paddingLeft:52, paddingRight:20 }}>
                {/* Vertical line */}
                <div style={{ position:'absolute', left:27, top:0,
                  bottom:0, width:1, background:TH2.bdr }} />
                {month.items.map((item, ii) => {
                  const pal = PALS2[item.pal];
                  return (
                    <div key={ii} style={{ position:'relative', marginBottom:14 }}>
                      {/* Timeline dot */}
                      <div style={{ position:'absolute', left:-25, top:10,
                        width:10, height:10, borderRadius:'50%',
                        background:pal[3], border:`2px solid ${TH2.bg0}`,
                        boxShadow:`0 0 8px ${pal[3]}60`,
                        zIndex:1 }} />
                      {/* Card */}
                      <div style={{ padding:'12px 14px', borderRadius:12,
                        background:TH2.bg1, border:`1px solid ${TH2.bdr}` }}>
                        <div style={{ display:'flex', alignItems:'center',
                          gap:8, marginBottom:6 }}>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
                            color:TH2.t2 }}>{item.date}</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                            color:pal[3], padding:'1px 7px', borderRadius:999,
                            background:`${pal[3]}18`,
                            border:`1px solid ${pal[3]}30` }}>{item.goal}</span>
                        </div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                          color:TH2.t0, fontWeight:500, marginBottom:4 }}>{item.title}</div>
                        <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
                          fontSize:11, color:TH2.t2, lineHeight:1.55,
                          overflow:'hidden', display:'-webkit-box',
                          WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ height:16 }} />
        </div>
      )}

      <PillTabBar active={activeTab} onChange={onTabChange} />
    </div>
  );
}

// ── Add Goal: conversation questions (Toyota 8-Step hidden) ───
// Step 1 (Clarify): Q1–Q2  |  Step 2 (Break Down): Q3–Q4  |  Step 3 (Set Target): Q5–Q6
const ADD_GOAL_QS = [
  // Toyota Step 1a — 现状感受 (current state)
  '说说看——\n\n什么让你想到这件事的？',
  // Toyota Step 1b — 差距描述 (gap between current & ideal)
  '嗯。\n\n现在是什么状态？你觉得，差距在哪里？',
  // Toyota Step 2a — 分解：何时发生 (when does it occur)
  '这种感觉，\n\n在什么时候最明显？',
  // Toyota Step 2b — 量化：频率与影响 (frequency & impact)
  '大概多久出现一次？\n\n每次会持续多久？',
  // Toyota Step 3a — 目标状态 (target state, 3-month horizon)
  '如果三个月后，这件事有了改变——\n\n你会看到什么不同？',
  // Toyota Step 3b — 可观测指标 (observable success signal)
  '你怎么知道自己在进步？\n\n有没有一个可以感受到的信号？',
];

// Which "user-facing phase" each question belongs to (0/1/2)
const ADD_PHASE_MAP = [0, 0, 1, 1, 2, 2];
const ADD_PHASE_LABELS = ['说清楚', '找规律', '定方向'];

// Positions for newly created goals on the planet board
const EXTRA_POSITIONS = [
  { cx:'44%', cy:'76%', sz:102 },
  { cx:'76%', cy:'62%', sz: 92 },
  { cx:'52%', cy:'30%', sz: 88 },
];

// ── Screen: Add Goal ──────────────────────────────────────────
function AddGoalScreen({ onCreated, onClose, accent }) {
  const ac = accent || TH2.acc;
  const [msgs,    setMsgs]    = React.useState([]);
  const [phase,   setPhase]   = React.useState('start');
  const [input,   setInput]   = React.useState('');
  const [qIdx,    setQIdx]    = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [newGoal, setNewGoal] = React.useState(null);
  const [cardVis, setCardVis] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Start first AI question
  React.useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([{ role:'ai', text:ADD_GOAL_QS[0], id:0 }]);
      setPhase('typing0');
    }, 400);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, phase, newGoal]);

  const handleAIDone = (idx) => setPhase(`wait${idx}`);

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input; setInput('');
    const newAns = [...answers, txt];
    setAnswers(newAns);
    setMsgs(prev => [...prev, { role:'user', text:txt }]);

    const nextQ = qIdx + 1;
    if (nextQ < ADD_GOAL_QS.length) {
      setPhase('thinking');
      setTimeout(() => {
        setMsgs(prev => [...prev, { role:'ai', text:ADD_GOAL_QS[nextQ], id:nextQ }]);
        setPhase(`typing${nextQ}`);
        setQIdx(nextQ);
      }, 1400);
    } else {
      // All 6 questions answered — synthesize goal
      setPhase('synthesizing');
      setTimeout(() => {
        const g = synthesizeGoal(newAns);
        setNewGoal(g);
        setPhase('done');
        setTimeout(() => setCardVis(true), 60);
      }, 2400);
    }
  };

  // Derive a goal object from user answers
  // In production: call Claude. In prototype: smart extraction.
  const synthesizeGoal = (ans) => {
    const raw0  = ans[0] || '';
    const raw1  = ans[1] || '';
    const raw4  = ans[4] || '';
    // Goal name: first 4 non-punctuation chars of first answer
    const cleaned = raw0.replace(/[，。！？、\s]/g, '');
    const name    = cleaned.slice(0, 4) || '新目标';
    // Gap: first 22 chars of answer 2
    const gap   = (raw1.slice(0, 22) + (raw1.length > 22 ? '……' : '')) || '现状与期望的差距';
    // Target: first 26 chars of answer 5
    const target = raw4.slice(0, 26) || '三个月后看到可感知的改变';
    // Pick palette not already used by GOALS2 (cycle)
    const usedPals = GOALS2.map(g => g.pal);
    const freePal  = [0,1,2,3].find(p => !usedPals.includes(p)) ?? Math.floor(Math.random()*4);
    return { name, phase:'现状→突破', gap, target, pal:freePal, period:'12周' };
  };

  const isTyping  = phase.startsWith('typing');
  const isWaiting = phase.startsWith('wait');
  const showInput = isWaiting;
  const curPhase  = ADD_PHASE_MAP[qIdx] || 0;
  const progressPct = Math.round((qIdx / ADD_GOAL_QS.length) * 100);

  return (
    <div style={{ height:'100%', background:TH2.bg0, display:'flex', flexDirection:'column' }}>

      {/* Nav */}
      <div style={{ padding:'8px 20px 0', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
          color:TH2.t1, width:32, height:32, borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
            color:TH2.t2, letterSpacing:'0.10em' }}>新目标</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color: phase==='done' ? ac : TH2.t1, marginTop:1 }}>
            {phase==='done' ? '如实已整理' : ADD_PHASE_LABELS[curPhase]}
          </div>
        </div>
        {/* 3 phase dots */}
        <div style={{ display:'flex', gap:5 }}>
          {ADD_PHASE_LABELS.map((_,i) => (
            <div key={i} style={{ width:5, height:5, borderRadius:'50%',
              background: i <= curPhase ? ac : TH2.bdr,
              transition:'background 300ms ease' }} />
          ))}
        </div>
      </div>

      {/* Progress line */}
      <div style={{ height:1, background:TH2.bdr, margin:'8px 0 0', flexShrink:0 }}>
        <div style={{ height:'100%', background:ac, borderRadius:1,
          width:`${progressPct}%`,
          transition:'width 600ms cubic-bezier(0.22,1,0.36,1)' }} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto',
        padding:'24px 24px 16px', display:'flex', flexDirection:'column', gap:20 }}>
        {msgs.map((msg, i) => {
          const isLastAI   = msg.role==='ai' && i===msgs.length-1;
          const typeActive = isLastAI && isTyping;
          if (msg.role==='user') return (
            <div key={i} style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ maxWidth:'78%', padding:'10px 14px',
                background:TH2.bg2, borderRadius:'12px 12px 4px 12px',
                fontFamily:"'DM Sans',sans-serif", fontSize:14,
                color:TH2.t1, lineHeight:1.6 }}>{msg.text}</div>
            </div>
          );
          if (typeActive) return (
            <div key={i}>
              <TypewriterV2 text={msg.text} speed={26}
                onDone={() => handleAIDone(msg.id)}
                style={{ fontSize:20, lineHeight:1.85 }} />
            </div>
          );
          return (
            <div key={i} style={{ maxWidth:'92%',
              fontFamily:"'Lora','PingFang SC',serif",
              fontSize:20, color:TH2.t0, whiteSpace:'pre-wrap', lineHeight:1.85 }}>
              {msg.text}
            </div>
          );
        })}

        {/* Synthesizing */}
        {phase==='synthesizing' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <ThinkingV2 />
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
              color:TH2.t2, letterSpacing:'0.10em' }}>如实正在整理……</div>
          </div>
        )}

        {/* Goal card */}
        {newGoal && (
          <div style={{
            opacity: cardVis ? 1 : 0,
            transform: cardVis ? 'none' : 'translateY(20px)',
            transition:'all 420ms cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
              color:ac, letterSpacing:'0.12em', marginBottom:14 }}>如实理解的是这样——</div>

            {/* Synthesis card */}
            <div style={{ background:TH2.bg1, borderRadius:16,
              border:`1px solid ${TH2.bdr}`, padding:'20px 18px',
              position:'relative', overflow:'hidden' }}>
              {/* Decorative quote */}
              <div style={{ position:'absolute', top:-10, left:10,
                fontFamily:"'Lora',serif", fontSize:80, lineHeight:1,
                color:TH2.t2, opacity:0.07, pointerEvents:'none',
                userSelect:'none' }}>"</div>

              <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:16 }}>
                <PlanetOrb2 goal={{ id:99, progress:0, pal:newGoal.pal }} size={52} />
                <div>
                  <div style={{ fontFamily:"'Lora',serif", fontSize:20,
                    color:TH2.t0, marginBottom:3 }}>{newGoal.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:TH2.t1 }}>{newGoal.phase}</div>
                </div>
              </div>

              <div style={{ borderTop:`1px solid ${TH2.bdr}`, paddingTop:14,
                display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8,
                    color:TH2.t2, letterSpacing:'0.12em', marginBottom:4 }}>核心差距</div>
                  <div style={{ fontFamily:"'Lora',serif", fontStyle:'italic',
                    fontSize:13, color:TH2.t1, lineHeight:1.65 }}>{newGoal.gap}</div>
                </div>
                <div style={{ display:'flex', gap:28 }}>
                  <div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8,
                      color:TH2.t2, letterSpacing:'0.12em', marginBottom:3 }}>预计周期</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13,
                      color:TH2.t0 }}>{newGoal.period}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8,
                      color:TH2.t2, letterSpacing:'0.12em', marginBottom:3 }}>第一阶段</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13,
                      color:TH2.t0 }}>澄清现状</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button onClick={onClose} style={{ flex:1, height:44, borderRadius:12,
                background:'transparent', border:`1px solid ${TH2.bdr}`,
                fontFamily:"'DM Sans',sans-serif", fontSize:13,
                color:TH2.t1, cursor:'pointer' }}>重新描述</button>
              <button onClick={() => onCreated(newGoal)} style={{ flex:2, height:44,
                borderRadius:12, background:ac, border:'none',
                fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500,
                color:'#fff', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                transition:'opacity 150ms' }}
                onMouseDown={e => e.currentTarget.style.opacity='0.8'}
                onMouseUp={e => e.currentTarget.style.opacity='1'}>
                确认，开始追踪
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ borderTop:`1px solid ${TH2.bdr}`,
        padding:'10px 18px 28px', background:TH2.bg0, flexShrink:0,
        opacity: showInput ? 1 : 0, transition:'opacity 280ms ease',
        pointerEvents: showInput ? 'auto' : 'none' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="随便说……" rows={1} style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontFamily:"'DM Sans',sans-serif", fontSize:15, color:TH2.t0,
            resize:'none', lineHeight:1.5, caretColor:ac, paddingTop:2 }} />
          <button onClick={handleSend} disabled={!input.trim()} style={{
            width:32, height:32, borderRadius:'50%',
            background: input.trim() ? ac : TH2.bg2,
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, transition:'background 200ms ease' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M3 5l3-3 3 3"
                stroke={input.trim()?'#fff':TH2.t2}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exports ───────────────────────────────────────────────────
Object.assign(window, {
  StartScreenV2, OnboardingScreenV2, PlanetBoardScreen,
  GoalPlanScreen, ChatScreenV2, GeneralChatScreen,
  SettlementScreen, AddGoalScreen,
  PlanetOrb2, PillTabBar,
  TH2, GOALS2, PALS2, EXTRA_POSITIONS,
});
