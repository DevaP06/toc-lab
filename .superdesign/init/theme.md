## Theme Spec
Built using vanilla CSS variables.

### globals / index.css
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-primary: #0F172A;
  --bg-secondary: #111827;
  --bg-card: #1F2937;
  --border: #374151;
  
  --accent-primary: #6366F1;
  --accent-primary-hover: #4F46E5;
  --accent-secondary: #22C55E;
  --accent-secondary-hover: #16A34A;
  --accent-highlight: #F59E0B;
  --accent-highlight-hover: #D97706;
  --error: #EF4444;
  --error-hover: #DC2626;
  
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  
  --font-main: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Base App Layout */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px; /* Navbar height */
}

.workspace-area {
  flex: 1;
  background-color: var(--bg-primary);
  padding: 32px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}

.btn {
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-family: var(--font-main);
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary { background-color: var(--accent-primary); color: white; }
.btn-success { background-color: var(--accent-secondary); color: white; }
.btn-warning { background-color: var(--accent-highlight); color: white; }
.btn-danger { background-color: var(--error); color: white; }
```
