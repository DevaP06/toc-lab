/**
 * Core engine for Pushdown Automata (PDA)
 */
export class PDA {
  constructor(states, inputAlphabet, stackAlphabet, startState, startStackSymbol, acceptStates, transitions) {
    this.states = new Set(states);
    this.inputAlphabet = new Set(inputAlphabet);
    this.stackAlphabet = new Set(stackAlphabet);
    this.startState = startState;
    this.startStackSymbol = startStackSymbol;
    this.acceptStates = new Set(acceptStates);
    this.transitions = transitions; // Array of { from, input, pop, push, to }
  }

  validate() {
    if (!this.states.has(this.startState)) return { isValid: false, error: 'Start state must be in the set of states.' };
    if (!this.stackAlphabet.has(this.startStackSymbol) && this.startStackSymbol !== '') return { isValid: false, error: 'Start stack symbol is invalid.' };
    return { isValid: true, error: null };
  }

  // Gets applicable transitions for a configuration
  getApplicableTransitions(state, inputSymbol, stackTop) {
    return this.transitions.filter(t => 
      t.from === state &&
      (t.input === inputSymbol || t.input === 'ε' || t.input === '') &&
      (t.pop === stackTop || t.pop === 'ε' || t.pop === '')
    );
  }

  simulateStepByStep(inputString) {
    // Each path tracks: state, stack (array of chars strings, top is last), inputConsumed, history
    let configIdCounter = 1;

    const initialConfig = {
      id: 0,
      state: this.startState,
      stack: this.startStackSymbol ? [this.startStackSymbol] : [],
      inputConsumed: 0,
      status: 'START',
      history: []
    };

    let currentConfigs = [initialConfig];
    const allSteps = [[initialConfig]]; // Array of configuration arrays per step iteration

    // Safety cap to prevent infinite loops from epsilon cycles
    const MAX_STEPS = 500;
    let stepCount = 0;
    let acceptedConfig = null;
    let timedOut = false;

    while (currentConfigs.length > 0 && stepCount < MAX_STEPS) {
      stepCount++;
      const nextConfigs = [];

      for (const config of currentConfigs) {
        // If string fully consumed, check acceptance
        if (config.inputConsumed === inputString.length) {
          if (this.acceptStates.has(config.state)) {
            acceptedConfig = config;
            config.status = 'ACCEPT';
            break; // Found acceptance — no need to explore further
          }
          // Do NOT mark rejected here yet — epsilon moves below may still reach acceptance
        }

        if (acceptedConfig) break;

        const nextSymbol = config.inputConsumed < inputString.length
          ? inputString[config.inputConsumed]
          : 'ε';
        const stackTop = config.stack.length > 0 ? config.stack[config.stack.length - 1] : '';

        let possibleMoves = this.getApplicableTransitions(config.state, nextSymbol, stackTop);
        // Always check epsilon-input moves in parallel (covers post-exhaustion epsilon chains)
        if (nextSymbol !== 'ε') {
          const eMoves = this.getApplicableTransitions(config.state, 'ε', stackTop);
          possibleMoves = possibleMoves.concat(eMoves);
        }

        if (possibleMoves.length === 0) {
          // No moves possible — this branch dies
          config.status = config.inputConsumed < inputString.length
            ? 'DEAD PATH'
            : 'REJECT (No moves, not accepted)';
        }

        for (const move of possibleMoves) {
          const newStack = [...config.stack];
          // Pop
          if (move.pop && move.pop !== 'ε') {
            newStack.pop();
          }
          // Push symbols in reverse so the first character ends up on top
          // e.g. push="AB" → push B first then A → A is top
          if (move.push && move.push !== 'ε') {
            const pushArr = move.push.split('').reverse();
            newStack.push(...pushArr);
          }

          const consumed = (move.input === 'ε' || move.input === '')
            ? config.inputConsumed
            : config.inputConsumed + 1;

          nextConfigs.push({
            id: configIdCounter++,
            state: move.to,
            stack: newStack,
            inputConsumed: consumed,
            status: 'ACTIVE',
            history: [...config.history, move]
          });
        }
      }

      if (acceptedConfig) break;

      if (nextConfigs.length > 0) {
        allSteps.push(nextConfigs);
        currentConfigs = nextConfigs;
      } else {
        break; // All configurations died
      }
    }

    if (stepCount >= MAX_STEPS && !acceptedConfig) {
      timedOut = true;
    }

    return {
      accepted: !!acceptedConfig,
      finalConfig: acceptedConfig,
      allSteps,
      timedOut
    };
  }
}
