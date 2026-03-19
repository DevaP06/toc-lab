import { createAutomaton } from '../models/Automaton.js';

const EPSILON = 'ε';

let stateCounter = 0;

function newState() {
  return `q${stateCounter++}`;
}

/**
 * Resets the state counter. Useful for testing.
 */
export function resetStateCounter() {
  stateCounter = 0;
}

/**
 * Creates a basic NFA fragment for a single symbol.
 *
 *   start --symbol--> accept
 */
function symbolNFA(symbol) {
  const start = newState();
  const accept = newState();
  const transitions = {
    [start]: { [symbol]: [accept] },
  };
  return { start, accept, transitions, states: [start, accept] };
}

/**
 * Creates an NFA for the union (|) of two NFA fragments.
 *
 *              ε --> frag1.start ... frag1.accept --> ε
 *   start -->                                           --> accept
 *              ε --> frag2.start ... frag2.accept --> ε
 */
function unionNFA(frag1, frag2) {
  const start = newState();
  const accept = newState();
  const transitions = {
    ...frag1.transitions,
    ...frag2.transitions,
    [start]: { [EPSILON]: [frag1.start, frag2.start] },
    [frag1.accept]: { [EPSILON]: [accept] },
    [frag2.accept]: { [EPSILON]: [accept] },
  };
  const states = [start, ...frag1.states, ...frag2.states, accept];
  return { start, accept, transitions, states };
}

/**
 * Creates an NFA for the concatenation (.) of two NFA fragments.
 *
 *   frag1.start ... frag1.accept --ε--> frag2.start ... frag2.accept
 */
function concatNFA(frag1, frag2) {
  const transitions = {
    ...frag1.transitions,
    ...frag2.transitions,
    [frag1.accept]: { [EPSILON]: [frag2.start] },
  };
  const states = [...frag1.states, ...frag2.states];
  return { start: frag1.start, accept: frag2.accept, transitions, states };
}

/**
 * Creates an NFA for the Kleene star (*) of an NFA fragment.
 *
 *   start --ε--> frag.start ... frag.accept --ε--> accept
 *     |                   <----ε----                  ^
 *     +------------------ε----------------------------+
 */
function starNFA(frag) {
  const start = newState();
  const accept = newState();
  const transitions = {
    ...frag.transitions,
    [start]: { [EPSILON]: [frag.start, accept] },
    [frag.accept]: { [EPSILON]: [frag.start, accept] },
  };
  const states = [start, ...frag.states, accept];
  return { start, accept, transitions, states };
}

/**
 * Builds an ε-NFA from a postfix regex expression using Thompson Construction.
 *
 * @param {string} postfix - The postfix regex expression
 * @returns {Object} Automaton object representing the ε-NFA
 */
export function thompsonConstruction(postfix) {
  resetStateCounter();
  const stack = [];

  for (const c of postfix) {
    switch (c) {
      case 'a':
      case 'b':
        stack.push(symbolNFA(c));
        break;
      case '.': {
        const frag2 = stack.pop();
        const frag1 = stack.pop();
        stack.push(concatNFA(frag1, frag2));
        break;
      }
      case '|': {
        const frag2 = stack.pop();
        const frag1 = stack.pop();
        stack.push(unionNFA(frag1, frag2));
        break;
      }
      case '*': {
        const frag = stack.pop();
        stack.push(starNFA(frag));
        break;
      }
      default:
        break;
    }
  }

  const result = stack.pop();
  return createAutomaton(
    result.states,
    ['a', 'b'],
    result.transitions,
    result.start,
    [result.accept]
  );
}
