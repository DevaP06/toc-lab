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
    
    // Safety break to prevent infinite loops from epsilon cycles
    const MAX_STEPS = 200;
    let stepCount = 0;
    let acceptedConfig = null;

    while (currentConfigs.length > 0 && stepCount < MAX_STEPS) {
      stepCount++;
      const nextConfigs = [];
      let advancedInput = false;

      for (const config of currentConfigs) {
        // If string fully consumed
        if (config.inputConsumed === inputString.length) {
           if (this.acceptStates.has(config.state)) {
             acceptedConfig = config;
             config.status = 'ACCEPT';
           } else {
             // Still check for epsilon transitions that could lead to accept!
             const epsilonMoves = this.getApplicableTransitions(config.state, 'ε', config.stack[config.stack.length - 1] || '');
             if (epsilonMoves.length === 0) {
               config.status = 'REJECT (No input left, not accepted)';
             } else {
               config.status = 'EVALUATING EPSILON';
             }
           }
        }

        if (acceptedConfig) break;

        const nextSymbol = config.inputConsumed < inputString.length ? inputString[config.inputConsumed] : 'ε';
        const stackTop = config.stack.length > 0 ? config.stack[config.stack.length - 1] : '';
        
        let possibleMoves = this.getApplicableTransitions(config.state, nextSymbol, stackTop);
        // Also add pure epsilon input moves if we haven't exhausted string entirely
        if (nextSymbol !== 'ε') {
           const eMoves = this.getApplicableTransitions(config.state, 'ε', stackTop);
           possibleMoves = possibleMoves.concat(eMoves);
        }

        if (possibleMoves.length === 0 && config.inputConsumed < inputString.length) {
           config.status = 'DEAD PATH';
        }

        for (const move of possibleMoves) {
           const newStack = [...config.stack];
           // Pop
           if (move.pop && move.pop !== 'ε') {
             newStack.pop();
           }
           // Push (push symbols individually if it's a string like "AZ", but usually defined sequentially)
           // If 'push' is "AB", we usually push 'B' then 'A' so 'A' is on top. We'll push in reverse order.
           if (move.push && move.push !== 'ε') {
             const pushArr = move.push.split('').reverse();
             newStack.push(...pushArr);
           }

           const consumed = (move.input === 'ε' || move.input === '') ? config.inputConsumed : config.inputConsumed + 1;
           if (consumed > config.inputConsumed) advancedInput = true;

           nextConfigs.push({
             id: Math.random(),
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

    return { 
      accepted: !!acceptedConfig, 
      finalConfig: acceptedConfig,
      allSteps 
    };
  }
}
