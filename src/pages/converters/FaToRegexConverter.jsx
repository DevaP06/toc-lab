import React, { useState } from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { faToRegex } from '../../core/faToRegex';
import './Converter.css';

const DEFAULT_FA = {
  states: 'q0, q1',
  startState: 'q0',
  acceptStates: 'q1',
  transitions: 'q0, a, q1\nq1, b, q0'
};

const FaToRegexConverter = () => {
  const [definition, setDefinition] = useState(DEFAULT_FA);
  const [conversionResult, setConversionResult] = useState(null);
  
  const handleConvert = () => {
    try {
      const statesArr = definition.states.split(',').map(s => s.trim()).filter(Boolean);
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

      const automaton = {
         states: statesArr,
         transitions: transObj,
         startState: definition.startState.trim(),
         acceptStates: acceptArr
      };

      const result = faToRegex(automaton);
      
      setConversionResult({ regex: result, automaton });
    } catch (e) {
      alert("Error parsing FA definition or during conversion. " + e.message);
    }
  };

  const getEngineFormat = () => {
      if (!conversionResult) return null;
      const { automaton } = conversionResult;
      return {
          states: new Set(automaton.states),
          transition: automaton.transitions,
          startState: automaton.startState,
          acceptStates: new Set(automaton.acceptStates)
      };
  };

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>FA to Regex Converter</h2>
        <p className="text-muted">Convert a Finite Automaton to a Regular Expression using the State Elimination Method based on the provided rigorous algorithm.</p>
      </div>

      <div className="converter-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">Source FA Definition</h3>
            
            <div className="form-group">
              <label>States (comma separated)</label>
              <input value={definition.states} onChange={e => setDefinition({...definition, states: e.target.value})} />
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
            
            <button className="btn btn-primary" onClick={handleConvert} style={{width: '100%', marginTop: '8px', justifyContent: 'center'}}>
              <Settings2 size={18} /> Convert to Regex <ArrowRight size={18} />
            </button>
          </div>
          
          {conversionResult && (
             <div className="panel resulting-dfa-def">
                <h3 className="panel-header text-success">Resulting Regular Expression</h3>
                <div className="read-only-code" style={{fontSize: 20, textAlign: 'center', padding: 24}}>
                    <span style={{color: 'var(--accent-primary)'}}>{conversionResult.regex}</span>
                </div>
             </div>
          )}
        </div>

        <div className="right-panel">
          <div className="panel visualization-panel" style={{height:'350px'}}>
            <h3 className="panel-header">Source FA Graph</h3>
            {conversionResult ? (
                <GraphVisualizer automaton={getEngineFormat()} />
            ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                    Define an FA and click Convert to generate the equivalent Regex.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaToRegexConverter;
