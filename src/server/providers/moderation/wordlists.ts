// Minimal seed wordlists per locale — production should load these from a curated source.
// We keep them short on purpose; ML moderation in OpenAIModerationProvider catches the rest.

export const PROFANITY_TR = [
  "amk",
  "aq",
  "orospu",
  "şerefsiz",
  "puşt",
  "siktir",
  "sikim",
  "yarrak",
  "götveren",
  "amına",
];

export const PROFANITY_EN = [
  "fuck",
  "shit",
  "asshole",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "piss",
];

export const PII_PATTERNS: RegExp[] = [
  /\b\d{11}\b/, // TC kimlik (11 digits)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /(?:\+90|0)?\s*5\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/, // GSM
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, // credit card
];
