import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { isAuthed } from '../../lib/auth';
import { useRouter } from 'next/router';

type SearchItem = {
  title: string;
  company_number: string;
  company_status: string;
  date_of_creation?: string;
  date_of_cessation?: string;
  address_snippet?: string;
};

type SearchResponse = {
  items: SearchItem[];
  total_results: number;
};

export default function CompaniesHouseTools() {
  const router = useRouter();
  const [q, setQ] = useState('test');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);

  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [companyDetail, setCompanyDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isAuthed()) router.replace('/login');
  }, [router]);

  const search = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/ch/public/search', { params: { q } });
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (companyNumber: string) => {
    setSelectedNumber(companyNumber);
    setDetailLoading(true);
    setCompanyDetail(null);
    try {
      const { data } = await api.get(`/ch/public/company/${companyNumber}`);
      setCompanyDetail(data);
    } catch (e: any) {
      setCompanyDetail({ error: e.response?.data || e.message });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Companies House – Search & Lookup</h1>
              <p className="text-gray-400 mt-1">
                This page calls your backend proxy endpoints: <span className="text-gray-300">/ch/public/search</span> and <span className="text-gray-300">/ch/public/company/:number</span>.
              </p>
            </div>
            <Button href="/dashboard" variant="outline" size="sm">Back to Dashboard</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-2">Search query</label>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. test, limited, apple"
                  />
                </div>
                <Button onClick={search} variant="primary" size="md" disabled={loading || !q.trim()}>
                  {loading ? 'Searching…' : 'Search'}
                </Button>
              </div>

              {error && <p className="text-red-300 mt-4">{error}</p>}

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Results</h2>
                  <p className="text-sm text-gray-500">{result?.total_results ? `${result.total_results} total` : ''}</p>
                </div>

                {!result?.items?.length ? (
                  <p className="text-sm text-gray-400 mt-4">No results.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {result.items.slice(0, 20).map((item) => (
                      <button
                        key={item.company_number}
                        onClick={() => loadDetail(item.company_number)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          selectedNumber === item.company_number
                            ? 'border-indigo-500/50 bg-indigo-500/10'
                            : 'border-gray-700/50 bg-gray-900/30 hover:bg-gray-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-semibold">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.company_number} · {item.company_status}</p>
                            {item.address_snippet && <p className="text-sm text-gray-300 mt-2">{item.address_snippet}</p>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.date_of_creation ? <p>Created: {item.date_of_creation}</p> : null}
                            {item.date_of_cessation ? <p>Closed: {item.date_of_cessation}</p> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-white">Company detail</h2>
              <p className="text-sm text-gray-500 mt-1">Company Profile endpoint</p>

              {detailLoading ? (
                <p className="text-sm text-gray-300 mt-4">Loading…</p>
              ) : !companyDetail ? (
                <p className="text-sm text-gray-400 mt-4">Select a company on the left.</p>
              ) : (
                <pre className="mt-4 text-xs text-gray-200 whitespace-pre-wrap break-words bg-black/30 border border-gray-700/50 rounded-lg p-3 overflow-auto max-h-[520px]">
{JSON.stringify(companyDetail, null, 2)}
                </pre>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
