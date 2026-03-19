import React, { useState } from 'react';
import { Scale, Activity } from 'lucide-react';
import { DFA } from '../../core/dfa';
import { checkEquivalence } from '../../core/equivalence';
import '../converters/Converter.css';

const DEFAULT_DFA_A = {
  states: 'q0, q1',
  alphabet: '0, 1',
  startState: 'q0',
  acceptStates: 'q1',
  transitions: 'q0, 0, q1\nq0, 1, q0\nq1, 0, q1\nq1, 1, q0'
};

const DEFAULT_DFA_B = {
  states: 'p0, p1, p2',
  alphabet: '0, 1',
  startState: 'p0',
  acceptStates: 'p1, p2',
  transitions: 'p0, 0, p1\np0, 1, p0\np1, 0, p2\np1, 1, p0\np2, 0, p2\np2, 1, p0'
};

const EquivalenceChecker = () => {
  const [defA, setDefA] = useState(DEFAULT_DFA_A);
  const [defB, setDefB] = useState(DEFAULT_DFA_B);
  const [result, setResult] = useState(null);
  
  const parseDFA = (definition) => {
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
      if (!validation.isValid) throw new Error(validation.error);
      return dfa;
  };

  const handleCheck = () => {
    try {
      const dfaA = parseDFA(defA);
      const dfaB = parseDFA(defB);
      
      const eqResult = checkEquivalence(dfaA, dfaB);
      setResult(eqResult);
    } catch (e) {
      alert("Error parsing DFA definitions: " + e.message);
    }
  };

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>DFA Equivalence Checker</h2>
        <p className="text-muted">Compare two Deterministic Finite Automata to verify if they accept the exact same language using the Table-Filling (Myhill-Nerode) state distinguishability check.</p>
      </div>

      <div className="converter-grid">
        <div className="left-panel">
          <div className="panel input-panel" style={{borderColor: 'rgba(99, 102, 241, 0.4)'}}>
            <h3 className="panel-header" style={{color: '#818CF8'}}>DFA A Definition</h3>
            
            <div className="form-group-row">
              <div className="form-group">
                <label>States</label>
                <input value={defA.states} onChange={e => setDefA({...defA, states: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Alphabet</label>
                <input value={defA.alphabet} onChange={e => setDefA({...defA, alphabet: e.target.value})} />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Start State</label>
                <input value={defA.startState} onChange={e => setDefA({...defA, startState: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Accept States</label>
                <input value={defA.acceptStates} onChange={e => setDefA({...defA, acceptStates: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
               <label>Transitions (from, symbol, to)</label>
               <textarea rows="4" value={defA.transitions} onChange={e => setDefA({...defA, transitions: e.target.value})} />
            </div>
          </div>
          
          <div className="panel input-panel" style={{borderColor: 'rgba(236, 72, 153, 0.4)'}}>
            <h3 className="panel-header" style={{color: '#F472B6'}}>DFA B Definition</h3>
            
            <div className="form-group-row">
              <div className="form-group">
                <label>States</label>
                <input value={defB.states} onChange={e => setDefB({...defB, states: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Alphabet</label>
                <input value={defB.alphabet} onChange={e => setDefB({...defB, alphabet: e.target.value})} />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Start State</label>
                <input value={defB.startState} onChange={e => setDefB({...defB, startState: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Accept States</label>
                <input value={defB.acceptStates} onChange={e => setDefB({...defB, acceptStates: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
               <label>Transitions (from, symbol, to)</label>
               <textarea rows="4" value={defB.transitions} onChange={e => setDefB({...defB, transitions: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel visualization-panel" style={{justifyContent: 'center', alignItems: 'center', gap: 24, padding: 32}}>
            <button className="btn btn-primary" onClick={handleCheck} style={{width: '60%', padding: '16px', fontSize: '16px', justifyContent: 'center'}}>
              <Scale size={20} /> Check Equivalence
            </button>

            {result && (
              <div className="fade-in" style={{
                width: '100%', padding: '24px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: result.isEquivalent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `2px solid ${result.isEquivalent ? '#22C55E' : '#EF4444'}`
              }}>
                <div style={{display:'flex', justifyContent: 'center', marginBottom: 12}}>
                   <Activity size={48} color={result.isEquivalent ? '#22C55E' : '#EF4444'} />
                </div>
                <h3 style={{fontSize: 24, margin: '0 0 8px 0', color: result.isEquivalent ? '#4ADE80' : '#F87171'}}>
                  {result.isEquivalent ? 'DFAs are Equivalent!' : 'DFAs are NOT Equivalent!'}
                </h3>
                <p style={{color: 'var(--text-secondary)'}}>
                  {result.isEquivalent 
                    ? 'Both machines accept the exact same language.' 
                    : 'The machines treat strings differently and are computationally distinct.'}
                </p>
              </div>
            )}
          </div>

          <div className="panel log-panel" style={{flex: 1}}>
            <h3 className="panel-header">Equivalence Proof Steps</h3>
            <div className="trace-box" style={{height: '100%'}}>
              {result ? result.steps.map((step, idx) => (
                <div key={idx} className="trace-line">
                  {step}
                </div>
              )) : (
                 <span className="text-muted">No equivalence check performed yet. Provide two DFAs and run the checker.</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EquivalenceChecker;
