export type SicSuggestion = {
  sicCode: string;
  label: string;
  confidence: 'low' | 'medium' | 'high';
};

const RULES: Array<{ keywords: RegExp; sic: SicSuggestion }> = [
  {
    keywords: /(software|saas|app|platform|developer|it|tech)/i,
    sic: { sicCode: '62020', label: 'Information technology consultancy activities', confidence: 'high' },
  },
  {
    keywords: /(ecommerce|shopify|amazon|store|retail)/i,
    sic: { sicCode: '47910', label: 'Retail sale via mail order houses or via Internet', confidence: 'high' },
  },
  {
    keywords: /(marketing|advertis|seo|social media|growth)/i,
    sic: { sicCode: '73110', label: 'Advertising agencies', confidence: 'medium' },
  },
  {
    keywords: /(consulting|advisory|strategy)/i,
    sic: { sicCode: '70229', label: 'Management consultancy activities (other than financial management)', confidence: 'medium' },
  },
  {
    keywords: /(fintech|payments|bank|credit|lending)/i,
    sic: { sicCode: '64999', label: 'Financial intermediation not elsewhere classified', confidence: 'low' },
  },
];

export function suggestUkSicCode(industryText: string): SicSuggestion | null {
  const t = (industryText || '').trim();
  if (!t) return null;

  for (const r of RULES) {
    if (r.keywords.test(t)) return r.sic;
  }

  return { sicCode: '82990', label: 'Other business support service activities n.e.c.', confidence: 'low' };
}
