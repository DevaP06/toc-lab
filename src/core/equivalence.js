import { DFA } from './dfa';

/**
 * Checks if two DFAs are computationally equivalent using the Table-Filling algorithm.
 * @param {DFA} dfa1 - First DFA
 * @param {DFA} dfa2 - Second DFA
 * @returns {Object} { isEquivalent, counterExample, steps }
 */
export function checkEquivalence(dfa1, dfa2) {
  const steps = [];

  // Check alphabet
  const alpha1 = Array.from(dfa1.alphabet).sort().join(',');
  const alpha2 = Array.from(dfa2.alphabet).sort().join(',');
  
  if (alpha1 !== alpha2) {
      steps.push(`Alphabets do not match. DFA1: {${alpha1}}, DFA2: {${alpha2}}`);
      return { isEquivalent: false, reason: "Alphabets differ", steps };
  }

  // Combine DFAs into a disjoint union
  const combinedStates = [];
  const combinedAccept = new Set();
  const transition = {};

  const prefix1 = 'A_';
  const prefix2 = 'B_';

  for (const s of dfa1.states) {
      const name = prefix1 + s;
      combinedStates.push(name);
      if (dfa1.acceptStates.has(s)) combinedAccept.add(name);
      
      transition[name] = {};
      for (const a of dfa1.alphabet) {
          if (dfa1.transition[s]?.[a]) {
              transition[name][a] = prefix1 + dfa1.transition[s][a];
          }
      }
  }

  for (const s of dfa2.states) {
      const name = prefix2 + s;
      combinedStates.push(name);
      if (dfa2.acceptStates.has(s)) combinedAccept.add(name);
      
      transition[name] = {};
      for (const a of dfa2.alphabet) {
          if (dfa2.transition[s]?.[a]) {
              transition[name][a] = prefix2 + dfa2.transition[s][a];
          }
      }
  }

  steps.push(`1. Created disjoint union of DFA A and DFA B states.`);

  // Use a virtual DEAD state to represent missing transitions in either DFA.
  // DEAD is non-accepting — distinguishable from any accept state.
  const DEAD = '\x00DEAD\x00';
  const distinguishable = new Set();
  const getPairKey = (s1, s2) => s1 < s2 ? `${s1},${s2}` : `${s2},${s1}`;

  // Check if either DFA has incomplete transitions
  const needsDead =
    [...dfa1.states].some(s => Array.from(dfa1.alphabet).some(a => !dfa1.transition[s]?.[a])) ||
    [...dfa2.states].some(s => Array.from(dfa2.alphabet).some(a => !dfa2.transition[s]?.[a]));

  const allCombinedStates = needsDead ? [...combinedStates, DEAD] : [...combinedStates];

  // Helper: resolve transition, falling back to DEAD for missing entries
  const delta = (s, a) => {
    if (s === DEAD) return DEAD;
    return transition[s]?.[a] ?? DEAD;
  };

  // Initially mark pairs where one is accept and one is reject
  // DEAD is non-accepting
  for (let i = 0; i < allCombinedStates.length; i++) {
    for (let j = i + 1; j < allCombinedStates.length; j++) {
      const p = allCombinedStates[i];
      const q = allCombinedStates[j];
      const pAccept = p !== DEAD && combinedAccept.has(p);
      const qAccept = q !== DEAD && combinedAccept.has(q);

      if (pAccept !== qAccept) {
        distinguishable.add(getPairKey(p, q));
      }
    }
  }

  steps.push(`2. Initialized Table-Filling. Marked all ({Accept}, {Reject}) pairs.`);

  let changed = true;
  let iteration = 1;
  const alphabet = Array.from(dfa1.alphabet);

  // We only really care if (start1, start2) gets marked.
  const start1 = prefix1 + dfa1.startState;
  const start2 = prefix2 + dfa2.startState;

  const targetPair = getPairKey(start1, start2);

  while (changed) {
    changed = false;
    for (let i = 0; i < allCombinedStates.length; i++) {
      for (let j = i + 1; j < allCombinedStates.length; j++) {
        const p = allCombinedStates[i];
        const q = allCombinedStates[j];
        if (distinguishable.has(getPairKey(p, q))) continue;

        for (const a of alphabet) {
          const tp = delta(p, a);
          const tq = delta(q, a);

          // If targets differ, check if they are distinguishable
          if (tp !== tq && distinguishable.has(getPairKey(tp, tq))) {
            distinguishable.add(getPairKey(p, q));
            changed = true;

            // If the start states are just proven distinguishable, early exit!
            if (getPairKey(p, q) === targetPair) {
              steps.push(`-> Found distinguishable transition from Start States on symbol '${a}'!`);
              steps.push(`3. Start states (${start1}, ${start2}) are distinguishable. NOT Equivalent.`);
              return { isEquivalent: false, reason: "Start states distinguishable", steps };
            }
            break;
          }
        }
      }
    }
    iteration++;
  }

  const isEquiv = !distinguishable.has(targetPair);
  steps.push(`3. Table filling stabilized after ${iteration - 1} iterations.`);
  
  if (isEquiv) {
      steps.push(`-> The start states (${start1}, ${start2}) are indistinguishable in the union DFA.`);
      steps.push(`-> Therefore, DFA A and DFA B accept the exact same language.`);
  } else {
      steps.push(`-> The start states (${start1}, ${start2}) are distinguishable in the union DFA.`);
      steps.push(`-> Therefore, DFA A and DFA B are NOT equivalent.`);
  }

  return { isEquivalent: isEquiv, steps };
}
