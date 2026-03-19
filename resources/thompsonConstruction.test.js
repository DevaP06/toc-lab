import { describe, it, expect } from 'vitest';
import { thompsonConstruction } from '../algorithms/thompsonConstruction';
import { regexToPostfix } from '../algorithms/regexToPostfix';

describe('thompsonConstruction', () => {
  it('creates a two-state NFA for a single symbol', () => {
    const nfa = thompsonConstruction('a');
    expect(nfa.states).toHaveLength(2);
    expect(nfa.startState).toBe('q0');
    expect(nfa.acceptStates).toEqual(['q1']);
    expect(nfa.transitions['q0']['a']).toEqual(['q1']);
  });

  it('creates correct NFA for concatenation (ab)', () => {
    const postfix = regexToPostfix('ab');
    const nfa = thompsonConstruction(postfix);
    // ab → 4 states: q0-a->q1, q2-b->q3, with q1-ε->q2
    expect(nfa.states).toHaveLength(4);
    expect(nfa.startState).toBe('q0');
    expect(nfa.acceptStates).toEqual(['q3']);
    expect(nfa.transitions['q0']['a']).toEqual(['q1']);
    expect(nfa.transitions['q1']['ε']).toEqual(['q2']);
    expect(nfa.transitions['q2']['b']).toEqual(['q3']);
  });

  it('creates correct NFA for union (a|b)', () => {
    const postfix = regexToPostfix('a|b');
    const nfa = thompsonConstruction(postfix);
    // a|b → 6 states: start(q4) -ε-> q0, q2; q1 -ε-> q5; q3 -ε-> q5
    expect(nfa.states).toHaveLength(6);
    expect(nfa.startState).toBe('q4');
    expect(nfa.acceptStates).toEqual(['q5']);
    expect(nfa.transitions['q4']['ε']).toContain('q0');
    expect(nfa.transitions['q4']['ε']).toContain('q2');
    expect(nfa.transitions['q1']['ε']).toEqual(['q5']);
    expect(nfa.transitions['q3']['ε']).toEqual(['q5']);
  });

  it('creates correct NFA for Kleene star (a*)', () => {
    const postfix = regexToPostfix('a*');
    const nfa = thompsonConstruction(postfix);
    // a* → 4 states: start(q2) -ε-> q0, q3; q1 -ε-> q0, q3
    expect(nfa.states).toHaveLength(4);
    expect(nfa.startState).toBe('q2');
    expect(nfa.acceptStates).toEqual(['q3']);
    expect(nfa.transitions['q2']['ε']).toContain('q0');
    expect(nfa.transitions['q2']['ε']).toContain('q3');
    expect(nfa.transitions['q1']['ε']).toContain('q0');
    expect(nfa.transitions['q1']['ε']).toContain('q3');
  });

  it('produces correct automaton structure', () => {
    const postfix = regexToPostfix('(a|b)*ab');
    const nfa = thompsonConstruction(postfix);

    expect(nfa.alphabet).toEqual(['a', 'b']);
    expect(nfa.startState).toBeDefined();
    expect(nfa.acceptStates).toHaveLength(1);
    expect(nfa.states.length).toBeGreaterThan(0);
    expect(nfa.transitions).toBeDefined();

    // Verify start state exists in states
    expect(nfa.states).toContain(nfa.startState);
    // Verify accept state exists in states
    expect(nfa.states).toContain(nfa.acceptStates[0]);
  });

  it('has correct data model shape', () => {
    const nfa = thompsonConstruction('a');
    expect(nfa).toHaveProperty('states');
    expect(nfa).toHaveProperty('alphabet');
    expect(nfa).toHaveProperty('transitions');
    expect(nfa).toHaveProperty('startState');
    expect(nfa).toHaveProperty('acceptStates');
    expect(Array.isArray(nfa.states)).toBe(true);
    expect(Array.isArray(nfa.alphabet)).toBe(true);
    expect(Array.isArray(nfa.acceptStates)).toBe(true);
    expect(typeof nfa.transitions).toBe('object');
    expect(typeof nfa.startState).toBe('string');
  });
});
