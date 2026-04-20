import React, { useMemo, useState } from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import GraphVisualizer from '../../components/automata/GraphVisualizer';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { NFA } from '../../core/nfa';
import { convertNfaToDfa } from '../../core/converters';
import { normalizeEpsilon, parseCSV } from '../../utils/parser';
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
  const [error, setError] = useState(null);
  const [completenessIssues, setCompletenessIssues] = useState([]);
  const [warning, setWarning] = useState(null);
  const [mode, setMode] = useState('instant');
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedState, setSelectedState] = useState(null);

  const toDisplayState = (state) => {
    if (!state) return '-';
    if (state === 'DEAD') return 'DEAD';
    return `{${state.split('|').join(',')}}`;
  };

  const deriveProcessingState = (step) => {
    if (!step) return null;
    if (step.processingState) return step.processingState;
    const fromMatch = step.message?.match(/^From\s+([^\s]+)\s+on\s+'/);
    if (fromMatch?.[1]) return fromMatch[1];
    const initMatch = step.message?.match(/->\s+([^\s]+)/);
    if (initMatch?.[1]) return initMatch[1];
    return null;
  };

  const validateCompleteness = (dfaInstance) => {
    const missing = [];
    const states = Array.from(dfaInstance.states);
    const alphabet = Array.from(dfaInstance.alphabet);
    for (const state of states) {
      for (const symbol of alphabet) {
        if (!dfaInstance.transition[state]?.[symbol]) {
          missing.push(`${state} on '${symbol}'`);
        }
      }
    }
    return missing;
  };
  
  const handleConvert = () => {
    try {
      const statesArr = parseCSV(definition.states);
      const alphaArr = parseCSV(definition.alphabet)
        .filter(s => !['ε', 'epsilon', 'eps', 'λ'].includes(s.toLowerCase()));
      const acceptArr = parseCSV(definition.acceptStates);
      
      const transObj = {};
      const lines = definition.transitions.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const parts = parseCSV(trimmedLine);
        if (parts.length !== 3) {
          throw new Error(`Invalid transition format: ${trimmedLine}`);
        }

        const [from, rawSymbol, to] = parts;
        const symbol = normalizeEpsilon(rawSymbol);
        if (!transObj[from]) transObj[from] = {};
        if (!transObj[from][symbol]) transObj[from][symbol] = [];

        if (!transObj[from][symbol].includes(to)) {
          transObj[from][symbol].push(to);
        }
      });

      const nfa = new NFA(
        statesArr,
        alphaArr,
        definition.startState.trim(),
        acceptArr,
        transObj
      );
      const validation = nfa.validate();
      if (!validation.isValid) {
        setError(`NFA Definition Error: ${validation.error}`);
        setConversionResult(null);
        return;
      }

      const result = convertNfaToDfa(nfa);
      setError(null);
      setConversionResult(result);
      setMode('instant');
      setStepIndex(0);
      setSelectedState(result.dfaInstance.startState || null);

      const missing = validateCompleteness(result.dfaInstance);
      setCompletenessIssues(missing);

      const dfaStateCount = result.dfaInstance.states.size;
      if (dfaStateCount > 50) {
        setWarning(`Large DFA generated (${dfaStateCount} states). Potential state explosion.`);
      } else {
        setWarning(null);
      }
    } catch (e) {
      setConversionResult(null);
      setCompletenessIssues([]);
      setWarning(null);
      setError(e?.message || 'Error parsing NFA definition or during conversion.');
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'step') {
      setStepIndex(0);
    }
  };

  const handleNextStep = () => {
    if (!conversionResult) return;
    setStepIndex(prev => Math.min(prev + 1, conversionResult.constructionSteps.length - 1));
  };

  const getSubsetRows = () => {
    if (!conversionResult) return [];
    const dfa = conversionResult.dfaInstance;
    const states = Array.from(dfa.states);
    const alphabet = Array.from(dfa.alphabet);
    return states.map(state => ({
      state,
      transitions: alphabet.reduce((acc, symbol) => {
        acc[symbol] = dfa.transition[state]?.[symbol] || '-';
        return acc;
      }, {})
    }));
  };

  const dfaDefinition = conversionResult?.dfaDefinitionFormatted;
  const visibleSteps = !conversionResult
    ? []
    : mode === 'step'
      ? conversionResult.constructionSteps.slice(0, stepIndex + 1)
      : conversionResult.constructionSteps;

  const currentProcessingState = visibleSteps.length
    ? deriveProcessingState(visibleSteps[visibleSteps.length - 1])
    : null;
  const subsetRows = getSubsetRows();
  const dfaAlphabet = conversionResult ? Array.from(conversionResult.dfaInstance.alphabet) : [];
  const focusedEdges = useMemo(() => {
    if (!conversionResult || !selectedState) return [];
    const row = conversionResult.dfaInstance.transition[selectedState] || {};
    return Object.entries(row)
      .filter(([, target]) => Boolean(target))
      .map(([symbol, target]) => ({ from: selectedState, to: target, symbol }));
  }, [conversionResult, selectedState]);
  const dfaAutomaton = useMemo(() => {
    if (!conversionResult) return null;
    const { dfaInstance } = conversionResult;

    const tObj = {};
    for (const from in dfaInstance.transition) {
      tObj[from] = {};
      for (const symbol in dfaInstance.transition[from]) {
        const target = dfaInstance.transition[from]?.[symbol];
        if (target) {
          tObj[from][symbol] = [target];
        }
      }
    }

    return {
      states: dfaInstance.states,
      transition: tObj,
      startState: dfaInstance.startState,
      acceptStates: dfaInstance.acceptStates
    };
  }, [conversionResult]);

  return (
    <div className="converter-container fade-in">
      <div className="header-section">
        <h2>NFA to DFA Converter</h2>
        <p className="text-muted">Convert a Nondeterministic Finite Automaton (with ε-transitions) into an equivalent Deterministic Finite Automaton using Subset Construction.</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {warning && (
        <div className="panel converter-warning" role="status">
          {warning}
        </div>
      )}

      {!!completenessIssues.length && (
        <ErrorBanner message="DFA completeness check failed:">
          <ul className="converter-inline-list">
            {completenessIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </ErrorBanner>
      )}

      <div className="converter-grid">
        <div className="left-panel">
          <div className="panel input-panel">
            <h3 className="panel-header">Input NFA</h3>
            
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
                <h3 className="panel-header text-success">Generated DFA</h3>
                <div className="read-only-code">
                   <strong>States:</strong> {parseCSV(dfaDefinition.states).map(s => toDisplayState(s)).join(', ')}<br/>
                   <strong>Alphabet:</strong> {dfaDefinition.alphabet}<br/>
                   <strong>Start State:</strong> {toDisplayState(dfaDefinition.startState)}<br/>
                   <strong>Accepting:</strong> {dfaDefinition.acceptStates ? parseCSV(dfaDefinition.acceptStates).map(s => toDisplayState(s)).join(', ') : '<None>'}<br/>
                   <strong>Transitions:</strong><br/>
                   <pre>{dfaDefinition.transitions.split('\n').map(line => {
                     const [from, symbol, to] = parseCSV(line);
                     return `${toDisplayState(from)}, ${symbol}, ${toDisplayState(to)}`;
                   }).join('\n')}</pre>
                </div>
             </div>
          )}
        </div>

        <div className="right-panel">

          <div className="panel visualization-panel" style={{height:'380px'}}>
            <div className="converter-row-header">
              <h3 className="panel-header">Generated DFA Graph</h3>
              {conversionResult && (
                <select
                  className="converter-state-select"
                  value={selectedState || ''}
                  onChange={(e) => setSelectedState(e.target.value || null)}
                >
                  <option value="">Focus state</option>
                  {Array.from(conversionResult.dfaInstance.states).map(state => (
                    <option key={state} value={state}>{toDisplayState(state)}</option>
                  ))}
                </select>
              )}
            </div>
            {conversionResult ? (
                <GraphVisualizer
                  automaton={dfaAutomaton}
                  activeNode={selectedState}
                  activeEdges={focusedEdges}
                  fadeInactiveEdges={focusedEdges.length > 0}
                />
            ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                    Define an NFA and click Convert to generate the DFA graph.
                </div>
            )}
          </div>

          {conversionResult && (
            <div className="panel subset-table-panel">
              <h3 className="panel-header">Subset Construction Table</h3>
              <div className="subset-table-wrap">
                <table className="subset-table">
                  <thead>
                    <tr>
                      <th>DFA State</th>
                      {dfaAlphabet.map(symbol => (
                        <th key={symbol}>{symbol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subsetRows.map(row => (
                      <tr
                        key={row.state}
                        className={`${currentProcessingState === row.state ? 'is-active-row' : ''}`}
                        onClick={() => setSelectedState(row.state)}
                      >
                        <td>{toDisplayState(row.state)}</td>
                        {dfaAlphabet.map(symbol => (
                          <td key={`${row.state}-${symbol}`}>{toDisplayState(row.transitions[symbol])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="panel log-panel">
            <div className="converter-row-header">
              <h3 className="panel-header">Conversion Steps</h3>
              <div className="mode-toggle" role="group" aria-label="Conversion step mode">
                <button
                  className={`btn ${mode === 'instant' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleModeChange('instant')}
                  type="button"
                >
                  Instant
                </button>
                <button
                  className={`btn ${mode === 'step' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleModeChange('step')}
                  type="button"
                >
                  Step Mode
                </button>
                {mode === 'step' && conversionResult && (
                  <button className="btn btn-secondary" onClick={handleNextStep} type="button">
                    Next Step
                  </button>
                )}
              </div>
            </div>
            <div className="trace-box" style={{height: '300px'}}>
              {conversionResult ? visibleSteps.map((step, idx) => (
                <div key={`${step.message}-${idx}`} className={`trace-line ${step.stateCreated ? 'success' : ''} ${step.processingState ? 'trace-processing' : ''}`}>
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
