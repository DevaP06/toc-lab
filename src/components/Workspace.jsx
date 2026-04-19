import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import DfaSimulator from '../pages/simulators/DfaSimulator';
import NfaSimulator from '../pages/simulators/NfaSimulator';
import PdaSimulator from '../pages/simulators/PdaSimulator';
import TuringMachineSimulator from '../pages/simulators/TuringMachineSimulator';
import NfaToDfaConverter from '../pages/converters/NfaToDfaConverter';
import RegexToNfaConverter from '../pages/converters/RegexToNfaConverter';
import DfaMinimizer from '../pages/analyzers/DfaMinimizer';
import EquivalenceChecker from '../pages/analyzers/EquivalenceChecker';
import './Workspace.css';

// Placeholder components for routes
const Placeholder = ({ title }) => (
  <div className="placeholder fade-in">
    <h2>{title}</h2>
    <p>This module is currently under construction.</p>
  </div>
);

const Workspace = () => {
  return (
    <main className="workspace-area">
      <Routes>
        
        {/* Simulators */}
        <Route path="/simulators/dfa" element={<DfaSimulator />} />
        <Route path="/simulators/nfa" element={<NfaSimulator />} />
        <Route path="/simulators/pda" element={<PdaSimulator />} />
        <Route path="/simulators/tm" element={<TuringMachineSimulator />} />
        
        {/* Converters */}
        <Route path="/converters/nfa-to-dfa" element={<NfaToDfaConverter />} />
        <Route path="/converters/regex-to-nfa" element={<RegexToNfaConverter />} />
        
        {/* Analyzers */}
        <Route path="/analyzers/dfa-minimizer" element={<DfaMinimizer />} />
        <Route path="/analyzers/equivalence" element={<EquivalenceChecker />} />
        
        <Route path="*" element={<Placeholder title="404 - Not Found" />} />
      </Routes>
    </main>
  );
};

export default Workspace;
