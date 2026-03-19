/**
 * Inserts explicit concatenation operators ('.') into a regex string.
 * Concatenation is implicit between:
 *   - two operands (a, b)
 *   - operand followed by (
 *   - ) followed by operand
 *   - ) followed by (
 *   - * followed by operand
 *   - * followed by (
 *
 * @param {string} regex - The regex string
 * @returns {string} Regex with explicit concatenation operators
 */
export function insertConcatenation(regex) {
  let result = '';
  for (let i = 0; i < regex.length; i++) {
    const c = regex[i];
    result += c;

    if (i + 1 < regex.length) {
      const next = regex[i + 1];
      // After a symbol, *, or ), we insert '.' before a symbol or (
      if (
        (isOperand(c) || c === '*' || c === ')') &&
        (isOperand(next) || next === '(')
      ) {
        result += '.';
      }
    }
  }
  return result;
}

/**
 * Converts an infix regex (with explicit concatenation) to postfix
 * using the Shunting Yard algorithm.
 *
 * Operator precedence:
 *   * (Kleene star) — highest (3)
 *   . (concatenation) — middle (2)
 *   | (union) — lowest (1)
 *
 * @param {string} regex - Regex with explicit concatenation operators
 * @returns {string} Postfix expression
 */
export function infixToPostfix(regex) {
  const precedence = { '|': 1, '.': 2, '*': 3 };
  let output = '';
  const stack = [];

  for (const c of regex) {
    if (isOperand(c)) {
      output += c;
    } else if (c === '(') {
      stack.push(c);
    } else if (c === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output += stack.pop();
      }
      stack.pop(); // remove '('
    } else if (c === '*') {
      // Unary operator, highest precedence — goes directly to output
      output += c;
    } else {
      // Binary operators: | and .
      while (
        stack.length > 0 &&
        stack[stack.length - 1] !== '(' &&
        (precedence[stack[stack.length - 1]] || 0) >= (precedence[c] || 0)
      ) {
        output += stack.pop();
      }
      stack.push(c);
    }
  }

  while (stack.length > 0) {
    output += stack.pop();
  }

  return output;
}

/**
 * Full conversion: regex string → postfix string.
 * Inserts concatenation then converts to postfix.
 *
 * @param {string} regex - Original regex string
 * @returns {string} Postfix expression
 */
export function regexToPostfix(regex) {
  const withConcat = insertConcatenation(regex);
  return infixToPostfix(withConcat);
}

function isOperand(c) {
  return c === 'a' || c === 'b';
}
