import React, { useState } from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { NFA } from '../../core/nfa';
import { convertNfaToDfa } from '../../core/converters';
import './Converter.css';

const DEFAULT_NFA = {
  states: 'q0, q1, q2',
  alphabet: '0, 1',
  startState: 'q0',
  acceptStates: 'q2',
  transitions: 'q0, ε, q1\nq1, 0, q1\nq1, 1, q1\nq1, 1, q2'
};

const NfaToDfaConverter = () => {
  const [definition, setDefinition] = useState(DEFAULT_NFA);
  const [conversionResult, setConversionResult] = useState(null);
  
  const handleConvert = () => {
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
        return;
      }

      const result = convertNfaToDfa(nfa);
      setConversionResult(result);
    } catch (e) {
      alert("Error parsing NFA definition or during conversion.");
    }
  };

  const getDfaEngineFormat = () => {
      if (!conversionResult) return null;
      const { dfaInstance } = conversionResult;
      
      const tObj = {};
      for (const from in dfaInstance.transition) {
          tObj[from] = {};
          for (const symbol in dfaInstance.transition[from]) {
              // Convert to array format GraphVisualizer expects even if DFA
             tObj[from][symbol] = [dfaInstance.transition[from][symbol]];
          }
      }

      return {
          states: dfaInstance.states,
          transition: tObj,
          startState: dfaInstance.startState,
          acceptStates: dfaInstance.acceptStates
      };
  };

  const dfaDefinition = conversionResult?.dfaDefinitionFormatted;

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>NFA to DFA Converter</h2>
        <p className="text-muted">Convert a Nondeterministic Finite Automaton (with ε-transitions) into an equivalent Deterministic Finite Automaton using Subset Construction.</p>
      </div>

      <div className="converter-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">Source NFA Definition</h3>
            
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
               <label>Transitions (from, symbol, to) - One per line. Use 'ε'</label>
               <textarea 
                 rows="6" 
                 value={definition.transitions} 
                 onChange={e => setDefinition({...definition, transitions: e.target.value})}
               />
            </div>
            
            <button className="btn btn-primary" onClick={handleConvert} style={{width: '100%', marginTop: '8px', justifyContent: 'center'}}>
              <Settings2 size={18} /> Convert to DFA <ArrowRight size={18} />
            </button>
          </div>
          
          {conversionResult && (
             <div className="panel resulting-dfa-def">
                <h3 className="panel-header text-success">Resulting DFA</h3>
                <div className="read-only-code">
                   <strong>States:</strong> {dfaDefinition.states}<br/>
                   <strong>Alphabet:</strong> {dfaDefinition.alphabet}<br/>
                   <strong>Start State:</strong> {dfaDefinition.startState}<br/>
                   <strong>Accepting:</strong> {dfaDefinition.acceptStates || '<None>'}<br/>
                   <strong>Transitions:</strong><br/>
                   <pre>{dfaDefinition.transitions}</pre>
                </div>
             </div>
          )}
        </div>

        <div className="right-panel">
        
          <div className="panel visualization-panel" style={{height:'350px'}}>
            <h3 className="panel-header">Generated DFA Graph</h3>
            {conversionResult ? (
                <GraphVisualizer automaton={getDfaEngineFormat()} />
            ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                    Define an NFA and click Convert to generate the DFA graph.
                </div>
            )}
          </div>

          <div className="panel log-panel">
            <h3 className="panel-header">Subset Construction Steps</h3>
            <div className="trace-box" style={{height: '300px'}}>
              {conversionResult ? conversionResult.constructionSteps.map((step, idx) => (
                <div key={idx} className={`trace-line ${step.stateCreated ? 'success' : ''}`}>
                  {step.message}
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

export default NfaToDfaConverter;
