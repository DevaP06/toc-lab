/**
 * Core engine for Nondeterministic Finite Automata (NFA)
 */
export class NFA {
  constructor(states, alphabet, thirdArg, fourthArg, fifthArg) {
    this.states = new Set(states);
    this.alphabet = new Set(alphabet);

    let transitions;
    let startState;
    let acceptStates;

    // Supports both:
    // 1) (states, alphabet, transitions, startState, acceptStates)
    // 2) (states, alphabet, startState, acceptStates, transitions)
    if (typeof thirdArg === 'string') {
      startState = thirdArg;
      acceptStates = fourthArg;
      transitions = fifthArg;
    } else {
      transitions = thirdArg;
      startState = fourthArg;
      acceptStates = fifthArg;
    }

    this.transitions = this.normalizeTransitionTable(transitions || {});
    // Backward-compat alias for older code paths.
    this.transition = this.transitions;
    this.startState = startState;
    this.acceptStates = new Set(acceptStates);
  }

  normalizeEpsilonSymbol(symbol) {
    if (symbol === null || symbol === undefined) return 'ε';
    const normalized = String(symbol).trim();
    const epsSet = ['ε', 'epsilon', 'eps', 'λ'];
    if (normalized === '' || epsSet.includes(normalized.toLowerCase())) return 'ε';
    return normalized;
  }

  normalizeTransitionTable(transition) {
    const normalizedTransition = {};

    for (const fromState in transition) {
      if (!normalizedTransition[fromState]) normalizedTransition[fromState] = {};
      const stateTransitions = transition[fromState] || {};

      for (const rawSymbol in stateTransitions) {
        const symbol = this.normalizeEpsilonSymbol(rawSymbol);
        const rawTargets = stateTransitions[rawSymbol];
        const targets = Array.isArray(rawTargets) ? rawTargets : [rawTargets];

        if (!normalizedTransition[fromState][symbol]) {
          normalizedTransition[fromState][symbol] = [];
        }

        for (const target of targets) {
          if (
            target !== null
            && target !== undefined
            && !normalizedTransition[fromState][symbol].includes(target)
          ) {
            normalizedTransition[fromState][symbol].push(target);
          }
        }
      }
    }

    return normalizedTransition;
  }

  formatStateSet(statesInput) {
    const set = statesInput instanceof Set ? statesInput : new Set(statesInput);
    return `{${Array.from(set).join(', ')}}`;
  }

  validate() {
    if (!this.states.has(this.startState)) return { isValid: false, error: 'Start state must be in the set of states.' };
    for (const state of this.acceptStates) {
      if (!this.states.has(state)) return { isValid: false, error: `Accept state '${state}' is not valid.` };
    }

    for (const fromState in this.transitions) {
      if (!this.states.has(fromState)) {
        return { isValid: false, error: `Transition state '${fromState}' is unknown.` };
      }

      for (const symbol in this.transitions[fromState]) {
        if (symbol !== 'ε' && !this.alphabet.has(symbol)) {
          return { isValid: false, error: `Transition symbol '${symbol}' is not in the alphabet.` };
        }

        const targets = Array.isArray(this.transitions[fromState][symbol])
          ? this.transitions[fromState][symbol]
          : [this.transitions[fromState][symbol]];

        for (const target of targets) {
          if (!this.states.has(target)) {
            return { isValid: false, error: `Transition to unknown state '${target}'.` };
          }
        }
      }
    }

    return { isValid: true, error: null };
  }

  epsilonClosure(statesInput) {
    const stack = Array.isArray(statesInput) ? [...statesInput] : Array.from(statesInput);
    const closure = new Set(stack);
    
    while(stack.length > 0) {
      const current = stack.pop();
      const epsilonTargets = this.transitions[current]?.['ε'] || [];
      
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
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let currentStates = this.epsilonClosure([this.startState]);
    const steps = [];
    const initialSet = new Set([this.startState]);
    const initialExpression = `ε-closure(${this.formatStateSet(initialSet)}) = ${this.formatStateSet(currentStates)}`;

    steps.push({
      step: 0,
      from: initialSet,
      symbol: initialExpression,
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
           let targets = this.transitions[state]?.[symbol] || [];
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
    }

      const accepted = [...currentStates].some(s => this.acceptStates.has(s));

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
