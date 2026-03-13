import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../lib/api';

interface ChFilingRow {
  id: number;
  userId: number;
  status: string;
  companyNumber: string | null;
  env: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFilingsList() {
  const [rows, setRows] = useState<ChFilingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    setLoading(true);
    api
      .get<ChFilingRow[]>('/admin/ch/filing')
      .then((res) => setRows(res.data))
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load filings');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin · Filings</h1>
              <p className="text-sm text-gray-400 mt-1">
                Internal view of all Companies House filing drafts and manual filings.
              </p>
            </div>
            <div className="flex gap-3">
              <Button href="/admin" variant="outline" size="md">
                Back to Admin Home
              </Button>
              <Button href="/companies/uk" variant="primary" size="md">
                New UK Draft
              </Button>
            </div>
          </div>

          <Card>
            {loading && <p className="text-sm text-gray-300">Loading…</p>}
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            {!loading && rows.length === 0 && !error && (
              <p className="text-sm text-gray-400">No filings yet.</p>
            )}

            {!loading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-200">
                  <thead>
                    <tr className="border-b border-gray-700 text-xs uppercase text-gray-400">
                      <th className="py-2 pr-4 text-left">ID</th>
                      <th className="py-2 pr-4 text-left">Status</th>
                      <th className="py-2 pr-4 text-left">Company No.</th>
                      <th className="py-2 pr-4 text-left">Env</th>
                      <th className="py-2 pr-4 text-left">User</th>
                      <th className="py-2 pr-4 text-left">Created</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                        <td className="py-2 pr-4 font-mono text-xs">{row.id}</td>
                        <td className="py-2 pr-4 text-xs">{row.status}</td>
                        <td className="py-2 pr-4 text-xs">{row.companyNumber || '—'}</td>
                        <td className="py-2 pr-4 text-xs">{row.env}</td>
                        <td className="py-2 pr-4 text-xs">{row.userId}</td>
                        <td className="py-2 pr-4 text-xs text-gray-400">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <Link
                            href={`/admin/filings/${row.id}`}
                            className="text-xs text-indigo-300 hover:text-indigo-100 underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
