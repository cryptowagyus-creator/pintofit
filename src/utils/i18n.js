const SPANISH_USERS = new Set(['alejo', 'claudia', 'eliana', 'mafe', 'rosalina']);

export function isSpanishUser(name) {
  return SPANISH_USERS.has((name || '').trim().toLowerCase());
}

export function t(name, english, spanish) {
  return isSpanishUser(name) ? spanish : english;
}
