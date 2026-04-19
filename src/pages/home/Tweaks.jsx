import React from 'react';

const Row = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

const Segmented = ({ value, options, onChange }) => (
  <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(18,25,35,0.85)', border: '1px solid #1F3B73', borderRadius: 8 }}>
    {options.map(([v, label]) => (
      <button key={v} onClick={() => onChange(v)} style={{
        flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: value === v ? 'rgba(0,245,196,0.2)' : 'transparent',
        color: value === v ? 'var(--text)' : 'var(--muted)',
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
      }}>{label}</button>
    ))}
  </div>
);

const TweakPanel = ({ state, setState }) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setVisible(true);
      if (e.data.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const persist = (patch) => {
    const next = { ...state, ...patch };
    setState(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch {}
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20, zIndex: 9999,
      width: 280, padding: 18,
      background: 'rgba(18,25,35,0.92)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(31,59,115,0.7)', borderRadius: 14,
      boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)',
      fontFamily: 'var(--font-body)', color: 'var(--text)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 14, letterSpacing: -0.2 }}>
        Tweaks
      </div>
      <Row label="Background">
        <Segmented value={state.auroraVariant}
          options={[['aurora','Aurora'],['mesh','Mesh'],['minimal','Minimal']]}
          onChange={(v) => persist({ auroraVariant: v })}/>
      </Row>
      <Row label="Motion intensity">
        <input type="range" min="0.3" max="1.8" step="0.1" value={state.intensity}
          onChange={(e) => persist({ intensity: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: '#00F5C4' }}/>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{state.intensity.toFixed(1)}×</div>
      </Row>
      <Row label="Heading style">
        <Segmented value={state.headingStyle}
          options={[['grotesk','Grotesk'],['serif','Serif'],['mono','Mono']]}
          onChange={(v) => persist({ headingStyle: v })}/>
      </Row>
      <Row label="Live demo">
        <Segmented value={state.liveRunning ? 'on' : 'off'}
          options={[['on','Running'],['off','Paused']]}
          onChange={(v) => persist({ liveRunning: v === 'on' })}/>
      </Row>
    </div>
  );
};

export { TweakPanel };
