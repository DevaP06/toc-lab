import React, { useState } from 'react';
import { Scale, Activity } from 'lucide-react';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { DFA } from '../../core/dfa';
import { checkEquivalence } from '../../core/equivalence';
import { parseCSV } from '../../utils/parser';
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
  const [error, setError] = useState(null);
  const [showPairTransitions, setShowPairTransitions] = useState(false);
  
  const parseDFA = (definition) => {
      const statesArr = parseCSV(definition.states);
      const alphaArr = parseCSV(definition.alphabet);
      const acceptArr = parseCSV(definition.acceptStates);
      
      const transObj = {};
      const lines = definition.transitions.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const parts = parseCSV(trimmed);
        if (parts.length !== 3) {
          throw new Error(`Invalid transition format at line ${index + 1}: ${trimmed}`);
        }

        const [from, symbol, to] = parts;
        if (!from || !symbol || !to) {
          throw new Error(`Invalid transition values at line ${index + 1}: ${trimmed}`);
        }

        if (!transObj[from]) transObj[from] = {};
        if (transObj[from][symbol] && transObj[from][symbol] !== to) {
          throw new Error(`Conflicting transition for (${from}, ${symbol}) at line ${index + 1}`);
        }
        transObj[from][symbol] = to;
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
      setError(null);
      setResult(eqResult);
    } catch (e) {
      setResult(null);
      setError(`Error parsing DFA definitions: ${e.message}`);
    }
  };

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>DFA Equivalence Checker</h2>
        <p className="text-muted">Compare two Deterministic Finite Automata using BFS on the product automaton, with automatic alphabet union, DFA completion, and shortest counterexample extraction.</p>
      </div>

      {error && <ErrorBanner message={error} />}

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
                backgroundColor: result.isEquivalent ? 'rgba(124, 255, 178, 0.15)' : 'rgba(255, 107, 129, 0.15)',
                border: `2px solid ${result.isEquivalent ? 'var(--accent-secondary)' : 'var(--error)'}`
              }}>
                <div style={{display:'flex', justifyContent: 'center', marginBottom: 12}}>
                   <Activity size={48} color={result.isEquivalent ? 'var(--accent-secondary)' : 'var(--error)'} />
                </div>
                <h3 style={{fontSize: 24, margin: '0 0 8px 0', color: result.isEquivalent ? 'var(--accent-secondary)' : 'var(--error)'}}>
                  {result.isEquivalent ? 'DFAs are Equivalent!' : 'DFAs are NOT Equivalent!'}
                </h3>
                <p style={{color: 'var(--text-secondary)'}}>
                  {result.isEquivalent 
                    ? 'Both machines accept the exact same language.' 
                    : 'The machines treat strings differently and are computationally distinct.'}
                </p>
                <p style={{color: 'var(--text-secondary)', marginTop: 8}}>
                  {result.reason}
                </p>

                {Array.isArray(result.alphabet) && result.alphabet.length > 0 && (
                  <p style={{color: 'var(--text-secondary)', marginTop: 6}}>
                    Union alphabet: {'{'}{result.alphabet.join(', ')}{'}'}
                  </p>
                )}

                {!result.isEquivalent && (
                  <div style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.35)',
                    border: '1px solid rgba(248, 113, 113, 0.45)'
                  }}>
                    {typeof result.counterExample === 'string' && (
                      <div style={{marginBottom: 8, color: 'var(--text-secondary)'}}>
                        Counterexample string: <strong style={{color: 'var(--text-primary)'}}>"{result.counterExample}"</strong>
                      </div>
                    )}
                    {result.mismatchPair && (
                      <div style={{color: 'var(--text-secondary)'}}>
                        First mismatch pair: <strong style={{color: 'var(--text-primary)'}}>({result.mismatchPair.a}, {result.mismatchPair.b})</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {result && (
            <div className="panel" style={{marginTop: 12}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
                <h3 className="panel-header" style={{marginBottom: 0}}>Debug Transitions</h3>
                <label style={{display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)'}}>
                  <input
                    className="inline-check"
                    type="checkbox"
                    checked={showPairTransitions}
                    onChange={(e) => setShowPairTransitions(e.target.checked)}
                  />
                  Show product-pair transitions
                </label>
              </div>

              {showPairTransitions ? (
                <div className="trace-box" style={{maxHeight: 220, overflow: 'auto', marginTop: 10}}>
                  {Array.isArray(result.exploredPairs) && result.exploredPairs.length > 0 ? (
                    result.exploredPairs.map((edge, idx) => (
                      <div key={`${edge.from}-${edge.symbol}-${edge.to}-${idx}`} className="trace-line">
                        {edge.from} --{edge.symbol}--&gt; {edge.to}
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">No transition debug data available.</span>
                  )}
                </div>
              ) : (
                <span className="text-muted">Enable debug transitions to inspect explored product-state edges.</span>
              )}
            </div>
          )}

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

          {result && !result.isEquivalent && Array.isArray(result.pairTrace) && result.pairTrace.length > 0 && (
            <div className="panel" style={{marginTop: 12}}>
              <h3 className="panel-header">Shortest Mismatch Path</h3>
              <div className="trace-box" style={{maxHeight: 180, overflow: 'auto'}}>
                {result.pairTrace.map((node, idx) => (
                  <div key={`${node.pair}-${idx}`} className="trace-line" style={{
                    color: idx === result.pairTrace.length - 1 ? '#FCA5A5' : undefined,
                    fontWeight: idx === result.pairTrace.length - 1 ? 600 : 400
                  }}>
                    {idx === 0 ? `${node.pair} (start)` : `${node.pair} via '${node.symbol}'`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EquivalenceChecker;
