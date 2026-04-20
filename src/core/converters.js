import { DFA } from './dfa.js';
import { NFA } from './nfa.js';

/**
 * Converts an NFA to a DFA using the Subset Construction algorithm.
 * @param {NFA} nfa - The NFA instance to convert
 * @returns {Object} - Contains the resulting DFA definition, the state mapping, and construction steps
 */
export function convertNfaToDfa(nfa) {
  const isEpsilon = (symbol) => {
    const normalized = String(symbol || '').trim().toLowerCase();
    return normalized === 'ε' || normalized === 'epsilon' || normalized === 'eps' || normalized === 'λ';
  };
  const alphabet = Array.from(nfa.alphabet).filter(s => s !== null && s !== '' && !isEpsilon(s));
  const transitions = nfa.transition || {};
  const isAccept = (set) => Array.from(set).some(s => nfa.acceptStates.has(s));
  
  // Helper to format a set of states as a string name for the DFA
  const formatSetName = (set) => {
    if (!set || set.size === 0) return 'DEAD';
    return Array.from(new Set(set)).sort().join('|');
  };

  const startClosure = nfa.epsilonClosure([nfa.startState]);
  const startDfaStateName = formatSetName(startClosure);

  const dfaStates = new Set();
  const dfaTransitions = {};
  const dfaAcceptStates = new Set();
  
  // Queue stores sets of NFA states
  const queue = [startClosure];
  const processedNames = new Set([startDfaStateName]);
  
  const constructionSteps = [];

  // Initialize
  dfaStates.add(startDfaStateName);
  const startContainsAccept = isAccept(startClosure);
  if (startContainsAccept) dfaAcceptStates.add(startDfaStateName);

  constructionSteps.push({
    message: `1. Computed ε-closure of start state '${nfa.startState}' -> ${startDfaStateName}`,
    stateCreated: startDfaStateName,
    isAccept: startContainsAccept
  });

  while (queue.length > 0) {
    const currentSet = queue.shift();
    const currentName = formatSetName(currentSet);
    console.log('Processing DFA state:', currentName);
    constructionSteps.push({
      message: `Processing DFA state: ${currentName}`,
      processingState: currentName
    });
    
    if (!dfaTransitions[currentName]) dfaTransitions[currentName] = {};

    for (const symbol of alphabet) {
      console.log(' Symbol:', symbol);
      console.log('  Current Set:', Array.from(currentSet));
      // 1. Find all reachable NFA states on symbol
      const reachable = new Set();
      for (const nfaState of currentSet) {
        let targets = transitions[nfaState]?.[symbol] || [];
        if (!Array.isArray(targets)) targets = [targets];
        for (const t of targets) reachable.add(t);
      }
      console.log('  Reachable:', Array.from(reachable));

      // 2. Compute epsilon closure of the reachable states
      const closureSet = nfa.epsilonClosure(reachable);
      console.log('  Closure:', Array.from(closureSet));

      if (closureSet.size === 0) {
        console.warn(`WARNING Empty set reached from ${currentName} on '${symbol}'`);
        dfaTransitions[currentName][symbol] = 'DEAD';
        dfaStates.add('DEAD');
        processedNames.add('DEAD');
        constructionSteps.push({
          message: `From ${currentName} on '${symbol}': no reachable states, transition -> DEAD`,
          transitionAdded: `${currentName} --${symbol}--> DEAD`
        });
        continue;
      }

      const targetName = formatSetName(closureSet);

      dfaTransitions[currentName][symbol] = targetName;

      constructionSteps.push({
        message: `From ${currentName} on '${symbol}': Reachable {${Array.from(reachable).sort().join(',')}}, ε-closure -> ${targetName}`,
        transitionAdded: `${currentName} --${symbol}--> ${targetName}`
      });

      // 3. If new set, add to queue and DFA states
      if (!processedNames.has(targetName)) {
        processedNames.add(targetName);
        queue.push(closureSet);
        dfaStates.add(targetName);
        
        const accept = isAccept(closureSet);
        if (accept) dfaAcceptStates.add(targetName);
        
        constructionSteps.push({
          message: `   Added new state: ${targetName} ${accept ? '(Accepting)' : ''}`,
          stateCreated: targetName,
          isAccept: accept
        });
      }
    }
  }

  // Ensure total DFA transition function before minimization/use.
  let requiresDead = dfaStates.has('DEAD');

  for (const state of dfaStates) {
    dfaTransitions[state] = dfaTransitions[state] || {};
    for (const symbol of alphabet) {
      if (!dfaTransitions[state]?.[symbol]) {
        dfaTransitions[state][symbol] = 'DEAD';
        requiresDead = true;
      }
    }
  }

  if (requiresDead) {
    if (!dfaStates.has('DEAD')) {
      dfaStates.add('DEAD');
    }

    console.log('Adding DEAD state transitions...');
    dfaTransitions.DEAD = dfaTransitions.DEAD || {};
    for (const symbol of alphabet) {
      dfaTransitions.DEAD[symbol] = 'DEAD';
    }
  }

  console.log('DFA States:', Array.from(dfaStates));
  console.log('DFA Transitions:', dfaTransitions);

  for (const state of dfaStates) {
    for (const symbol of alphabet) {
      if (!dfaTransitions[state]?.[symbol]) {
        console.error(`Missing transition: ${state} on '${symbol}'`);
      }
    }
  }

  // Compile definition string ready for the DFA Simulator format
  const transitionLines = [];
  for (const from in dfaTransitions) {
    for (const symbol in dfaTransitions[from]) {
      transitionLines.push(`${from}, ${symbol}, ${dfaTransitions[from][symbol]}`);
    }
  }

  const dfaDefinitionObj = {
    states: Array.from(dfaStates).join(', '),
    alphabet: alphabet.join(', '),
    startState: startDfaStateName,
    acceptStates: Array.from(dfaAcceptStates).join(', '),
    transitions: transitionLines.join('\n')
  };

  // Compile full DFA instance
  const actualTransitionsObj = {};
  for (const from in dfaTransitions) {
      actualTransitionsObj[from] = {};
      for (const symbol in dfaTransitions[from]) {
          actualTransitionsObj[from][symbol] = dfaTransitions[from][symbol];
      }
  }
  
  const dfaInstance = new DFA(
      Array.from(dfaStates),
      alphabet,
      actualTransitionsObj,
      startDfaStateName,
      Array.from(dfaAcceptStates)
  );

  return { dfaDefinitionFormatted: dfaDefinitionObj, dfaInstance, constructionSteps };
}

/**
 * Regex parsing and Thompson's Construction (From user resources)
 */
export function insertConcatenation(regex) {
  let result = '';
  for (let i = 0; i < regex.length; i++) {
    const c = regex[i];
    result += c;

    if (i + 1 < regex.length) {
      const next = regex[i + 1];
      // Insert explicit concat '.' between: (operand|*|+|)) followed by (operand|()
      if (
        (isOperand(c) || c === '*' || c === '+' || c === ')') &&
        (isOperand(next) || next === '(')
      ) {
        result += '.';
      }
    }
  }
  return result;
}

export function infixToPostfix(regex) {
  // * and + are postfix (highest precedence, emitted immediately)
  const precedence = { '|': 1, '.': 2, '*': 3, '+': 3 };
  let output = '';
  const stack = [];

  for (const c of regex) {
    if (isOperand(c)) {
      output += c;
    } else if (c === '(') {
      stack.push(c);
    } else if (c === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output += stack.pop();
      }
      stack.pop();
    } else if (c === '*' || c === '+') {
      // Postfix quantifiers: emit directly (no stack needed, highest precedence)
      output += c;
    } else {
      if (!isOperand(c) && !['|', '*', '+', '(', ')', '.'].includes(c)) {
        throw new Error(`Invalid character: ${c}`);
      }
      while (
        stack.length > 0 &&
        stack[stack.length - 1] !== '(' &&
        (precedence[stack[stack.length - 1]] || 0) >= (precedence[c] || 0)
      ) {
        output += stack.pop();
      }
      stack.push(c);
    }
  }

  while (stack.length > 0) {
    output += stack.pop();
  }

  return output;
}

export function regexToPostfix(regex) {
  const withConcat = insertConcatenation(regex);
  return infixToPostfix(withConcat);
}

function isOperand(c) {
  // Any letter or digit is a valid operand symbol
  return /[a-zA-Z0-9]/.test(c);
}

const EPSILON = 'ε';

export function convertRegexToNfa(regexStr) {
  if (!regexStr || regexStr.trim() === '') {
    throw new Error('Empty regex not allowed');
  }

  const postfix = regexToPostfix(regexStr.replace(/\s+/g, ''));
  let stateCounter = 0;
  function newState() { return `q${stateCounter++}`; }

  function mergeTransitions(t1, t2) {
    const merged = {};

    const mergeFrom = (source) => {
      for (const state in source || {}) {
        if (!merged[state]) merged[state] = {};
        for (const sym in source[state] || {}) {
          const targets = Array.isArray(source[state][sym])
            ? source[state][sym]
            : [source[state][sym]];
          if (!merged[state][sym]) merged[state][sym] = [];
          for (const target of targets) {
            if (!merged[state][sym].includes(target)) {
              merged[state][sym].push(target);
            }
          }
        }
      }
    };

    mergeFrom(t1);
    mergeFrom(t2);

    return merged;
  }

  // Collect actual alphabet symbols used in the regex
  const alphabetSet = new Set();

  function symbolNFA(symbol) {
    if (symbol !== EPSILON) {
      alphabetSet.add(symbol);
    }
    const start = newState();
    const accept = newState();
    const transition = { [start]: { [symbol]: [accept] } };
    return { start, accept, transition, states: [start, accept] };
  }

  function unionNFA(frag1, frag2) {
    const start = newState();
    const accept = newState();
    const transition = mergeTransitions(mergeTransitions(frag1.transition, frag2.transition), {
      [start]: { [EPSILON]: [frag1.start, frag2.start] },
      [frag1.accept]: { [EPSILON]: [accept] },
      [frag2.accept]: { [EPSILON]: [accept] },
    });
    const states = [start, ...frag1.states, ...frag2.states, accept];
    return { start, accept, transition, states };
  }

  function concatNFA(frag1, frag2) {
    // Merge frag1.accept's epsilon targets rather than blindly overwriting,
    // in case frag1.accept already has an epsilon entry (defensive merge).
    const existingEps = frag1.transition[frag1.accept]?.[EPSILON] || [];
    const transition = mergeTransitions(mergeTransitions(frag1.transition, frag2.transition), {
      [frag1.accept]: {
        ...(frag1.transition[frag1.accept] || {}),
        [EPSILON]: [...existingEps, frag2.start],
      },
    });
    const states = [...frag1.states, ...frag2.states];
    return { start: frag1.start, accept: frag2.accept, transition, states };
  }

  function starNFA(frag) {
    const start = newState();
    const accept = newState();
    const transition = mergeTransitions(frag.transition, {
      [start]: { [EPSILON]: [frag.start, accept] },
      [frag.accept]: { [EPSILON]: [frag.start, accept] },
    });
    const states = [start, ...frag.states, accept];
    return { start, accept, transition, states };
  }

  // a+ = a followed by a* — one or more
  function plusNFA(frag) {
    const accept = newState();
    const existing = frag.transition[frag.accept] || {};
    const transition = mergeTransitions(frag.transition, {
      // From frag's accept: loop back to frag's start OR go to new accept
      [frag.accept]: {
        ...existing,
        [EPSILON]: [...(existing[EPSILON] || []), frag.start, accept],
      },
    });
    const states = [...frag.states, accept];
    return { start: frag.start, accept, transition, states };
  }

  const stack = [];

  for (const c of postfix) {
    if (isOperand(c)) {
      stack.push(symbolNFA(c));
    } else {
      switch (c) {
        case '.': {
          if (stack.length < 2) {
            throw new Error("Invalid regex: missing operand for concatenation '.'");
          }
          const frag2 = stack.pop();
          const frag1 = stack.pop();
          stack.push(concatNFA(frag1, frag2));
          break;
        }
        case '|': {
          if (stack.length < 2) {
            throw new Error("Invalid regex: missing operand after '|'");
          }
          const frag2 = stack.pop();
          const frag1 = stack.pop();
          stack.push(unionNFA(frag1, frag2));
          break;
        }
        case '*': {
          if (stack.length < 1) {
            throw new Error("Invalid regex: missing operand before '*'");
          }
          const frag = stack.pop();
          stack.push(starNFA(frag));
          break;
        }
        case '+': {
          if (stack.length < 1) {
            throw new Error("Invalid regex: missing operand before '+'");
          }
          const frag = stack.pop();
          stack.push(plusNFA(frag));
          break;
        }
        default:
          throw new Error(`Invalid regex: unexpected token '${c}'`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Invalid regex: malformed expression');
  }
  const result = stack.pop();
  const alphabetArr = Array.from(alphabetSet).sort();

  // Format to Simulator NFA structure
  const transitionLines = [];
  for (const from in result.transition) {
    for (const symbol in result.transition[from]) {
      for (const to of result.transition[from][symbol]) {
        transitionLines.push(`${from}, ${symbol}, ${to}`);
      }
    }
  }

  const nfaDefinitionObj = {
    states: result.states.join(', '),
    alphabet: alphabetArr.join(', '),
    startState: result.start,
    acceptStates: result.accept,
    transitions: transitionLines.join('\n')
  };

  const nfaInstance = new NFA(result.states, alphabetArr, result.start, [result.accept], result.transition);

  return { nfaDefinitionFormatted: nfaDefinitionObj, nfaInstance, constructionSteps: ["Compiled Regex using Thompson's Construction. Supports |, *, + and any alphanumeric alphabet."], postfix };
}
