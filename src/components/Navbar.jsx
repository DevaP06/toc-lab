import React from 'react';
import { MonitorPlay, ArrowRightLeft, BookOpenText, Activity } from 'lucide-react';
import { AnimeNavBar } from './ui/anime-navbar';
import './Navbar.css';

const items = [
  { name: "Simulators", url: "/simulators/dfa", icon: MonitorPlay },
  { name: "Converters", url: "/converters/nfa-to-dfa", icon: ArrowRightLeft },
  { name: "Grammar Tools", url: "/grammar/cfg-derivation", icon: BookOpenText },
  { name: "Analyzers", url: "/analyzers/dfa-minimizer", icon: Activity },
];

const Navbar = () => {
  return <AnimeNavBar items={items} defaultActive="Simulators" />;
};

export default Navbar;
