import React, { useState } from 'react';
import { Play, SkipForward, RotateCcw } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { getTMPreset, BLANK_SYMBOL } from '../../core/turingMachine';
import './TuringMachineSimulator.css';

const PRESET_OPTIONS = [
  {
    value: 'BINARY_INCREMENT',
    label: 'Binary Increment Machine',
    description: 'Scans right to the blank, then propagates carry to increment a binary number by 1.'
  },
  {
    value: 'EVEN_ONES',
    label: 'Even number of 1s',
    description: 'Tracks parity of 1s while reading the tape and accepts only if the count is even.'
  },
  {
    value: 'REPLACE_1_WITH_0',
    label: 'Replace 1 with 0',
    description: 'Single-pass rewrite machine that converts every 1 on tape into 0.'
  },
  {
    value: 'PALINDROME',
    label: 'Palindrome checker',
    description: 'Marks matching outer characters and verifies the tape reads the same in both directions.'
  }
];

const DEFAULT_PRESET = 'BINARY_INCREMENT';

const getPresetEdges = (machine) => Object.entries(machine?.transitions || {}).flatMap(([from, bySymbol]) => (
  Object.entries(bySymbol).map(([read, transition]) => ({
    from,
    to: transition.next,
    read,
    write: transition.write,
    move: transition.move
  }))
));

const getPresetDefinition = (selection) => {
  const preset = getTMPreset(selection);
  const option = PRESET_OPTIONS.find(item => item.value === selection);

  return {
    selectedPreset: selection,
    presetLabel: preset.label,
    inputString: preset.inputString,
    machine: preset.machine,
    presetDescription: option?.description || ''
  };
};

const buildGraphData = (machine, edges) => {
  if (!machine) return null;

  const edgeMap = new Map();

  edges.forEach(({ from, to, read, write, move }) => {
    const key = `${from}->${to}`;
    const label = `${read} → ${write}, ${move}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key).labels.push(label);
    } else {
      edgeMap.set(key, { from, to, labels: [label] });
    }
  });

  return {
    states: Array.from(machine.states),
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
  const [graphEdges, setGraphEdges] = useState(getPresetEdges(initialPreset.machine));
  const [simulation, setSimulation] = useState({ steps: [], currentStep: -1, accepted: false, timedOut: false });
  const [resultSummary, setResultSummary] = useState({
    status: 'Ready',
    reason: 'Select a predefined Turing Machine and run it on your input.',
  });
  const [runtime, setRuntime] = useState(null);
  const [activeNode, setActiveNode] = useState(initialPreset.machine ? initialPreset.machine.startState : null);
  const [activeEdge, setActiveEdge] = useState(null);

  const setField = (key, value) => {
    setDefinition(prev => ({ ...prev, [key]: value }));
  };

  const handlePresetChange = (selection) => {
    const preset = getPresetDefinition(selection);
    setDefinition(preset);
    setEngine(preset.machine);
    setGraphEdges(getPresetEdges(preset.machine));
    setSimulation({ steps: [], currentStep: -1, accepted: false, timedOut: false });
    setResultSummary({
      status: 'Ready',
      reason: 'Select a predefined Turing Machine and run it on your input.',
    });
    setRuntime(null);
    setActiveNode(preset.machine.startState);
    setActiveEdge(null);
  };

  const handleResetInputToPreset = () => {
    const preset = getTMPreset(definition.selectedPreset);
    setDefinition(prev => ({ ...prev, inputString: preset.inputString }));
  };

  const handleSimulate = () => {
    const machine = engine;
    if (!machine) return;

    try {
      const result = machine.simulateStepByStep(definition.inputString.trim());
      const lastIndex = result.allSteps.length - 1;
      const lastSnapshot = result.allSteps[lastIndex];

      setSimulation({
        steps: result.allSteps,
        currentStep: lastIndex,
        accepted: result.accepted,
        timedOut: result.timedOut,
      });
      setRuntime(null);
      setActiveNode(lastSnapshot?.state || machine.startState);
      setActiveEdge(lastSnapshot?.transition ? { from: lastSnapshot.transition.from, to: lastSnapshot.transition.next } : null);
      setResultSummary({
        status: result.timedOut ? 'Timed Out' : result.accepted ? 'Accepted' : 'Rejected',
        reason: getResultReason(result)
      });
    } catch (err) {
      setResultSummary({
        status: 'Rejected',
        reason: err?.message || 'Unable to simulate this input.'
      });
      setSimulation({ steps: [], currentStep: -1, accepted: false, timedOut: false });
      setRuntime(null);
      setActiveNode(machine.startState);
      setActiveEdge(null);
    }
  };

  const handleStep = () => {
    const machine = engine;
    if (!machine) return;

    const runSingleTransition = (currentRuntime, stepNumber) => {
      const tape = [...currentRuntime.tape];
      let head = currentRuntime.head;
      let state = currentRuntime.state;

      while (head < 0) {
        tape.unshift(BLANK_SYMBOL);
        head += 1;
      }

      while (head >= tape.length) {
        tape.push(BLANK_SYMBOL);
      }

      const readSymbol = tape[head] || BLANK_SYMBOL;
      const transition = machine.getTransition(state, readSymbol);

      if (!transition) {
        return {
          snapshot: {
            step: stepNumber,
            state,
            tape: [...tape],
            head,
            readSymbol,
            action: `No transition for (${state}, ${readSymbol})`,
            status: 'REJECT',
            transition: null
          },
          nextRuntime: {
            tape,
            head,
            state,
            halted: true,
            accepted: false,
            timedOut: false
          }
        };
      }

      const previousState = state;
      const { write, move, next } = transition;
      tape[head] = write;

      if (move === 'L') {
        head -= 1;
      } else if (move === 'R') {
        head += 1;
      }

      while (head < 0) {
        tape.unshift(BLANK_SYMBOL);
        head += 1;
      }

      while (head >= tape.length) {
        tape.push(BLANK_SYMBOL);
      }

      state = next;
      const status = state === machine.acceptState
        ? 'ACCEPT'
        : state === machine.rejectState
          ? 'REJECT'
          : 'ACTIVE';

      return {
        snapshot: {
          step: stepNumber,
          state,
          tape: [...tape],
          head,
          readSymbol,
          action: `(${previousState}, ${readSymbol}) → (${next}, ${write}, ${move})`,
          status,
          transition: { from: previousState, read: readSymbol, write, move, next }
        },
        nextRuntime: {
          tape,
          head,
          state,
          halted: status === 'ACCEPT' || status === 'REJECT',
          accepted: status === 'ACCEPT',
          timedOut: false
        }
      };
    };

    if (simulation.currentStep === -1) {
      const input = definition.inputString.trim();

      for (const ch of input) {
        if (!machine.tapeAlphabet.has(ch)) {
          setResultSummary({
            status: 'Rejected',
            reason: `Invalid symbol "${ch}" in input`
          });
          return;
        }
      }

      const tape = input.length > 0 ? input.split('') : [];
      if (tape.length === 0 || tape[tape.length - 1] !== BLANK_SYMBOL) {
        tape.push(BLANK_SYMBOL);
      }

      const initialRuntime = {
        tape,
        head: 0,
        state: machine.startState,
        halted: false,
        accepted: false,
        timedOut: false
      };

      const initialSnapshot = {
        step: 0,
        state: machine.startState,
        tape: [...tape],
        head: 0,
        readSymbol: tape[0] || BLANK_SYMBOL,
        action: 'Initial configuration',
        status: 'START',
        transition: null
      };

      if (machine.startState === machine.acceptState || machine.startState === machine.rejectState) {
        const terminalStatus = machine.startState === machine.acceptState ? 'ACCEPT' : 'REJECT';
        const terminalSnapshot = { ...initialSnapshot, status: terminalStatus };
        setSimulation({
          steps: [terminalSnapshot],
          currentStep: 0,
          accepted: terminalStatus === 'ACCEPT',
          timedOut: false,
        });
        setRuntime({ ...initialRuntime, halted: true, accepted: terminalStatus === 'ACCEPT' });
        setActiveNode(terminalSnapshot.state);
        setActiveEdge(null);
        setResultSummary({
          status: terminalStatus === 'ACCEPT' ? 'Accepted' : 'Rejected',
          reason: terminalStatus === 'ACCEPT'
            ? 'The machine halted in the accept state.'
            : 'The machine halted in the reject state.'
        });
        return;
      }

      const firstTransitionResult = runSingleTransition(initialRuntime, 1);
      const firstStep = firstTransitionResult.snapshot;
      const stepped = [initialSnapshot, firstStep];

      setSimulation({
        steps: stepped,
        currentStep: 1,
        accepted: firstStep.status === 'ACCEPT',
        timedOut: false,
      });
      setRuntime(firstTransitionResult.nextRuntime);
      setActiveNode(firstStep?.state || machine.startState);
      setActiveEdge(firstStep?.transition
        ? { from: firstStep.transition.from, to: firstStep.transition.next }
        : null);
      setResultSummary({
        status: firstStep.status === 'ACCEPT' ? 'Accepted' : firstStep.status === 'REJECT' ? 'Rejected' : 'Running',
        reason: firstStep.status === 'ACCEPT'
          ? 'The machine halted in the accept state.'
          : firstStep.status === 'REJECT'
            ? firstStep.action
            : 'Use Step to move through the machine one transition at a time.'
      });
      return;
    }

    if (!runtime || runtime.halted) {
      return;
    }

    const transitionSteps = simulation.steps.length - 1;
    if (transitionSteps >= machine.maxSteps) {
      const timeoutSnapshot = {
        step: simulation.steps.length,
        state: runtime.state,
        tape: [...runtime.tape],
        head: runtime.head,
        readSymbol: runtime.tape[runtime.head] || BLANK_SYMBOL,
        action: `Step limit exceeded (${machine.maxSteps})`,
        status: 'TIMEOUT',
        transition: null
      };

      setSimulation(prev => ({
        ...prev,
        steps: [...prev.steps, timeoutSnapshot],
        currentStep: prev.steps.length,
        timedOut: true
      }));
      setRuntime({ ...runtime, halted: true, timedOut: true });
      setActiveNode(timeoutSnapshot.state);
      setActiveEdge(null);
      setResultSummary({
        status: 'Timed Out',
        reason: 'Step limit exceeded. The machine may be looping.'
      });
      return;
    }

    const nextResult = runSingleTransition({
      tape: [...runtime.tape],
      head: runtime.head,
      state: runtime.state
    }, simulation.steps.length);
    const nextSnapshot = nextResult.snapshot;

    setSimulation(prev => ({
      ...prev,
      steps: [...prev.steps, nextSnapshot],
      currentStep: prev.steps.length,
      accepted: nextSnapshot.status === 'ACCEPT' ? true : prev.accepted
    }));
    setRuntime(nextResult.nextRuntime);
    setActiveNode(nextSnapshot?.state || machine.startState);
    setActiveEdge(nextSnapshot?.transition ? { from: nextSnapshot.transition.from, to: nextSnapshot.transition.next } : null);

    if (nextSnapshot.status === 'ACCEPT') {
      setResultSummary({
        status: 'Accepted',
        reason: 'The machine halted in the accept state.'
      });
      return;
    }

    if (nextSnapshot.status === 'REJECT') {
      setResultSummary({
        status: 'Rejected',
        reason: nextSnapshot.action
      });
    }
  };

  const handleReset = () => {
    setSimulation({ steps: [], currentStep: -1, accepted: false, timedOut: false });
    setResultSummary({ status: 'Ready', reason: 'Select a predefined Turing Machine and run it on your input.' });
    setRuntime(null);
    setActiveNode(engine?.startState || null);
    setActiveEdge(null);
  };

  const graphData = buildGraphData(engine, graphEdges);

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
            Select a predefined Turing Machine and run it on your input.
          </p>
        </div>
      </div>

      <div className="tm-main-grid">
        <div className="tm-left">
          <div className="panel tm-config-panel">
            <h3 className="panel-header">Preset Machine</h3>

            <div className="form-group">
              <label>Preset Machine</label>
              <select value={definition.selectedPreset} onChange={e => handlePresetChange(e.target.value)}>
                {PRESET_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <p className="tm-preset-description">{definition.presetDescription}</p>
          </div>

          <div className="panel tm-controls-panel">
            <h3 className="panel-header">Execution Controls</h3>
            <div className="form-group">
              <label>Input String</label>
              <input
                value={definition.inputString}
                onChange={e => setField('inputString', e.target.value)}
                placeholder="Enter input for the selected preset"
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

            <div className="control-buttons tm-secondary-controls">
              <button className="btn btn-secondary" onClick={handleResetInputToPreset}>
                Reset to preset input
              </button>
            </div>

            <div className="tm-status-strip">
              <div className="tm-status-item"><span className="tm-label">Step</span><span className="tm-value">{simulation.currentStep >= 0 ? simulation.currentStep : '-'}</span></div>
              <div className="tm-status-item"><span className="tm-label">State</span><span className="tm-value">{currentSnapshot?.state || engine?.startState || '-'}</span></div>
              <div className="tm-status-item"><span className="tm-label">Symbol</span><span className="tm-value">{currentSymbol}</span></div>
              <div className="tm-status-item"><span className="tm-label">Action</span><span className="tm-value tm-action">{currentSnapshot?.action || 'Not started'}</span></div>
            </div>
          </div>
        </div>

        <div className="tm-right">
          <div className="panel tm-diagram-panel">
            <h3 className="panel-header">State Diagram</h3>
            <div className="tm-diagram-canvas">
              <GraphVisualizer
                automaton={graphData}
                activeNode={activeNode}
                activeEdge={activeEdge}
                rejectNodes={rejectNodes}
              />
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
                {currentSnapshot?.state || engine?.startState || '-'}
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
        </div>
      </div>
    </div>
  );
};

export default TuringMachineSimulator;
