export function parseCSV(str) {
  return String(str ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeEpsilon(symbol) {
  const normalized = String(symbol ?? '').trim();
  const lower = normalized.toLowerCase();
  if (!normalized || lower === 'epsilon' || lower === 'eps' || normalized === 'ε' || normalized === 'λ') {
    return 'ε';
  }
  return normalized;
}
