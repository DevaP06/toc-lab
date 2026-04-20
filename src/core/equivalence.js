/**
 * Checks if two DFAs are equivalent by BFS on the product automaton.
 * Supports different alphabets by completing each DFA over the union alphabet.
 * @param {DFA} dfa1 - First DFA
 * @param {DFA} dfa2 - Second DFA
 * @returns {Object} Detailed equivalence result with witness when not equivalent
 */
export function checkEquivalence(dfa1, dfa2) {
  const steps = [];
  const alphabet = Array.from(new Set([...dfa1.alphabet, ...dfa2.alphabet])).sort();

  steps.push(`1. Using union alphabet: {${alphabet.join(', ')}}`);

  const normalizedA = completeDfaForAlphabet(dfa1, alphabet, 'A', steps);
  const normalizedB = completeDfaForAlphabet(dfa2, alphabet, 'B', steps);

  const startPair = { a: normalizedA.startState, b: normalizedB.startState };
  const startKey = pairKey(startPair.a, startPair.b);

  const queue = [startPair];
  const visited = new Set([startKey]);
  const parent = new Map();
  const pairInfo = new Map([[startKey, startPair]]);
  const exploredPairs = [];

  steps.push(`2. Running BFS from (${displayA(startPair.a)}, ${displayB(startPair.b)}) in product automaton.`);

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = pairKey(current.a, current.b);

    const aAccept = normalizedA.acceptStates.has(current.a);
    const bAccept = normalizedB.acceptStates.has(current.b);

    if (aAccept !== bAccept) {
      const counterExample = reconstructCounterexample(currentKey, parent);
      const pairTrace = reconstructPairTrace(currentKey, parent, pairInfo);
      const reason = `Mismatch at (${displayA(current.a)}, ${displayB(current.b)})`;

      steps.push(`3. Found acceptance mismatch at (${displayA(current.a)}, ${displayB(current.b)}).`);
      steps.push(`4. Shortest counterexample by BFS: "${counterExample}"`);

      return {
        isEquivalent: false,
        counterExample,
        reason,
        mismatchPair: { a: displayA(current.a), b: displayB(current.b) },
        alphabet,
        exploredPairs,
        pairTrace,
        steps
      };
    }

    for (const symbol of alphabet) {
      const nextA = normalizedA.transition[current.a][symbol];
      const nextB = normalizedB.transition[current.b][symbol];
      const nextKey = pairKey(nextA, nextB);

      exploredPairs.push({
        from: `(${displayA(current.a)}, ${displayB(current.b)})`,
        symbol,
        to: `(${displayA(nextA)}, ${displayB(nextB)})`
      });

      if (!visited.has(nextKey)) {
        visited.add(nextKey);
        queue.push({ a: nextA, b: nextB });
        parent.set(nextKey, { prev: currentKey, symbol });
        pairInfo.set(nextKey, { a: nextA, b: nextB });
      }
    }
  }

  steps.push(`3. BFS completed with ${visited.size} reachable state pairs and no acceptance mismatch.`);
  steps.push('4. DFA A and DFA B are equivalent.');

  return {
    isEquivalent: true,
    counterExample: null,
    reason: 'No reachable mismatch pair found.',
    mismatchPair: null,
    alphabet,
    exploredPairs,
    pairTrace: [],
    steps
  };
}

function pairKey(a, b) {
  return `${a}\x00${b}`;
}

function displayA(state) {
  return `A_${state}`;
}

function displayB(state) {
  return `B_${state}`;
}

function reconstructCounterexample(endKey, parent) {
  const symbols = [];
  let current = endKey;

  while (parent.has(current)) {
    const edge = parent.get(current);
    symbols.push(edge.symbol);
    current = edge.prev;
  }

  symbols.reverse();
  return symbols.join('');
}

function reconstructPairTrace(endKey, parent, pairInfo) {
  const edges = [];
  let current = endKey;

  while (parent.has(current)) {
    const edge = parent.get(current);
    edges.push({ key: current, symbol: edge.symbol });
    current = edge.prev;
  }

  edges.reverse();

  const trace = [];
  let fromKey = current;
  const fromPair = pairInfo.get(fromKey);
  if (fromPair) {
    trace.push({ pair: `(${displayA(fromPair.a)}, ${displayB(fromPair.b)})`, symbol: null });
  }

  for (const edge of edges) {
    const toPair = pairInfo.get(edge.key);
    if (!toPair) continue;
    trace.push({
      pair: `(${displayA(toPair.a)}, ${displayB(toPair.b)})`,
      symbol: edge.symbol
    });
  }

  return trace;
}

function completeDfaForAlphabet(dfa, alphabet, label, steps) {
  const states = new Set(dfa.states);
  const acceptStates = new Set(dfa.acceptStates);
  const transition = {};

  for (const state of states) {
    transition[state] = { ...(dfa.transition[state] || {}) };
  }

  let deadState = 'DEAD';
  let suffix = 1;
  while (states.has(deadState)) {
    deadState = `DEAD_${suffix}`;
    suffix += 1;
  }

  let addedDead = false;

  for (const state of Array.from(states)) {
    if (!transition[state]) transition[state] = {};

    for (const symbol of alphabet) {
      if (!(symbol in transition[state])) {
        transition[state][symbol] = deadState;
        addedDead = true;
      }
    }
  }

  if (addedDead) {
    states.add(deadState);
    transition[deadState] = {};
    for (const symbol of alphabet) {
      transition[deadState][symbol] = deadState;
    }
    steps.push(`- DFA ${label}: added DEAD state '${deadState}' and completed missing transitions.`);
  } else {
    steps.push(`- DFA ${label}: already complete for union alphabet.`);
  }

  return {
    states,
    acceptStates,
    transition,
    startState: dfa.startState,
    deadState: addedDead ? deadState : null
  };
}
