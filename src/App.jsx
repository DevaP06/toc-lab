import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import Home from './pages/Home';
import './index.css';

const MainLayout = () => (
  <div className="main-content">
    <Sidebar />
    <Workspace />
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-container group-app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
