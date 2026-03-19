## / (Home Page)
Entry: `src/pages/Home.jsx`
Dependencies:
- `src/App.jsx`
  - `src/components/Navbar.jsx`
  - `src/components/Sidebar.jsx`
  - `src/components/Workspace.jsx`
    - `src/pages/Home.jsx`

## /simulators/dfa (DFA Simulator)
Entry: `src/pages/simulators/DfaSimulator.jsx`
Dependencies:
- `src/App.jsx`
  - `src/components/Navbar.jsx`
  - `src/components/Sidebar.jsx`
  - `src/components/Workspace.jsx`
    - `src/pages/simulators/DfaSimulator.jsx`
      - `src/components/automata/GraphVisualizer.jsx`

## /converters/regex-to-nfa
Entry: `src/pages/converters/RegexToNfaConverter.jsx`
Dependencies:
- `src/App.jsx`
  - `src/components/Navbar.jsx`
  - `src/components/Sidebar.jsx`
  - `src/components/Workspace.jsx`
    - `src/pages/converters/RegexToNfaConverter.jsx`
      - `src/core/regexValidator.js`
      - `src/core/converters.js`
        - `src/core/regexToPostfix.js`
        - `src/core/thompsonConstruction.js`
      - `src/components/automata/GraphVisualizer.jsx`
