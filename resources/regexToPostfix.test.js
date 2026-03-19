import { describe, it, expect } from 'vitest';
import { insertConcatenation, regexToPostfix } from '../algorithms/regexToPostfix';

describe('insertConcatenation', () => {
  it('inserts concatenation between adjacent operands', () => {
    expect(insertConcatenation('ab')).toBe('a.b');
  });

  it('inserts concatenation between operand and opening paren', () => {
    expect(insertConcatenation('a(b)')).toBe('a.(b)');
  });

  it('inserts concatenation between closing paren and operand', () => {
    expect(insertConcatenation('(a)b')).toBe('(a).b');
  });

  it('inserts concatenation after star', () => {
    expect(insertConcatenation('a*b')).toBe('a*.b');
    expect(insertConcatenation('a*(b)')).toBe('a*.(b)');
  });

  it('does not insert concatenation around operators', () => {
    expect(insertConcatenation('a|b')).toBe('a|b');
  });

  it('handles complex expressions', () => {
    expect(insertConcatenation('(a|b)*ab')).toBe('(a|b)*.a.b');
  });
});

describe('regexToPostfix', () => {
  it('converts simple concatenation', () => {
    expect(regexToPostfix('ab')).toBe('ab.');
  });

  it('converts simple union', () => {
    expect(regexToPostfix('a|b')).toBe('ab|');
  });

  it('converts Kleene star', () => {
    expect(regexToPostfix('a*')).toBe('a*');
  });

  it('respects operator precedence: * > concat > union', () => {
    // a|b* should be a|(b*) = ab*|
    expect(regexToPostfix('a|b*')).toBe('ab*|');
  });

  it('handles parentheses for grouping', () => {
    // (a|b)* = ab|*
    expect(regexToPostfix('(a|b)*')).toBe('ab|*');
  });

  it('handles complex expression (a|b)*ab', () => {
    // (a|b)*ab = ab|*a.b.
    expect(regexToPostfix('(a|b)*ab')).toBe('ab|*a.b.');
  });
});
