import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from './home/Sections';
import { Features, ToolCatalog, Closer, HomeFooter } from './home/Catalog';
import { TweakPanel } from './home/Tweaks';

const GlobalCSS = () => (
  <style>{`
    :root {
      --font-display: 'Space Grotesk', system-ui, sans-serif;
      --font-body: 'Inter', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;
      --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

      /* Landing-only color system */
      --bg: #0B0F14;
      --card: #121923;
      --primary: #00F5C4;
      --secondary: #1F3B73;
      --accent: #7CFFB2;
      --text: #E6F1FF;
      --muted: #7A8CA3;
    }
    @keyframes btnShine {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }
    @keyframes gradientSlide {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes dotPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.6; }
    }
    @keyframes floatY {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes drift {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-30px, 20px); }
    }
    @keyframes spinLogo {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 960px) {
      .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; padding: 96px 24px 80px !important; }
      .feature-grid { grid-template-columns: 1fr !important; }
      .catalog-grid { grid-template-columns: 1fr !important; }
    }
    .heading-serif h1, .heading-serif h2, .heading-serif h3 {
      font-family: 'Playfair Display', Georgia, serif !important; font-weight: 600 !important;
    }
    .heading-mono h1, .heading-mono h2, .heading-mono h3 {
      font-family: 'JetBrains Mono', monospace !important; letter-spacing: -1px !important;
    }
  `}</style>
);

const TopNav = () => (
  <nav style={{
    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
    zIndex: 50,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px 8px 18px',
    background: 'rgba(18,25,35,0.82)', backdropFilter: 'blur(24px) saturate(1.2)',
    border: '1px solid rgba(31,59,115,0.45)',
    borderRadius: 999,
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.6)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16, borderRight: '1px solid rgba(31,59,115,0.55)' }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: 'conic-gradient(from 220deg, #00F5C4, #7CFFB2, #1F3B73, #00F5C4)',
        animation: 'spinLogo 8s linear infinite',
      }}/>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, letterSpacing: -0.3 }}>TOC Lab</span>
    </div>
    {[
      { label: 'Simulators', to: '/simulators/dfa', active: false },
      { label: 'Converters', to: '/converters/nfa-to-dfa', active: false },
      { label: 'Analyzers',  to: '/analyzers/minimize',    active: false },
    ].map(({ label, to, active }) => (
      <Link key={label} to={to} style={{
        padding: '8px 14px', borderRadius: 999,
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
        color: active ? 'var(--text)' : 'var(--muted)',
        background: active ? 'rgba(0,245,196,0.14)' : 'transparent',
        transition: 'all 220ms', textDecoration: 'none',
      }}>{label}</Link>
    ))}
  </nav>
);

const TWEAK_DEFAULTS = {
  auroraVariant: 'aurora',
  intensity: 1,
  headingStyle: 'grotesk',
  liveRunning: true,
};

const Home = () => {
  const [state, setState] = React.useState(TWEAK_DEFAULTS);

  React.useEffect(() => {
    if (state.headingStyle === 'serif' && !document.getElementById('pf-font')) {
      const l = document.createElement('link');
      l.id = 'pf-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap';
      document.head.appendChild(l);
    }
  }, [state.headingStyle]);

  const cls = state.headingStyle === 'serif' ? 'heading-serif'
             : state.headingStyle === 'mono'  ? 'heading-mono'
             : '';

  return (
    <div className={cls} style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <GlobalCSS/>
      <TopNav/>
      <Hero auroraVariant={state.auroraVariant} intensity={state.intensity} liveRunning={state.liveRunning}/>
      <Features/>
      <ToolCatalog/>
      <Closer/>
      <HomeFooter/>
      <TweakPanel state={state} setState={setState}/>
    </div>
  );
};

export default Home;
