import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COMPANY_STATUS,
  CH_FLOW_STATUS,
  CompanyProfile,
  getCompanyProfile,
  setCompanyProfile,
  setCompanyStatus,
  setChFlowStatus,
} from '../lib/state';
import api from '../lib/api';
import { suggestUkSicCode } from '../lib/simulators/sicSuggest';
import { Shareholder, validateOwnership } from '../lib/simulators/ownership';

const steps = [
  { id: 1, name: 'Company Basics' },
  { id: 2, name: 'People & Ownership' },
  { id: 3, name: 'Compliance Check' },
  { id: 4, name: 'Review & Submit' },
];

const nowIso = () => new Date().toISOString();

const initialProfile: CompanyProfile = {
  companyName: '',
  country: 'UK',
  industry: '',
  sicCode: '',
  registeredOfficeAddress: '',
  shareCapital: '',

  directorFullName: '',
  directorDob: '',
  directorNationality: '',
  directorResidentialAddress: '',
  directorServiceAddress: '',
  pscOver25: false,

  services: ['Company Registration'],
  createdAt: nowIso(),
  lastUpdated: nowIso(),
};

type ComplianceResult = {
  status: 'pending' | 'passed' | 'failed';
  issues: string[];
  needsEdd: boolean;
  createdAt: string;
};

const COMPLIANCE_KEY = 'complianceResult';
const SHAREHOLDERS_KEY = 'shareholders';

const inputClass =
  'w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

const smallHint = 'text-xs text-gray-500 mt-1';

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getShareholders(): Shareholder[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SHAREHOLDERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setShareholders(v: Shareholder[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SHAREHOLDERS_KEY, JSON.stringify(v));
}

function setCompliance(r: ComplianceResult) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(r));
}

function getCompliance(): ComplianceResult | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(COMPLIANCE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Setup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<CompanyProfile>(initialProfile);
  const [companyType, setCompanyType] = useState<'LTD'>('LTD');
  const [shareholders, setShareholdersState] = useState<Shareholder[]>([]);
  const [sameAsServiceAddress, setSameAsServiceAddress] = useState(false);

  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');
    if (!isAuthed) {
      router.replace('/login');
      return;
    }

    const existing = getCompanyProfile();
    if (existing) {
      setProfile(existing);
      setCompanyStatus(COMPANY_STATUS.DRAFT);
    } else {
      setCompanyProfile(initialProfile);
      setCompanyStatus(COMPANY_STATUS.DRAFT);
    }

    const existingSh = getShareholders();
    if (existingSh.length) {
      setShareholdersState(existingSh);
    } else {
      const seeded: Shareholder[] = [
        { id: uid(), name: '', percentage: 100 },
      ];
      setShareholdersState(seeded);
      setShareholders(seeded);
    }
  }, [router]);

  const updateProfile = (updates: Partial<CompanyProfile>) => {
    setProfile((prev) => {
      const next: CompanyProfile = {
        ...prev,
        ...updates,
        lastUpdated: nowIso(),
      };
      setCompanyProfile(next);
      setCompanyStatus(COMPANY_STATUS.DRAFT);
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateProfile({ [name]: value } as Partial<CompanyProfile>);
  };

  // Name availability via Companies House REST API (through backend proxy)
  const [nameCheck, setNameCheck] = useState<{ loading: boolean; items: any[]; error: string | null }>({
    loading: false,
    items: [],
    error: null,
  });

  useEffect(() => {
    const name = profile.companyName.trim();
    if (!name || name.length < 3) {
      setNameCheck({ loading: false, items: [], error: null });
      return;
    }

    let cancelled = false;
    setNameCheck((prev) => ({ ...prev, loading: true, error: null }));

    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.get('/ch/public/search', { params: { q: name } });
        if (cancelled) return;
        setNameCheck({ loading: false, items: data.items || [], error: null });
      } catch (e: any) {
        if (cancelled) return;
        setNameCheck({ loading: false, items: [], error: e.response?.data?.message || 'Name check unavailable' });
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [profile.companyName]);

  // SIC suggestion simulation
  const sicSuggestion = useMemo(() => suggestUkSicCode(profile.industry), [profile.industry]);

  // ownership validation
  const ownership = useMemo(() => validateOwnership(shareholders), [shareholders]);

  useEffect(() => {
    // auto update PSC flag based on shareholder psc list
    updateProfile({ pscOver25: ownership.pscShareholders.length > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownership.pscShareholders.length]);

  const toggleService = (service: string, checked: boolean) => {
    const current = profile.services || [];
    const next = checked ? Array.from(new Set([...current, service])) : current.filter((s) => s !== service);
    updateProfile({ services: next });
  };

  const updateShareholder = (id: string, patch: Partial<Shareholder>) => {
    const next = shareholders.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setShareholdersState(next);
    setShareholders(next);
  };

  const addShareholder = () => {
    const next = [...shareholders, { id: uid(), name: '', percentage: 0 }];
    setShareholdersState(next);
    setShareholders(next);
  };

  const removeShareholder = (id: string) => {
    const next = shareholders.filter((s) => s.id !== id);
    setShareholdersState(next);
    setShareholders(next);
  };

  const runCompliance = (): ComplianceResult => {
    const issues: string[] = [];

    // required fields per doc
    if (!profile.companyName.trim()) issues.push('Company name is required.');
    if (!profile.registeredOfficeAddress.trim()) issues.push('Registered office address (UK) is required.');
    if (!profile.sicCode.trim()) issues.push('SIC code is required.');
    if (!profile.shareCapital.trim()) issues.push('Share capital is required.');

    if (!profile.directorFullName.trim()) issues.push('Director full legal name is required.');
    if (!profile.directorDob.trim()) issues.push('Director DOB is required.');
    if (!profile.directorNationality.trim()) issues.push('Director nationality is required.');
    if (!profile.directorResidentialAddress.trim()) issues.push('Director residential address is required.');
    if (!profile.directorServiceAddress.trim()) issues.push('Director service address is required.');

    // name availability (basic): if Companies House search returns many results, treat as potential conflict
    if (nameCheck.items.length > 0) {
      issues.push('Company name check: similar names exist in Companies House search.');
    }

    // ownership
    issues.push(...ownership.issues);

    const needsEdd = ownership.needsEdd;

    const result: ComplianceResult = {
      status: issues.length ? 'failed' : 'passed',
      issues,
      needsEdd,
      createdAt: nowIso(),
    };

    setCompliance(result);
    return result;
  };

  const nextStep = () => {
    const next = Math.min(currentStep + 1, 4);

    // when entering compliance step, compute it
    if (next === 3) {
      runCompliance();
    }

    setCurrentStep(next);
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    // On submit: lock in that info is completed and kick off CH flow simulation
    setCompanyStatus(COMPANY_STATUS.SUBMITTED);
    setChFlowStatus(CH_FLOW_STATUS.INFO_COMPLETED);
    router.push('/success');
  };

  const compliance = useMemo(() => getCompliance(), [currentStep]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 pt-24 pb-12">
        <Card className="w-full max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`text-sm font-medium ${currentStep >= step.id ? 'text-white' : 'text-gray-500'}`}
                >
                  Step {step.id}: {step.name}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1 */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Step 1 – Company Basics</h2>
                  <p className="text-sm text-gray-400 mb-6">UK is locked. We'll simulate name availability and SIC mapping.</p>

                  <div className="space-y-4">
                    <div>
                      <input
                        name="companyName"
                        placeholder="Company Name (we'll check Companies House)"
                        value={profile.companyName}
                        onChange={handleChange}
                        className={inputClass}
                      />

                      {/* Name check status */}
                      {nameCheck.loading && (
                        <p className={`${smallHint} text-gray-400`}>Checking Companies House…</p>
                      )}
                      {!nameCheck.loading && !nameCheck.error && profile.companyName.trim() && nameCheck.items.length === 0 && (
                        <p className={`${smallHint} text-green-400`}>
                          No similar names found in Companies House search.
                        </p>
                      )}
                      {!nameCheck.loading && nameCheck.items.length > 0 && (
                        <div className={smallHint + ' text-red-300'}>
                          Found {nameCheck.items.length} similar name(s) in Companies House. See a few examples below.
                          <ul className="mt-1 space-y-1">
                            {nameCheck.items.slice(0, 3).map((item: any) => (
                              <li key={item.company_number} className="flex flex-col">
                                <span className="font-semibold text-xs text-red-200">{item.title}</span>
                                <span className="text-[11px] text-gray-400">
                                  {item.company_number} · {item.company_status} · {item.date_of_creation}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {nameCheck.error && (
                        <p className={`${smallHint} text-yellow-300`}>
                          Name check unavailable (REST API error). Basic validation only.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Country</label>
                        <input value="United Kingdom" disabled className={inputClass + ' opacity-70 cursor-not-allowed'} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Company type</label>
                        <select
                          value={companyType}
                          onChange={(e) => setCompanyType(e.target.value as 'LTD')}
                          className={inputClass}
                        >
                          <option value="LTD">Private Limited Company (Ltd)</option>
                        </select>
                        <p className={smallHint}>Default: Ltd (most common).</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Share capital</label>
                        <input
                          name="shareCapital"
                          placeholder="e.g. 100 shares @ £1"
                          value={profile.shareCapital}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <textarea
                      name="registeredOfficeAddress"
                      placeholder="Registered Office Address (UK)"
                      value={profile.registeredOfficeAddress}
                      onChange={handleChange}
                      className={inputClass}
                      rows={3}
                    />

                    <div>
                      <input
                        name="industry"
                        placeholder="Business description (we'll suggest SIC code)"
                        value={profile.industry}
                        onChange={handleChange}
                        className={inputClass}
                      />
                      {sicSuggestion && (
                        <div className="mt-2 text-sm text-gray-300">
                          Suggested SIC: <span className="font-semibold">{sicSuggestion.sicCode}</span> – {sicSuggestion.label}{' '}
                          <span className="text-xs text-gray-500">({sicSuggestion.confidence} confidence)</span>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateProfile({ sicCode: sicSuggestion.sicCode })}
                            >
                              Apply suggestion
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      name="sicCode"
                      placeholder="SIC Code (required)"
                      value={profile.sicCode}
                      onChange={handleChange}
                      className={inputClass}
                    />

                    <div className="pt-2">
                      <p className="text-sm text-gray-400 mb-2">Services</p>
                      <div className="space-y-3">
                        {['Company Registration', 'Bank Account', 'Compliance'].map((service) => (
                          <label
                            key={service}
                            className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:border-indigo-500/50"
                          >
                            <input
                              type="checkbox"
                              checked={profile.services.includes(service)}
                              onChange={(e) => toggleService(service, e.target.checked)}
                              className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-white">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Step 2 – People & Ownership</h2>
                  <p className="text-sm text-gray-400 mb-6">Add directors and shareholders. We'll validate 100% ownership and identify PSC (&gt;25%).</p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Director</h3>
                      <div className="space-y-4">
                        <input
                          name="directorFullName"
                          placeholder="Director Full Legal Name"
                          value={profile.directorFullName}
                          onChange={handleChange}
                          className={inputClass}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            name="directorDob"
                            placeholder="DOB (YYYY-MM-DD)"
                            value={profile.directorDob}
                            onChange={handleChange}
                            className={inputClass}
                          />
                          <input
                            name="directorNationality"
                            placeholder="Nationality"
                            value={profile.directorNationality}
                            onChange={handleChange}
                            className={inputClass}
                          />
                        </div>
                        <textarea
                          name="directorResidentialAddress"
                          placeholder="Residential Address"
                          value={profile.directorResidentialAddress}
                          onChange={handleChange}
                          className={inputClass}
                          rows={3}
                        />
                        <label className="flex items-center gap-3 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={sameAsServiceAddress}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSameAsServiceAddress(checked);
                              if (checked) {
                                updateProfile({ directorServiceAddress: profile.directorResidentialAddress });
                              }
                            }}
                          />
                          Same as service address
                        </label>
                        <textarea
                          name="directorServiceAddress"
                          placeholder="Service Address"
                          value={profile.directorServiceAddress}
                          onChange={handleChange}
                          className={inputClass}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">Shareholders</h3>
                        <Button size="sm" variant="secondary" onClick={addShareholder}>Add shareholder</Button>
                      </div>

                      <div className="space-y-3">
                        {shareholders.map((s, idx) => (
                          <div key={s.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                            <div className="md:col-span-6">
                              <input
                                placeholder={`Shareholder ${idx + 1} name`}
                                value={s.name}
                                onChange={(e) => updateShareholder(s.id, { name: e.target.value })}
                                className={inputClass}
                              />
                            </div>
                            <div className="md:col-span-4">
                              <input
                                type="number"
                                placeholder="%"
                                value={Number.isFinite(s.percentage) ? s.percentage : 0}
                                onChange={(e) => updateShareholder(s.id, { percentage: Number(e.target.value) })}
                                className={inputClass}
                              />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeShareholder(s.id)}
                                disabled={shareholders.length <= 1}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 text-sm text-gray-300">
                        Total ownership: <span className={`font-semibold ${ownership.isValid100 ? 'text-green-400' : 'text-red-400'}`}>{ownership.total}%</span>
                        {ownership.pscShareholders.length > 0 && (
                          <div className="mt-1 text-xs text-gray-400">
                            PSC detected (&gt;25%): {ownership.pscShareholders.map((p) => p.name || '—').join(', ')}
                          </div>
                        )}
                        {ownership.needsEdd && (
                          <div className="mt-1 text-xs text-yellow-300">
                            Enhanced Due Diligence (EDD) may be required (simulation).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Step 3 – Compliance Check</h2>
                  <p className="text-sm text-gray-400 mb-6">We're verifying your information.</p>

                  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-700/50 bg-gray-900/30">
                    <div className="w-10 h-10 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="text-white font-medium">KYC / AML / Sanctions / PEP</p>
                      <p className="text-sm text-gray-400">This prototype simulates checks and generates pass/fail results.</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    {compliance?.status === 'passed' ? (
                      <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-200">
                        Compliance passed.
                        {compliance.needsEdd && <span className="block text-xs text-yellow-200 mt-2">EDD flagged (simulation).</span>}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200">
                        Action required.
                        <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                          {(compliance?.issues || []).slice(0, 6).map((i, idx) => (
                            <li key={idx}>{i}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-300 mt-3">Fix the issues in previous steps, then continue.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Step 4 – Review & Submit</h2>
                  <p className="text-sm text-gray-400 mb-6">Review business summary, people & ownership, and estimated timeline. We do not show XML in the UI.</p>

                  <div className="space-y-4 text-gray-200 bg-gray-800/30 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Business summary</p>
                      <p><strong>Name:</strong> {profile.companyName || '—'}</p>
                      <p><strong>Type:</strong> Private Limited Company (Ltd)</p>
                      <p><strong>Registered office:</strong> {profile.registeredOfficeAddress || '—'}</p>
                      <p><strong>SIC:</strong> {profile.sicCode || '—'}</p>
                      <p><strong>Share capital:</strong> {profile.shareCapital || '—'}</p>
                      <p><strong>Industry:</strong> {profile.industry || '—'}</p>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-gray-400">Directors & shareholders</p>
                      <p><strong>Director:</strong> {profile.directorFullName || '—'} ({profile.directorNationality || '—'})</p>
                      <p><strong>PSC &gt; 25%:</strong> {ownership.pscShareholders.length ? ownership.pscShareholders.map((p) => p.name || '—').join(', ') : 'None'}</p>
                      <p><strong>Ownership total:</strong> {ownership.total}%</p>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-gray-400">Estimated timeline</p>
                      <p>Filed → In review (usually 24–48h) → Completed</p>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-gray-400">Services</p>
                      <p>{profile.services.length ? profile.services.join(', ') : '—'}</p>
                    </div>
                  </div>

                  {!ownership.isValid100 && (
                    <p className="text-sm text-red-300 mt-4">Ownership must total 100% before submission.</p>
                  )}
                  {nameCheck.items.length > 0 && (
                    <p className="text-sm text-red-300 mt-2">
                      Company name should be sufficiently distinct from existing Companies House records.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button variant="primary" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!ownership.isValid100 || nameCheck.items.length > 0 || compliance?.status === 'failed'}
              >
                Confirm & Submit
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
