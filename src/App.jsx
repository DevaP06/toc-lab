import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

const AppShell = () => {
  const location = useLocation();
  const showChrome = location.pathname !== '/';

  return (
    <div className="app-container group-app">
      {showChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
      {showChrome && (
        <footer className="app-footer">
          <div>TOC Lab © 2026</div>
          <div className="status-indicator">
            <div className="status-dot"></div>
            System Online
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
