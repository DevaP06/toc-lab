# TOC Lab

Interactive Theory of Computation playground built with React and Vite.

TOC Lab provides visual tools to simulate, convert, and analyze automata and formal-language workflows.

## Features

- Simulators: DFA, NFA, PDA, Turing Machine
- Converters: NFA to DFA, Regex to NFA (Thompson construction)
- Analyzers: DFA minimization, DFA equivalence checking
- Interactive UI with route-based workspace and landing page

## Tech Stack

- React
- Vite
- React Router
- Tailwind CSS (configured)
- ESLint

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Main Routes

- `/` -> Home page
- `/simulators/dfa`
- `/simulators/nfa`
- `/simulators/pda`
- `/simulators/tm`
- `/converters/nfa-to-dfa`
- `/converters/regex-to-nfa`
- `/analyzers/dfa-minimizer`
- `/analyzers/equivalence`

## Project Structure

- `src/pages/simulators` -> simulator pages and styles
- `src/pages/converters` -> converter pages
- `src/pages/analyzers` -> analyzer pages
- `src/core` -> automata and conversion logic
- `src/components` -> shared UI shell components
- `src/pages/home` -> landing page sections/components

## Repository Hygiene

Generated/local agent artifacts and temporary files are excluded from version control through `.gitignore`.

## License

No license file is currently defined in this repository.
