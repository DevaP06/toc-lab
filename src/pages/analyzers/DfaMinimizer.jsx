import React, { useMemo, useState } from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { DFA } from '../../core/dfa';
import { minimizeDFA } from '../../core/minimizer';
import { parseCSV } from '../../utils/parser';
import '../converters/Converter.css';

const DEFAULT_DFA = {
  states: 'q0, q1, q2, q3, q4',
  alphabet: '0, 1',
  startState: 'q0',
  acceptStates: 'q4',
  transitions: 'q0, 0, q1\nq0, 1, q2\nq1, 0, q1\nq1, 1, q3\nq2, 0, q1\nq2, 1, q2\nq3, 0, q1\nq3, 1, q4\nq4, 0, q1\nq4, 1, q2'
};

const DfaMinimizer = () => {
  const [definition, setDefinition] = useState(DEFAULT_DFA);
  const [minimizationResult, setMinimizationResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleMinimize = () => {
    try {
      const statesArr = parseCSV(definition.states);
      const alphaArr = parseCSV(definition.alphabet);
      const acceptArr = parseCSV(definition.acceptStates);
      
      const transObj = {};
      const lines = definition.transitions.split('\n');
      lines.forEach(line => {
        const parts = parseCSV(line);
        if (parts.length === 3) {
          const [from, symbol, to] = parts;
          if (!transObj[from]) transObj[from] = {};
          transObj[from][symbol] = to;
        }
      });

      const dfa = new DFA(statesArr, alphaArr, transObj, definition.startState.trim(), acceptArr);
      const validation = dfa.validate();
      if (!validation.isValid) {
        setError(`DFA Definition Error: ${validation.error}`);
        setMinimizationResult(null);
        return;
      }

      const result = minimizeDFA(dfa);
      setError(null);
      setMinimizationResult(result);
    } catch {
      setMinimizationResult(null);
      setError('Error parsing DFA definition or during minimization.');
    }
  };

  const minDefinition = minimizationResult?.minimizedDefinition;
  const minimizedAutomaton = useMemo(() => {
    if (!minimizationResult) return null;
    const { minimizedInstance } = minimizationResult;

    const tObj = {};
    for (const from in minimizedInstance.transition) {
      tObj[from] = {};
      for (const symbol in minimizedInstance.transition[from]) {
        tObj[from][symbol] = [minimizedInstance.transition[from][symbol]];
      }
    }

    return {
      states: minimizedInstance.states,
      transition: tObj,
      startState: minimizedInstance.startState,
      acceptStates: minimizedInstance.acceptStates
    };
  }, [minimizationResult]);

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>DFA Minimizer</h2>
        <p className="text-muted">Minimize a Deterministic Finite Automaton using the Table-Filling (Myhill-Nerode) Algorithm.</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="converter-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">Source DFA Definition</h3>
            
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
               <label>Transitions (from, symbol, to) - One per line.</label>
               <textarea 
                 rows="6" 
                 value={definition.transitions} 
                 onChange={e => setDefinition({...definition, transitions: e.target.value})}
               />
            </div>
            
            <button className="btn btn-primary" onClick={handleMinimize} style={{width: '100%', marginTop: '8px', justifyContent: 'center'}}>
              <Settings2 size={18} /> Minimize DFA <ArrowRight size={18} />
            </button>
          </div>
          
          {minimizationResult && (
             <div className="panel resulting-dfa-def">
                <h3 className="panel-header text-success">Minimized Equivalent DFA</h3>
                <div className="read-only-code">
                   <strong>States:</strong> {minDefinition.states}<br/>
                   <strong>Alphabet:</strong> {minDefinition.alphabet}<br/>
                   <strong>Start State:</strong> {minDefinition.startState}<br/>
                   <strong>Accepting:</strong> {minDefinition.acceptStates || '<None>'}<br/>
                   <strong>Transitions:</strong><br/>
                   <pre>{minDefinition.transitions}</pre>
                </div>
             </div>
          )}
        </div>

        <div className="right-panel">
        
          <div className="panel visualization-panel" style={{height:'350px'}}>
            <h3 className="panel-header">Resulting Graph</h3>
            {minimizationResult ? (
              <GraphVisualizer automaton={minimizedAutomaton} />
            ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                    Define a DFA and click Minimize to generate the collapsed graph.
                </div>
            )}
          </div>

          <div className="panel log-panel">
            <h3 className="panel-header">Minimization Steps</h3>
            <div className="trace-box" style={{height: '300px'}}>
              {minimizationResult ? minimizationResult.steps.map((step, idx) => (
                <div key={idx} className="trace-line">
                  {step}
                </div>
              )) : (
                 <span className="text-muted">No minimization performed yet.</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DfaMinimizer;
