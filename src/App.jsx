import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import Home from './pages/Home';
import './index.css';

const MainLayout = ({ sidebarCollapsed, onToggleSidebar }) => (
  <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
    <Sidebar collapsed={sidebarCollapsed} />
    <Workspace />
    <button
      type="button"
      className="sidebar-toggle-fab"
      onClick={onToggleSidebar}
      aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      ☰
    </button>
  </div>
);

const AppShell = () => {
  const location = useLocation();
  const showChrome = location.pathname !== '/';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  React.useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    if (showChrome) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [showChrome]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="app-container group-app">
      {showChrome && <Navbar onToggleSidebar={handleToggleSidebar} sidebarCollapsed={sidebarCollapsed} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/*"
          element={(
            <MainLayout
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
            />
          )}
        />
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
