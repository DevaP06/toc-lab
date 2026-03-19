/**
 * Core engine for Nondeterministic Finite Automata (NFA)
 */
export class NFA {
  constructor(states, alphabet, transition, startState, acceptStates) {
    this.states = new Set(states);
    this.alphabet = new Set(alphabet);
    this.transition = transition;
    this.startState = startState;
    this.acceptStates = new Set(acceptStates);
  }

  validate() {
    if (!this.states.has(this.startState)) return { isValid: false, error: 'Start state must be in the set of states.' };
    for (const state of this.acceptStates) {
      if (!this.states.has(state)) return { isValid: false, error: `Accept state '${state}' is not valid.` };
    }
    return { isValid: true, error: null };
  }

  epsilonClosure(statesInput) {
    const stack = Array.isArray(statesInput) ? [...statesInput] : Array.from(statesInput);
    const closure = new Set(stack);
    
    while(stack.length > 0) {
      const current = stack.pop();
      const epsilonTargets = this.transition[current]?.[null] || this.transition[current]?.[''] || this.transition[current]?.['ε'] || this.transition[current]?.['epsilon'] || [];
      
      const targetsArray = Array.isArray(epsilonTargets) ? epsilonTargets : [epsilonTargets];
      
      for (const target of targetsArray) {
        if (!closure.has(target)) {
          closure.add(target);
          stack.push(target);
        }
      }
    }
    return closure;
  }

  simulateStepByStep(inputString) {
    let currentStates = this.epsilonClosure([this.startState]);
    const steps = [];

    steps.push({
      step: 0,
      from: new Set([this.startState]),
      symbol: 'ε-closure',
      to: currentStates,
      status: 'START'
    });

    for (let i = 0; i < inputString.length; i++) {
        const symbol = inputString[i];
        if (!this.alphabet.has(symbol)) {
             steps.push({ step: i + 1, from: currentStates, symbol, to: new Set(), status: 'REJECT (Invalid Symbol)' });
             return { accepted: false, steps, finalStates: new Set() };
        }

        const nextStates = new Set();
        for (const state of currentStates) {
           let targets = this.transition[state]?.[symbol] || [];
           if (!Array.isArray(targets)) targets = [targets];
           for (const t of targets) nextStates.add(t);
        }
        
        const closureStates = this.epsilonClosure(nextStates);
        
        steps.push({
           step: i + 1,
           from: currentStates,
           symbol,
           to: closureStates,
           status: closureStates.size > 0 ? 'CONTINUE' : 'DEAD PATH'
        });

        currentStates = closureStates;
        if (currentStates.size === 0) break;
    }

    let accepted = false;
    for (const s of currentStates) {
       if (this.acceptStates.has(s)) accepted = true;
    }

    steps.push({
      step: 'Final',
      from: currentStates,
      symbol: '',
      to: currentStates,
      status: accepted ? 'ACCEPT' : 'REJECT'
    });

    return { accepted, steps, finalStates: currentStates };
  }
}
