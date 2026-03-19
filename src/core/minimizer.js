import { DFA } from './dfa';

/**
 * Minimizes a DFA using the Table-Filling (Myhill-Nerode) algorithm.
 * @param {DFA} dfa - The original DFA
 * @returns {Object} - Resulting DFA, equivalence classes, and steps
 */
export function minimizeDFA(dfa) {
  const steps = [];

  // 1. Remove unreachable states
  const reachable = new Set([dfa.startState]);
  const queue = [dfa.startState];
  
  while (queue.length > 0) {
    const s = queue.shift();
    for (const a of dfa.alphabet) {
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

  // 2. Initialize Distinguishability Table (Pairs)
  const distinguishable = new Set(); // store pairs as "s1,s2" where s1 < s2
  const getPairKey = (s1, s2) => s1 < s2 ? `${s1},${s2}` : `${s2},${s1}`;

  // Initially mark pairs where one is accept and one is reject
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const p = states[i];
      const q = states[j];
      const pAccept = dfa.acceptStates.has(p);
      const qAccept = dfa.acceptStates.has(q);
      
      if (pAccept !== qAccept) {
        distinguishable.add(getPairKey(p, q));
      }
    }
  }
  
  steps.push(`2. Marked all ({Accept}, {Non-Accept}) pairs as distinguishable.`);

  // 3. Mark transitions iteratively
  let changed = true;
  let iteration = 1;
  while (changed) {
    changed = false;
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const p = states[i];
        const q = states[j];
        if (distinguishable.has(getPairKey(p, q))) continue;

        for (const a of dfa.alphabet) {
          const tp = dfa.transition[p]?.[a];
          const tq = dfa.transition[q]?.[a];

          // If both have transitions on 'a', check if their targets are distinguishable
          if (tp && tq && tp !== tq) {
             if (distinguishable.has(getPairKey(tp, tq))) {
               distinguishable.add(getPairKey(p, q));
               changed = true;
               steps.push(`   Iteration ${iteration}: Marked (${p}, ${q}) because δ(${p}, ${a})=${tp} and δ(${q}, ${a})=${tq} are distinguishable.`);
               break; // Move to next pair
             }
          }
        }
      }
    }
    iteration++;
  }

  steps.push(`3. Table filling complete after ${iteration - 1} iterations.`);

  // 4. Group equivalent states (Find connected components of unmarked pairs)
  const equivalentPairs = [];
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      if (!distinguishable.has(getPairKey(states[i], states[j]))) {
        equivalentPairs.push([states[i], states[j]]);
      }
    }
  }

  // Union-Find or simple clustering for equivalence classes
  const classes = [];
  const stateClassMap = {};

  states.forEach(s => {
    if (!stateClassMap[s]) {
      const cls = new Set([s]);
      classes.push(cls);
      stateClassMap[s] = cls;
    }
  });

  for (const [p, q] of equivalentPairs) {
     const clsP = stateClassMap[p];
     const clsQ = stateClassMap[q];
     if (clsP !== clsQ) {
        // Merge clsQ into clsP
        for (const sq of clsQ) {
           clsP.add(sq);
           stateClassMap[sq] = clsP;
        }
        // Remove old clsQ
        classes.splice(classes.indexOf(clsQ), 1);
     }
  }

  if (equivalentPairs.length > 0) {
      steps.push(`4. Found indistinguishable states. Merged into equivalence classes:`);
      classes.forEach(cls => {
         if (cls.size > 1) {
             steps.push(`   - {${Array.from(cls).join(', ')}}`);
         }
      });
  } else {
      steps.push(`4. No equivalent states found. The DFA is already minimal.`);
  }

  // 5. Build new minimal DFA
  const formatClassName = (clsSet) => Array.from(clsSet).sort().join('_');
  
  const minStates = classes.map(formatClassName);
  let minStart = '';
  const minAccept = new Set();
  const minTrans = {};

  classes.forEach(cls => {
     const name = formatClassName(cls);
     minTrans[name] = {};
     
     // Use a representative to build transitions
     const rep = Array.from(cls)[0];
     
     if (cls.has(dfa.startState)) minStart = name;
     if (dfa.acceptStates.has(rep)) minAccept.add(name);

     for (const a of dfa.alphabet) {
        if (dfa.transition[rep] && dfa.transition[rep][a]) {
            const target = dfa.transition[rep][a];
            const targetCls = stateClassMap[target];
            if (targetCls) {
                minTrans[name][a] = formatClassName(targetCls);
            }
        }
     }
  });

  const transitionLines = [];
  for (const from in minTrans) {
    for (const a in minTrans[from]) {
      transitionLines.push(`${from}, ${a}, ${minTrans[from][a]}`);
    }
  }

  const minDfaDef = {
     states: minStates.join(', '),
     alphabet: Array.from(dfa.alphabet).join(', '),
     startState: minStart,
     acceptStates: Array.from(minAccept).join(', '),
     transitions: transitionLines.join('\n')
  };

  const minDfaInstance = new DFA(minStates, Array.from(dfa.alphabet), minTrans, minStart, Array.from(minAccept));

  return { minimizedDefinition: minDfaDef, minimizedInstance: minDfaInstance, steps };
}
