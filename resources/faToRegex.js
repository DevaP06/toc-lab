/**
 * FA to Regular Expression conversion using the State Elimination method.
 *
 * The algorithm works by:
 * 1. Constructing a Generalized NFA (GNFA) with a unique new start and accept state
 * 2. Systematically eliminating each original state, merging transitions with regex labels
 * 3. The remaining transition from the new start to the new accept is the result regex
 */

const EMPTY_SET = '∅';
const EPSILON = 'ε';

/**
 * Returns true if the string is paren-wrapped at the top level, e.g. "(a|b)".
 */
function isParenWrapped(r) {
  if (!r.startsWith('(') || !r.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < r.length; i++) {
    if (r[i] === '(') depth++;
    else if (r[i] === ')') depth--;
    if (depth === 0 && i < r.length - 1) return false;
  }
  return depth === 0;
}

/**
 * Returns true if the string is an "atomic" regex unit that needs no extra parens.
 * Atomic: single char, ε, ∅, a paren-wrapped group, or a star applied to an atom.
 */
function isAtom(r) {
  if (r.length === 0) return false;
  if (r.length === 1) return true;
  if (r === EPSILON || r === EMPTY_SET) return true;
  if (isParenWrapped(r)) return true;
  if (r.endsWith('*') && isAtom(r.slice(0, -1))) return true;
  return false;
}

/**
 * Returns true if the regex contains a top-level alternation (|) operator.
 */
function hasTopLevelAlt(r) {
  let depth = 0;
  for (const c of r) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '|' && depth === 0) return true;
  }
  return false;
}

/**
 * Combines two regex strings with union (|), handling identity elements.
 * @param {string|null} r1
 * @param {string|null} r2
 * @returns {string|null}
 */
export function regexUnion(r1, r2) {
  if (r1 === null || r1 === EMPTY_SET) return r2;
  if (r2 === null || r2 === EMPTY_SET) return r1;
  if (r1 === r2) return r1;
  return `(${r1}|${r2})`;
}

/**
 * Concatenates two regex strings, handling identity and absorbing elements.
 * @param {string} r1
 * @param {string} r2
 * @returns {string}
 */
export function regexConcat(r1, r2) {
  if (r1 === EMPTY_SET || r2 === EMPTY_SET) return EMPTY_SET;
  if (r1 === EPSILON) return r2;
  if (r2 === EPSILON) return r1;
  // Wrap operand with parens if it contains a top-level | not already wrapped
  const p1 = hasTopLevelAlt(r1) && !isParenWrapped(r1) ? `(${r1})` : r1;
  const p2 = hasTopLevelAlt(r2) && !isParenWrapped(r2) ? `(${r2})` : r2;
  return `${p1}${p2}`;
}

/**
 * Applies Kleene star to a regex string, handling special cases.
 * @param {string|null} r
 * @returns {string}
 */
export function regexStar(r) {
  if (r === null || r === EMPTY_SET || r === EPSILON) return EPSILON;
  // Idempotent: (r*)* = r*
  if (r.endsWith('*') && isAtom(r.slice(0, -1))) return r;
  const p = isAtom(r) ? r : `(${r})`;
  return `${p}*`;
}

/**
 * Converts a Finite Automaton to a Regular Expression using State Elimination.
 *
 * @param {Object} automaton
 * @param {string[]} automaton.states - Array of state names
 * @param {Object}  automaton.transitions - { from: { symbol: [toStates] } }
 * @param {string}  automaton.startState - Name of the start state
 * @param {string[]} automaton.acceptStates - Array of accept state names
 * @returns {string} Regular expression string
 */
export function faToRegex({ states, transitions, startState, acceptStates }) {
  if (!states || states.length === 0) return EMPTY_SET;
  if (!acceptStates || acceptStates.length === 0) return EMPTY_SET;

  // Unique sentinel names for the new GNFA start/accept states
  const S = '$$start$$';
  const F = '$$accept$$';

  // gnfa[from][to] = regex label string, or absent if no transition
  const gnfa = {};
  for (const s of [S, ...states, F]) gnfa[s] = {};

  // New start --ε--> original start
  gnfa[S][startState] = EPSILON;

  // Original accept states --ε--> new accept
  for (const s of acceptStates) {
    gnfa[s][F] = regexUnion(gnfa[s][F] ?? null, EPSILON);
  }

  // Copy original FA transitions, unioning labels for duplicate (from, to) pairs
  for (const [from, symbolMap] of Object.entries(transitions)) {
    if (!gnfa[from]) continue;
    for (const [sym, targets] of Object.entries(symbolMap)) {
      for (const to of targets) {
        if (!(to in gnfa)) continue;
        gnfa[from][to] = regexUnion(gnfa[from][to] ?? null, sym);
      }
    }
  }

  // Eliminate each original state one by one
  let remaining = [S, ...states, F];

  for (const q of states) {
    // Find predecessors and successors among currently remaining states (excluding q)
    const pred = remaining.filter(s => s !== q && gnfa[s]?.[q] != null);
    const succ = remaining.filter(s => s !== q && gnfa[q]?.[s] != null);
    const selfLoop = gnfa[q]?.[q] ?? null;

    for (const p of pred) {
      for (const r of succ) {
        const pq = gnfa[p][q];
        const qr = gnfa[q][r];

        // Bypass path: p --(pq)(selfLoop)*(qr)--> r
        const newPath = selfLoop
          ? regexConcat(pq, regexConcat(regexStar(selfLoop), qr))
          : regexConcat(pq, qr);

        gnfa[p][r] = regexUnion(gnfa[p][r] ?? null, newPath);
      }
    }

    // Remove q from the GNFA
    remaining = remaining.filter(s => s !== q);
    delete gnfa[q];
    for (const s of remaining) {
      if (gnfa[s]) delete gnfa[s][q];
    }
  }

  return gnfa[S]?.[F] ?? EMPTY_SET;
}
