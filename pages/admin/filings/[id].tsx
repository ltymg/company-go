import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../lib/api';

type AdminChFiling = {
  id: number;
  userId: number;
  companyId: number | null;
  status: string;
  payloadJson: string;
  companyNumber: string | null;
  transactionId: string | null;
  env: string;
  createdAt: string;
  updatedAt: string;
};

type FilingStatusResponse = {
  transactionId: number;
  status: string;
  companyNumber: string | null;
  message: string;
  officialProfile?: any;
};

function safeJsonParse(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function AdminFilingDetail() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const [filing, setFiling] = useState<AdminChFiling | null>(null);
  const [statusRes, setStatusRes] = useState<FilingStatusResponse | null>(null);

  const [companyNumber, setCompanyNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const payloadObj = useMemo(() => {
    if (!filing?.payloadJson) return null;
    return safeJsonParse(filing.payloadJson);
  }, [filing?.payloadJson]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }

    if (!id) return;

    setLoading(true);
    setError('');

    Promise.all([
      api.get<AdminChFiling>(`/admin/ch/filing/${id}`),
      api.get<FilingStatusResponse>(`/ch/filing/status/${id}`),
    ])
      .then(([detailRes, statusRes]) => {
        setFiling(detailRes.data);
        setStatusRes(statusRes.data);
        const initialCompanyNo = detailRes.data.companyNumber || '';
        setCompanyNumber(initialCompanyNo);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load filing detail');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const refreshStatus = async () => {
    if (!id) return;
    try {
      const res = await api.get<FilingStatusResponse>(`/ch/filing/status/${id}`);
      setStatusRes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const backfill = async () => {
    if (!id) return;
    if (!companyNumber.trim()) {
      alert('companyNumber 不能为空');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.post<AdminChFiling>(`/admin/ch/filing/${id}/company-number`, {
        companyNumber: companyNumber.trim(),
      });
      setFiling(res.data);
      await refreshStatus();
      alert('回填成功');
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || '回填失败');
    } finally {
      setSaving(false);
    }
  };

  const official = statusRes?.officialProfile;
  const officialAddress = official?.registered_office_address
    ? [
        official.registered_office_address.address_line_1,
        official.registered_office_address.address_line_2,
        official.registered_office_address.locality,
        official.registered_office_address.region,
        official.registered_office_address.postal_code,
        official.registered_office_address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin · Filing #{id}</h1>
              <p className="text-sm text-gray-400 mt-1">View filing payload, status, and backfill company number.</p>
            </div>
            <div className="flex gap-3">
              <Button href="/admin/filings" variant="outline" size="md">Back</Button>
              <Button onClick={refreshStatus} variant="secondary" size="md">Refresh</Button>
            </div>
          </div>

          {loading && (
            <Card>
              <p className="text-sm text-gray-300">Loading…</p>
            </Card>
          )}

          {error && (
            <Card className="border-red-500/30 bg-red-500/10 mb-6">
              <p className="text-sm text-red-200">{error}</p>
            </Card>
          )}

          {!loading && filing && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-white">Filing detail</h2>
                <div className="mt-4 text-sm text-gray-200 space-y-2">
                  <p><strong>ID:</strong> {filing.id}</p>
                  <p><strong>User ID:</strong> {filing.userId}</p>
                  <p><strong>Status:</strong> {filing.status}</p>
                  <p><strong>Env:</strong> {filing.env}</p>
                  <p><strong>Company ID:</strong> {filing.companyId ?? '—'}</p>
                  <p><strong>Company Number:</strong> {filing.companyNumber ?? '—'}</p>
                  <p className="text-xs text-gray-500">Created: {new Date(filing.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Updated: {new Date(filing.updatedAt).toLocaleString()}</p>
                </div>

                <div className="mt-6 border-t border-gray-700/60 pt-6">
                  <h3 className="text-sm font-semibold text-white">Payload (JSON)</h3>
                  <p className="text-xs text-gray-500 mt-1">Raw payload saved in backend as payloadJson.</p>
                  <pre className="mt-3 text-xs text-gray-200 whitespace-pre-wrap break-words p-3 rounded-xl bg-gray-950/50 border border-gray-800/60">
                    {JSON.stringify(payloadObj ?? filing.payloadJson, null, 2)}
                  </pre>
                </div>
              </Card>

              <div className="space-y-8">
                <Card>
                  <h2 className="text-lg font-semibold text-white">Backfill company number</h2>
                  <p className="text-sm text-gray-500 mt-1">After WebFiling is completed, paste the company number here.</p>

                  <div className="mt-4 space-y-3">
                    <input
                      className="input w-full"
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                      placeholder="e.g. 12345678"
                    />
                    <Button onClick={backfill} variant="primary" size="md" disabled={saving}>
                      {saving ? 'Saving…' : 'Update company number'}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Tip: you can use 00000006 as a demo company number.</p>
                </Card>

                <Card className={official ? 'border-green-500/30' : ''}>
                  <h2 className="text-lg font-semibold text-white">Companies House (official)</h2>
                  <p className="text-sm text-gray-500 mt-1">Data returned by /ch/filing/status/:id → officialProfile.</p>

                  {!statusRes ? (
                    <p className="mt-4 text-sm text-gray-400">No status loaded.</p>
                  ) : (
                    <div className="mt-4 text-sm text-gray-200 space-y-2">
                      <p><strong>Internal status:</strong> {statusRes.status}</p>
                      <p><strong>Company number:</strong> {statusRes.companyNumber ?? '—'}</p>
                      <p className="text-xs text-gray-500">{statusRes.message}</p>

                      {!official ? (
                        <p className="text-sm text-gray-400 mt-3">No officialProfile yet. Backfill a company number to fetch official data.</p>
                      ) : (
                        <div className="mt-4 border-t border-gray-700/60 pt-4 space-y-2">
                          <p><strong>Name:</strong> {official.company_name ?? '—'}</p>
                          <p><strong>Status:</strong> {official.company_status ?? '—'}</p>
                          <p><strong>Created:</strong> {official.date_of_creation ?? '—'}</p>
                          <p><strong>SIC:</strong> {official.sic_codes?.join(', ') ?? '—'}</p>
                          <p><strong>Registered office:</strong> {officialAddress ?? '—'}</p>
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs text-indigo-300">Show raw officialProfile JSON</summary>
                            <pre className="mt-2 text-xs text-gray-200 whitespace-pre-wrap break-words p-3 rounded-xl bg-gray-950/50 border border-gray-800/60">
                              {JSON.stringify(official, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
