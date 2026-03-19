## Routes Mapping

Configured using React-Router-DOM in `src/components/Workspace.jsx`:

- `/` -> `Home` page (currently a placeholder or blank)
- `/simulators/dfa` -> `DfaSimulator`
- `/simulators/nfa` -> `NfaSimulator`
- `/simulators/pda` -> `PdaSimulator`
- `/simulators/tm` -> `Placeholder`
- `/converters/nfa-to-dfa` -> `NfaToDfaConverter`
- `/converters/regex-to-nfa` -> `RegexToNfaConverter`
- `/converters/fa-to-regex` -> `FaToRegexConverter`
- `/converters/cfg-to-cnf` -> `Placeholder`
- `/grammar/cfg-derivation` -> `Placeholder`
- `/grammar/parse-tree` -> `Placeholder`
- `/grammar/cyk-parser` -> `Placeholder`
- `/analyzers/dfa-minimizer` -> `DfaMinimizer`
- `/analyzers/equivalence` -> `EquivalenceChecker`
- `/*` -> `Placeholder`

```jsx
// src/components/Workspace.jsx routes config
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Simulators */}
        <Route path="/simulators/dfa" element={<DfaSimulator />} />
        <Route path="/simulators/nfa" element={<NfaSimulator />} />
        <Route path="/simulators/pda" element={<PdaSimulator />} />
        <Route path="/simulators/tm" element={<Placeholder title="Turing Machine Simulator" />} />
        
        {/* Converters */}
        <Route path="/converters/nfa-to-dfa" element={<NfaToDfaConverter />} />
        <Route path="/converters/regex-to-nfa" element={<RegexToNfaConverter />} />
        <Route path="/converters/fa-to-regex" element={<FaToRegexConverter />} />
        <Route path="/converters/cfg-to-cnf" element={<Placeholder title="CFG → CNF Converter" />} />
        
        {/* Grammar Tools */}
        <Route path="/grammar/cfg-derivation" element={<Placeholder title="CFG Derivation Simulator" />} />
        <Route path="/grammar/parse-tree" element={<Placeholder title="Parse Tree Generator" />} />
        <Route path="/grammar/cyk-parser" element={<Placeholder title="CYK Parser" />} />
        
        {/* Analyzers */}
        <Route path="/analyzers/dfa-minimizer" element={<DfaMinimizer />} />
        <Route path="/analyzers/equivalence" element={<EquivalenceChecker />} />
        
        <Route path="*" element={<Placeholder title="404 - Not Found" />} />
      </Routes>
```
