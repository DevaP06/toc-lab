import React from 'react';

const DFA = {
  states: ['q0', 'q1', 'q2'],
  start: 'q0',
  accept: ['q2'],
  transitions: {
    q0: { a: 'q1', b: 'q0' },
    q1: { a: 'q1', b: 'q2' },
    q2: { a: 'q1', b: 'q0' },
  },
};

const POS = {
  q0: { x: 90,  y: 150 },
  q1: { x: 220, y: 80  },
  q2: { x: 340, y: 170 },
};

const EDGES = [
  { from: 'q0', to: 'q1', label: 'a', curve: -30 },
  { from: 'q1', to: 'q0', label: 'b', curve:  30 },
  { from: 'q1', to: 'q2', label: 'b', curve: -20 },
  { from: 'q2', to: 'q1', label: 'a', curve:  20 },
  { from: 'q2', to: 'q0', label: 'b', curve:  60 },
  { from: 'q0', to: 'q0', label: 'b', self: 'left'  },
  { from: 'q1', to: 'q1', label: 'a', self: 'top'   },
];

function edgePath(from, to, curve = 0) {
  const a = POS[from], b = POS[to];
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const cx = mx + nx * curve, cy = my + ny * curve;
  return { d: `M ${a.x},${a.y} Q ${cx},${cy} ${b.x},${b.y}`, cx, cy };
}

function selfLoopPath(id, side) {
  const { x, y } = POS[id];
  if (side === 'top')  return { d: `M ${x-14},${y-22} C ${x-50},${y-90} ${x+50},${y-90} ${x+14},${y-22}`, cx: x, cy: y - 62 };
  if (side === 'left') return { d: `M ${x-22},${y-14} C ${x-90},${y-50} ${x-90},${y+50} ${x-22},${y+14}`, cx: x - 62, cy: y };
  return { d: `M ${x+22},${y-14} C ${x+90},${y-50} ${x+90},${y+50} ${x+22},${y+14}`, cx: x + 62, cy: y };
}

function getEdgeGeom(e) {
  if (e.self) return selfLoopPath(e.from, e.self);
  return edgePath(e.from, e.to, e.curve || 0);
}

const LiveAutomaton = ({ running = true }) => {
  const [current, setCurrent] = React.useState('q0');
  const [inputIdx, setInputIdx] = React.useState(0);
  const [activeEdge, setActiveEdge] = React.useState(null);
  const [string] = React.useState('a b a b a a b'.split(' '));

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setInputIdx((i) => {
        const next = (i + 1) % (string.length + 1);
        if (next === 0) { setCurrent('q0'); setActiveEdge(null); return 0; }
        const symbol = string[next - 1];
        setCurrent((cur) => {
          const nxt = DFA.transitions[cur][symbol];
          setActiveEdge(`${cur}->${nxt}:${symbol}`);
          return nxt;
        });
        return next;
      });
    }, 1100);
    return () => clearInterval(id);
  }, [running, string]);

  const accepted = current === 'q2' && inputIdx === string.length;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="0 0 440 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <marker id="la-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#A6B0C0" />
          </marker>
          <marker id="la-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#818CF8" />
          </marker>
          <filter id="la-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {EDGES.map((e, i) => {
          const { d, cx, cy } = getEdgeGeom(e);
          const key = `${e.from}->${e.to}:${e.label}`;
          const isActive = activeEdge === key;
          return (
            <g key={i}>
              <path
                d={d} fill="none"
                stroke={isActive ? '#818CF8' : '#364159'}
                strokeWidth={isActive ? 2.5 : 1.5}
                markerEnd={`url(#${isActive ? 'la-arrow-active' : 'la-arrow'})`}
                style={{ transition: 'stroke 300ms, stroke-width 300ms', filter: isActive ? 'url(#la-glow)' : 'none' }}
              />
              {isActive && (
                <circle r="4" fill="#C7D2FE" filter="url(#la-glow)">
                  <animateMotion dur="0.9s" repeatCount="1" path={d} />
                  <animate attributeName="opacity" values="0;1;1;0" dur="0.9s" repeatCount="1" />
                </circle>
              )}
              <g transform={`translate(${cx} ${cy})`}>
                <rect x="-11" y="-10" width="22" height="18" rx="5"
                      fill={isActive ? 'rgba(129,140,248,0.18)' : 'rgba(20,27,45,0.9)'}
                      stroke={isActive ? '#818CF8' : '#26304A'} strokeWidth="1" />
                <text textAnchor="middle" y="4" fontFamily="JetBrains Mono, monospace" fontSize="11"
                      fill={isActive ? '#E0E7FF' : '#A6B0C0'} fontWeight="600">{e.label}</text>
              </g>
            </g>
          );
        })}

        <g>
          <path d={`M ${POS.q0.x - 52} ${POS.q0.y} L ${POS.q0.x - 22} ${POS.q0.y}`} stroke="#A6B0C0" strokeWidth="1.5" markerEnd="url(#la-arrow)" fill="none"/>
          <text x={POS.q0.x - 58} y={POS.q0.y - 8} textAnchor="end" fontSize="10" fill="#6B7280" fontFamily="JetBrains Mono, monospace">start</text>
        </g>

        {DFA.states.map((s) => {
          const { x, y } = POS[s];
          const isCurrent = current === s;
          const isAccept = DFA.accept.includes(s);
          return (
            <g key={s} transform={`translate(${x} ${y})`}>
              {isCurrent && (
                <>
                  <circle r="32" fill="none" stroke="#818CF8" strokeWidth="1" opacity="0.6">
                    <animate attributeName="r" values="22;44;22" dur="1.6s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
                  </circle>
                  <circle r="28" fill="rgba(99,102,241,0.2)" filter="url(#la-glow)" />
                </>
              )}
              <circle r="22" fill={isCurrent ? '#6366F1' : '#141B2D'} stroke={isCurrent ? '#A5B4FC' : '#26304A'} strokeWidth="2" />
              {isAccept && <circle r="17" fill="none" stroke={isCurrent ? '#A5B4FC' : '#26304A'} strokeWidth="1.5"/>}
              <text textAnchor="middle" y="4" fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight="700"
                    fill={isCurrent ? '#FFFFFF' : '#E5E7EB'}>{s}</text>
            </g>
          );
        })}
      </svg>

      <div style={{
        position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
        display: 'flex', gap: 6, padding: '10px 14px',
        background: 'rgba(11,16,32,0.7)', backdropFilter: 'blur(8px)',
        border: '1px solid #26304A', borderRadius: 10,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
      }}>
        <span style={{ color: '#6B7280', marginRight: 6 }}>input</span>
        {string.map((ch, i) => {
          const consumed = i < inputIdx;
          const isHead = i === inputIdx - 1;
          return (
            <span key={i} style={{
              width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 5,
              background: isHead ? '#6366F1' : consumed ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isHead ? '#fff' : consumed ? '#A5B4FC' : '#6B7280',
              border: `1px solid ${isHead ? '#A5B4FC' : consumed ? '#26304A' : 'transparent'}`,
              transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
              fontWeight: 600,
            }}>{ch}</span>
          );
        })}
        <span style={{
          marginLeft: 10, padding: '2px 8px', borderRadius: 5,
          fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase',
          background: accepted ? 'rgba(34,197,94,0.18)' : 'rgba(107,114,128,0.12)',
          color: accepted ? '#86EFAC' : '#9CA3AF',
          border: `1px solid ${accepted ? 'rgba(34,197,94,0.4)' : '#26304A'}`,
        }}>
          {inputIdx === string.length ? (accepted ? 'accepted' : 'rejected') : 'running'}
        </span>
      </div>
    </div>
  );
};

export { LiveAutomaton };
