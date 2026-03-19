import React from 'react';
import './Home.css';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WavyBackground } from '../components/ui/wavy-background';

const Home = () => {
  return (
    <div className="fade-in w-full min-h-screen bg-[#0F172A] m-0 p-0 overflow-x-hidden">
      {/* Hero Section */}
      <WavyBackground className="max-w-4xl mx-auto pb-10" containerClassName="w-full m-0 p-0">
        <div className="flex flex-col items-center justify-center text-center px-4">
          <div className="badge mb-6 border border-[#6366F1] text-[#6366F1] bg-[#6366F1]/10 px-3 py-1 rounded-full text-sm font-medium">v1.0.0 Now Available</div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl text-white font-bold inter-var text-center tracking-tight mb-4">
            Theory of Computation<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Interactive Lab</span>
          </h1>
          <p className="text-base md:text-lg mt-4 text-[#9CA3AF] font-normal inter-var text-center max-w-2xl">
            Simulate automata, grammars, and machines in an interactive, visual environment designed for deep understanding.
          </p>
          <div className="flex items-center gap-4 mt-10">
            <Link to="/simulators/dfa" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all">
              <Play size={18} />
              Start Exploring
            </Link>
            <Link to="/converters/nfa-to-dfa" className="bg-transparent border border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1]/10 px-6 py-3 rounded-xl font-medium transition-all">
              View Tools
            </Link>
          </div>
        </div>
      </WavyBackground>
      
      <div className="features-section">
        <div className="feature-card glass-panel">
          <div className="feature-icon bg-accent-primary"></div>
          <h3>State Machines</h3>
          <p>Visually build and simulate DFA, NFA, and PDA with step-by-step trace execution.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-icon bg-accent-secondary"></div>
          <h3>Turing Complete</h3>
          <p>Interactive Turing Machine simulator with dynamic tape visualization and head tracking.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-icon bg-accent-highlight"></div>
          <h3>Formal Grammars</h3>
          <p>Convert CFG to CNF, generate parse trees, and run the CYK parsing algorithm.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
