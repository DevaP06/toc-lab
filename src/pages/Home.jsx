import React from 'react';
import './Home.css';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WavyBackground } from '../components/ui/wavy-background';

const Home = () => {
  return (
    <div className="fade-in w-full min-h-screen bg-[#0F172A] m-0 p-0 overflow-x-hidden">
      {/* Hero Section */}
      <WavyBackground waveOpacity={0.35} blur={15} className="max-w-5xl mx-auto pb-10" containerClassName="w-full m-0 p-0">
        <div className="flex flex-col items-center justify-center text-center px-6 sm:px-8 md:px-12">
          <div className="badge mb-8 border border-[#6366F1]/50 text-[#818cf8] bg-[#6366F1]/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-wide">v1.0.0 Now Available</div>
          <h1 className="text-[40px] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] text-white font-bold inter-var text-center tracking-tight mb-6 drop-shadow-md">
            Theory of Computation<br/>
            <span className="text-[#60A5FA] drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">Interactive Lab</span>
          </h1>
          <p className="text-[16px] sm:text-lg md:text-xl text-[#B0B9C3] font-medium inter-var text-center max-w-3xl leading-relaxed">
            Simulate automata, grammars, and machines in an interactive, visual environment designed for deep understanding.
          </p>
          <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-3 sm:gap-4 mt-10">
            <Link to="/simulators/dfa" className="w-full sm:w-auto justify-center h-12 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-8 rounded-full font-semibold flex items-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5">
              <Play size={18} />
              Start Exploring
            </Link>
            <Link to="/converters/nfa-to-dfa" className="w-full sm:w-auto justify-center h-12 bg-transparent border-2 border-[#6366F1]/70 text-[#a5b4fc] hover:bg-[#6366F1]/10 px-8 rounded-full font-semibold transition-all hover:-translate-y-0.5">
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
