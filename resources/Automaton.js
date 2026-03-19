/**
 * Creates an automaton object representing a finite automaton.
 *
 * @param {string[]} states - Array of state names
 * @param {string[]} alphabet - Array of input symbols
 * @param {Object} transitions - Transition function mapping { stateName: { symbol: [targetStates] } }
 * @param {string} startState - The start state name
 * @param {string[]} acceptStates - Array of accept state names
 * @returns {Object} Automaton object
 */
export function createAutomaton(states, alphabet, transitions, startState, acceptStates) {
  return {
    states: [...states],
    alphabet: [...alphabet],
    transitions: { ...transitions },
    startState,
    acceptStates: [...acceptStates],
  };
}
