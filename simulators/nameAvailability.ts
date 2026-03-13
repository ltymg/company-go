const RESERVED_NAMES = [
  'google',
  'apple',
  'microsoft',
  'amazon',
  'meta',
  'openai',
  'anthropic',
  'firstbase',
  'companies house',
];

export type NameAvailabilityResult = {
  normalized: string;
  isAvailable: boolean;
  reason: string;
};

export function checkUkCompanyNameAvailability(name: string): NameAvailabilityResult {
  const normalized = (name || '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { normalized, isAvailable: false, reason: 'Enter a company name to check availability.' };
  }

  const lower = normalized.toLowerCase();

  if (normalized.length < 3) {
    return { normalized, isAvailable: false, reason: 'Name is too short.' };
  }

  if (RESERVED_NAMES.some((r) => lower.includes(r))) {
    return { normalized, isAvailable: false, reason: 'Name appears to be reserved or too similar to a well-known brand.' };
  }

  if (/\b(ltd|limited)\b/i.test(normalized) === false) {
    return { normalized, isAvailable: true, reason: 'Likely available. Consider adding “Ltd”.' };
  }

  // simple collision simulation: repeated words
  if (/\b(company|group|holdings)\b/i.test(normalized) && normalized.split(' ').length < 3) {
    return { normalized, isAvailable: false, reason: 'Too generic. Add more distinctive words.' };
  }

  return { normalized, isAvailable: true, reason: 'Likely available.' };
}
