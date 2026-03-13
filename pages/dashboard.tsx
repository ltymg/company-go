import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { motion } from 'framer-motion';
import {
  CH_FLOW_STATUS,
  COMPANY_STATUS,
  ChFlowStatus,
  CompanyProfile,
  CompanyStatus,
  getChFlowStatus,
  getCompanyProfile,
  getCompanyStatus,
  setChFlowStatus,
  setCompanyProfile,
  setCompanyStatus,
} from '../lib/state';
import {
  clearNotifications,
  clearWorkflowHistory,
  getNotifications,
  getWorkflowHistory,
} from '../lib/workflow';
import {
  downloadCertificateTxt,
  generateCertificate,
  generateCompanyNumber,
} from '../lib/certificate';
import api from '../lib/api';

// --------------------
// Types & local helpers
// --------------------

type ComplianceResult = {
  status: 'pending' | 'passed' | 'failed';
  issues: string[];
  needsEdd: boolean;
  createdAt: string;
};

const COMPANY_NUMBER_KEY = 'companyNumber';
const CERTIFICATE_KEY = 'certificatePayload';

function getCompliance(): ComplianceResult | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('complianceResult');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getCompanyNumber(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COMPANY_NUMBER_KEY);
}

function setCompanyNumber(n: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPANY_NUMBER_KEY, n);
}

function getCertificatePayload(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CERTIFICATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCertificatePayload(p: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CERTIFICATE_KEY, JSON.stringify(p));
}

const labelForCompanyStatus: Record<string, string> = {
  [COMPANY_STATUS.EMPTY]: 'empty',
  [COMPANY_STATUS.DRAFT]: 'draft',
  [COMPANY_STATUS.SUBMITTED]: 'submitted',
  [COMPANY_STATUS.IN_PROGRESS]: 'in progress',
  [COMPANY_STATUS.COMPLETED]: 'completed',
  [COMPANY_STATUS.ERROR]: 'error',
  // Real backend statuses
  DRAFT: 'draft',
  READY_FOR_FILING: 'ready for filing',
  FILED_MANUALLY: 'filed manually',
};

function statusHeadline(status: string) {
  switch (status) {
    case COMPANY_STATUS.EMPTY:
      return 'Start your first company';
    case COMPANY_STATUS.DRAFT:
    case 'DRAFT':
      return 'Resume setup';
    case COMPANY_STATUS.SUBMITTED:
    case COMPANY_STATUS.IN_PROGRESS:
    case 'READY_FOR_FILING':
    case 'FILED_MANUALLY':
      return 'In progress';
    case COMPANY_STATUS.COMPLETED:
      return 'Company active';
    case COMPANY_STATUS.ERROR:
      return 'Action required';
    default:
      return 'Dashboard';
  }
}

function companyStatusDescription(status: string) {
  switch (status) {
    case COMPANY_STATUS.EMPTY:
      return 'No setup has been started yet.';
    case COMPANY_STATUS.DRAFT:
    case 'DRAFT':
      return 'You have a draft setup ready to complete.';
    case COMPANY_STATUS.SUBMITTED:
    case 'READY_FOR_FILING':
      return 'We received your submission and started processing it.';
    case COMPANY_STATUS.IN_PROGRESS:
    case 'FILED_MANUALLY':
      return 'Processing is ongoing. Government review may take 24–48h.';
    case COMPANY_STATUS.COMPLETED:
      return 'Your UK company is officially incorporated.';
    case COMPANY_STATUS.ERROR:
      return 'We hit an issue and need you to review the details.';
    default:
      return '';
  }
}

function chUxCopy(
  ch: ChFlowStatus | null,
  realStatus?: { status: string; companyNumber?: string | null; officialProfile?: any } | null,
): { title: string; body: string; tone: 'info' | 'success' | 'warn' } {
  if (realStatus) {
    if (realStatus.officialProfile?.company_status === 'active') {
      return {
        title: 'Active (Official)',
        body: 'Your company is officially active on UK Companies House.',
        tone: 'success',
      };
    }
    if (realStatus.status === 'READY_FOR_FILING') {
      return {
        title: 'Ready for filing',
        body:
          'Your filing draft is READY_FOR_FILING in FALALA. Our team will complete Companies House filing and backfill the company number.',
        tone: 'info',
      };
    }
    if (realStatus.status === 'FILED_MANUALLY') {
      return {
        title: 'Filed (manual)',
        body:
          realStatus.companyNumber
            ? `Filing has been completed manually. Company number ${realStatus.companyNumber} has been backfilled.`
            : 'Filing has been completed manually. Company number will be backfilled once available.',
        tone: 'info',
      };
    }
    if (realStatus.status === 'DRAFT') {
      return {
        title: 'Draft in progress',
        body: 'You have a Companies House draft stored in the backend. Complete the setup to proceed.',
        tone: 'info',
      };
    }
  }

  switch (ch) {
    case CH_FLOW_STATUS.FILED_WITH_CH:
      return {
        title: 'Filed',
        body: 'Your company has been filed with UK Companies House.',
        tone: 'info',
      };
    case CH_FLOW_STATUS.CH_ACCEPTED:
      return {
        title: 'In review',
        body: 'Government review in progress (usually 24–48h).',
        tone: 'info',
      };
    case CH_FLOW_STATUS.COMPLETED:
      return {
        title: 'Completed',
        body: 'Your UK company is officially incorporated.',
        tone: 'success',
      };
    case CH_FLOW_STATUS.KYC_FAILED:
      return {
        title: 'Action required',
        body: 'KYC failed. Please correct the information and resubmit.',
        tone: 'warn',
      };
    case CH_FLOW_STATUS.CH_REJECTED:
      return {
        title: 'Action required',
        body: 'Companies House rejected the filing. Please review and resubmit.',
        tone: 'warn',
      };
    case CH_FLOW_STATUS.KYC_PENDING:
      return {
        title: 'KYC pending',
        body: 'We are verifying the director and PSC details.',
        tone: 'info',
      };
    case CH_FLOW_STATUS.KYC_PASSED:
      return {
        title: 'KYC passed',
        body: 'KYC passed. Preparing Companies House filing.',
        tone: 'info',
      };
    case CH_FLOW_STATUS.READY_FOR_FILING:
      return {
        title: 'Ready for filing',
        body: 'We are preparing the software filing payload (XML over HTTPS).',
        tone: 'info',
      };
    case CH_FLOW_STATUS.INFO_COMPLETED:
      return {
        title: 'Info completed',
        body: 'Information completed. Starting compliance checks.',
        tone: 'info',
      };
    default:
      return {
        title: 'Not started',
        body: 'Start a setup to begin the Companies House workflow simulation.',
        tone: 'info',
      };
  }
}

const badgeToneClass: Record<'info' | 'success' | 'warn', string> = {
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  success: 'bg-green-500/15 text-green-300 border-green-500/30',
  warn: 'bg-red-500/15 text-red-300 border-red-500/30',
};

function ensureProfileSeed(): CompanyProfile {
  const now = new Date().toISOString();
  return {
    companyName: 'Example UK LTD',
    country: 'UK',
    industry: 'Software',
    sicCode: '62020',
    registeredOfficeAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    shareCapital: '100 shares @ £1',

    directorFullName: 'Alex Founder',
    directorDob: '1990-01-01',
    directorNationality: 'British',
    directorResidentialAddress: '10 Example Road, London, UK',
    directorServiceAddress: '71-75 Shelton Street, London, WC2H 9JQ',
    pscOver25: true,

    services: ['Company Registration'],
    createdAt: now,
    lastUpdated: now,
  };
}

// --------------------
// Dashboard component
// --------------------

export default function Dashboard() {
  const router = useRouter();
  const filingIdFromQuery = router.query.filingId as string | undefined;

  const [status, setStatus] = useState<CompanyStatus>(COMPANY_STATUS.EMPTY);
  const [chStatus, setChStatus] = useState<ChFlowStatus | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [companyNumber, setCompanyNumberState] = useState<string | null>(null);
  const [certificatePayload, setCertificatePayloadState] = useState<any | null>(null);
  const [realFilingStatus, setRealFilingStatus] = useState<
    | {
        transactionId: number;
        status: string;
        companyNumber: string | null;
        message: string;
        officialProfile?: any;
      }
    | null
  >(null);
  const [loadingRealStatus, setLoadingRealStatus] = useState(false);
  const [realStatusError, setRealStatusError] = useState<string | null>(null);

  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');
    if (!isAuthed) {
      window.location.href = '/login';
      return;
    }

    const sync = () => {
      setStatus(getCompanyStatus());
      setChStatus(getChFlowStatus());
      setProfile(getCompanyProfile());
      setWorkflowHistory(getWorkflowHistory());
      setNotifications(getNotifications());
      setCompliance(getCompliance());
      setCompanyNumberState(getCompanyNumber());
      setCertificatePayloadState(getCertificatePayload());
    };

    sync();

    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync as any);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth-changed', sync as any);
    };
  }, []);

  // 拉取真实后端 filing 状态（如果 URL 有 filingId）
  useEffect(() => {
    if (!filingIdFromQuery) return;
    setLoadingRealStatus(true);
    setRealStatusError(null);
    api
      .get(`/ch/filing/status/${filingIdFromQuery}`)
      .then((res) => {
        setRealFilingStatus(res.data);
      })
      .catch((err) => {
        console.error(err);
        setRealStatusError(
          err?.response?.data?.message || 'Failed to load real filing status from backend.',
        );
      })
      .finally(() => {
        setLoadingRealStatus(false);
      });
  }, [filingIdFromQuery]);

  // Auto-generate company number & certificate when completed (simulation only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== COMPANY_STATUS.COMPLETED) return;
    if (!profile) return;

    if (!companyNumber) {
      const n = generateCompanyNumber();
      setCompanyNumber(n);
      setCompanyNumberState(n);
    }

    if (!certificatePayload) {
      const n = companyNumber || getCompanyNumber() || generateCompanyNumber();
      if (!companyNumber) {
        setCompanyNumber(n);
        setCompanyNumberState(n);
      }
      const payload = generateCertificate(profile, n);
      setCertificatePayload(payload);
      setCertificatePayloadState(payload);
    }
  }, [status, profile, companyNumber, certificatePayload]);

  // --------------------
  // Derived state (Real vs Simulation)
  // --------------------

  const currentEffectiveStatus = realFilingStatus?.officialProfile?.company_status === 'active' 
    ? COMPANY_STATUS.COMPLETED 
    : (realFilingStatus?.status || status);

  const header = statusHeadline(currentEffectiveStatus);
  const desc = companyStatusDescription(currentEffectiveStatus);
  const chCopy = useMemo(
    () => chUxCopy(chStatus, realFilingStatus),
    [chStatus, realFilingStatus],
  );

  const progressPct = useMemo(() => {
    // If we have real official data saying active, it's 100%
    if (realFilingStatus?.officialProfile?.company_status === 'active') return 100;
    
    // If we have real backend status
    if (realFilingStatus) {
      if (realFilingStatus.status === 'READY_FOR_FILING') return 45;
      if (realFilingStatus.status === 'FILED_MANUALLY') return 75;
      if (realFilingStatus.status === 'DRAFT') return 15;
    }

    // Fallback to simulation logic
    if (status === COMPANY_STATUS.SUBMITTED) return 20;
    if (status === COMPANY_STATUS.IN_PROGRESS) {
      if (chStatus === CH_FLOW_STATUS.FILED_WITH_CH) return 55;
      if (chStatus === CH_FLOW_STATUS.CH_ACCEPTED) return 75;
      return 35;
    }
    if (status === COMPANY_STATUS.COMPLETED) return 100;
    if (status === COMPANY_STATUS.ERROR) return 40;
    return 0;
  }, [status, chStatus, realFilingStatus]);

  const primaryCta = useMemo(() => {
    if (realFilingStatus) {
      return { label: 'View real status', href: '#' };
    }
    switch (status) {
      case COMPANY_STATUS.EMPTY:
        return { label: 'Start configuration', href: '/setup' };
      case COMPANY_STATUS.DRAFT:
        return { label: 'Resume setup', href: '/setup' };
      case COMPANY_STATUS.SUBMITTED:
      case COMPANY_STATUS.IN_PROGRESS:
        return { label: 'View status', href: '/success' };
      case COMPANY_STATUS.COMPLETED:
        return { label: 'View company summary', href: '/dashboard' };
      case COMPANY_STATUS.ERROR:
        return { label: 'Complete setup', href: '/setup' };
      default:
        return { label: 'Start', href: '/setup' };
    }
  }, [status, realFilingStatus]);

  const resetAll = () => {
    setCompanyStatus(COMPANY_STATUS.EMPTY);
    localStorage.removeItem('chFlowStatus');
    localStorage.removeItem('companyProfile');
    localStorage.removeItem('complianceResult');
    localStorage.removeItem('shareholders');
    localStorage.removeItem(COMPANY_NUMBER_KEY);
    localStorage.removeItem(CERTIFICATE_KEY);
    clearWorkflowHistory();
    clearNotifications();

    setStatus(COMPANY_STATUS.EMPTY);
    setChStatus(null);
    setProfile(null);
    setWorkflowHistory([]);
    setNotifications([]);
    setCompliance(null);
    setCompanyNumberState(null);
    setCertificatePayloadState(null);
    setRealFilingStatus(null);
    setRealStatusError(null);
    // Remove query param without reload
    router.replace('/dashboard', undefined, { shallow: true });
  };

  const simulate = (nextCompany: CompanyStatus, nextCh?: ChFlowStatus) => {
    const seeded = getCompanyProfile() || ensureProfileSeed();
    setCompanyProfile(seeded);
    setProfile(seeded);

    setCompanyStatus(nextCompany);
    setStatus(nextCompany);

    if (nextCh) {
      setChFlowStatus(nextCh);
      setChStatus(nextCh);
    }
  };

  const simulateInfoIncomplete = () => {
    simulate(COMPANY_STATUS.ERROR, CH_FLOW_STATUS.KYC_FAILED);
  };

  const simulatePaymentFailed = () => {
    simulate(COMPANY_STATUS.ERROR, CH_FLOW_STATUS.CH_REJECTED);
  };

  const downloadCert = () => {
    if (!profile || !certificatePayload) return;
    downloadCertificateTxt(profile, certificatePayload);
  };

  // --------------------
  // Official Profile Display Logic
  // --------------------
  const official = realFilingStatus?.officialProfile;
  const officialAddress = official?.registered_office_address 
    ? `${official.registered_office_address.address_line_1 || ''}, ${official.registered_office_address.locality || ''}, ${official.registered_office_address.postal_code || ''}`
    : null;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-1">
                State-driven UI (Powered by real Companies House API)
              </p>
            </div>
            <div className="flex gap-3">
              <Button href="/companies/uk" variant="primary" size="md">
                New UK Filing
              </Button>
              <Button href={primaryCta.href} variant="secondary" size="md">
                {primaryCta.label}
              </Button>
              <Button onClick={resetAll} variant="outline" size="md">
                Reset
              </Button>
            </div>
          </div>

          {/* 如果 URL 中有 filingId，则显示真实状态卡片 */}
          {filingIdFromQuery && (
            <Card className="mb-8 border-indigo-500/40 bg-indigo-500/5">
              <h3 className="text-lg font-semibold text-white mb-1">
                Backend Filing Record
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                ID: <span className="font-mono">{filingIdFromQuery}</span> {realFilingStatus?.env === 'sandbox' && '(Sandbox)'}
              </p>
              {loadingRealStatus ? (
                <p className="text-sm text-gray-300 animate-pulse">Fetching status from CH via backend…</p>
              ) : realStatusError ? (
                <p className="text-sm text-red-400">{realStatusError}</p>
              ) : realFilingStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-200">
                  <div className="space-y-1">
                    <p>
                      <strong>Internal Status:</strong> <span className="text-indigo-300">{realFilingStatus.status}</span>
                    </p>
                    <p>
                      <strong>Company Number:</strong> {realFilingStatus.companyNumber || 'Pending'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>Official Source:</strong> {realFilingStatus.officialProfile ? 'Companies House API' : 'None yet'}</p>
                    <p className="text-gray-400 text-xs mt-1">{realFilingStatus.message}</p>
                  </div>
                </div>
              ) : null}
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main status */}
            <Card className="lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{header}</h2>
                  <p className="text-gray-400 mt-2">{desc}</p>
                </div>
                <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-gray-700/60 bg-gray-800/40 text-gray-200">
                  {labelForCompanyStatus[currentEffectiveStatus] || currentEffectiveStatus}
                </span>
              </div>

              {(currentEffectiveStatus !== COMPANY_STATUS.EMPTY) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Formation Progress</span>
                    <span className="text-sm text-gray-400">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                    <motion.div
                      className="bg-indigo-500 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 rounded-xl border border-gray-700/50 bg-gray-900/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Companies House Channel</p>
                    <p className="text-lg font-semibold text-white">{chCopy.title}</p>
                    <p className="text-gray-300 mt-1">{chCopy.body}</p>
                    {(realFilingStatus?.status || chStatus) && (
                      <p className="text-xs text-gray-500 mt-2">Flow Status: {realFilingStatus?.status || chStatus}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${badgeToneClass[chCopy.tone]}`}
                  >
                    {realFilingStatus?.officialProfile ? 'Real API' : 'Simulation'}
                  </span>
                </div>
              </div>

              {/* Action required issues */}
              {status === COMPANY_STATUS.ERROR && compliance?.issues?.length ? (
                <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                  <p className="text-sm font-semibold text-red-200">Key issues</p>
                  <ul className="mt-2 text-sm text-red-100 list-disc list-inside space-y-1">
                    {compliance.issues.slice(0, 8).map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Timeline from workflow history */}
              <div className="mt-8 border-t border-gray-700/50 pt-6">
                <h3 className="text-lg font-semibold text-white">Workflow timeline</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Audit trail of registration events.
                </p>

                {workflowHistory.length === 0 && !realFilingStatus ? (
                  <p className="mt-4 text-sm text-gray-400">
                    No events recorded yet. Submit a setup to generate timeline.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {/* If we have real status, prepend a real event */}
                    {realFilingStatus && (
                      <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">API Update: {realFilingStatus.status}</p>
                          <p className="text-xs text-indigo-300">Live</p>
                        </div>
                        <p className="text-sm text-indigo-100 mt-1">{realFilingStatus.message}</p>
                      </div>
                    )}
                    {workflowHistory.slice(-10).map((e: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-gray-700/50 bg-gray-900/30 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{e.chFlowStatus}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(e.at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{e.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Right column */}
            <div className="space-y-8">
              <Card className={official ? 'border-green-500/30' : ''}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-white">Company profile</h3>
                  {official && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">OFFICIAL</span>}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {official ? 'Data from UK Companies House API' : 'Local draft summary'}
                </p>

                {(!profile && !official) ? (
                  <div className="mt-6 text-sm text-gray-400">No profile yet.</div>
                ) : (
                  <div className="space-y-4 text-sm text-gray-200">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Entity Details</p>
                      <p>
                        <strong>Name:</strong> {official?.company_name || profile?.companyName || '—'}
                      </p>
                      <p>
                        <strong>Number:</strong> {official?.company_number || realFilingStatus?.companyNumber || companyNumber || 'Pending'}
                      </p>
                      <p>
                        <strong>Status:</strong> <span className={official?.company_status === 'active' ? 'text-green-400' : ''}>{official?.company_status || '(Draft)'}</span>
                      </p>
                      <p>
                        <strong>Type:</strong> {official?.type || profile?.country || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Dates & Industry</p>
                      <p>
                        <strong>Incorporated:</strong> {official?.date_of_creation || '—'}
                      </p>
                      <p>
                        <strong>SIC Codes:</strong> {official?.sic_codes?.join(', ') || profile?.sicCode || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Registered Office</p>
                      <p className="whitespace-pre-wrap text-xs text-gray-300 mt-1">
                        {officialAddress || profile?.registeredOfficeAddress || '—'}
                      </p>
                    </div>
                    {!official && profile?.directorFullName && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Director (Draft)</p>
                        <p><strong>Name:</strong> {profile.directorFullName}</p>
                        <p><strong>Nationality:</strong> {profile.directorNationality}</p>
                      </div>
                    )}
                    <div className="pt-2 text-[10px] text-gray-600 italic">
                      <p>Last Data Sync: {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white">Official Outputs</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Documents retrieved from Companies House.
                </p>

                {(!official && currentEffectiveStatus !== COMPANY_STATUS.COMPLETED) ? (
                  <p className="mt-4 text-sm text-gray-400">Available after incorporation.</p>
                ) : (
                  <div className="mt-4 space-y-3 text-sm text-gray-200">
                    <p>
                      <strong>Company number:</strong> {official?.company_number || realFilingStatus?.companyNumber || companyNumber || '—'}
                    </p>
                    {official && (
                      <p className="text-xs text-green-400">✓ Digital record active</p>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={downloadCert}
                      disabled={!profile && !official}
                    >
                      Download Incorporation Cert
                    </Button>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white">Support & Logs</h3>
                <p className="text-sm text-gray-500 mt-1">
                  System notifications and event logs.
                </p>

                {notifications.length === 0 && !realFilingStatus ? (
                  <p className="mt-4 text-sm text-gray-400">
                    No recent notifications.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {realFilingStatus && (
                       <div className="p-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
                        <p className="text-[10px] text-indigo-400 uppercase font-bold">System Log</p>
                        <p className="text-xs text-gray-300 mt-0.5">Filing status tracked via backend engine.</p>
                       </div>
                    )}
                    {notifications.slice(0, 4).map((n: any) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-gray-700/50 bg-gray-900/30 opacity-70"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-white">
                            {n.type}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{n.subject}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Simulation controls - Hidden if real data exists */}
          {!filingIdFromQuery && (
            <Card className="mt-10 bg-gray-800/30 border-dashed">
              <h3 className="font-semibold text-white mb-2">Prototype Simulation Controls</h3>
              <p className="text-sm text-gray-500 mb-4">
                Used for offline demos. Start a real UK filing via <a href="/companies/uk" className="text-indigo-400 underline">/companies/uk</a> to bypass simulation.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => simulate(COMPANY_STATUS.EMPTY)}
                >
                  Set: empty
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => simulate(COMPANY_STATUS.DRAFT, CH_FLOW_STATUS.INFO_COMPLETED)}
                >
                  Set: draft
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    simulate(
                      COMPANY_STATUS.IN_PROGRESS,
                      CH_FLOW_STATUS.CH_ACCEPTED,
                    )
                  }
                >
                  Simulate: CH Review
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    simulate(
                      COMPANY_STATUS.COMPLETED,
                      CH_FLOW_STATUS.COMPLETED,
                    )
                  }
                >
                  Simulate: Success
                </Button>
              </div>
            </Card>
          )}

          {/* 6-layer diagram */}
          <Card className="mt-10">
            <h3 className="text-lg font-semibold text-white">
              UK Companies House Digitization Flow
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              End-to-end, automated, auditable, and scalable.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-200">
              <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-900/30">
                <p className="text-indigo-400 font-bold mb-1">1) USER LAYER</p>
                <p>Founder inputs data via intelligent wizard.</p>
              </div>
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                <p className="text-indigo-400 font-bold mb-1">2) BACKEND WORKFLOW</p>
                <p>NestJS & Prisma managing persistent filing drafts.</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-900/30">
                <p className="text-indigo-400 font-bold mb-1">3) COMPLIANCE</p>
                <p>KYC/AML validation before filing submission.</p>
              </div>
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                <p className="text-green-400 font-bold mb-1">4) OFFICIAL CH API</p>
                <p>Direct integration with Companies House Public data.</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-900/30">
                <p className="text-indigo-400 font-bold mb-1">5) SOFTWARE FILING</p>
                <p>JSON to XML TIS transformation (Future).</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-900/30">
                <p className="text-indigo-400 font-bold mb-1">6) STATUS SYNC</p>
                <p>Automatic polling and profile updates.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
