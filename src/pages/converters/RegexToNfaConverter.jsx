import React, { useState } from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import { convertRegexToNfa } from '../../core/converters';
import { validateRegex } from '../../core/regexValidator';
import './Converter.css';

const RegexToNfaConverter = () => {
  const [regex, setRegex] = useState('(a|b)*ab');
  const [conversionResult, setConversionResult] = useState(null);
  
  const handleConvert = () => {
    try {
      const trimmed = regex.trim().replace(/\s+/g, '');
      const val = validateRegex(trimmed);
      if (!val.valid) {
         alert("Invalid Regex: " + val.error);
         return;
      }
      const result = convertRegexToNfa(trimmed);
      setConversionResult(result);
    } catch (e) {
      alert("Error parsing Regular Expression. Please check your syntax.");
    }
  };

  const getNfaEngineFormat = () => {
      if (!conversionResult) return null;
      const { nfaInstance } = conversionResult;
      
      const tObj = {};
      for (const from in nfaInstance.transition) {
          tObj[from] = {};
          for (const symbol in nfaInstance.transition[from]) {
             // GraphVisualizer expects array of targets for NFA
             tObj[from][symbol] = Array.isArray(nfaInstance.transition[from][symbol]) 
                ? nfaInstance.transition[from][symbol] 
                : [nfaInstance.transition[from][symbol]];
          }
      }

      return {
          states: nfaInstance.states,
          transition: tObj,
          startState: nfaInstance.startState,
          acceptStates: nfaInstance.acceptStates
      };
  };

  const nfaDefinition = conversionResult?.nfaDefinitionFormatted;

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>Regex to NFA Converter</h2>
        <p className="text-muted">Convert a Regular Expression into an equivalent Nondeterministic Finite Automaton using Thompson's Construction Algorithm.</p>
      </div>

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
                   <strong>States:</strong> {nfaDefinition.states}<br/>
                   <strong>Alphabet:</strong> {nfaDefinition.alphabet}<br/>
                   <strong>Start State:</strong> {nfaDefinition.startState}<br/>
                   <strong>Accepting:</strong> {nfaDefinition.acceptStates || '<None>'}<br/>
                   <strong>Transitions:</strong><br/>
                   <pre>{nfaDefinition.transitions}</pre>
                </div>
             </div>
          )}
        </div>

        <div className="right-panel">
          <div className="panel visualization-panel" style={{height:'350px'}}>
            <h3 className="panel-header">Generated NFA Graph</h3>
            {conversionResult ? (
                <GraphVisualizer automaton={getNfaEngineFormat()} />
            ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                    Enter a Regex and click Convert to generate the equivalent NFA graph.
                </div>
            )}
          </div>

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
