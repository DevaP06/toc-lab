import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { faToRegex } from '../algorithms/faToRegex';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import StateNode from './nodes/StateNode';
import TransitionEdge from './edges/TransitionEdge';

// ── Custom node/edge types (memoized outside component) ──────────────────
const nodeTypes = { stateNode: StateNode };
const edgeTypes = { transition: TransitionEdge };

// ── Graph helpers ──────────────────────────────────────────────────────────

function computeDefaultPosition(index, total) {
  if (total === 1) return { x: 200, y: 180 };
  const R = Math.max(150, total * 50);
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: R + 80 + R * Math.cos(angle),
    y: R + 80 + R * Math.sin(angle),
  };
}

function buildNodes(states, startState, acceptStates, prevNodes) {
  const posMap = {};
  for (const n of prevNodes) posMap[n.id] = n.position;

  return states.map((state, i) => {
    const isStart = state === startState;
    const isAccept = acceptStates.includes(state);
    let stateType = 'normal';
    if (isStart && isAccept) stateType = 'startAccept';
    else if (isStart) stateType = 'start';
    else if (isAccept) stateType = 'accept';

    return {
      id: state,
      type: 'stateNode',
      data: { label: state, stateType },
      position: posMap[state] ?? computeDefaultPosition(i, states.length),
    };
  });
}

function buildEdges(transitions) {
  const edgeMap = new Map();

  for (const [from, symbolMap] of Object.entries(transitions)) {
    for (const [sym, targets] of Object.entries(symbolMap)) {
      for (const to of targets) {
        const key = `${from}->${to}`;
        if (edgeMap.has(key)) {
          edgeMap.get(key).labels.push(sym);
        } else {
          edgeMap.set(key, { from, to, labels: [sym] });
        }
      }
    }
  }

  const edges = [];
  for (const [key, { from, to, labels }] of edgeMap) {
    const isSelfLoop = from === to;
    edges.push({
      id: key,
      source: from,
      target: to,
      type: 'transition',
      sourceHandle: isSelfLoop ? 'top-src' : undefined,
      targetHandle: isSelfLoop ? 'top' : undefined,
      data: { label: labels.join(', '), isSelfLoop },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#999',
        width: 16,
        height: 16,
      },
      style: { stroke: '#999', strokeWidth: 1.8 },
    });
  }
  return edges;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Determine whether the FA is a DFA or NFA based on its transitions.
 * An FA is a DFA if every state has exactly one target per symbol and
 * there are no ε-transitions. Otherwise it is an NFA.
 */
function classifyFA(states, transitions) {
  const allSymbols = new Set();
  for (const symbolMap of Object.values(transitions)) {
    for (const sym of Object.keys(symbolMap)) {
      if (sym === 'ε' || sym === 'epsilon') return 'NFA';
      allSymbols.add(sym);
    }
  }
  for (const state of states) {
    const symbolMap = transitions[state] || {};
    for (const sym of allSymbols) {
      const targets = symbolMap[sym] || [];
      if (targets.length !== 1) return 'NFA';
    }
  }
  return allSymbols.size > 0 ? 'DFA' : 'NFA';
}

export default function FAToRegexPlayground() {
  const navigate = useNavigate();
  // FA state
  const [states, setStates] = useState(['q0', 'q1']);
  const [startState, setStartState] = useState('q0');
  const [acceptStates, setAcceptStates] = useState(['q1']);
  const [transitions, setTransitions] = useState({ q0: { a: ['q1'] } });

  // Form inputs
  const [newStateName, setNewStateName] = useState('');
  const [transFrom, setTransFrom] = useState('q0');
  const [transSymbol, setTransSymbol] = useState('a');
  const [transTo, setTransTo] = useState('q1');

  // Result
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Mobile panel toggle
  const [showControls, setShowControls] = useState(true);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Sync FA state → graph
  useEffect(() => {
    setNodes(prev => buildNodes(states, startState, acceptStates, prev));
    setEdges(buildEdges(transitions));
  }, [states, startState, acceptStates, transitions, setNodes, setEdges]);

  // Dynamically classify the automaton as NFA or DFA
  const faType = useMemo(() => classifyFA(states, transitions), [states, transitions]);

  // ── FA mutation helpers ──

  const addState = useCallback(() => {
    const name = newStateName.trim();
    if (!name) return setError('State name cannot be empty.');
    if (states.includes(name))
      return setError(`State "${name}" already exists.`);
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name))
      return setError(
        'State name must start with a letter and contain only letters, digits, or underscores.'
      );
    setStates(prev => [...prev, name]);
    setNewStateName('');
    setError('');
    setResult(null);
  }, [newStateName, states]);

  const removeState = useCallback(
    s => {
      if (states.length <= 1)
        return setError('FA must have at least one state.');
      const remaining = states.filter(x => x !== s);
      setStates(remaining);
      if (startState === s) setStartState(remaining[0] ?? '');
      setAcceptStates(prev => prev.filter(x => x !== s));
      setTransitions(prev => {
        const updated = {};
        for (const [from, map] of Object.entries(prev)) {
          if (from === s) continue;
          const newMap = {};
          for (const [sym, targets] of Object.entries(map)) {
            const filtered = targets.filter(t => t !== s);
            if (filtered.length > 0) newMap[sym] = filtered;
          }
          if (Object.keys(newMap).length > 0) updated[from] = newMap;
        }
        return updated;
      });
      if (transFrom === s) setTransFrom(remaining[0] ?? '');
      if (transTo === s) setTransTo(remaining[0] ?? '');
      setError('');
      setResult(null);
    },
    [states, startState, transFrom, transTo]
  );

  const toggleAccept = useCallback(s => {
    setAcceptStates(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
    setResult(null);
  }, []);

  const addTransition = useCallback(() => {
    if (!transFrom || !transTo) return setError('Select from and to states.');
    const sym = transSymbol.trim();
    if (!sym) return setError('Symbol cannot be empty.');
    if (sym.length !== 1)
      return setError('Symbol must be exactly one character (e.g. a, b, 0).');
    setTransitions(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[transFrom]) updated[transFrom] = {};
      if (!updated[transFrom][sym]) updated[transFrom][sym] = [];
      if (!updated[transFrom][sym].includes(transTo)) {
        updated[transFrom][sym] = [...updated[transFrom][sym], transTo];
      }
      return updated;
    });
    setError('');
    setResult(null);
  }, [transFrom, transSymbol, transTo]);

  const removeTransition = useCallback((from, sym, to) => {
    setTransitions(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[from]?.[sym]) return prev;
      const newTargets = updated[from][sym].filter(t => t !== to);
      if (newTargets.length === 0) {
        delete updated[from][sym];
        if (Object.keys(updated[from]).length === 0) delete updated[from];
      } else {
        updated[from][sym] = newTargets;
      }
      return updated;
    });
    setResult(null);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!startState) return setError('Set a start state first.');
    if (acceptStates.length === 0)
      return setError('Add at least one accept state.');
    const regex = faToRegex({ states, transitions, startState, acceptStates });
    setResult(regex);
    setError('');
  }, [states, transitions, startState, acceptStates]);

  // Build flat transition list for display
  const transitionList = [];
  for (const [from, symbolMap] of Object.entries(transitions)) {
    for (const [sym, targets] of Object.entries(symbolMap)) {
      for (const to of targets) {
        transitionList.push({ from, sym, to });
      }
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-nav">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            ← Home
          </Button>
          <div className="app-nav-right">
            <button
              className="fa-panel-toggle"
              onClick={() => setShowControls(v => !v)}
              aria-label="Toggle controls panel"
            >
              {showControls ? '⚙️ Hide Panel' : '⚙️ Show Panel'}
            </button>
            <ThemeToggle />
          </div>
        </div>
        <h1 className="app-title">FA → Regex Converter</h1>
        <p className="app-subtitle">
          Build a finite automaton and generate its regular expression
        </p>
      </header>

      <main className="fa-regex-layout">
        {/* ── Left controls panel ── */}
        <aside className={`fa-controls-panel panel ${showControls ? '' : 'fa-controls-hidden'}`}>
          {/* States */}
          <section className="fa-section">
            <h3 className="fa-section-title">States</h3>

            <div className="fa-add-row">
              <input
                className="fa-input"
                value={newStateName}
                onChange={e => setNewStateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addState()}
                placeholder="e.g. q2"
                aria-label="New state name"
              />
              <Button size="sm" onClick={addState}>
                Add
              </Button>
            </div>

            <ul className="fa-state-list">
              {states.map(s => (
                <li key={s} className="fa-state-item">
                  <span className="fa-state-name">{s}</span>
                  <div className="fa-state-actions">
                    <button
                      className={`fa-badge-btn ${startState === s ? 'active-start' : ''}`}
                      onClick={() => {
                        setStartState(s);
                        setResult(null);
                      }}
                      title="Set as start state"
                    >
                      {startState === s ? '→ Start' : 'Start'}
                    </button>
                    <button
                      className={`fa-badge-btn ${acceptStates.includes(s) ? 'active-accept' : ''}`}
                      onClick={() => toggleAccept(s)}
                      title="Toggle accept state"
                    >
                      {acceptStates.includes(s) ? '★ Accept' : 'Accept'}
                    </button>
                    <button
                      className="fa-remove-btn"
                      onClick={() => removeState(s)}
                      title={`Remove state ${s}`}
                      aria-label={`Remove state ${s}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Transitions */}
          <section className="fa-section">
            <h3 className="fa-section-title">Transitions</h3>

            <div className="fa-transition-form">
              <select
                className="fa-select"
                value={transFrom}
                onChange={e => setTransFrom(e.target.value)}
                aria-label="From state"
              >
                {states.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <input
                className="fa-input fa-symbol-input"
                value={transSymbol}
                onChange={e => setTransSymbol(e.target.value)}
                maxLength={1}
                placeholder="a"
                aria-label="Transition symbol"
              />

              <select
                className="fa-select"
                value={transTo}
                onChange={e => setTransTo(e.target.value)}
                aria-label="To state"
              >
                {states.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <Button size="sm" onClick={addTransition}>
                Add
              </Button>
            </div>

            {transitionList.length > 0 && (
              <ul className="fa-transition-list">
                {transitionList.map(({ from, sym, to }, i) => (
                  <li key={i} className="fa-transition-item">
                    <span className="fa-transition-label">
                      <span className="fa-trans-state">{from}</span>
                      <span className="fa-trans-arrow">
                        &nbsp;─<sup>{sym}</sup>→&nbsp;
                      </span>
                      <span className="fa-trans-state">{to}</span>
                    </span>
                    <button
                      className="fa-remove-btn"
                      onClick={() => removeTransition(from, sym, to)}
                      aria-label={`Remove transition ${from} -${sym}-> ${to}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Error */}
          {error && <p className="error-message">{error}</p>}

          {/* Generate */}
          <Button className="fa-generate-btn" onClick={handleGenerate}>
            Generate Regex ✦
          </Button>

          {/* Result */}
          {result !== null && (
            <div className="fa-result">
              <span className="fa-result-label">Generated Regex:</span>
              <span className="fa-result-value">{result}</span>
            </div>
          )}
        </aside>

        {/* ── Right: graph ── */}
        <section className="panel fa-graph-panel">
          <h2 className="panel-title">
            FA Graph
            <span className="panel-title-legend">
              <span className="legend-dot legend-start"></span> Start
              <span className="legend-dot legend-accept"></span> Accept
              <span className="legend-dot legend-normal"></span> Normal
            </span>
          </h2>
          {states.length > 0 && (
            <div className="fa-state-info">
              <span className="fa-state-info-item fa-info-start">
                ▶ Start: <strong>{startState || '—'}</strong>
              </span>
              <span className="fa-state-info-item fa-info-accept">
                ★ Accept: <strong>{acceptStates.length > 0 ? acceptStates.join(', ') : '—'}</strong>
              </span>
              <span className="fa-state-info-item fa-info-type">
                Type: <strong>{faType}</strong>
              </span>
            </div>
          )}
          <div className="panel-content">
            {states.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <span className="text-3xl" role="img" aria-label="Graph">
                  📊
                </span>
                <span className="text-sm font-medium">
                  Add states to visualise the automaton.
                </span>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1.4 }}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-left"
              >
                <Background color="#d0d0d0" gap={24} size={1.5} variant="dots" />
                <Controls showInteractive={false} />
              </ReactFlow>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
