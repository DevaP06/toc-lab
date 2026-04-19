import React, { useState, useEffect } from 'react';
import { Play, SkipForward, RotateCcw } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { DFA } from '../../core/dfa';
import './DfaSimulator.css';

const DEFAULT_DFA = {
  states: 'q0, q1, q2',
  alphabet: '0, 1',
  startState: 'q0',
  acceptStates: 'q2',
  transitions: 'q0,0,q0\nq0,1,q1\nq1,0,q0\nq1,1,q2\nq2,0,q2\nq2,1,q2', 
  inputString: '110'
};

const DfaSimulator = () => {
  const [definition, setDefinition] = useState(DEFAULT_DFA);
  const [engine, setEngine] = useState(null);
  const [simulationParams, setSimulationParams] = useState({ steps: [], currentStep: -1, accepted: false });
  const [activeNode, setActiveNode] = useState(null);
  
  // Parse and configure DFA
  const loadDFA = () => {
    try {
      const statesArr = definition.states.split(',').map(s => s.trim()).filter(Boolean);
      const alphaArr = definition.alphabet.split(',').map(s => s.trim()).filter(Boolean);
      const acceptArr = definition.acceptStates.split(',').map(s => s.trim()).filter(Boolean);
      
      const transObj = {};
      const lines = definition.transitions.split('\n');
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length === 3) {
          const [from, symbol, to] = parts;
          if (!transObj[from]) transObj[from] = {};
          transObj[from][symbol] = to;
        }
      });

      const dfa = new DFA(statesArr, alphaArr, transObj, definition.startState.trim(), acceptArr);
      const validation = dfa.validate();
      if (!validation.isValid) {
        alert("DFA Definition Error: " + validation.error);
        return null;
      }
      setEngine(dfa);
      return dfa;
    } catch (e) {
      alert("Error parsing DFA definition.");
      return null;
    }
  };

  const handleRunAll = () => {
    const dfa = loadDFA();
    if (!dfa) return;

    const result = dfa.simulateStepByStep(definition.inputString.trim());
    setSimulationParams({ steps: result.steps, currentStep: result.steps.length - 1, accepted: result.accepted });
    // finalState is only set on the acceptance path; fall back to the last known state
    const lastStep = result.steps[result.steps.length - 1];
    setActiveNode(result.finalState ?? lastStep?.from ?? null);
  };

  const handleStep = () => {
    let dfa = engine;
    if (!dfa) {
      dfa = loadDFA();
      if (!dfa) return;
    }

    // First step
    if (simulationParams.currentStep === -1) {
      const result = dfa.simulateStepByStep(definition.inputString.trim());
      setSimulationParams({ steps: result.steps, currentStep: 0, accepted: result.accepted });
      setActiveNode(result.steps[0].from);
      return;
    }

    // Next steps
    if (simulationParams.currentStep < simulationParams.steps.length - 1) {
      const nextIdx = simulationParams.currentStep + 1;
      setSimulationParams(prev => ({ ...prev, currentStep: nextIdx }));
      setActiveNode(simulationParams.steps[nextIdx].from || simulationParams.steps[nextIdx].to);
    }
  };

  const handleReset = () => {
    setSimulationParams({ steps: [], currentStep: -1, accepted: false });
    setActiveNode(null);
  };

  useEffect(() => {
    loadDFA(); // Load initially to populate graph
  }, []); // eslint-disable-line

  return (
    <div className="dfa-container fade-in">
      <div className="header-section">
        <h2>DFA Simulator</h2>
        <p className="text-muted">Define a Deterministic Finite Automaton and visualize its computation step-by-step.</p>
      </div>

      <div className="simulator-grid main-container">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">DFA Definition</h3>
            
            <div className="form-group">
              <label>States (comma separated)</label>
              <input value={definition.states} onChange={e => setDefinition({...definition, states: e.target.value})} placeholder="q0, q1, q2" />
            </div>
            
            <div className="form-group">
              <label>Alphabet (comma separated)</label>
              <input value={definition.alphabet} onChange={e => setDefinition({...definition, alphabet: e.target.value})} placeholder="0, 1" />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Start State</label>
                <input value={definition.startState} onChange={e => setDefinition({...definition, startState: e.target.value})} placeholder="q0" />
              </div>
              <div className="form-group">
                <label>Accept States</label>
                <input value={definition.acceptStates} onChange={e => setDefinition({...definition, acceptStates: e.target.value})} placeholder="q2" />
              </div>
            </div>

            <div className="form-group">
               <label>Transitions (from, symbol, to) - One per line</label>
               <textarea 
                 rows="6" 
                 value={definition.transitions} 
                 onChange={e => setDefinition({...definition, transitions: e.target.value})}
                 placeholder="q0, 0, q0&#10;q0, 1, q1"
               />
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel visualization-panel">
            <h3 className="panel-header">Graph Output</h3>
            <div className="graph-box">
              <GraphVisualizer automaton={engine} activeNode={activeNode} />

              <div className="controls-overlay">
                <div className="overlay-input-group">
                  <label>Input String</label>
                  <input
                    value={definition.inputString}
                    onChange={e => setDefinition({...definition, inputString: e.target.value})}
                    placeholder="e.g. 110"
                  />
                </div>

                <div className="control-buttons">
                  <button className="btn btn-success" onClick={handleRunAll}>
                    <Play size={16} /> Run Complete
                  </button>
                  <button className="btn btn-warning" onClick={handleStep}>
                    <SkipForward size={16} /> Step
                  </button>
                  <button className="btn btn-danger" onClick={handleReset}>
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel log-panel">
            <h3 className="panel-header">Execution Trace</h3>
            {simulationParams.steps.length > 0 && simulationParams.currentStep === simulationParams.steps.length - 1 && (
              <div style={{
                padding: '12px', marginBottom: '16px', borderRadius: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold',
                backgroundColor: simulationParams.accepted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: simulationParams.accepted ? 'var(--accent-secondary)' : 'var(--error)',
                border: `1px solid ${simulationParams.accepted ? 'var(--accent-secondary)' : 'var(--error)'}`
              }} className="fade-in">
                {simulationParams.accepted ? '✅ String Accepted' : '❌ String Rejected'}
              </div>
            )}
            <div className="trace-box trace-section">
              {simulationParams.steps.length === 0 ? (
                <div className="trace-empty">▶ Run or Step to start simulation</div>
              ) : (
                <div className="trace-content">
                  {simulationParams.steps.map((step, idx) => (
                    <div key={idx} className={`trace-line ${idx === simulationParams.currentStep ? 'current' : ''} ${step.status === 'ACCEPT' ? 'success' : step.status.includes('REJECT') ? 'error' : ''}`}>
                      <span className="step-num">Step {step.step}:</span>
                      {step.symbol ? (
                        <span> <code>{step.from}</code> --(<strong>{step.symbol}</strong>)--&gt; <code>{step.to || 'DEAD'}</code></span>
                      ) : (
                        <span> <strong>{step.status}</strong> on State <code>{step.from}</code></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DfaSimulator;
