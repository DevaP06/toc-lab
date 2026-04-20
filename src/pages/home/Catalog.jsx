import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Reveal, MagneticBtn } from './Sections';

// ---------- Mini visuals ----------
const MiniDFA = () => {
  const [i, setI] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => setI(x => (x+1)%3), 900); return () => clearInterval(id); }, []);
  const pts = [[30,45],[90,20],[130,55]];
  return (
    <svg viewBox="0 0 160 80" style={{ width: '100%', height: 120 }}>
      <path d="M 30 45 Q 60 10 90 20" stroke={i>=1?'#00F5C4':'#1F3B73'} strokeWidth="1.5" fill="none" style={{transition:'stroke 300ms'}}/>
      <path d="M 90 20 Q 110 35 130 55" stroke={i>=2?'#7CFFB2':'#1F3B73'} strokeWidth="1.5" fill="none" style={{transition:'stroke 300ms'}}/>
      {pts.map(([x,y], k) => (
        <g key={k}>
          <circle cx={x} cy={y} r="13" fill={i===k?'#1F3B73':'#121923'} stroke={i===k?'#00F5C4':'#1F3B73'} strokeWidth="1.5" style={{transition:'fill 300ms'}}/>
          <text x={x} y={y+4} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill={i===k?'#E6F1FF':'#7A8CA3'} fontWeight="600">q{k}</text>
        </g>
      ))}
    </svg>
  );
};

const MiniTape = () => {
  const [head, setHead] = React.useState(2);
  React.useEffect(() => { const id = setInterval(() => setHead(h => (h+1)%7), 700); return () => clearInterval(id); }, []);
  const cells = ['1','0','1','1','0','1','_'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, padding: '24px 0 24px' }}>
      {cells.map((c,i) => (
        <div key={i} style={{
          height: 34, borderRadius: 6, display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
          background: i === head ? 'var(--primary)' : 'rgba(18,25,35,0.85)',
          color: i === head ? '#061019' : 'var(--muted)',
          border: `1px solid ${i === head ? '#7CFFB2' : '#1F3B73'}`,
          transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
          transform: i === head ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: i === head ? '0 8px 20px -4px rgba(0,245,196,0.55)' : 'none',
        }}>{c}</div>
      ))}
    </div>
  );
};

const MiniRegex = () => {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => setPhase(p => (p+1)%3), 1200); return () => clearInterval(id); }, []);
  const tokens = [
    { t: '(', c: '#7A8CA3' }, { t: 'a', c: '#00F5C4' }, { t: '|', c: '#7A8CA3' },
    { t: 'b', c: '#7CFFB2' }, { t: ')', c: '#7A8CA3' }, { t: '*', c: '#1F3B73' },
    { t: 'a', c: '#00F5C4' }, { t: 'b', c: '#7CFFB2' },
  ];
  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600 }}>
        {tokens.map((tk, i) => (
          <span key={i} style={{
            color: tk.c, opacity: phase >= 1 ? 1 : 0.3,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(4px)',
            transition: `all 400ms cubic-bezier(0.22,1,0.36,1) ${i*60}ms`,
          }}>{tk.t}</span>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', opacity: phase >= 2 ? 1 : 0, transition: 'opacity 500ms' }}>
        → NFA with 9 states, 12 transitions
      </div>
      <svg viewBox="0 0 200 30" style={{ width: '100%', height: 30, opacity: phase >= 2 ? 1 : 0, transition: 'opacity 500ms 200ms' }}>
        {[...Array(6)].map((_,i) => (
          <g key={i}>
            <circle cx={18 + i*32} cy="15" r="8" fill="#121923" stroke="#00F5C4" strokeWidth="1.5"/>
            {i < 5 && <path d={`M ${26 + i*32} 15 L ${42 + i*32} 15`} stroke="#00F5C4" strokeWidth="1.2"/>}
          </g>
        ))}
      </svg>
    </div>
  );
};

// ---------- Features ----------
const Features = () => {
  const cards = [
    {
      tag: '01 / SIMULATORS', title: 'State machines, alive.',
      body: 'DFA, NFA, PDA and Turing machines with step-through execution, transition tracing and stack visualization.',
      accent: '#00F5C4', visual: <MiniDFA/>,
    },
    {
      tag: '02 / CONVERTERS', title: 'Translate between models.',
      body: 'Regex → NFA via Thompson construction. NFA → DFA via subset construction with epsilon-closure.',
      accent: '#1F3B73', visual: <MiniRegex/>,
    },
    {
      tag: '03 / ANALYZERS', title: 'Minimize. Compare. Prove.',
      body: 'Collapse equivalent states with partition refinement minimization. Check language equivalence via product-automaton BFS. See the tape walk.',
      accent: '#7CFFB2', visual: <MiniTape/>,
    },
  ];

  return (
    <section style={{ position: 'relative', padding: '140px 48px', maxWidth: 1280, margin: '0 auto' }}>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--primary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>— Platform</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 600, letterSpacing: -1.5, lineHeight: 1.02, maxWidth: 720 }}>
              Everything you need to
              <span style={{ color: 'var(--primary)', fontStyle: 'italic', fontWeight: 400 }}> understand </span>
              computation.
            </h2>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', maxWidth: 240 }}>
            Eight tools organized in three families. Each one runs live, in your browser.
          </div>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="feature-grid">
        {cards.map((c, i) => (
          <Reveal key={c.tag} delay={i * 120}>
            <FeatureCard {...c} />
          </Reveal>
        ))}
      </div>
    </section>
  );
};

const FeatureCard = ({ tag, title, body, accent, visual }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(18,25,35,0.84), rgba(11,15,20,0.78))',
        border: `1px solid ${hover ? accent + '66' : '#1F3B73'}`,
        borderRadius: 20, padding: 28,
        transition: 'transform 400ms cubic-bezier(0.34,1.56,0.64,1), border-color 300ms, box-shadow 300ms',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hover ? `0 30px 60px -20px ${accent}40` : '0 0 0 transparent',
        overflow: 'hidden', minHeight: 380, display: 'flex', flexDirection: 'column',
      }}>
      <div aria-hidden style={{
        position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}55, transparent 70%)`,
        opacity: hover ? 0.9 : 0.25, transition: 'opacity 400ms', filter: 'blur(30px)',
      }}/>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent, letterSpacing: 1.4, marginBottom: 16, zIndex: 1 }}>{tag}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1.1, fontWeight: 600, letterSpacing: -0.7, marginBottom: 14, zIndex: 1 }}>{title}</h3>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)', zIndex: 1 }}>{body}</p>
      <div style={{ marginTop: 'auto', zIndex: 1 }}>{visual}</div>
      <div style={{
        marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 12, color: accent,
        transform: hover ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 300ms', zIndex: 1,
      }}>
        <span>open tools</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </div>
    </div>
  );
};

// ---------- Tool catalog ----------
const TOOLS = [
  { fam: 'sim', key: 'dfa', name: 'DFA Simulator',    kbd: 'D', blurb: 'Deterministic finite automata',    route: '/simulators/dfa' },
  { fam: 'sim', key: 'nfa', name: 'NFA Simulator',    kbd: 'N', blurb: 'Nondeterministic w/ ε-moves',      route: '/simulators/nfa' },
  { fam: 'sim', key: 'pda', name: 'PDA Simulator',    kbd: 'P', blurb: 'Pushdown automata + stack trace',  route: '/simulators/pda' },
  { fam: 'sim', key: 'tm',  name: 'Turing Machine',   kbd: 'T', blurb: 'Infinite tape, head tracking',     route: '/simulators/tm' },
  { fam: 'cvt', key: 'n2d', name: 'NFA → DFA',        kbd: '1', blurb: 'Subset construction',              route: '/converters/nfa-to-dfa' },
  { fam: 'cvt', key: 'r2n', name: 'Regex → NFA',      kbd: '2', blurb: 'Thompson construction',            route: '/converters/regex-to-nfa' },
  { fam: 'an',  key: 'min', name: 'DFA Minimization', kbd: 'M', blurb: 'Partition refinement minimization', route: '/analyzers/dfa-minimizer' },
  { fam: 'an',  key: 'eq',  name: 'DFA Equivalence',  kbd: 'E', blurb: 'Language equality check',          route: '/analyzers/equivalence' },
];

const FAM = {
  sim: { label: 'Simulator', color: '#00F5C4' },
  cvt: { label: 'Converter', color: '#1F3B73' },
  an:  { label: 'Analyzer',  color: '#7CFFB2' },
};

const ToolCatalog = () => {
  const [filter, setFilter] = React.useState('all');
  const filtered = filter === 'all' ? TOOLS : TOOLS.filter(t => t.fam === filter);

  return (
    <section style={{ position: 'relative', padding: '80px 48px 140px', maxWidth: 1280, margin: '0 auto' }}>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--primary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>— Catalog</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 3.4vw, 44px)', fontWeight: 600, letterSpacing: -1.2, lineHeight: 1.05 }}>
              All tools, one keystroke away.
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(18,25,35,0.7)', border: '1px solid #1F3B73', borderRadius: 12 }}>
            {['all','sim','cvt','an'].map(k => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: filter === k ? 'rgba(0,245,196,0.16)' : 'transparent',
                color: filter === k ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase',
                transition: 'all 240ms',
              }}>
                {k === 'all' ? 'All' : FAM[k].label + 's'}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="catalog-grid">
        {filtered.map((t, i) => <ToolRow key={t.key} t={t} i={i} />)}
      </div>
    </section>
  );
};

const ToolRow = ({ t, i }) => {
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const fam = FAM[t.fam];
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => navigate(t.route)}
      style={{
        position: 'relative', padding: '20px 22px',
        background: hover ? `linear-gradient(135deg, ${fam.color}1a, rgba(18,25,35,0.95))` : 'rgba(18,25,35,0.7)',
        border: `1px solid ${hover ? fam.color + '66' : '#1F3B73'}`,
        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer',
        opacity: shown ? 1 : 0,
        transform: shown ? (hover ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(12px)',
        transition: `opacity 500ms cubic-bezier(0.22,1,0.36,1) ${i*40}ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1), background 240ms, border-color 240ms`,
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg, ${fam.color}33, ${fam.color}11)`,
        border: `1px solid ${fam.color}55`,
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: fam.color,
      }}>{t.kbd}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: -0.2 }}>{t.name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t.blurb}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={hover ? fam.color : 'var(--muted)'} strokeWidth="2"
           style={{ transition: 'stroke 200ms, transform 300ms', transform: hover ? 'translateX(3px)' : 'translateX(0)' }}>
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
    </div>
  );
};

// ---------- Closer ----------
const Closer = () => (
  <section style={{ position: 'relative', padding: '100px 48px 160px', maxWidth: 1280, margin: '0 auto' }}>
    <Reveal>
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '80px 64px',
        background: 'linear-gradient(135deg, rgba(31,59,115,0.32), rgba(18,25,35,0.7), rgba(0,245,196,0.12))',
        border: '1px solid rgba(31,59,115,0.65)', borderRadius: 28, textAlign: 'center',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(0,245,196,0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(124,255,178,0.16), transparent 45%)',
          animation: 'drift 14s ease-in-out infinite alternate',
        }}/>
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.02, maxWidth: 760, margin: '0 auto' }}>
            Stop memorizing automata.<br/>
            <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontWeight: 400 }}>Start running them.</span>
          </h2>
          <div style={{ marginTop: 40, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <MagneticBtn variant="primary" to="/simulators/dfa">Launch DFA Simulator</MagneticBtn>
            <MagneticBtn variant="ghost" to="/simulators/nfa">Browse Tools</MagneticBtn>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);

const HomeFooter = () => (
  <footer style={{
    borderTop: '1px solid rgba(31,59,115,0.55)', padding: '28px 48px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)',
  }}>
    <div>TOC Lab  ©  2026 — theoretical made tangible</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}/>
      system online
    </div>
  </footer>
);

export { Features, ToolCatalog, Closer, HomeFooter };
