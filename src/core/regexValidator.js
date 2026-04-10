/**
 * Validates a regular expression over any alphanumeric alphabet.
 * Allowed characters: letters, digits, |, *, +, (, )
 * Validates balanced parentheses and structure.
 *
 * @param {string} regex - The regular expression string
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateRegex(regex) {
  if (!regex || regex.trim().length === 0) {
    return { valid: false, error: 'Regular expression cannot be empty.' };
  }

  const allowed = /^[a-zA-Z0-9|*+()]+$/;
  if (!allowed.test(regex)) {
    return {
      valid: false,
      error: 'Invalid characters. Only letters, digits, |, *, +, (, ) are allowed.',
    };
  }

  // Check balanced parentheses
  let depth = 0;
  for (const ch of regex) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0) {
      return { valid: false, error: 'Unmatched closing parenthesis.' };
    }
  }
  if (depth !== 0) {
    return { valid: false, error: 'Unmatched opening parenthesis.' };
  }

  // Check for empty parentheses ()
  if (regex.includes('()')) {
    return { valid: false, error: 'Empty parentheses are not allowed.' };
  }

  // Check that | is not at the start, end, or doubled
  if (regex.startsWith('|') || regex.endsWith('|')) {
    return { valid: false, error: 'Union operator | cannot be at the start or end.' };
  }
  if (regex.includes('||')) {
    return { valid: false, error: 'Consecutive union operators are not allowed.' };
  }

  // Check | is not preceded by ( or followed by )
  for (let i = 0; i < regex.length; i++) {
    if (regex[i] === '|') {
      if (i > 0 && regex[i - 1] === '(') {
        return { valid: false, error: 'Union operator | cannot appear right after (.' };
      }
      if (i < regex.length - 1 && regex[i + 1] === ')') {
        return { valid: false, error: 'Union operator | cannot appear right before ).' };
      }
    }
  }

  // Check * and + are not at start, after ( or |, or doubled (**)
  for (let i = 0; i < regex.length; i++) {
    if (regex[i] === '*' || regex[i] === '+') {
      const op = regex[i];
      if (i === 0) {
        return { valid: false, error: `'${op}' cannot be at the start.` };
      }
      const prev = regex[i - 1];
      if (prev === '(' || prev === '|') {
        return { valid: false, error: `'${op}' must follow a symbol, ) or *.` };
      }
      if (prev === '*' || prev === '+') {
        return { valid: false, error: `Consecutive quantifiers '${prev}${op}' are not allowed.` };
      }
    }
  }

  return { valid: true };
}
