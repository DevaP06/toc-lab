import React, { useState } from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { convertRegexToNfa, convertNfaToDfa } from '../../core/converters';
import { minimizeDFA as minimizeDfa } from '../../core/minimizer';
import { validateRegex } from '../../core/regexValidator';
import './Converter.css';

const RegexToNfaConverter = () => {
  const [regex, setRegex] = useState('(a|b)*ab');
  const [conversionResult, setConversionResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('nfa'); // 'nfa' | 'dfa'
  
  const handleConvert = () => {
    try {
      const trimmed = regex.trim().replace(/\s+/g, '');
      const val = validateRegex(trimmed);
      if (!val.valid) {
        setError(`Invalid Regex: ${val.error}`);
        setConversionResult(null);
        return;
      }
      const result = convertRegexToNfa(trimmed);

      // Step 1: NFA -> DFA
      const { dfaInstance } = convertNfaToDfa(result.nfaInstance);

      // Step 2: Minimize DFA
      const minimized = minimizeDfa(dfaInstance, { removeDead: true });
      const minimizedDfa = minimized?.minimizedInstance || null;

      setError(null);
      setConversionResult({
        ...result,
        dfaInstance,
        minimizedDfa
      });

      // Optional auto-switch for larger Thompson automata
      setViewMode(result.nfaInstance?.states?.size > 6 ? 'dfa' : 'nfa');
    } catch (e) {
      setConversionResult(null);
      setError(e?.message || 'Error parsing Regular Expression. Please check your syntax.');
    }
  };

  const getNfaEngineFormat = () => {
      if (!conversionResult) return null;
      const { nfaInstance } = conversionResult;
      const transitions = nfaInstance.transitions || nfaInstance.transition || {};
      
      const tObj = {};
      for (const from in transitions) {
          tObj[from] = {};
        for (const symbol in transitions[from]) {
             // GraphVisualizer expects array of targets for NFA
         const targets = transitions[from]?.[symbol] || [];
         tObj[from][symbol] = Array.isArray(targets) ? targets : [targets];
          }
      }

      return {
          states: nfaInstance.states,
          transition: tObj,
          startState: nfaInstance.startState,
          acceptStates: nfaInstance.acceptStates
      };
  };

  const getDfaEngineFormat = () => {
    if (!conversionResult?.minimizedDfa) return null;

    const dfa = conversionResult.minimizedDfa;
    const transition = dfa.transition || {};

    const tObj = {};
    for (const from in transition) {
      tObj[from] = {};
      for (const symbol in transition[from]) {
        const target = transition[from]?.[symbol];
        if (target) {
          tObj[from][symbol] = [target];
        }
      }
    }

    return {
      states: dfa.states,
      transition: tObj,
      startState: dfa.startState,
      acceptStates: dfa.acceptStates
    };
  };

  const toDisplayState = (state) => {
    if (!state) return '-';
    return String(state).includes('_') ? `{${String(state).split('_').join(',')}}` : state;
  };

  const nfaDefinition = conversionResult?.nfaDefinitionFormatted;
  const nfaStateCount = conversionResult?.nfaInstance?.states?.size || 0;
  const dfaStateCount = conversionResult?.dfaInstance?.states instanceof Set
    ? conversionResult.dfaInstance.states.size
    : Array.isArray(conversionResult?.dfaInstance?.states)
      ? conversionResult.dfaInstance.states.length
      : 0;
  const minimizedStateCount = conversionResult?.minimizedDfa?.states instanceof Set
    ? conversionResult.minimizedDfa.states.size
    : Array.isArray(conversionResult?.minimizedDfa?.states)
      ? conversionResult.minimizedDfa.states.length
      : 0;

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>Regex to NFA Converter</h2>
        <p className="text-muted">Convert a Regular Expression into an equivalent Nondeterministic Finite Automaton using Thompson's Construction Algorithm.</p>
      </div>

      {error && (
        <div className="panel converter-error" role="alert">
          {error}
        </div>
      )}

      <div className="converter-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">Source Regular Expression</h3>
            
            <div className="form-group">
              <label>Regex (Use *, |, and parentheses)</label>
              <input value={regex} onChange={e => setRegex(e.target.value)} placeholder="(a|b)*abb" style={{fontSize: 18, fontFamily: 'monospace', padding: 12}} />
            </div>
            
            <button className="btn btn-primary" onClick={handleConvert} style={{width: '100%', marginTop: '8px', justifyContent: 'center'}}>
              <Settings2 size={18} /> Convert to ε-NFA <ArrowRight size={18} />
            </button>
            <p className="text-muted" style={{marginTop: 12, fontSize: 13}}>Note: Concatenation operations are inserted implicitly. e.g. `ab` becomes `a.b`.</p>
          </div>
          
          {conversionResult && (
             <div className="panel resulting-dfa-def">
                <h3 className="panel-header text-success">Resulting ε-NFA</h3>
                <div className="read-only-code" style={{marginBottom: 12}}>
                    <strong>Postfix:</strong> <span style={{color: 'var(--accent-primary)'}}>{conversionResult.postfix}</span>
                </div>
                <div className="read-only-code">
                   <strong>States:</strong> {nfaDefinition.states.split(',').map(s => toDisplayState(s.trim())).join(', ')}<br/>
                   <strong>Alphabet:</strong> {nfaDefinition.alphabet}<br/>
                   <strong>Start State:</strong> {toDisplayState(nfaDefinition.startState)}<br/>
                   <strong>Accepting:</strong> {nfaDefinition.acceptStates ? nfaDefinition.acceptStates.split(',').map(s => toDisplayState(s.trim())).join(', ') : '<None>'}<br/>
                   <strong>Transitions:</strong><br/>
                   <pre>{nfaDefinition.transitions.split('\n').map(line => {
                    const [from, symbol, to] = line.split(',').map(p => p.trim());
                    return `${toDisplayState(from)}, ${symbol}, ${toDisplayState(to)}`;
                   }).join('\n')}</pre>
                </div>
             </div>
          )}
        </div>

        <div className="right-panel">
          <div className="panel visualization-panel" style={{height:'350px'}}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button
                className={`btn ${viewMode === 'nfa' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('nfa')}
                type="button"
              >
                Thompson NFA
              </button>
              <button
                className={`btn ${viewMode === 'dfa' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('dfa')}
                type="button"
                disabled={!conversionResult?.minimizedDfa}
              >
                Simplified DFA
              </button>
            </div>

            <h3 className="panel-header">
              {viewMode === 'nfa'
                ? 'Thompson ε-NFA'
                : 'Minimized DFA (Simplified View)'}
            </h3>

            {conversionResult ? (
                <GraphVisualizer
                  automaton={viewMode === 'nfa' ? getNfaEngineFormat() : getDfaEngineFormat()}
                />
            ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                    Enter a Regex and click Convert to generate the equivalent NFA graph.
                </div>
            )}
          </div>

          {conversionResult && (
            <div className="panel converter-stats">
              <h3 className="panel-header">Pipeline Stats</h3>
              <div className="stats-grid">
                <p>NFA States: {nfaStateCount}</p>
                <p>DFA States: {dfaStateCount}</p>
                <p>Minimized DFA: {minimizedStateCount}</p>
              </div>
            </div>
          )}

          <div className="panel log-panel">
            <h3 className="panel-header">Thompson Construction Execution</h3>
            <div className="trace-box" style={{height: '300px'}}>
              {conversionResult ? conversionResult.constructionSteps.map((step, idx) => (
                <div key={idx} className="trace-line success">
                  {idx + 1}. {step}
                </div>
              )) : (
                 <span className="text-muted">No conversion performed yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegexToNfaConverter;
