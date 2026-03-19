import { describe, it, expect } from 'vitest';
import { regexToPostfix } from '../algorithms/regexToPostfix';
import { thompsonConstruction } from '../algorithms/thompsonConstruction';

describe('ab* pattern NFA construction', () => {
  it('creates correct NFA for ab* with proper b transition', () => {
    const regex = 'ab*';
    const postfix = regexToPostfix(regex);
    const nfa = thompsonConstruction(postfix);

    // Verify 'b' transition exists
    let hasBTransition = false;
    for (const [_state, trans] of Object.entries(nfa.transitions)) {
      if (trans.b) {
        hasBTransition = true;
        expect(trans.b).toBeDefined();
        expect(Array.isArray(trans.b)).toBe(true);
        expect(trans.b.length).toBeGreaterThan(0);
      }
    }

    expect(hasBTransition).toBe(true);
  });

  it('creates correct structure for ab* pattern', () => {
    const regex = 'ab*';
    const postfix = regexToPostfix(regex);
    expect(postfix).toBe('ab*.');

    const nfa = thompsonConstruction(postfix);

    // Should have 6 states for ab*:
    // q0 --a--> q1 --ε--> q4 --ε--> q2 --b--> q3
    //                      |                  |
    //                      +----ε-----> q5 <--+
    expect(nfa.states).toHaveLength(6);
    expect(nfa.startState).toBeDefined();
    expect(nfa.acceptStates).toHaveLength(1);

    // Verify both 'a' and 'b' transitions exist
    const allSymbols = new Set();
    for (const trans of Object.values(nfa.transitions)) {
      for (const symbol of Object.keys(trans)) {
        if (symbol !== 'ε') {
          allSymbols.add(symbol);
        }
      }
    }

    expect(allSymbols.has('a')).toBe(true);
    expect(allSymbols.has('b')).toBe(true);
  });

  it('includes both a and b in alphabet for ab*', () => {
    const regex = 'ab*';
    const postfix = regexToPostfix(regex);
    const nfa = thompsonConstruction(postfix);

    expect(nfa.alphabet).toContain('a');
    expect(nfa.alphabet).toContain('b');
  });
});
