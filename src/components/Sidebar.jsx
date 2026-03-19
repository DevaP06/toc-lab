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
