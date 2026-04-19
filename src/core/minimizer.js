import { DFA } from './dfa.js';

/**
 * Minimizes a DFA using the Table-Filling (Myhill-Nerode) algorithm.
 * @param {DFA} dfa - The original DFA
 * @param {{removeDead?: boolean}} options - Minimization options
 * @returns {Object} - Resulting DFA, equivalence classes, and steps
 */
export function minimizeDFA(dfa, options = { removeDead: false }) {
  const steps = [];

  // 1. Remove unreachable states
  const reachable = new Set([dfa.startState]);
  const queue = [dfa.startState];
  const alphabet = Array.from(dfa.alphabet);
  
  while (queue.length > 0) {
    const s = queue.shift();
    for (const a of alphabet) {
      if (dfa.transition[s] && dfa.transition[s][a]) {
        const target = dfa.transition[s][a];
        if (!reachable.has(target)) {
          reachable.add(target);
          queue.push(target);
        }
      }
    }
  }

  const states = Array.from(reachable);
  steps.push(`1. Removed unreachable states. Reachable states: {${states.join(', ')}}`);

  // 2. Ensure complete DFA transitions with explicit DEAD sink.
  const transitions = {};
  for (const state of states) {
    transitions[state] = { ...(dfa.transition[state] || {}) };
  }

  let needsDead = false;
  for (const state of states) {
    for (const symbol of alphabet) {
      if (!transitions[state]?.[symbol]) {
        transitions[state][symbol] = 'DEAD';
        needsDead = true;
      }
    }
  }

  const workingStates = [...states];
  if (needsDead) {
    workingStates.push('DEAD');
    transitions.DEAD = transitions.DEAD || {};
    for (const symbol of alphabet) {
      transitions.DEAD[symbol] = 'DEAD';
    }
    steps.push('2. Completed DFA transitions by adding DEAD sink state.');
  } else {
    steps.push('2. DFA transition table already complete (no DEAD sink needed).');
  }

  const acceptSet = new Set(
    Array.from(dfa.acceptStates).filter(s => workingStates.includes(s))
  );
  const nonAcceptSet = new Set(
    workingStates.filter(s => !acceptSet.has(s))
  );

  // 3. Initialize partitions.
  let partitions = [];
  if (acceptSet.size > 0) partitions.push(acceptSet);
  if (nonAcceptSet.size > 0) partitions.push(nonAcceptSet);
  steps.push('3. Initialized partitions into accepting and non-accepting groups.');

  // 4. Refine partitions iteratively.
  let changed = true;
  let iteration = 1;

  const findPartitionIndex = (state, currentPartitions) =>
    currentPartitions.findIndex(group => group.has(state));

  while (changed) {
    changed = false;
    const newPartitions = [];

    for (const group of partitions) {
      const subgroups = {};

      for (const state of group) {
        const signature = alphabet.map(symbol => {
          const target = transitions[state][symbol];
          return findPartitionIndex(target, partitions);
        }).join('|');

        if (!subgroups[signature]) subgroups[signature] = [];
        subgroups[signature].push(state);
      }

      const values = Object.values(subgroups);
      if (values.length > 1) changed = true;

      for (const statesInSubgroup of values) {
        newPartitions.push(new Set(statesInSubgroup));
      }
    }

    partitions = newPartitions;
    steps.push(`4.${iteration}. Partition refinement iteration ${iteration} produced ${partitions.length} groups.`);
    iteration += 1;
  }

  // 5. Build mapping from old states to minimized states.
  const stateMap = {};
  partitions.forEach((group, index) => {
    const name = `S${index}`;
    for (const state of group) {
      stateMap[state] = name;
    }
  });

  // 6. Build minimized transitions.
  const newTransitions = {};
  for (const state of workingStates) {
    const newState = stateMap[state];
    if (!newTransitions[newState]) newTransitions[newState] = {};

    for (const symbol of alphabet) {
      const target = transitions[state][symbol];
      newTransitions[newState][symbol] = stateMap[target];
    }
  }

  // 7. Derive start/accept/final state sets and remove duplicates.
  const newStart = stateMap[dfa.startState];
  const newAcceptStates = new Set(
    Array.from(dfa.acceptStates).map(s => stateMap[s]).filter(Boolean)
  );
  let finalStates = [...new Set(Object.values(stateMap))];

  if (options.removeDead) {
    const deadState = finalStates.find((state) => {
      const row = newTransitions[state] || {};
      const allSelfLoops = alphabet.length > 0 && alphabet.every(symbol => row[symbol] === state);
      const notAccept = !newAcceptStates.has(state);
      return allSelfLoops && notAccept;
    });

    if (deadState && deadState !== newStart) {
      const filteredStates = finalStates.filter(s => s !== deadState);
      const filteredTransitions = {};

      for (const state of filteredStates) {
        filteredTransitions[state] = {};
        for (const symbol of alphabet) {
          const target = newTransitions[state]?.[symbol];
          if (target && target !== deadState) {
            filteredTransitions[state][symbol] = target;
          }
        }
      }

      finalStates = filteredStates;
      Object.keys(newTransitions).forEach(k => delete newTransitions[k]);
      Object.assign(newTransitions, filteredTransitions);

      steps.push(`6. Removed DEAD sink state '${deadState}' for simplified view.`);
    }
  }

  console.log('Minimized DFA States:', finalStates);
  console.log('Transitions:', newTransitions);

  const transitionLines = [];
  for (const from in newTransitions) {
    for (const symbol in newTransitions[from]) {
      transitionLines.push(`${from}, ${symbol}, ${newTransitions[from][symbol]}`);
    }
  }

  const minDfaDef = {
    states: finalStates.join(', '),
    alphabet: alphabet.join(', '),
    startState: newStart,
    acceptStates: Array.from(newAcceptStates).join(', '),
    transitions: transitionLines.join('\n')
  };

  const minDfaInstance = new DFA(
    finalStates,
    alphabet,
    newTransitions,
    newStart,
    Array.from(newAcceptStates)
  );

  steps.push(`5. Built minimized DFA with ${finalStates.length} states.`);

  return { minimizedDefinition: minDfaDef, minimizedInstance: minDfaInstance, steps };
}
