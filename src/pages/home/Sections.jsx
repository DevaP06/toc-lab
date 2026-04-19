import React from 'react';
import { Link } from 'react-router-dom';
import { Aurora } from './Aurora';
import { LiveAutomaton } from './Automaton';

const useReveal = (threshold = 0.15) => {
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown];
};

const Reveal = ({ delay = 0, children, as: As = 'div', className = '', style = {} }) => {
  const [ref, shown] = useReveal();
  return (
    <As ref={ref} className={className} style={{
      ...style,
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.98)',
      transition: `opacity 700ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 800ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      willChange: 'transform, opacity',
    }}>{children}</As>
  );
};

const MagneticBtn = ({ children, variant = 'primary', onClick, icon, to }) => {
  const ref = React.useRef(null);
  const [tr, setTr] = React.useState({ x: 0, y: 0 });
  const handle = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    setTr({ x: x * 0.25, y: y * 0.25 });
  };
  const reset = () => setTr({ x: 0, y: 0 });

  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '14px 26px', borderRadius: 999,
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, letterSpacing: -0.1,
    transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms, background 220ms, border-color 220ms',
    transform: `translate(${tr.x}px, ${tr.y}px)`,
    cursor: 'pointer', border: '1px solid transparent',
    position: 'relative', overflow: 'hidden', textDecoration: 'none',
  };
  const styles = variant === 'primary'
    ? { ...base, background: 'linear-gradient(135deg, var(--secondary), var(--primary))', color: '#061019',
      boxShadow: '0 12px 40px -12px rgba(0,245,196,0.65), inset 0 1px 0 rgba(255,255,255,0.15)' }
    : { ...base, background: 'rgba(0,245,196,0.08)', color: 'var(--text)', borderColor: 'rgba(31,59,115,0.7)' };

  const content = (
    <>
      {icon}
      <span>{children}</span>
      {variant === 'primary' && (
        <span aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
          transform: 'translateX(-100%)', animation: 'btnShine 3s ease-in-out infinite',
        }}/>
      )}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} onMouseMove={handle} onMouseLeave={reset} style={styles}>
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref} onMouseMove={handle} onMouseLeave={reset} onClick={onClick} style={styles}>
      {content}
    </button>
  );
};

const FloatBadge = ({ style, label, value, color, mono }) => (
  <div style={{
    position: 'absolute', ...style,
    padding: '8px 12px', borderRadius: 10,
    background: 'rgba(18,25,35,0.92)', backdropFilter: 'blur(12px)',
    border: `1px solid ${color}44`, boxShadow: `0 12px 32px -8px ${color}55`,
    animation: 'floatY 3.5s ease-in-out infinite',
    animationDelay: style.top ? '0.2s' : '0.8s',
  }}>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
    <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)', fontSize: 16, fontWeight: 600, color }}>{value}</div>
  </div>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

const Hero = ({ auroraVariant, intensity, liveRunning = true }) => (
  <section style={{
    position: 'relative', minHeight: '92vh',
    display: 'flex', alignItems: 'center',
    borderBottom: '1px solid rgba(31,59,115,0.55)',
    overflow: 'hidden',
  }}>
    <Aurora variant={auroraVariant} intensity={intensity} />

    <div style={{
      position: 'relative', zIndex: 2,
      maxWidth: 1280, margin: '0 auto', padding: '120px 48px 100px',
      display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 64, alignItems: 'center', width: '100%',
    }} className="hero-grid">

      <div>
        <Reveal delay={0}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 14px 6px 8px', borderRadius: 999,
            background: 'rgba(0,245,196,0.08)', border: '1px solid rgba(31,59,115,0.65)',
            color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: 0.3,
          }}>
            <span style={{ width: 20, height: 20, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'rgba(0,245,196,0.18)' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)', animation: 'dotPulse 1.8s infinite' }}/>
            </span>
            v1.2 — live simulation engine
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(44px, 6vw, 88px)', lineHeight: 1.05,
            fontWeight: 700, letterSpacing: -2.5, marginTop: 24, marginBottom: 0,
          }}>
            <span style={{ display: 'block', color: 'var(--text)' }}>Theory of</span>
            <span style={{ display: 'block' }}>
              <span style={{
                background: 'linear-gradient(110deg, var(--primary) 0%, var(--accent) 40%, #54d0ff 70%, var(--secondary) 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent', color: 'transparent',
                backgroundSize: '300% 300%', animation: 'gradientSlide 9s ease-in-out infinite',
                display: 'inline-block',
              }}>Computation</span>
            </span>
            <span style={{ display: 'block', color: 'var(--muted)', fontStyle: 'italic', fontWeight: 400, paddingBottom: '0.1em' }}>made tangible.</span>
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p style={{ marginTop: 28, maxWidth: 520, fontSize: 18, lineHeight: 1.6, color: 'var(--muted)' }}>
            Build DFAs, NFAs, PDAs and Turing machines visually. Trace executions step by step.
            Convert, minimize, and compare — all in a single fluid workspace.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <MagneticBtn variant="primary" icon={<PlayIcon/>} to="/simulators/dfa">Start Exploring</MagneticBtn>
            <MagneticBtn variant="ghost" icon={<ArrowIcon/>} to="/simulators/nfa">Browse Tools</MagneticBtn>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <div style={{ marginTop: 48, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[
              { k: '11', v: 'Interactive Tools' },
              { k: '4', v: 'Machine Models' },
              { k: '∞', v: 'Strings Simulated' },
            ].map((s) => (
              <div key={s.v}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, letterSpacing: -1,
                              background: 'linear-gradient(180deg, var(--text), var(--muted))', WebkitBackgroundClip: 'text',
                              backgroundClip: 'text', color: 'transparent' }}>{s.k}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 0.6,
                              textTransform: 'uppercase', marginTop: 4 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal delay={200}>
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(18,25,35,0.85), rgba(11,15,20,0.78))',
          backdropFilter: 'blur(24px) saturate(1.2)',
          border: '1px solid rgba(31,59,115,0.6)',
          borderRadius: 22, padding: 22,
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: '#EF4444' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: '#F59E0B' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--accent)' }}/>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
                dfa_simulator.toc — L = (a|b)*ab
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)',
                           padding: '3px 8px', borderRadius: 5, background: 'rgba(124,255,178,0.1)',
                           border: '1px solid rgba(124,255,178,0.35)' }}>● running</span>
          </div>

          <div style={{ height: 340, position: 'relative' }}>
            <LiveAutomaton running={liveRunning} />
          </div>

          <FloatBadge style={{ top: -14, right: 28 }} label="step" value="6 / 7" color="#00F5C4" />
          <FloatBadge style={{ bottom: 92, left: -18 }} label="state" value="q2" color="#7CFFB2" mono />
        </div>
      </Reveal>
    </div>

    <div style={{
      position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      animation: 'floatY 2.4s ease-in-out infinite',
    }}>
      <span>SCROLL</span>
      <span style={{ width: 1, height: 24, background: 'linear-gradient(180deg, var(--muted), transparent)' }}/>
    </div>
  </section>
);

export { Hero, Reveal, MagneticBtn };
