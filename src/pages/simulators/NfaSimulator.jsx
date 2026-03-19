import React, { useState, useEffect } from 'react';
import { Play, SkipForward, RotateCcw } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { NFA } from '../../core/nfa';
import './NfaSimulator.css';

const DEFAULT_NFA = {
  states: 'q0, q1, q2',
  alphabet: '0, 1',
  startState: 'q0',
  acceptStates: 'q2',
  transitions: 'q0, ε, q1\nq1, 0, q1\nq1, 1, q1\nq1, 1, q2', 
  inputString: '01'
};

const NfaSimulator = () => {
  const [definition, setDefinition] = useState(DEFAULT_NFA);
  const [engine, setEngine] = useState(null);
  const [simulationParams, setSimulationParams] = useState({ steps: [], currentStep: -1, accepted: false });
  const [activeNodes, setActiveNodes] = useState([]);
  
  const loadNFA = () => {
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
          if (!transObj[from][symbol]) transObj[from][symbol] = [];
          
          if (!transObj[from][symbol].includes(to)) {
             transObj[from][symbol].push(to);
          }
        }
      });

      const nfa = new NFA(statesArr, alphaArr, transObj, definition.startState.trim(), acceptArr);
      const validation = nfa.validate();
      if (!validation.isValid) {
        alert("NFA Definition Error: " + validation.error);
        return null;
      }
      setEngine(nfa);
      return nfa;
    } catch (e) {
      alert("Error parsing NFA definition.");
      return null;
    }
  };

  const handleRunAll = () => {
    const nfa = loadNFA();
    if (!nfa) return;
    
    const result = nfa.simulateStepByStep(definition.inputString.trim());
    setSimulationParams({ steps: result.steps, currentStep: result.steps.length - 1, accepted: result.accepted });
    setActiveNodes(Array.from(result.finalStates || new Set()));
  };

  const handleStep = () => {
    let nfa = engine;
    if (!nfa) {
      nfa = loadNFA();
      if (!nfa) return;
    }

    if (simulationParams.currentStep === -1) {
      const result = nfa.simulateStepByStep(definition.inputString.trim());
      setSimulationParams({ steps: result.steps, currentStep: 0, accepted: result.accepted });
      setActiveNodes(Array.from(result.steps[0].to)); // To states of initial closure
      return;
    }

    if (simulationParams.currentStep < simulationParams.steps.length - 1) {
      const nextIdx = simulationParams.currentStep + 1;
      setSimulationParams(prev => ({ ...prev, currentStep: nextIdx }));
      setActiveNodes(Array.from(simulationParams.steps[nextIdx].to));
    }
  };

  const handleReset = () => {
    setSimulationParams({ steps: [], currentStep: -1, accepted: false });
    setActiveNodes([]);
  };

  useEffect(() => {
    loadNFA();
  }, []); // eslint-disable-line

  const formatSet = (setObj) => {
    if (!setObj || setObj.size === 0) return '∅';
    return '{ ' + Array.from(setObj).join(', ') + ' }';
  };

  return (
    <div className="nfa-container fade-in">
      <div className="header-section">
        <h2>NFA Simulator</h2>
        <p className="text-muted">Define a Nondeterministic Finite Automaton (with ε-transitions) and visualize its parallel computation steps.</p>
      </div>

      <div className="simulator-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">NFA Definition</h3>
            
            <div className="form-group">
              <label>States (comma separated)</label>
              <input value={definition.states} onChange={e => setDefinition({...definition, states: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label>Alphabet (comma separated)</label>
              <input value={definition.alphabet} onChange={e => setDefinition({...definition, alphabet: e.target.value})} />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Start State</label>
                <input value={definition.startState} onChange={e => setDefinition({...definition, startState: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Accept States</label>
                <input value={definition.acceptStates} onChange={e => setDefinition({...definition, acceptStates: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
               <label>Transitions (from, symbol, to) - One per line. Use 'ε' or 'epsilon'</label>
               <textarea 
                 rows="6" 
                 value={definition.transitions} 
                 onChange={e => setDefinition({...definition, transitions: e.target.value})}
               />
            </div>
          </div>

          <div className="panel simulation-controls">
            <h3 className="panel-header">Execution</h3>
            <div className="form-group">
              <label>Input String</label>
              <input 
                value={definition.inputString} 
                onChange={e => setDefinition({...definition, inputString: e.target.value})} 
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

        <div className="right-panel">
          <div className="panel visualization-panel">
            <h3 className="panel-header">Graph Output</h3>
            <GraphVisualizer automaton={engine} activeNode={activeNodes} />
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
            <div className="trace-box">
              {simulationParams.steps.map((step, idx) => (
                <div key={idx} className={`trace-line ${idx === simulationParams.currentStep ? 'current' : ''} ${step.status === 'ACCEPT' ? 'success' : step.status.includes('REJECT') ? 'error' : ''}`}>
                  <span className="step-num">Step {step.step}:</span>
                  {step.symbol ? (
                    <span> <code>{formatSet(step.from)}</code> --(<strong>{step.symbol}</strong>)--&gt; <code>{formatSet(step.to)}</code></span>
                  ) : (
                    <span> <strong>{step.status}</strong> on Set <code>{formatSet(step.from)}</code></span>
                  )}
                </div>
              ))}
              {simulationParams.steps.length === 0 && <span className="text-muted">No simulation started.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NfaSimulator;
