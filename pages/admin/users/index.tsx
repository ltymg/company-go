import { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../lib/api';

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get<UserRow[]>('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load users'))
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
    fetchUsers();
  }, []);

  const updateRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'CLIENT' : 'ADMIN';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin · Users</h1>
              <p className="text-sm text-gray-400 mt-1">Manage platform users and their roles.</p>
            </div>
            <div className="flex gap-3">
              <Button href="/admin" variant="outline" size="md">Back to Admin Home</Button>
              <Button href="/admin/admins" variant="secondary" size="md">Manage Admins</Button>
            </div>
          </div>

          <Card>
            {loading && <p className="text-sm text-gray-300">Loading users...</p>}
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            
            {!loading && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-200">
                  <thead>
                    <tr className="border-b border-gray-700 text-xs uppercase text-gray-400">
                      <th className="py-2 pr-4 text-left">ID</th>
                      <th className="py-2 pr-4 text-left">Name</th>
                      <th className="py-2 pr-4 text-left">Email</th>
                      <th className="py-2 pr-4 text-left">Role</th>
                      <th className="py-2 pr-4 text-left">Joined</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                        <td className="py-2 pr-4 font-mono text-xs">{user.id}</td>
                        <td className="py-2 pr-4">{user.name || '—'}</td>
                        <td className="py-2 pr-4">{user.email}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            user.role === 'ADMIN' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-gray-600 bg-gray-700/30 text-gray-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-400 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4 text-right space-x-3">
                          {isSuperAdmin ? (
                            <>
                              <button
                                onClick={() => updateRole(user.id, user.role)}
                                className="text-xs text-indigo-400 hover:text-indigo-200 underline"
                              >
                                {user.role === 'ADMIN' ? 'Downgrade' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-xs text-red-400 hover:text-red-200 underline"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">Read-only</span>
                          )}
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
