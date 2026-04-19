import React from 'react';
import { Menu, MonitorPlay, ArrowRightLeft, Activity } from 'lucide-react';
import { AnimeNavBar } from './ui/anime-navbar';
import './Navbar.css';

const items = [
  { name: "Simulators", url: "/simulators/dfa", icon: MonitorPlay },
  { name: "Converters", url: "/converters/nfa-to-dfa", icon: ArrowRightLeft },
  { name: "Analyzers", url: "/analyzers/dfa-minimizer", icon: Activity },
];

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  return (
    <div className="navbar-shell">
      <button
        type="button"
        className="sidebar-hamburger"
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Menu size={20} />
      </button>
      <AnimeNavBar items={items} defaultActive="Simulators" />
    </div>
  );
};

export default Navbar;
