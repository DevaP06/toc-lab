import { describe, it, expect } from 'vitest';
import { validateRegex } from '../algorithms/regexValidator';

describe('validateRegex', () => {
  it('accepts valid simple expressions', () => {
    expect(validateRegex('a').valid).toBe(true);
    expect(validateRegex('b').valid).toBe(true);
    expect(validateRegex('ab').valid).toBe(true);
    expect(validateRegex('a|b').valid).toBe(true);
    expect(validateRegex('a*').valid).toBe(true);
  });

  it('accepts valid complex expressions', () => {
    expect(validateRegex('(a|b)*ab').valid).toBe(true);
    expect(validateRegex('a*b*').valid).toBe(true);
    expect(validateRegex('(a|b)*').valid).toBe(true);
    expect(validateRegex('a**').valid).toBe(true);
    expect(validateRegex('(ab)*').valid).toBe(true);
  });

  it('rejects empty input', () => {
    const result = validateRegex('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects invalid characters', () => {
    expect(validateRegex('abc').valid).toBe(false);
    expect(validateRegex('a+b').valid).toBe(false);
    expect(validateRegex('a.b').valid).toBe(false);
  });

  it('rejects unbalanced parentheses', () => {
    expect(validateRegex('(a').valid).toBe(false);
    expect(validateRegex('a)').valid).toBe(false);
    expect(validateRegex('((a)').valid).toBe(false);
  });

  it('rejects empty parentheses', () => {
    expect(validateRegex('()').valid).toBe(false);
  });

  it('rejects misplaced operators', () => {
    expect(validateRegex('|a').valid).toBe(false);
    expect(validateRegex('a|').valid).toBe(false);
    expect(validateRegex('*a').valid).toBe(false);
    expect(validateRegex('(|a)').valid).toBe(false);
    expect(validateRegex('(a|)').valid).toBe(false);
    expect(validateRegex('a||b').valid).toBe(false);
  });
});
