import { describe, it, expect } from 'vitest';
import { faToRegex, regexUnion, regexConcat, regexStar } from '../algorithms/faToRegex';

// ──────────────────────────────────────────────────────────────────────────────
// Helper regex utilities
// ──────────────────────────────────────────────────────────────────────────────

describe('regexUnion', () => {
  it('returns the other when one operand is null', () => {
    expect(regexUnion(null, 'a')).toBe('a');
    expect(regexUnion('a', null)).toBe('a');
  });

  it('returns the other when one operand is ∅', () => {
    expect(regexUnion('∅', 'a')).toBe('a');
    expect(regexUnion('a', '∅')).toBe('a');
  });

  it('returns the same value when both operands are equal', () => {
    expect(regexUnion('a', 'a')).toBe('a');
  });

  it('wraps distinct values in parens with |', () => {
    expect(regexUnion('a', 'b')).toBe('(a|b)');
  });
});

describe('regexConcat', () => {
  it('returns ∅ when either operand is ∅', () => {
    expect(regexConcat('∅', 'a')).toBe('∅');
    expect(regexConcat('a', '∅')).toBe('∅');
  });

  it('returns the other when one operand is ε', () => {
    expect(regexConcat('ε', 'a')).toBe('a');
    expect(regexConcat('a', 'ε')).toBe('a');
  });

  it('concatenates two single chars', () => {
    expect(regexConcat('a', 'b')).toBe('ab');
  });

  it('wraps left operand with parens when it contains top-level |', () => {
    expect(regexConcat('a|b', 'c')).toBe('(a|b)c');
  });
});

describe('regexStar', () => {
  it('returns ε for null, ε, or ∅', () => {
    expect(regexStar(null)).toBe('ε');
    expect(regexStar('ε')).toBe('ε');
    expect(regexStar('∅')).toBe('ε');
  });

  it('adds * to a single char', () => {
    expect(regexStar('a')).toBe('a*');
  });

  it('wraps multi-char regex in parens before adding *', () => {
    expect(regexStar('ab')).toBe('(ab)*');
  });

  it('does not double-star an already-starred atom', () => {
    expect(regexStar('a*')).toBe('a*');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// faToRegex – state elimination
// ──────────────────────────────────────────────────────────────────────────────

describe('faToRegex', () => {
  it('returns ∅ for an FA with no states', () => {
    expect(faToRegex({ states: [], transitions: {}, startState: '', acceptStates: [] })).toBe('∅');
  });

  it('returns ∅ for an FA with no accept states', () => {
    expect(faToRegex({
      states: ['q0'],
      transitions: {},
      startState: 'q0',
      acceptStates: [],
    })).toBe('∅');
  });

  it('produces "a" for a simple two-state FA: q0 -a-> q1', () => {
    const regex = faToRegex({
      states: ['q0', 'q1'],
      transitions: { q0: { a: ['q1'] } },
      startState: 'q0',
      acceptStates: ['q1'],
    });
    expect(regex).toBe('a');
  });

  it('produces ε when start state equals accept state with no transitions needed', () => {
    const regex = faToRegex({
      states: ['q0'],
      transitions: {},
      startState: 'q0',
      acceptStates: ['q0'],
    });
    expect(regex).toBe('ε');
  });

  it('produces "a*" for a self-loop FA: q0 -a-> q0 (start and accept)', () => {
    const regex = faToRegex({
      states: ['q0'],
      transitions: { q0: { a: ['q0'] } },
      startState: 'q0',
      acceptStates: ['q0'],
    });
    expect(regex).toBe('a*');
  });

  it('produces "a*b" for q0 -a-> q0, q0 -b-> q1', () => {
    const regex = faToRegex({
      states: ['q0', 'q1'],
      transitions: {
        q0: { a: ['q0'], b: ['q1'] },
      },
      startState: 'q0',
      acceptStates: ['q1'],
    });
    expect(regex).toBe('a*b');
  });

  it('produces a union for two parallel transitions: q0 -a-> q1, q0 -b-> q1', () => {
    const regex = faToRegex({
      states: ['q0', 'q1'],
      transitions: {
        q0: { a: ['q1'], b: ['q1'] },
      },
      startState: 'q0',
      acceptStates: ['q1'],
    });
    // Both a and b reach q1 → (a|b)
    expect(regex).toBe('(a|b)');
  });

  it('handles a three-state FA: q0 -a-> q1 -b-> q2', () => {
    const regex = faToRegex({
      states: ['q0', 'q1', 'q2'],
      transitions: {
        q0: { a: ['q1'] },
        q1: { b: ['q2'] },
      },
      startState: 'q0',
      acceptStates: ['q2'],
    });
    expect(regex).toBe('ab');
  });

  it('returns ∅ when there is no path from start to an accept state', () => {
    const regex = faToRegex({
      states: ['q0', 'q1'],
      transitions: {},
      startState: 'q0',
      acceptStates: ['q1'],
    });
    expect(regex).toBe('∅');
  });
});
