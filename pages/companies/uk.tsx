import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';

type DraftResponse = {
  id: number;
  status: string;
  env: string;
};

type SubmitResponse = {
  draftId: number;
  status: string;
  env: string;
  note?: string;
};

type Director = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  residentialAddress: string;
  serviceAddress: string;
};

type Shareholder = {
  id: string;
  fullName: string;
  shareholdingPercentage: number;
};

type FormState = {
  companyName: string;
  sicCode: string;
  registeredOfficeAddress: string;
  shareCapital: string;
  directors: Director[];
  shareholders: Shareholder[];
};

export default function UkCompanyNew() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    companyName: '',
    sicCode: '',
    registeredOfficeAddress: '',
    shareCapital: '100',
    directors: [{
      id: '1',
      fullName: '',
      dateOfBirth: '',
      nationality: '',
      residentialAddress: '',
      serviceAddress: '',
    }],
    shareholders: [{
      id: '1',
      fullName: '',
      shareholdingPercentage: 100,
    }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) router.replace('/login');
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDirectorChange = (id: string, field: keyof Director, value: string) => {
    setForm({
      ...form,
      directors: form.directors.map(director =>
        director.id === id ? { ...director, [field]: value } : director
      ),
    });
  };

  const handleShareholderChange = (id: string, field: keyof Shareholder, value: string | number) => {
    setForm({
      ...form,
      shareholders: form.shareholders.map(shareholder =>
        shareholder.id === id ? { ...shareholder, [field]: value } : shareholder
      ),
    });
  };

  const addDirector = () => {
    const newId = (form.directors.length + 1).toString();
    setForm({
      ...form,
      directors: [...form.directors, {
        id: newId,
        fullName: '',
        dateOfBirth: '',
        nationality: '',
        residentialAddress: '',
        serviceAddress: '',
      }],
    });
  };

  const addShareholder = () => {
    const newId = (form.shareholders.length + 1).toString();
    setForm({
      ...form,
      shareholders: [...form.shareholders, {
        id: newId,
        fullName: '',
        shareholdingPercentage: 0,
      }],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // 这里简单演示：从 localStorage 取 userId（真实环境应从 JWT/后端获取）
      const userIdRaw = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const userId = userIdRaw ? Number(userIdRaw) : undefined;

      const draftBody: any = {
        userId,
        companyName: form.companyName,
        sicCode: form.sicCode,
        registeredOfficeAddress: form.registeredOfficeAddress,
        shareCapital: form.shareCapital,
        directors: form.directors,
        shareholders: form.shareholders,
      };

      const draftRes = await api.post<DraftResponse>('/ch/filing/draft', draftBody);
      const draftId = draftRes.data.id;

      const submitRes = await api.post<SubmitResponse>(`/ch/filing/submit/${draftId}`);

      setSuccess('Draft created and marked as READY_FOR_FILING. Redirecting to dashboard…');
      // 把 filingId 存在 query 里，方便 dashboard 拉真实状态
      setTimeout(() => {
        router.push({
          pathname: '/dashboard',
          query: { filingId: draftId },
        });
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to submit UK company filing draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <Card>
            <h1 className="text-2xl font-bold text-white mb-2">New UK Company (Companies House)</h1>
            <p className="text-sm text-gray-400 mb-6">
              This form creates an internal filing draft and marks it as READY_FOR_FILING. Your operations team
              can then complete the Companies House filing (web filing / software filing) and backfill the company
              number.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-400">{success}</p>}

              {/* Company Details */}
              <div className="border-b border-gray-700 pb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Company Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Company name</label>
                    <input
                      name="companyName"
                      className="input w-full"
                      placeholder="Example UK LTD"
                      value={form.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">SIC code</label>
                    <input
                      name="sicCode"
                      className="input w-full"
                      placeholder="62020"
                      value={form.sicCode}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Registered office address</label>
                    <textarea
                      name="registeredOfficeAddress"
                      className="input w-full h-24"
                      placeholder="71-75 Shelton Street, Covent Garden, London, WC2H 9JQ"
                      value={form.registeredOfficeAddress}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Share capital (£)</label>
                    <input
                      name="shareCapital"
                      type="number"
                      className="input w-full"
                      placeholder="100"
                      value={form.shareCapital}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Directors */}
              <div className="border-b border-gray-700 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Directors</h2>
                  <Button variant="secondary" size="sm" onClick={addDirector}>
                    Add Director
                  </Button>
                </div>
                
                {form.directors.map((director, index) => (
                  <div key={director.id} className="border border-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-medium text-gray-300 mb-3">Director {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="John Doe"
                          value={director.fullName}
                          onChange={(e) => handleDirectorChange(director.id, 'fullName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="input w-full"
                          value={director.dateOfBirth}
                          onChange={(e) => handleDirectorChange(director.id, 'dateOfBirth', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Nationality</label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="British"
                          value={director.nationality}
                          onChange={(e) => handleDirectorChange(director.id, 'nationality', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Residential Address</label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="123 Main Street, London"
                          value={director.residentialAddress}
                          onChange={(e) => handleDirectorChange(director.id, 'residentialAddress', e.target.value)}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Service Address</label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="71-75 Shelton Street, Covent Garden, London, WC2H 9JQ"
                          value={director.serviceAddress}
                          onChange={(e) => handleDirectorChange(director.id, 'serviceAddress', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shareholders */}
              <div className="border-b border-gray-700 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Shareholders</h2>
                  <Button variant="secondary" size="sm" onClick={addShareholder}>
                    Add Shareholder
                  </Button>
                </div>
                
                {form.shareholders.map((shareholder, index) => (
                  <div key={shareholder.id} className="border border-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-medium text-gray-300 mb-3">Shareholder {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="John Doe"
                          value={shareholder.fullName}
                          onChange={(e) => handleShareholderChange(shareholder.id, 'fullName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Shareholding Percentage (%)</label>
                        <input
                          type="number"
                          className="input w-full"
                          placeholder="100"
                          value={shareholder.shareholdingPercentage}
                          onChange={(e) => handleShareholderChange(shareholder.id, 'shareholdingPercentage', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" size="md" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit draft'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
