import { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../lib/api';

interface AdminRow {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const fetchAdmins = () => {
    setLoading(true);
    api
      .get<AdminRow[]>('/admin/users/admins')
      .then((res) => setAdmins(res.data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load admins'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const superFlag = localStorage.getItem('isSuperAdmin');
    if (role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }
    setIsSuperAdmin(superFlag === 'true');
    fetchAdmins();
  }, []);

  const createAdmin = async () => {
    if (!email.trim()) {
      alert('Email is required');
      return;
    }
    try {
      await api.post('/admin/users/admins', {
        email: email.trim(),
        password: password || undefined,
      });
      setEmail('');
      setPassword('');
      fetchAdmins();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create/upgrade admin');
    }
  };

  const downgradeAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to downgrade this admin to CLIENT?')) return;
    try {
      await api.patch(`/admin/users/${id}/role`, { role: 'CLIENT' });
      fetchAdmins();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to downgrade admin');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin · Admin Accounts</h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage administrator accounts. You can upgrade existing users or create new admin users.
              </p>
            </div>
            <div className="flex gap-3">
              <Button href="/admin" variant="outline" size="md">
                Back to Admin Home
              </Button>
              <Button href="/admin/users" variant="secondary" size="md">
                Back to Users
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card>
              <h2 className="text-lg font-semibold text-white">Existing admins</h2>
              {loading && <p className="text-sm text-gray-300 mt-3">Loading admins…</p>}
              {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

              {!loading && admins.length === 0 && !error && (
                <p className="mt-4 text-sm text-gray-400">No admin accounts yet.</p>
              )}

              {!loading && admins.length > 0 && (
                <div className="mt-4 space-y-3 text-sm text-gray-200">
                  {admins.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl border border-gray-700/50 bg-gray-900/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold">{a.email}</p>
                        <p className="text-xs text-gray-400">
                          {a.name || '—'} · since {new Date(a.createdAt).toLocaleDateString()}
                          {a.isSuperAdmin && <span className="ml-2 text-indigo-400 font-bold">[SUPER]</span>}
                        </p>
                      </div>
                      {isSuperAdmin && !a.isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downgradeAdmin(a.id)}
                        >
                          Downgrade
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {isSuperAdmin ? (
              <Card className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-white">Create / upgrade admin</h2>
                <p className="text-sm text-gray-500 mt-1">
                  - If the email already exists, this will upgrade that user to ADMIN.
                  <br />
                  - If the email does not exist, this will create a new ADMIN user (password required).
                </p>

                <div className="mt-4 space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Admin email</label>
                    <input
                      className="input w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Password (only for new admin)</label>
                    <input
                      type="password"
                      className="input w-full"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="leave blank to upgrade existing user"
                    />
                  </div>
                  <div className="pt-2">
                    <Button variant="primary" size="md" onClick={createAdmin}>
                      Save admin
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="lg:col-span-2 flex items-center justify-center bg-gray-800/20 border-dashed">
                <div className="text-center">
                  <p className="text-gray-500 text-sm italic">
                    Only Super Admin can create or manage admin permissions.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
