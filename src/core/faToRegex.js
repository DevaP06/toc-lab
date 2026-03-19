/**
 * FA to Regular Expression conversion using the State Elimination method.
 */

const EMPTY_SET = '∅';
const EPSILON = 'ε';

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

function isAtom(r) {
  if (r.length === 0) return false;
  if (r.length === 1) return true;
  if (r === EPSILON || r === EMPTY_SET) return true;
  if (isParenWrapped(r)) return true;
  if (r.endsWith('*') && isAtom(r.slice(0, -1))) return true;
  return false;
}

function hasTopLevelAlt(r) {
  let depth = 0;
  for (const c of r) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '|' && depth === 0) return true;
  }
  return false;
}

export function regexUnion(r1, r2) {
  if (r1 === null || r1 === EMPTY_SET) return r2;
  if (r2 === null || r2 === EMPTY_SET) return r1;
  if (r1 === r2) return r1;
  return `(${r1}|${r2})`;
}

export function regexConcat(r1, r2) {
  if (r1 === EMPTY_SET || r2 === EMPTY_SET) return EMPTY_SET;
  if (r1 === EPSILON) return r2;
  if (r2 === EPSILON) return r1;
  const p1 = hasTopLevelAlt(r1) && !isParenWrapped(r1) ? `(${r1})` : r1;
  const p2 = hasTopLevelAlt(r2) && !isParenWrapped(r2) ? `(${r2})` : r2;
  return `${p1}${p2}`;
}

export function regexStar(r) {
  if (r === null || r === EMPTY_SET || r === EPSILON) return EPSILON;
  if (r.endsWith('*') && isAtom(r.slice(0, -1))) return r;
  const p = isAtom(r) ? r : `(${r})`;
  return `${p}*`;
}

export function faToRegex({ states, transitions, startState, acceptStates }) {
  if (!states || states.length === 0) return EMPTY_SET;
  if (!acceptStates || acceptStates.length === 0) return EMPTY_SET;

  const S = '$$start$$';
  const F = '$$accept$$';

  const gnfa = {};
  for (const s of [S, ...states, F]) gnfa[s] = {};

  gnfa[S][startState] = EPSILON;

  for (const s of acceptStates) {
    gnfa[s][F] = regexUnion(gnfa[s][F] ?? null, EPSILON);
  }

  for (const [from, symbolMap] of Object.entries(transitions)) {
    if (!gnfa[from]) continue;
    for (const [sym, targets] of Object.entries(symbolMap)) {
      for (const to of targets) {
        if (!(to in gnfa)) continue;
        gnfa[from][to] = regexUnion(gnfa[from][to] ?? null, sym);
      }
    }
  }

  let remaining = [S, ...states, F];

  for (const q of states) {
    const pred = remaining.filter(s => s !== q && gnfa[s]?.[q] != null);
    const succ = remaining.filter(s => s !== q && gnfa[q]?.[s] != null);
    const selfLoop = gnfa[q]?.[q] ?? null;

    for (const p of pred) {
      for (const r of succ) {
        const pq = gnfa[p][q];
        const qr = gnfa[q][r];

        const newPath = selfLoop
          ? regexConcat(pq, regexConcat(regexStar(selfLoop), qr))
          : regexConcat(pq, qr);

        gnfa[p][r] = regexUnion(gnfa[p][r] ?? null, newPath);
      }
    }

    remaining = remaining.filter(s => s !== q);
    delete gnfa[q];
    for (const s of remaining) {
      if (gnfa[s]) delete gnfa[s][q];
    }
  }

  return gnfa[S]?.[F] ?? EMPTY_SET;
}
