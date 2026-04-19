import React, { useState } from 'react';
import { Play, SkipForward, RotateCcw, Layers } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { PDA, getPDASelectionPreset } from '../../core/pda';
import './PdaSimulator.css';

const LANGUAGE_OPTIONS = [
  { value: 'ANBN',     label: "aⁿbⁿ — equal a's followed by b's" },
  { value: 'EVEN_PAL', label: 'wwᴿ — even length palindromes'    },
  { value: 'ODD_PAL',  label: 'Odd palindromes'                   },
];

const LANGUAGE_DETAILS = {
  ANBN: {
    name: 'aⁿbⁿ',
    meaning: 'equal number of a\'s followed by b\'s',
  },
  EVEN_PAL: {
    name: 'wwᴿ',
    meaning: 'even-length palindromes',
  },
  ODD_PAL: {
    name: 'wXwᴿ',
    meaning: 'odd-length palindromes',
  }
};

const getPresetDef = (value) => {
  const preset = getPDASelectionPreset(value);
  const label = LANGUAGE_OPTIONS.find(o => o.value === value)?.label || '';
  return {
    selectedLanguage: value,
    languageLabel: label,
    languageMeaning: LANGUAGE_DETAILS[value]?.meaning || '',
    inputString: preset.sampleInput,
    ...preset.definition,
  };
};

const buildPresetEngine = (value) => {
  const preset = getPDASelectionPreset(value);
  return new PDA(
    preset.definition.states.split(',').map(s => s.trim()).filter(Boolean),
    preset.definition.inputAlphabet.split(',').map(s => s.trim()).filter(Boolean),
    preset.definition.stackAlphabet.split(',').map(s => s.trim()).filter(Boolean),
    preset.definition.startState,
    preset.definition.startStack,
    preset.definition.acceptStates.split(',').map(s => s.trim()).filter(Boolean),
    preset.definition.transitions.split('\n').reduce((acc, line) => {
      const p = line.split(',').map(x => x.trim());
      if (p.length === 5) acc.push({ from: p[0], input: p[1], pop: p[2], push: p[3], to: p[4] });
      return acc;
    }, [])
  );
};

// Return the most "interesting" config at a given step:
// accepted > active/start > first available
const getPrimary = (configs) =>
  configs?.find(c => c.status === 'ACCEPT') ||
  configs?.find(c => c.status === 'ACTIVE' || c.status === 'START') ||
  configs?.[0] ||
  null;

const DEFAULT = 'ANBN';

const PdaSimulator = () => {
  const [definition, setDefinition] = useState(getPresetDef(DEFAULT));
  const [engine,     setEngine]     = useState(() => buildPresetEngine(DEFAULT));
  const [sim,        setSim]        = useState({ steps: [], step: -1, accepted: false, timedOut: false });
  const [activeNodes, setActiveNodes] = useState([]);

  const handleLanguageChange = (value) => {
    setDefinition(getPresetDef(value));
    setSim({ steps: [], step: -1, accepted: false, timedOut: false });
    setActiveNodes([]);
    setEngine(buildPresetEngine(value));
  };

  const loadPresetEngine = () => {
    const pda = buildPresetEngine(definition.selectedLanguage);
    setEngine(pda);
    return pda;
  };

  const handleSimulate = () => {
    const pda = loadPresetEngine();
    if (!pda) return;
    const result = pda.simulateStepByStep(definition.inputString.trim());
    const last = result.allSteps.length - 1;
    setSim({ steps: result.allSteps, step: last, accepted: result.accepted, timedOut: result.timedOut });
    const primary = getPrimary(result.allSteps[last]);
    if (primary) setActiveNodes([primary.state]);
    if (result.timedOut) alert('Step limit reached (500 steps). The PDA may have an infinite epsilon cycle.');
  };

  const handleStep = () => {
    const pda = engine || loadPresetEngine();
    if (!pda) return;

    if (sim.step === -1) {
      const result = pda.simulateStepByStep(definition.inputString.trim());
      setSim({ steps: result.allSteps, step: 0, accepted: result.accepted, timedOut: result.timedOut });
      const primary = getPrimary(result.allSteps[0]);
      if (primary) setActiveNodes([primary.state]);
      return;
    }
    if (sim.step < sim.steps.length - 1) {
      const next = sim.step + 1;
      setSim(prev => ({ ...prev, step: next }));
      const primary = getPrimary(sim.steps[next]);
      if (primary) setActiveNodes([primary.state]);
    }
  };

  const handleReset = () => {
    setSim({ steps: [], step: -1, accepted: false, timedOut: false });
    setActiveNodes([]);
  };

  const graphData = () => {
    if (!engine) return null;
    const edgeMap = new Map();
    engine.transitions.forEach(t => {
      const key  = `${t.from}->${t.to}`;
      const inp  = (!t.input  || t.input  === 'ε') ? 'ε' : t.input;
      const pop  = (!t.pop    || t.pop    === 'ε') ? 'ε' : t.pop;
      const push = (!t.push   || t.push   === 'ε') ? 'ε' : t.push;
      const lbl  = `${inp}, ${pop} → ${push}`;
      if (edgeMap.has(key)) edgeMap.get(key).labels.push(lbl);
      else edgeMap.set(key, { from: t.from, to: t.to, labels: [lbl] });
    });
    const edges = Array.from(edgeMap.values()).map(({ from, to, labels }) => ({
      from, to, label: labels.join('\n')
    }));
    return { states: engine.states, edges, startState: engine.startState, acceptStates: engine.acceptStates };
  };

  const formatMove = (move) => {
    if (!move) return 'Initial configuration';

    const read = move.input === '' ? 'ε' : move.input;
    const pop = move.pop || 'ε';
    const push = move.push || 'ε';

    return `Read '${read}', Pop ${pop}, Push ${push} → ${move.to}`;
  };

  // Derived display values
  const hasRun   = sim.steps.length > 0;
  const isAtEnd  = hasRun && sim.step === sim.steps.length - 1;
  const current  = hasRun && sim.step >= 0 ? sim.steps[sim.step] : [];
  const primary  = getPrimary(current);
  const inputStr = definition.inputString.trim();
  const consumed = primary?.inputConsumed ?? 0;

  // Diagram highlighting
  const currentMove = primary?.history?.length
    ? primary.history[primary.history.length - 1]
    : null;
  const activeEdge  = currentMove ? { from: currentMove.from, to: currentMove.to } : null;
  const isRejected  = primary?.status === 'DEAD PATH' || primary?.status?.includes('REJECT');
  const rejectNodes = isRejected ? [primary.state] : [];
  const graphModel = graphData();
  const languageName = LANGUAGE_DETAILS[definition.selectedLanguage]?.name || definition.languageLabel;
  const languageMeaning = LANGUAGE_DETAILS[definition.selectedLanguage]?.meaning || definition.languageMeaning || '';

  return (
    <div className="pda-page fade-in">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="pda-header">
        <div>
          <h2>PDA Simulator</h2>
          <p className="text-muted">
            Select a language preset or define a custom PDA — enter an input string and watch the stack evolve at each step.
          </p>
        </div>
      </div>

      <div className="pda-main-grid">

        {/* ══ LEFT: Configuration ══════════════════════════ */}
        <div className="pda-left">
          <div className="panel pda-config-panel">
            <h3 className="panel-header">Language</h3>

            <div className="form-group">
              <label>Select Language</label>
              <select value={definition.selectedLanguage} onChange={e => handleLanguageChange(e.target.value)}>
                {LANGUAGE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="preset-description">
              <div className="preset-summary">
                Language: <strong>{languageName}</strong>
              </div>
              <div className="preset-meaning">
                Meaning: {languageMeaning}
              </div>
              <div className="preset-example">
                Example input: <strong>{definition.inputString}</strong>
              </div>
            </div>

            <p className="text-muted preset-note">
              This preset automatically defines the PDA.
            </p>
          </div>

          {/* ── State Diagram (primary visual) ─────── */}
          <div className="panel graph-panel">
            <h3 className="panel-header" style={{ flexShrink: 0 }}>State Diagram</h3>
            <div className="graph-panel-body">
              <div className="graph-canvas">
                {graphModel ? (
                  <GraphVisualizer
                    automaton={graphModel}
                    activeNode={activeNodes}
                    activeEdge={activeEdge}
                    rejectNodes={rejectNodes}
                  />
                ) : (
                  <div className="graph-empty">Unable to render PDA graph.</div>
                )}
              </div>

              <div className="graph-controls">
                <div className="graph-controls-input">
                  <label>Input String</label>
                  <input
                    value={definition.inputString}
                    onChange={e => setDefinition(prev => ({ ...prev, inputString: e.target.value }))}
                    placeholder="e.g. aabb"
                    className="input-str-field"
                  />
                </div>
                <div className="control-buttons">
                  <button className="btn btn-success" onClick={handleSimulate}>
                    <Play size={14} /> Simulate
                  </button>
                  <button className="btn btn-warning" onClick={handleStep}>
                    <SkipForward size={14} /> Step
                  </button>
                  <button className="btn btn-danger" onClick={handleReset}>
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
                {hasRun && (
                  <div className="step-counter">
                    Step {sim.step} / {sim.steps.length - 1}
                    {!isAtEnd && <span className="step-hint"> — click Step to advance</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Simulation Output ═════════════════════ */}
        <div className="pda-right">

          {/* Input Tape */}
          <div className="panel tape-panel">
            <h3 className="panel-header">Input Tape</h3>
            {inputStr.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>
                Enter an input string to begin.
              </p>
            ) : (
              <>
                <div className="tape-track">
                  {inputStr.split('').map((ch, i) => {
                    const cls = !hasRun
                      ? 'tape-cell'
                      : i < consumed
                        ? 'tape-cell tape-consumed'
                        : i === consumed
                          ? 'tape-cell tape-current'
                          : 'tape-cell tape-remaining';
                    return (
                      <div key={i} className={cls}>
                        <span className="tape-char">{ch}</span>
                        <span className="tape-idx">{i}</span>
                      </div>
                    );
                  })}
                  <div className={`tape-cell tape-end${hasRun && consumed >= inputStr.length ? ' tape-current' : ''}`}>
                    <span className="tape-char">⊣</span>
                    <span className="tape-idx">end</span>
                  </div>
                </div>
                {hasRun && (
                  <div className="tape-caption">
                    {consumed < inputStr.length
                      ? <>Reading <strong>'{inputStr[consumed]}'</strong> at position {consumed}</>
                      : <strong>End of input reached</strong>}
                    {' — '}Step {sim.step} of {sim.steps.length - 1}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="machine-side-panels">
            <div className="pda-state-stack-row">

                {/* Current State */}
                <div className="panel state-panel">
                  <h3 className="panel-header">Current Configuration</h3>
                  <div className="config-caption">(q, stack)</div>
                  {primary ? (
                    <div className="state-display">
                      <div className={`state-node ${
                        primary.status === 'ACCEPT' ? 'sn-accept' :
                        primary.status === 'DEAD PATH' || primary.status.includes('REJECT') ? 'sn-reject' :
                        'sn-active'
                      }`}>
                        {primary.state}
                      </div>
                      <div className={`state-status-tag ${
                        primary.status === 'ACCEPT' ? 'tag-accept' :
                        primary.status === 'DEAD PATH' || primary.status.includes('REJECT') ? 'tag-reject' :
                        'tag-active'
                      }`}>
                        {primary.status}
                      </div>
                      {current.length > 1 && (
                        <div className="parallel-badge">{current.length} parallel paths</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted" style={{ textAlign: 'center', paddingTop: 20, fontSize: 14 }}>
                      Not started
                    </div>
                  )}
                </div>

                {/* Stack Visualization */}
                <div className="panel stack-vis-panel">
                  <h3 className="panel-header">
                    <Layers size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Stack
                  </h3>
                  <div className="stack-vis">
                    {primary && primary.stack.length > 0 ? (
                      [...primary.stack].reverse().map((sym, i) => (
                        <div key={i} className={`sv-block ${i === 0 ? 'sv-top' : ''}`}>
                          <span className="sv-sym">{sym}</span>
                          {i === 0 && <span className="sv-top-label">top</span>}
                        </div>
                      ))
                    ) : (
                      <div className="sv-empty">Stack empty</div>
                    )}
                    <div className="sv-floor">⊥ bottom</div>
                  </div>
                  {primary && (
                    <div className="stack-depth">Depth: {primary.stack.length}</div>
                  )}
                </div>
            </div>
          </div>

          {/* Execution Log */}
          <div className="panel log-panel">
            <div className="log-header-row">
              <h3 className="panel-header">Execution Log</h3>
              {hasRun && isAtEnd && (
                <div className={`log-result-pill ${sim.accepted ? 'banner-accept' : 'banner-reject'}`}>
                  {sim.timedOut ? 'Timed Out' : sim.accepted ? 'Accepted' : 'Rejected'}
                </div>
              )}
            </div>
            <div className="exec-log-box">
              {!hasRun && (
                <div className="text-muted" style={{ fontSize: 13, padding: '10px 4px' }}>
                  Run a simulation to see the step-by-step trace.
                </div>
              )}
              {hasRun && sim.steps.map((configs, stepIdx) => {
                const cfg  = getPrimary(configs);
                if (!cfg) return null;
                const move   = cfg.history[cfg.history.length - 1];
                const isCur  = stepIdx === sim.step;
                const isAcc  = cfg.status === 'ACCEPT';
                const isDead = cfg.status === 'DEAD PATH' || cfg.status.includes('REJECT');
                return (
                  <div
                    key={stepIdx}
                    className={`log-row${isCur ? ' log-current' : ''}${isAcc ? ' log-accept' : ''}${isDead ? ' log-dead' : ''}`}
                    ref={isCur ? el => el?.scrollIntoView({ block: 'nearest' }) : null}
                  >
                    <span className="log-step-num">#{stepIdx}</span>
                    <span className="log-state-tag">{cfg.state}</span>
                    <span className="log-move-desc">{formatMove(move)}</span>
                    <span className="log-stack-snap">[{cfg.stack.join(' ') || '∅'}]</span>
                    {configs.length > 1 && (
                      <span className="log-paths-badge">+{configs.length - 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PdaSimulator;
