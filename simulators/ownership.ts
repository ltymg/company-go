export type Shareholder = {
  id: string;
  name: string;
  percentage: number; // 0-100
};

export type OwnershipValidation = {
  total: number;
  isValid100: boolean;
  pscShareholders: Shareholder[]; // >25%
  needsEdd: boolean;
  issues: string[];
};

export function validateOwnership(shareholders: Shareholder[]): OwnershipValidation {
  const issues: string[] = [];
  const cleaned = (shareholders || []).map((s) => ({
    ...s,
    name: (s.name || '').trim(),
    percentage: Number.isFinite(s.percentage) ? s.percentage : 0,
  }));

  const total = Math.round(cleaned.reduce((sum, s) => sum + (s.percentage || 0), 0) * 100) / 100;

  if (cleaned.length === 0) issues.push('At least one shareholder is required.');
  if (cleaned.some((s) => !s.name)) issues.push('All shareholders must have a name.');
  if (cleaned.some((s) => s.percentage <= 0)) issues.push('All shareholders must have a percentage greater than 0.');

  const isValid100 = Math.abs(total - 100) < 0.001;
  if (!isValid100) issues.push(`Shareholder ownership must total 100%. Current total: ${total}%.`);

  const pscShareholders = cleaned.filter((s) => s.percentage > 25);

  // EDD simulation rules (simple): any shareholder > 50% OR more than 2 PSCs
  const needsEdd = cleaned.some((s) => s.percentage > 50) || pscShareholders.length >= 3;

  return {
    total,
    isValid100,
    pscShareholders,
    needsEdd,
    issues,
  };
}
