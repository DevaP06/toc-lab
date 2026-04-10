import React, { useState, useEffect } from 'react';
import { Play, SkipForward, RotateCcw, Layers } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { PDA } from '../../core/pda';
import './PdaSimulator.css';

const DEFAULT_PDA = {
  states: 'q0, q1, q2',
  inputAlphabet: 'a, b',
  stackAlphabet: 'A, Z',
  startState: 'q0',
  startStack: 'Z',
  acceptStates: 'q2',
  transitions: 'q0, a, Z, AZ, q0\nq0, a, A, AA, q0\nq0, b, A, ε, q1\nq1, b, A, ε, q1\nq1, ε, Z, Z, q2', 
  inputString: 'aabb'
};

const PdaSimulator = () => {
  const [definition, setDefinition] = useState(DEFAULT_PDA);
  const [engine, setEngine] = useState(null);
  const [simulationParams, setSimulationParams] = useState({ steps: [], currentStep: -1, accepted: false });
  const [activeNodes, setActiveNodes] = useState([]);
  
  // Parse and configure PDA
  const loadPDA = () => {
    try {
      const statesArr = definition.states.split(',').map(s => s.trim()).filter(Boolean);
      const inputArr = definition.inputAlphabet.split(',').map(s => s.trim()).filter(Boolean);
      const stackArr = definition.stackAlphabet.split(',').map(s => s.trim()).filter(Boolean);
      const acceptArr = definition.acceptStates.split(',').map(s => s.trim()).filter(Boolean);
      
      const transArr = [];
      const lines = definition.transitions.split('\n');
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length === 5) {
          const [from, input, pop, push, to] = parts;
          transArr.push({ from, input, pop, push, to });
        }
      });

      const pda = new PDA(statesArr, inputArr, stackArr, definition.startState.trim(), definition.startStack.trim(), acceptArr, transArr);
      const validation = pda.validate();
      if (!validation.isValid) {
        alert("PDA Definition Error: " + validation.error);
        return null;
      }
      setEngine(pda);
      return pda;
    } catch (e) {
      alert("Error parsing PDA definition.");
      return null;
    }
  };

  const handleRunAll = () => {
    const pda = loadPDA();
    if (!pda) return;

    const result = pda.simulateStepByStep(definition.inputString.trim());
    setSimulationParams({ steps: result.allSteps, currentStep: result.allSteps.length - 1, accepted: result.accepted, timedOut: result.timedOut });
    if (result.finalConfig) {
      setActiveNodes([result.finalConfig.state]);
    }
    if (result.timedOut) {
      alert('Warning: Simulation reached the step limit (500 steps). The PDA may have an infinite epsilon cycle. Result shown is inconclusive.');
    }
  };

  const handleStep = () => {
    let pda = engine;
    if (!pda) {
      pda = loadPDA();
      if (!pda) return;
    }

    if (simulationParams.currentStep === -1) {
      const result = pda.simulateStepByStep(definition.inputString.trim());
      setSimulationParams({ steps: result.allSteps, currentStep: 0, accepted: result.accepted });
      setActiveNodes(Array.from(new Set(result.allSteps[0].map(c => c.state))));
      return;
    }

    if (simulationParams.currentStep < simulationParams.steps.length - 1) {
      const nextIdx = simulationParams.currentStep + 1;
      setSimulationParams(prev => ({ ...prev, currentStep: nextIdx }));
      setActiveNodes(Array.from(new Set(simulationParams.steps[nextIdx].map(c => c.state))));
    }
  };

  const handleReset = () => {
    setSimulationParams({ steps: [], currentStep: -1, accepted: false });
    setActiveNodes([]);
  };

  useEffect(() => {
    loadPDA();
  }, []); // eslint-disable-line

  // Engine adapter for GraphVisualizer
  const renderEngineData = () => {
      if (!engine) return null;
      // Convert flat transitions array to expected object format for GraphVisualizer
      const tObj = {};
      engine.transitions.forEach(t => {
          if (!tObj[t.from]) tObj[t.from] = {};
          const label = `${t.input},${t.pop}/${t.push}`;
          if (!tObj[t.from][label]) tObj[t.from][label] = [];
          tObj[t.from][label].push(t.to);
      });
      return {
          states: engine.states,
          transition: tObj,
          startState: engine.startState,
          acceptStates: engine.acceptStates
      };
  };

  const currentConfigs = simulationParams.currentStep >= 0 ? simulationParams.steps[simulationParams.currentStep] : [];

  return (
    <div className="pda-container fade-in">
      <div className="header-section">
        <h2>PDA Simulator</h2>
        <p className="text-muted">Define a Pushdown Automaton with stack memory and visualize parallel execution trees.</p>
      </div>

      <div className="simulator-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">PDA Definition</h3>
            
            <div className="form-group">
              <label>States (comma separated)</label>
              <input value={definition.states} onChange={e => setDefinition({...definition, states: e.target.value})} />
            </div>
            
            <div className="form-group-row">
                <div className="form-group">
                <label>Input Alphabet</label>
                <input value={definition.inputAlphabet} onChange={e => setDefinition({...definition, inputAlphabet: e.target.value})} />
                </div>
                <div className="form-group">
                <label>Stack Alphabet</label>
                <input value={definition.stackAlphabet} onChange={e => setDefinition({...definition, stackAlphabet: e.target.value})} />
                </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Start State</label>
                <input value={definition.startState} onChange={e => setDefinition({...definition, startState: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Start Stack Symbol</label>
                <input value={definition.startStack} onChange={e => setDefinition({...definition, startStack: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Accept States</label>
                <input value={definition.acceptStates} onChange={e => setDefinition({...definition, acceptStates: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
               <label>Transitions (from, input, pop, push, to) - Use 'ε'</label>
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
          <div className="panel visualization-panel" style={{height:'350px', marginBottom: '16px'}}>
            <h3 className="panel-header">Graph Output</h3>
            <div style={{flex: 1, position:'relative'}}>
               <GraphVisualizer automaton={renderEngineData()} activeNode={activeNodes} />
            </div>
          </div>

          {/* New Stack Tracker Panel for PDA */}
          <div className="panel stack-panel">
             <h3 className="panel-header" style={{display:'flex', alignItems:'center', gap:'8px'}}><Layers size={18}/> Active Configurations & Stacks</h3>
             <div className="stacks-container">
                 {currentConfigs.length === 0 && <span className="text-muted">No configurations active.</span>}
                 {currentConfigs.map((cfg, i) => (
                    <div key={i} className="config-card fade-in">
                       <div className="config-header">
                          <span className={`status-badge ${cfg.status === 'ACCEPT' ? 'success' : ''}`}>[{cfg.state}]</span>
                          <span className="text-muted" style={{fontSize: 13}}>Input consumed: {cfg.inputConsumed}/{definition.inputString.trim().length}</span>
                       </div>
                       <div className="stack-visual">
                         <div className="stack-bottom">Wall</div>
                         {cfg.stack.map((sym, si) => (
                            <div key={si} className="stack-block">{sym}</div>
                         ))}
                       </div>
                    </div>
                 ))}
             </div>
          </div>

          {simulationParams.steps.length > 0 && simulationParams.currentStep === simulationParams.steps.length - 1 && (
              <div style={{
                padding: '12px', marginTop: '16px', borderRadius: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold',
                backgroundColor: simulationParams.accepted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: simulationParams.accepted ? 'var(--accent-secondary)' : 'var(--error)',
                border: `1px solid ${simulationParams.accepted ? 'var(--accent-secondary)' : 'var(--error)'}`
              }} className="fade-in">
                {simulationParams.accepted ? '✅ String Accepted by Final State' : '❌ String Rejected'}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdaSimulator;
