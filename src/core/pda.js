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

function createPDADefinition({ states, inputAlphabet, stackAlphabet, startState, startStack, acceptStates, transitions }) {
  return {
    states: states.join(', '),
    inputAlphabet: inputAlphabet.join(', '),
    stackAlphabet: stackAlphabet.join(', '),
    startState,
    startStack,
    acceptStates: acceptStates.join(', '),
    transitions: transitions.map(({ from, input, pop, push, to }) => `${from}, ${input}, ${pop}, ${push}, ${to}`).join('\n')
  };
}

export function generateAnBnPDA() {
  return new PDA(
    ['q0', 'q1', 'q2'],
    ['a', 'b'],
    ['A', 'Z'],
    'q0',
    'Z',
    ['q2'],
    [
      { from: 'q0', input: 'a', pop: 'Z', push: 'AZ', to: 'q0' },
      { from: 'q0', input: 'a', pop: 'A', push: 'AA', to: 'q0' },
      { from: 'q0', input: 'b', pop: 'A', push: 'ε', to: 'q1' },
      { from: 'q1', input: 'b', pop: 'A', push: 'ε', to: 'q1' },
      { from: 'q1', input: 'ε', pop: 'Z', push: 'Z', to: 'q2' }
    ]
  );
}

export function generateEvenPalindromePDA() {
  // Even palindrome: wwᴿ  e.g. "abba", "baab", "aabbaa"
  // Phase 1 (q0): push each symbol using epsilon-pop so any stack top is accepted.
  // Midpoint guess: epsilon input + epsilon pop/push → switch to q1 without touching stack.
  // Phase 2 (q1): pop matching symbols for the second half.
  return new PDA(
    ['q0', 'q1', 'qf'],
    ['a', 'b'],
    ['a', 'b', 'Z'],
    'q0',
    'Z',
    ['qf'],
    [
      // Phase 1: push (ε pop = push on top regardless of current stack top)
      { from: 'q0', input: 'a', pop: 'ε', push: 'a', to: 'q0' },
      { from: 'q0', input: 'b', pop: 'ε', push: 'b', to: 'q0' },
      // Midpoint guess: no input consumed, stack unchanged
      { from: 'q0', input: 'ε', pop: 'ε', push: 'ε', to: 'q1' },
      // Phase 2: pop matching symbols
      { from: 'q1', input: 'a', pop: 'a', push: 'ε', to: 'q1' },
      { from: 'q1', input: 'b', pop: 'b', push: 'ε', to: 'q1' },
      // Accept when only the bottom marker Z remains
      { from: 'q1', input: 'ε', pop: 'Z', push: 'Z', to: 'qf' }
    ]
  );
}

export function generateOddPalindromePDA() {
  // Odd palindrome: wXwᴿ  e.g. "aba", "bab", "aabaa"
  // Phase 1 (q0): push each symbol using epsilon-pop so any stack top is accepted.
  // Middle-char guess: consume one symbol (the centre) without changing the stack,
  //   then switch to q1. Using ε pop/push means the stack top does not constrain
  //   which symbol we guess as the middle.
  // Phase 2 (q1): pop matching symbols for the second half.
  return new PDA(
    ['q0', 'q1', 'qf'],
    ['a', 'b'],
    ['a', 'b', 'Z'],
    'q0',
    'Z',
    ['qf'],
    [
      // Phase 1: push (ε pop = push on top regardless of current stack top)
      { from: 'q0', input: 'a', pop: 'ε', push: 'a', to: 'q0' },
      { from: 'q0', input: 'b', pop: 'ε', push: 'b', to: 'q0' },
      // Middle-character guess: consume the symbol, leave stack unchanged
      { from: 'q0', input: 'a', pop: 'ε', push: 'ε', to: 'q1' },
      { from: 'q0', input: 'b', pop: 'ε', push: 'ε', to: 'q1' },
      // Phase 2: pop matching symbols
      { from: 'q1', input: 'a', pop: 'a', push: 'ε', to: 'q1' },
      { from: 'q1', input: 'b', pop: 'b', push: 'ε', to: 'q1' },
      // Accept when only the bottom marker Z remains
      { from: 'q1', input: 'ε', pop: 'Z', push: 'Z', to: 'qf' }
    ]
  );
}

export function buildPDAFromSelection(type) {
  switch (type) {
    case 'ANBN':
      return generateAnBnPDA();
    case 'EVEN_PAL':
      return generateEvenPalindromePDA();
    case 'ODD_PAL':
      return generateOddPalindromePDA();
    default:
      throw new Error('Invalid selection');
  }
}

export function getPDASelectionPreset(type) {
  switch (type) {
    case 'ANBN': {
      const pda = generateAnBnPDA();
      return {
        label: 'aⁿbⁿ',
        sampleInput: 'aabb',
        pda,
        definition: createPDADefinition({
          states: [...pda.states],
          inputAlphabet: [...pda.inputAlphabet],
          stackAlphabet: [...pda.stackAlphabet],
          startState: pda.startState,
          startStack: pda.startStackSymbol,
          acceptStates: [...pda.acceptStates],
          transitions: pda.transitions
        })
      };
    }
    case 'EVEN_PAL': {
      const pda = generateEvenPalindromePDA();
      return {
        label: 'Even Palindrome (wwᴿ)',
        sampleInput: 'abba',
        pda,
        definition: createPDADefinition({
          states: [...pda.states],
          inputAlphabet: [...pda.inputAlphabet],
          stackAlphabet: [...pda.stackAlphabet],
          startState: pda.startState,
          startStack: pda.startStackSymbol,
          acceptStates: [...pda.acceptStates],
          transitions: pda.transitions
        })
      };
    }
    case 'ODD_PAL': {
      const pda = generateOddPalindromePDA();
      return {
        label: 'Odd Palindrome',
        sampleInput: 'aba',
        pda,
        definition: createPDADefinition({
          states: [...pda.states],
          inputAlphabet: [...pda.inputAlphabet],
          stackAlphabet: [...pda.stackAlphabet],
          startState: pda.startState,
          startStack: pda.startStackSymbol,
          acceptStates: [...pda.acceptStates],
          transitions: pda.transitions
        })
      };
    }
    case 'CUSTOM': {
      // CUSTOM returns empty definition so the UI can fill it freely
      return {
        label: 'Custom PDA',
        sampleInput: '',
        pda: null,
        definition: {
          states: 'q0, q1, q2',
          inputAlphabet: 'a, b',
          stackAlphabet: 'A, Z',
          startState: 'q0',
          startStack: 'Z',
          acceptStates: 'q2',
          transitions: 'q0, a, Z, AZ, q0\nq0, a, A, AA, q0\nq0, b, A, ε, q1\nq1, b, A, ε, q1\nq1, ε, Z, Z, q2'
        }
      };
    }
    default:
      throw new Error('Invalid selection');
  }
}

export function buildLanguageBasedPDA(languageSpec) {
  const normalized = (languageSpec || '')
    .replace(/\s+/g, '')
    .replace(/\^/g, '')
    .toLowerCase();

  const match = normalized.match(/^([a-z])n([a-z])n$/);
  if (!match) {
    return {
      error: "Unsupported language format. Try 'anbn' or 'a^n b^n'."
    };
  }

  const [, firstSymbol, secondSymbol] = match;

  if (firstSymbol === secondSymbol) {
    return {
      error: 'The two symbols in the language must be different.'
    };
  }

  const pda = new PDA(
    ['q0', 'q1', 'q2'],
    [firstSymbol, secondSymbol],
    ['A', 'Z'],
    'q0',
    'Z',
    ['q2'],
    [
      { from: 'q0', input: firstSymbol, pop: 'Z', push: `A${'Z'}`, to: 'q0' },
      { from: 'q0', input: firstSymbol, pop: 'A', push: 'AA', to: 'q0' },
      { from: 'q0', input: secondSymbol, pop: 'A', push: 'ε', to: 'q1' },
      { from: 'q1', input: secondSymbol, pop: 'A', push: 'ε', to: 'q1' },
      { from: 'q1', input: 'ε', pop: 'Z', push: 'Z', to: 'q2' }
    ]
  );

  return {
    languageSpec: `${firstSymbol}^n ${secondSymbol}^n`,
    states: 'q0, q1, q2',
    inputAlphabet: `${firstSymbol}, ${secondSymbol}`,
    stackAlphabet: 'A, Z',
    startState: 'q0',
    startStack: 'Z',
    acceptStates: 'q2',
    transitions: pda.transitions.map(({ from, input, pop, push, to }) => `${from}, ${input}, ${pop}, ${push}, ${to}`).join('\n'),
    inputString: `${firstSymbol}${firstSymbol}${secondSymbol}${secondSymbol}`,
    pda
  };
}
