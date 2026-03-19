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

  const distinguishable = new Set();
  const getPairKey = (s1, s2) => s1 < s2 ? `${s1},${s2}` : `${s2},${s1}`;

  // Initially mark pairs where one is accept and one is reject
  for (let i = 0; i < combinedStates.length; i++) {
    for (let j = i + 1; j < combinedStates.length; j++) {
      const p = combinedStates[i];
      const q = combinedStates[j];
      const pAccept = combinedAccept.has(p);
      const qAccept = combinedAccept.has(q);
      
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
    for (let i = 0; i < combinedStates.length; i++) {
      for (let j = i + 1; j < combinedStates.length; j++) {
        const p = combinedStates[i];
        const q = combinedStates[j];
        if (distinguishable.has(getPairKey(p, q))) continue;

        for (const a of alphabet) {
          const tp = transition[p]?.[a];
          const tq = transition[q]?.[a];

          if (tp && tq && tp !== tq) {
             if (distinguishable.has(getPairKey(tp, tq))) {
               distinguishable.add(getPairKey(p, q));
               changed = true;
               
               // If the start states are just proven distinguishable, we can early exit!
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
