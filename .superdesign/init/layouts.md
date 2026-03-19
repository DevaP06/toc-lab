## App Layout (App.jsx)
```jsx
// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
// ...imports
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <Sidebar />
          <Workspace />
        </div>
      </div>
    </Router>
  );
}
export default App;
```

## Navbar (Top Navigation)
```jsx
// src/components/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Github, HelpCircle } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar fade-in">
      <div className="navbar-left">
        <div className="logo-container">
          <BookOpen className="logo-icon" size={24} color="#6366F1" />
          <span className="logo-text">TOC Interactive Lab</span>
        </div>
      </div>
      
      <div className="navbar-center">
        <NavLink to="/simulators" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Simulators</NavLink>
        <NavLink to="/converters" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Converters</NavLink>
        <NavLink to="/grammar" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Grammar Tools</NavLink>
        <NavLink to="/analyzers" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Analyzers</NavLink>
      </div>
      
      <div className="navbar-right">
        <a href="#" className="nav-icon-link" title="Documentation">
          <HelpCircle size={20} />
          <span>Docs</span>
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="nav-icon-link" title="GitHub Source">
          <Github size={20} />
          <span>GitHub</span>
        </a>
      </div>
    </nav>
  );
};
export default Navbar;
```

## Sidebar
```jsx
// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const sections = [
    {
      title: 'SIMULATORS',
      links: [
        { name: 'DFA Simulator', path: '/simulators/dfa' },
        { name: 'NFA Simulator', path: '/simulators/nfa' },
        { name: 'PDA Simulator', path: '/simulators/pda' },
        { name: 'Turing Machine', path: '/simulators/tm' }
      ]
    },
    {
      title: 'CONVERTERS',
      links: [
        { name: 'NFA → DFA', path: '/converters/nfa-to-dfa' },
        { name: 'Regex → NFA', path: '/converters/regex-to-nfa' },
        { name: 'FA → Regex', path: '/converters/fa-to-regex' },
        { name: 'CFG → CNF', path: '/converters/cfg-to-cnf' }
      ]
    },
    {
      title: 'GRAMMAR TOOLS',
      links: [
        { name: 'CFG Derivation', path: '/grammar/cfg-derivation' },
        { name: 'Parse Tree', path: '/grammar/parse-tree' },
        { name: 'CYK Parser', path: '/grammar/cyk-parser' }
      ]
    },
    {
      title: 'ANALYZERS',
      links: [
        { name: 'DFA Minimization', path: '/analyzers/dfa-minimizer' },
        { name: 'DFA Equivalence', path: '/analyzers/equivalence' }
      ]
    }
  ];

  return (
    <aside className="sidebar fade-in">
      <div className="sidebar-content">
        {sections.map((section, idx) => (
          <div className="sidebar-section" key={idx}>
            <h4 className="sidebar-title">{section.title}</h4>
            <ul className="sidebar-list">
              {section.links.map((link, lIndex) => (
                <li key={lIndex}>
                  <NavLink 
                    to={link.path}
                    className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};
export default Sidebar;
```
