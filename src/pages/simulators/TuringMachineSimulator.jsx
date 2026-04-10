import React, { useState } from 'react';
import { Play, SkipForward, RotateCcw, Layers, Settings2 } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { TuringMachine, getTMPreset, BLANK_SYMBOL } from '../../core/turingMachine';
import './TuringMachineSimulator.css';

const PRESET_OPTIONS = [
  { value: 'BINARY_INCREMENT', label: 'Binary Increment Machine' },
  { value: 'EVEN_ONES', label: 'Even number of 1s' },
  { value: 'REPLACE_1_WITH_0', label: 'Replace 1 with 0' },
  { value: 'PALINDROME', label: 'Palindrome checker' }
];

const DEFAULT_PRESET = 'BINARY_INCREMENT';

const getPresetDefinition = (selection) => {
  const preset = getTMPreset(selection);
  return {
    selectedPreset: selection,
    presetLabel: preset.label,
    machine: preset.machine,
    ...preset.definition,
  };
};

const parseTransitions = (text) => {
  const transitions = {};
  const edges = [];
  const errors = [];

  text.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const arrowMatch = line.includes('→') ? line.split('→') : line.split('->');
    if (arrowMatch.length !== 2) {
      errors.push(`Line ${index + 1}: expected format "q0,1 → q1,1,R".`);
      return;
    }

    const leftParts = arrowMatch[0].split(',').map(part => part.trim()).filter(Boolean);
    const rightParts = arrowMatch[1].split(',').map(part => part.trim()).filter(Boolean);

    if (leftParts.length !== 2 || rightParts.length !== 3) {
      errors.push(`Line ${index + 1}: invalid transition format.`);
      return;
    }

    const [from, read] = leftParts;
    const [next, write, move] = rightParts;
    const normalizedMove = move.toUpperCase();

    if (!transitions[from]) transitions[from] = {};
    transitions[from][read] = { write, move: normalizedMove, next };
    edges.push({ from, to: next, read, write, move: normalizedMove });
  });

  return { transitions, edges, errors };
};

const buildGraphData = (machine, parsedEdges) => {
  if (!machine) return null;

  const edgeMap = new Map();

  parsedEdges.forEach(({ from, to, read, write, move }) => {
    const key = `${from}->${to}`;
    const label = `${read} → ${write}, ${move}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key).labels.push(label);
    } else {
      edgeMap.set(key, { from, to, labels: [label] });
    }
  });

  return {
    states: machine.states,
    edges: Array.from(edgeMap.values()).map(({ from, to, labels }) => ({
      from,
      to,
      label: labels.join('\n')
    })),
    startState: machine.startState,
    acceptStates: new Set([machine.acceptState])
  };
};

const getPrimarySnapshot = (steps, currentStep) => {
  if (!steps.length || currentStep < 0) return null;
  return steps[currentStep] || null;
};

const getResultReason = (result) => {
  if (result.timedOut) {
    return 'Step limit exceeded. The machine may be looping.';
  }

  if (result.accepted) {
    return 'The machine halted in the accept state.';
  }

  const last = result.finalConfig;
  if (last?.action?.startsWith('No transition')) {
    return last.action;
  }

  if (last?.state) {
    return `Machine halted in state ${last.state}.`;
  }

  return 'The machine rejected the input.';
};

const TuringMachineSimulator = () => {
  const initialPreset = getPresetDefinition(DEFAULT_PRESET);
  const [definition, setDefinition] = useState(initialPreset);
  const [engine, setEngine] = useState(initialPreset.machine);
  const [parsedEdges, setParsedEdges] = useState([]);
  const [simulation, setSimulation] = useState({ steps: [], currentStep: -1, accepted: false, timedOut: false });
  const [resultSummary, setResultSummary] = useState({
    status: 'Ready',
    reason: 'Choose a preset and run the machine.',
  });
  const [activeNode, setActiveNode] = useState(initialPreset.machine ? initialPreset.machine.startState : null);
  const [activeEdge, setActiveEdge] = useState(null);

  const setField = (key, value) => {
    setDefinition(prev => ({ ...prev, [key]: value }));
  };

  const parseMachine = () => {
    try {
      const statesArr = definition.states.split(',').map(item => item.trim()).filter(Boolean);
      const tapeAlphabetArr = definition.tapeAlphabet.split(',').map(item => item.trim()).filter(Boolean);
      const parsed = parseTransitions(definition.transitions);

      if (parsed.errors.length > 0) {
        alert(parsed.errors.join('\n'));
        return null;
      }

      const machine = new TuringMachine(
        statesArr,
        tapeAlphabetArr,
        definition.startState.trim(),
        definition.acceptState.trim(),
        definition.rejectState.trim(),
        parsed.transitions
      );

      const validation = machine.validate();
      if (!validation.isValid) {
        alert('Turing Machine Error: ' + validation.error);
        return null;
      }

      setEngine(machine);
      setParsedEdges(parsed.edges);
      return machine;
    } catch (error) {
      alert('Error parsing Turing Machine definition.');
      return null;
    }
  };

  const handlePresetChange = (selection) => {
    const preset = getPresetDefinition(selection);
    setDefinition(preset);
    setEngine(preset.machine);
    setParsedEdges(Object.entries(preset.machine.transitions).flatMap(([from, bySymbol]) => (
      Object.entries(bySymbol).map(([read, transition]) => ({
        from,
        to: transition.next,
        read,
        write: transition.write,
        move: transition.move
      }))
    )));
    setSimulation({ steps: [], currentStep: -1, accepted: false, timedOut: false });
    setResultSummary({
      status: 'Ready',
      reason: 'Choose a preset and run the machine.',
    });
    setActiveNode(preset.machine.startState);
    setActiveEdge(null);
  };

  const handleSimulate = () => {
    const machine = parseMachine();
    if (!machine) return;

    const result = machine.simulateStepByStep(definition.inputString.trim());
    const lastIndex = result.allSteps.length - 1;
    const lastSnapshot = result.allSteps[lastIndex];

    setSimulation({
      steps: result.allSteps,
      currentStep: lastIndex,
      accepted: result.accepted,
      timedOut: result.timedOut,
    });
    setActiveNode(lastSnapshot?.state || machine.startState);
    setActiveEdge(lastSnapshot?.transition ? { from: lastSnapshot.transition.from, to: lastSnapshot.transition.next } : null);
    setResultSummary({
      status: result.timedOut ? 'Timed Out' : result.accepted ? 'Accepted' : 'Rejected',
      reason: getResultReason(result)
    });
  };

  const handleStep = () => {
    let machine = engine;
    if (!machine) {
      machine = parseMachine();
      if (!machine) return;
    }

    if (simulation.currentStep === -1) {
      const result = machine.simulateStepByStep(definition.inputString.trim());
      setSimulation({
        steps: result.allSteps,
        currentStep: 0,
        accepted: result.accepted,
        timedOut: result.timedOut,
      });

      const first = result.allSteps[0];
      setActiveNode(first?.state || machine.startState);
      setActiveEdge(first?.transition ? { from: first.transition.from, to: first.transition.next } : null);
      setResultSummary({
        status: result.timedOut ? 'Timed Out' : result.accepted ? 'Accepted' : 'Running',
        reason: result.timedOut ? getResultReason(result) : 'Use Step to move through the machine one transition at a time.'
      });
      return;
    }

    if (simulation.currentStep < simulation.steps.length - 1) {
      const nextStep = simulation.currentStep + 1;
      const snapshot = simulation.steps[nextStep];
      setSimulation(prev => ({ ...prev, currentStep: nextStep }));
      setActiveNode(snapshot?.state || machine.startState);
      setActiveEdge(snapshot?.transition ? { from: snapshot.transition.from, to: snapshot.transition.next } : null);

      if (nextStep === simulation.steps.length - 1) {
        setResultSummary({
          status: simulation.accepted ? 'Accepted' : snapshot?.status === 'REJECT' ? 'Rejected' : snapshot?.status || 'Running',
          reason: simulation.accepted ? 'The machine halted in the accept state.' : getResultReason({ ...simulation, finalConfig: snapshot })
        });
      }
    }
  };

  const handleReset = () => {
    setSimulation({ steps: [], currentStep: -1, accepted: false, timedOut: false });
    setResultSummary({ status: 'Ready', reason: 'Choose a preset and run the machine.' });
    setActiveNode(engine?.startState || definition.startState);
    setActiveEdge(null);
  };

  const graphData = buildGraphData(engine, parsedEdges.length ? parsedEdges : Object.entries(engine?.transitions || {}).flatMap(([from, bySymbol]) => (
    Object.entries(bySymbol).map(([read, transition]) => ({
      from,
      to: transition.next,
      read,
      write: transition.write,
      move: transition.move
    }))
  )));

  const currentSnapshot = getPrimarySnapshot(simulation.steps, simulation.currentStep);
  const tape = currentSnapshot?.tape || [];
  const head = currentSnapshot?.head ?? 0;
  const currentSymbol = tape[head] ?? BLANK_SYMBOL;
  const hasRun = simulation.steps.length > 0;
  const isAtEnd = hasRun && simulation.currentStep === simulation.steps.length - 1;
  const rejectNodes = currentSnapshot && (currentSnapshot.status === 'REJECT' || currentSnapshot.status === 'TIMEOUT')
    ? [currentSnapshot.state]
    : [];

  return (
    <div className="tm-page fade-in">
      <div className="tm-header">
        <div>
          <h2>Turing Machine Simulator</h2>
          <p className="text-muted">
            Select a preset machine, enter an input string, and inspect tape movement step by step.
          </p>
        </div>
      </div>

      <div className="tm-main-grid">
        <div className="tm-left">
          <div className="panel tm-config-panel">
            <h3 className="panel-header">
              <Settings2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Machine Configuration
            </h3>

            <div className="form-group">
              <label>Preset Machine</label>
              <select value={definition.selectedPreset} onChange={e => handlePresetChange(e.target.value)}>
                {PRESET_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>States</label>
              <input value={definition.states} onChange={e => setField('states', e.target.value)} placeholder="q0, q1, qa, qr" />
            </div>

            <div className="tm-field-row">
              <div className="form-group">
                <label>Tape Alphabet</label>
                <input value={definition.tapeAlphabet} onChange={e => setField('tapeAlphabet', e.target.value)} placeholder="0, 1, _" />
              </div>
              <div className="form-group">
                <label>Start State</label>
                <input value={definition.startState} onChange={e => setField('startState', e.target.value)} placeholder="q0" />
              </div>
            </div>

            <div className="tm-field-row">
              <div className="form-group">
                <label>Accept State</label>
                <input value={definition.acceptState} onChange={e => setField('acceptState', e.target.value)} placeholder="qa" />
              </div>
              <div className="form-group">
                <label>Reject State</label>
                <input value={definition.rejectState} onChange={e => setField('rejectState', e.target.value)} placeholder="qr" />
              </div>
            </div>

            <div className="form-group">
              <label>
                Transitions
                <span className="field-hint">from,read → next,write,move — one per line</span>
              </label>
              <textarea
                rows={10}
                value={definition.transitions}
                onChange={e => setField('transitions', e.target.value)}
                placeholder={`q0,1 → q0,1,R\nq0,_ → qa,_,S`}
              />
            </div>
          </div>
        </div>

        <div className="tm-right">
          <div className="panel tm-controls-panel">
            <h3 className="panel-header">Execution Controls</h3>
            <div className="form-group">
              <label>Input String</label>
              <input
                value={definition.inputString}
                onChange={e => setField('inputString', e.target.value)}
                placeholder="Enter binary input or tape symbols"
              />
            </div>

            <div className="control-buttons">
              <button className="btn btn-success" onClick={handleSimulate}>
                <Play size={16} /> Simulate
              </button>
              <button className="btn btn-warning" onClick={handleStep}>
                <SkipForward size={16} /> Step
              </button>
              <button className="btn btn-danger" onClick={handleReset}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            <div className="tm-status-strip">
              <div className="tm-status-item"><span className="tm-label">Step</span><span className="tm-value">{simulation.currentStep >= 0 ? simulation.currentStep : '-'}</span></div>
              <div className="tm-status-item"><span className="tm-label">State</span><span className="tm-value">{currentSnapshot?.state || definition.startState}</span></div>
              <div className="tm-status-item"><span className="tm-label">Symbol</span><span className="tm-value">{currentSymbol}</span></div>
              <div className="tm-status-item"><span className="tm-label">Action</span><span className="tm-value tm-action">{currentSnapshot?.action || 'Not started'}</span></div>
            </div>
          </div>

          <div className={`tm-result-banner ${resultSummary.status === 'Accepted' ? 'banner-accept' : resultSummary.status === 'Rejected' ? 'banner-reject' : resultSummary.status === 'Timed Out' ? 'banner-timeout' : ''}`}>
            <div className="tm-result-title">{resultSummary.status === 'Accepted' ? '✅ Accepted' : resultSummary.status === 'Rejected' ? '❌ Rejected' : resultSummary.status === 'Timed Out' ? '⏳ Timed Out' : 'Ready'}</div>
            <div className="tm-result-detail">
              <div><strong>Selected Machine:</strong> {definition.presetLabel}</div>
              <div><strong>Input:</strong> {definition.inputString || BLANK_SYMBOL}</div>
              <div><strong>Reason:</strong> {resultSummary.reason}</div>
            </div>
          </div>

          <div className="panel tm-tape-panel">
            <h3 className="panel-header">Tape Visualization</h3>
            {!hasRun ? (
              <p className="text-muted">Run the simulation to see the tape update step by step.</p>
            ) : (
              <div className="tm-tape-scroll">
                <div className="tm-tape-row">
                  {tape.map((cell, index) => {
                    const isHead = index === head;
                    const isConsumed = index < head;
                    const isRemaining = index > head;
                    return (
                      <div
                        key={`${index}-${cell}`}
                        className={`tm-tape-cell ${isHead ? 'tm-head' : ''} ${isConsumed ? 'tm-consumed' : ''} ${isRemaining ? 'tm-remaining' : ''}`}
                      >
                        {isHead && <span className="tm-head-marker">^</span>}
                        <span className="tm-cell-symbol">{cell}</span>
                        <span className="tm-cell-index">{index}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="tm-tape-caption">
                  Head position: {head} | Current symbol: {currentSymbol} | {currentSnapshot?.action || 'Initial configuration'}
                </div>
              </div>
            )}
          </div>

          <div className="tm-state-row">
            <div className="panel tm-state-panel">
              <h3 className="panel-header">Current State</h3>
              <div className={`tm-state-bubble ${currentSnapshot?.status === 'ACCEPT' ? 'state-accept' : currentSnapshot?.status === 'REJECT' || currentSnapshot?.status === 'TIMEOUT' ? 'state-reject' : 'state-active'}`}>
                {currentSnapshot?.state || definition.startState}
              </div>
              <div className="tm-state-meta">
                <div><span className="tm-label">Head</span><span className="tm-value">{head}</span></div>
                <div><span className="tm-label">Status</span><span className="tm-value">{currentSnapshot?.status || 'START'}</span></div>
              </div>
            </div>

            <div className="panel tm-log-panel">
              <h3 className="panel-header">Execution Log</h3>
              <div className="tm-log-box">
                {!hasRun && <div className="text-muted">No simulation started.</div>}
                {hasRun && simulation.steps.map((step, index) => {
                  const isCurrent = index === simulation.currentStep;
                  return (
                    <div key={index} className={`tm-log-line ${isCurrent ? 'current' : ''} ${step.status === 'ACCEPT' ? 'accept' : step.status === 'REJECT' || step.status === 'TIMEOUT' ? 'reject' : ''}`}>
                      <span className="tm-log-step">Step {step.step}</span>
                      <span className="tm-log-action">{step.action}</span>
                      <span className="tm-log-state">{step.state}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {hasRun && isAtEnd && (
            <div className={`tm-result-footer ${simulation.accepted ? 'footer-accept' : simulation.timedOut ? 'footer-timeout' : 'footer-reject'} fade-in`}>
              {simulation.accepted ? 'Machine accepted the input.' : simulation.timedOut ? 'Machine timed out during simulation.' : 'Machine rejected the input.'}
            </div>
          )}

          <div className="panel tm-diagram-panel" style={{ height: 340, display: 'flex', flexDirection: 'column' }}>
            <h3 className="panel-header">State Diagram</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <GraphVisualizer
                automaton={graphData}
                activeNode={activeNode}
                activeEdge={activeEdge}
                rejectNodes={rejectNodes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TuringMachineSimulator;