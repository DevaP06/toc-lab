import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const SidebarNavItem = ({ path, badge, label }) => (
  <NavLink
    to={path}
    className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
    title={label}
    data-tooltip={label}
  >
    <span className="sidebar-badge" aria-hidden="true">{badge}</span>
    <span className="sidebar-link-text">{label}</span>
  </NavLink>
);

const Sidebar = ({ collapsed = false }) => {
  const sections = [
    {
      title: 'SIMULATORS',
      links: [
        { badge: 'DFA', label: 'Deterministic Finite Automaton', path: '/simulators/dfa' },
        { badge: 'NFA', label: 'Nondeterministic Finite Automaton', path: '/simulators/nfa' },
        { badge: 'PDA', label: 'Pushdown Automaton', path: '/simulators/pda' },
        { badge: 'TM', label: 'Turing Machine', path: '/simulators/tm' }
      ]
    },
    {
      title: 'CONVERTERS',
      links: [
        { badge: 'N2D', label: 'NFA to DFA', path: '/converters/nfa-to-dfa' },
        { badge: 'R2N', label: 'Regex to NFA', path: '/converters/regex-to-nfa' },
        { badge: 'F2R', label: 'FA to Regex', path: '/converters/fa-to-regex' }
      ]
    },
    {
      title: 'ANALYZERS',
      links: [
        { badge: 'MIN', label: 'DFA Minimization', path: '/analyzers/dfa-minimizer' },
        { badge: 'EQV', label: 'DFA Equivalence', path: '/analyzers/equivalence' }
      ]
    }
  ];

  return (
    <aside className={`sidebar fade-in ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {sections.map((section, idx) => (
          <div className="sidebar-section" key={idx}>
            <h4 className="sidebar-title">{section.title}</h4>
            <ul className="sidebar-list">
              {section.links.map((link, lIndex) => (
                <li key={lIndex}>
                  <SidebarNavItem path={link.path} badge={link.badge} label={link.label} />
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
