/**
 * Core engine for Deterministic Finite Automata (DFA)
 */
export class DFA {
  /**
   * @param {string[]} states - Array of state names
   * @param {string[]} alphabet - Array of input symbols
   * @param {Object} transition - Transition table { 'q0': { '0': 'q0', '1': 'q1' } }
   * @param {string} startState - Start state name
   * @param {string[]} acceptStates - Array of accept state names
   */
  constructor(states, alphabet, transition, startState, acceptStates) {
    this.states = new Set(states);
    this.alphabet = new Set(alphabet);
    this.transition = transition;
    this.startState = startState;
    this.acceptStates = new Set(acceptStates);
  }

  /**
   * Validates the DFA definition
   * @returns {Object} { isValid, error }
   */
  validate() {
    if (this.states.has('DEAD')) {
      return { isValid: false, error: "State name 'DEAD' is reserved and cannot be used." };
    }

    if (!this.states.has(this.startState)) {
      return { isValid: false, error: 'Start state must be in the set of states.' };
    }
    
    for (const state of this.acceptStates) {
      if (!this.states.has(state)) {
        return { isValid: false, error: `Accept state '${state}' is not in the set of states.` };
      }
    }

    // Check transitions
    for (const state in this.transition) {
      if (!this.states.has(state)) {
        return { isValid: false, error: `Transition state '${state}' is unknown.` };
      }
      for (const symbol in this.transition[state]) {
        if (!this.alphabet.has(symbol)) {
          return { isValid: false, error: `Transition symbol '${symbol}' is not in the alphabet.` };
        }
        const nextState = this.transition[state][symbol];
        if (!this.states.has(nextState)) {
          return { isValid: false, error: `Transition to unknown state '${nextState}'.` };
        }
      }
    }

    // Ensure total transition function: every state must define every symbol
    for (const state of this.states) {
      if (!(state in this.transition)) {
        return {
          isValid: false,
          error: `State '${state}' has no transition defined.`
        };
      }

      if (!this.transition[state]) {
        return { isValid: false, error: `Missing transition object for state '${state}'.` };
      }

      for (const symbol of this.alphabet) {
        if (!(symbol in this.transition[state])) {
          return {
            isValid: false,
            error: `Missing transition for state '${state}' with symbol '${symbol}'.`
          };
        }
      }
    }

    return { isValid: true, error: null };
  }

  /**
   * Simulates the DFA linearily
   * @param {string} inputString 
   * @returns {Object} { accepted, steps }
   */
  simulateStepByStep(inputString) {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let currentState = this.startState;
    const steps = [];

    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];

      if (!this.alphabet.has(symbol)) {
        return {
          accepted: false,
          steps: [{ step: i + 1, from: currentState, symbol, to: null, status: 'REJECT (Invalid Symbol)' }]
        };
      }

      const nextState = this.transition[currentState][symbol];

      if (!nextState) {
        throw new Error('Invalid DFA: missing transition. Run validate() first.');
      }

      steps.push({ step: i + 1, from: currentState, symbol, to: nextState, status: 'CONTINUE' });
      currentState = nextState;
    }

    const accepted = this.acceptStates.has(currentState);
    steps.push({ 
        step: 'Final', 
        from: currentState, 
        symbol: '', 
        to: currentState, 
        status: accepted ? 'ACCEPT' : 'REJECT' 
    });

    return { accepted, steps, finalState: currentState };
  }
}
