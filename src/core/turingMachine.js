/**
 * Core engine for Turing Machines
 */
export const BLANK_SYMBOL = '_';

export class TuringMachine {
  constructor(states, tapeAlphabet, startState, acceptState, rejectState, transition, maxSteps = 2000) {
    this.states = new Set(states);
    this.tapeAlphabet = new Set(tapeAlphabet);
    this.startState = startState;
    this.acceptState = acceptState;
    this.rejectState = rejectState;
    this.transition = transition || {};
    this.maxSteps = maxSteps;
  }

  validate() {
    if (!this.states.has(this.startState)) {
      return { isValid: false, error: 'Start state must exist in the set of states.' };
    }

    if (!this.states.has(this.acceptState)) {
      return { isValid: false, error: 'Accept state must exist in the set of states.' };
    }

    if (!this.states.has(this.rejectState)) {
      return { isValid: false, error: 'Reject state must exist in the set of states.' };
    }

    if (!this.tapeAlphabet.has(BLANK_SYMBOL)) {
      return { isValid: false, error: 'Tape alphabet must include the blank symbol "_".' };
    }

    for (const [state, transitionsBySymbol] of Object.entries(this.transition)) {
      if (!this.states.has(state)) {
        return { isValid: false, error: `Transition state "${state}" is not in the set of states.` };
      }

      for (const [readSymbol, transition] of Object.entries(transitionsBySymbol || {})) {
        if (!transition || typeof transition !== 'object') {
          return { isValid: false, error: `Transition for state "${state}" and symbol "${readSymbol}" is invalid.` };
        }

        const { write, move, next } = transition;

        if (!this.states.has(next)) {
          return { isValid: false, error: `Transition from "${state}" references invalid next state "${next}".` };
        }

        if (!['L', 'R', 'S'].includes(move)) {
          return { isValid: false, error: `Invalid move "${move}". Use L, R, or S.` };
        }

        if (!this.tapeAlphabet.has(readSymbol) && readSymbol !== BLANK_SYMBOL) {
          return { isValid: false, error: `Read symbol "${readSymbol}" is not in the tape alphabet.` };
        }

        if (!this.tapeAlphabet.has(write) && write !== BLANK_SYMBOL) {
          return { isValid: false, error: `Write symbol "${write}" is not in the tape alphabet.` };
        }
      }
    }

    return { isValid: true, error: null };
  }

  getTransition(state, symbol) {
    return this.transition?.[state]?.[symbol] || null;
  }

  simulateStepByStep(inputString) {
    for (const ch of inputString || '') {
      if (!this.tapeAlphabet.has(ch)) {
        throw new Error(`Invalid symbol "${ch}" in input`);
      }
    }

    const tape = (inputString && inputString.length > 0)
      ? inputString.split('')
      : [];

    if (tape.length === 0 || tape[tape.length - 1] !== BLANK_SYMBOL) {
      tape.push(BLANK_SYMBOL);
    }

    let head = 0;
    let state = this.startState;
    const allSteps = [];
    let accepted = false;
    let timedOut = false;

    const ensureTapeBounds = () => {
      while (head < 0) {
        tape.unshift(BLANK_SYMBOL);
        head += 1;
      }

      while (head >= tape.length) {
        tape.push(BLANK_SYMBOL);
      }
    };

    const pushStep = (snapshot) => {
      allSteps.push({ ...snapshot, tape: [...snapshot.tape] });
      return allSteps[allSteps.length - 1];
    };

    ensureTapeBounds();

    let currentSnapshot = pushStep({
      step: 0,
      state,
      tape: [...tape],
      head,
      readSymbol: tape[head] || BLANK_SYMBOL,
      action: 'Initial configuration',
      status: 'START',
      transition: null
    });

    if (state === this.acceptState) {
      currentSnapshot.status = 'ACCEPT';
      return {
        accepted: true,
        finalConfig: currentSnapshot,
        allSteps,
        timedOut: false
      };
    }

    if (state === this.rejectState) {
      currentSnapshot.status = 'REJECT';
      return {
        accepted: false,
        finalConfig: currentSnapshot,
        allSteps,
        timedOut: false
      };
    }

    for (let iteration = 0; iteration < this.maxSteps; iteration++) {
      ensureTapeBounds();

      const readSymbol = tape[head] || BLANK_SYMBOL;
      const transition = this.getTransition(state, readSymbol);

      if (!transition) {
        currentSnapshot = pushStep({
          step: allSteps.length,
          state,
          tape: [...tape],
          head,
          readSymbol,
          action: `No transition for (${state}, ${readSymbol})`,
          status: 'REJECT',
          transition: null
        });
        break;
      }

      const previousState = state;
      const { write, move, next } = transition;
      tape[head] = write;

      if (move === 'L') {
        head -= 1;
      } else if (move === 'R') {
        head += 1;
      }

      ensureTapeBounds();
      state = next;

      const status = state === this.acceptState
        ? 'ACCEPT'
        : state === this.rejectState
          ? 'REJECT'
          : 'ACTIVE';

      currentSnapshot = pushStep({
        step: allSteps.length,
        state,
        tape: [...tape],
        head,
        readSymbol,
        action: `(${previousState}, ${readSymbol}) → (${next}, ${write}, ${move})`,
        status,
        transition: { from: previousState, read: readSymbol, write, move, next }
      });

      if (status === 'ACCEPT') {
        accepted = true;
        break;
      }

      if (status === 'REJECT') {
        break;
      }
    }

    if (!accepted && currentSnapshot.status !== 'REJECT' && currentSnapshot.status !== 'ACCEPT') {
      timedOut = true;
      currentSnapshot = { ...currentSnapshot, status: 'TIMEOUT' };
      allSteps[allSteps.length - 1] = currentSnapshot;
    }

    return {
      accepted,
      finalConfig: currentSnapshot,
      allSteps,
      timedOut
    };
  }
}

const createTransitionsObject = (transitionList) => {
  const transitionMap = {};

  transitionList.forEach(({ from, read, write, move, next }) => {
    if (!transitionMap[from]) transitionMap[from] = {};
    if (transitionMap[from][read]) {
      throw new Error(`Duplicate transition for (${from}, ${read})`);
    }
    transitionMap[from][read] = { write, move, next };
  });

  return transitionMap;
};

const createDefinition = ({ states, tapeAlphabet, startState, acceptState, rejectState, transitionList, inputString }) => ({
  states: states.join(', '),
  tapeAlphabet: tapeAlphabet.join(', '),
  startState,
  acceptState,
  rejectState,
  transitions: transitionList.map(({ from, read, write, move, next }) => `${from}, ${read} → ${next}, ${write}, ${move}`).join('\n'),
  inputString
});

const createPreset = ({ label, inputString, states, tapeAlphabet, startState, acceptState, rejectState, transitionList }) => {
  const machine = new TuringMachine(states, tapeAlphabet, startState, acceptState, rejectState, createTransitionsObject(transitionList));

  return {
    label,
    inputString,
    machine,
    definition: createDefinition({
      states,
      tapeAlphabet,
      startState,
      acceptState,
      rejectState,
      transitionList,
      inputString
    })
  };
};

export function generateBinaryIncrementTM() {
  return createPreset({
    label: 'Binary Increment Machine',
    inputString: '1011',
    states: ['q0', 'q1', 'qa', 'qr'],
    tapeAlphabet: ['0', '1', '_'],
    startState: 'q0',
    acceptState: 'qa',
    rejectState: 'qr',
    transitionList: [
      { from: 'q0', read: '0', write: '0', move: 'R', next: 'q0' },
      { from: 'q0', read: '1', write: '1', move: 'R', next: 'q0' },
      { from: 'q0', read: '_', write: '_', move: 'L', next: 'q1' },
      { from: 'q1', read: '0', write: '1', move: 'S', next: 'qa' },
      { from: 'q1', read: '1', write: '0', move: 'L', next: 'q1' },
      { from: 'q1', read: '_', write: '1', move: 'S', next: 'qa' }
    ]
  });
}

export function generateEvenOnesTM() {
  return createPreset({
    label: 'Even number of 1s',
    inputString: '10110',
    states: ['qEven', 'qOdd', 'qa', 'qr'],
    tapeAlphabet: ['0', '1', '_'],
    startState: 'qEven',
    acceptState: 'qa',
    rejectState: 'qr',
    transitionList: [
      { from: 'qEven', read: '0', write: '0', move: 'R', next: 'qEven' },
      { from: 'qEven', read: '1', write: '1', move: 'R', next: 'qOdd' },
      { from: 'qEven', read: '_', write: '_', move: 'S', next: 'qa' },
      { from: 'qOdd', read: '0', write: '0', move: 'R', next: 'qOdd' },
      { from: 'qOdd', read: '1', write: '1', move: 'R', next: 'qEven' },
      { from: 'qOdd', read: '_', write: '_', move: 'S', next: 'qr' }
    ]
  });
}

export function generateReplaceOneWithZeroTM() {
  return createPreset({
    label: 'Replace 1 with 0',
    inputString: '110101',
    states: ['q0', 'qa', 'qr'],
    tapeAlphabet: ['0', '1', '_'],
    startState: 'q0',
    acceptState: 'qa',
    rejectState: 'qr',
    transitionList: [
      { from: 'q0', read: '0', write: '0', move: 'R', next: 'q0' },
      { from: 'q0', read: '1', write: '0', move: 'R', next: 'q0' },
      { from: 'q0', read: '_', write: '_', move: 'S', next: 'qa' }
    ]
  });
}

export function generatePalindromeCheckerTM() {
  return createPreset({
    label: 'Palindrome checker',
    inputString: 'abba',
    states: ['q0', 'q1a', 'q1b', 'q2a', 'q2b', 'qBack', 'qa', 'qr'],
    tapeAlphabet: ['a', 'b', 'X', 'Y', '_'],
    startState: 'q0',
    acceptState: 'qa',
    rejectState: 'qr',
    transitionList: [
      { from: 'q0', read: 'X', write: 'X', move: 'R', next: 'q0' },
      { from: 'q0', read: 'Y', write: 'Y', move: 'R', next: 'q0' },
      { from: 'q0', read: 'a', write: 'X', move: 'R', next: 'q1a' },
      { from: 'q0', read: 'b', write: 'Y', move: 'R', next: 'q1b' },
      { from: 'q0', read: '_', write: '_', move: 'S', next: 'qa' },

      { from: 'q1a', read: 'a', write: 'a', move: 'R', next: 'q1a' },
      { from: 'q1a', read: 'b', write: 'b', move: 'R', next: 'q1a' },
      { from: 'q1a', read: 'X', write: 'X', move: 'R', next: 'q1a' },
      { from: 'q1a', read: 'Y', write: 'Y', move: 'R', next: 'q1a' },
      { from: 'q1a', read: '_', write: '_', move: 'L', next: 'q2a' },

      { from: 'q1b', read: 'a', write: 'a', move: 'R', next: 'q1b' },
      { from: 'q1b', read: 'b', write: 'b', move: 'R', next: 'q1b' },
      { from: 'q1b', read: 'X', write: 'X', move: 'R', next: 'q1b' },
      { from: 'q1b', read: 'Y', write: 'Y', move: 'R', next: 'q1b' },
      { from: 'q1b', read: '_', write: '_', move: 'L', next: 'q2b' },

      { from: 'q2a', read: 'X', write: 'X', move: 'L', next: 'q2a' },
      { from: 'q2a', read: 'Y', write: 'Y', move: 'L', next: 'q2a' },
      { from: 'q2a', read: 'a', write: 'X', move: 'L', next: 'qBack' },
      { from: 'q2a', read: 'b', write: 'b', move: 'S', next: 'qr' },
      { from: 'q2a', read: '_', write: '_', move: 'S', next: 'qa' },

      { from: 'q2b', read: 'X', write: 'X', move: 'L', next: 'q2b' },
      { from: 'q2b', read: 'Y', write: 'Y', move: 'L', next: 'q2b' },
      { from: 'q2b', read: 'b', write: 'Y', move: 'L', next: 'qBack' },
      { from: 'q2b', read: 'a', write: 'a', move: 'S', next: 'qr' },
      { from: 'q2b', read: '_', write: '_', move: 'S', next: 'qa' },

      { from: 'qBack', read: 'a', write: 'a', move: 'L', next: 'qBack' },
      { from: 'qBack', read: 'b', write: 'b', move: 'L', next: 'qBack' },
      { from: 'qBack', read: 'X', write: 'X', move: 'L', next: 'qBack' },
      { from: 'qBack', read: 'Y', write: 'Y', move: 'L', next: 'qBack' },
      { from: 'qBack', read: '_', write: '_', move: 'R', next: 'q0' }
    ]
  });
}

export function buildTMFromSelection(type) {
  switch (type) {
    case 'BINARY_INCREMENT':
      return generateBinaryIncrementTM().machine;
    case 'EVEN_ONES':
      return generateEvenOnesTM().machine;
    case 'REPLACE_1_WITH_0':
      return generateReplaceOneWithZeroTM().machine;
    case 'PALINDROME':
      return generatePalindromeCheckerTM().machine;
    default:
      throw new Error('Invalid selection');
  }
}

export function getTMPreset(type) {
  switch (type) {
    case 'BINARY_INCREMENT':
      return generateBinaryIncrementTM();
    case 'EVEN_ONES':
      return generateEvenOnesTM();
    case 'REPLACE_1_WITH_0':
      return generateReplaceOneWithZeroTM();
    case 'PALINDROME':
      return generatePalindromeCheckerTM();
    default:
      throw new Error('Invalid selection');
  }
}