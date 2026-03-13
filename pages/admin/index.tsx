import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import Link from 'next/link';

interface AdminStats {
  totalFilings: number;
  pendingFilings: number;
  totalUsers: number;
  activeAdmins: number;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats>({
    totalFilings: 0,
    pendingFilings: 0,
    totalUsers: 0,
    activeAdmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }

    // 获取简单统计数据
    const fetchStats = async () => {
      try {
        const [filingsRes, usersRes, adminsRes] = await Promise.all([
          api.get('/admin/ch/filing'),
          api.get('/admin/users'),
          api.get('/admin/users/admins'),
        ]);

        const filings = filingsRes.data;
        setStats({
          totalFilings: filings.length,
          pendingFilings: filings.filter((f: any) => f.status === 'READY_FOR_FILING').length,
          totalUsers: usersRes.data.length,
          activeAdmins: adminsRes.data.length,
        });
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminModules = [
    {
      title: 'Company Filings',
      description: 'Manage UK company registration drafts and backfill company numbers.',
      href: '/admin/filings',
      count: stats.totalFilings,
      badge: `${stats.pendingFilings} Action Required`,
      color: 'border-indigo-500/30',
    },
    {
      title: 'User Management',
      description: 'Review platform users, delete accounts, and manage client access.',
      href: '/admin/users',
      count: stats.totalUsers,
      color: 'border-blue-500/30',
    },
    {
      title: 'Admin Accounts',
      description: 'Manage administrator permissions and create new admin users.',
      href: '/admin/admins',
      count: stats.activeAdmins,
      color: 'border-green-500/30',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, Administrator. Here is the platform overview.</p>
          </div>

          {loading ? (
            <p className="text-gray-300">Loading system statistics...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {adminModules.map((module) => (
                <Card key={module.href} className={`relative flex flex-col justify-between ${module.color}`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-white">{module.title}</h2>
                      {module.badge && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-6">{module.description}</p>
                    <div className="text-3xl font-mono font-bold text-white mb-2">
                      {module.count}
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Total Records</p>
                  </div>
                  <div className="mt-8">
                    <Link href={module.href}>
                      <Button variant="outline" size="sm" className="w-full">
                        Open Module
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-10 bg-indigo-500/5 border-indigo-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">System Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <p className="text-gray-200 font-medium">Manual Filing Guide</p>
                <p className="text-gray-400 mt-1">
                  1. Go to Filings list and pick "READY_FOR_FILING" items.<br/>
                  2. Use the provided JSON payload to fill Companies House WebFiling.<br/>
                  3. Once completed, backfill the company number in the detail view.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <p className="text-gray-200 font-medium">Platform Health</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-gray-400">Backend API: Online</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-gray-400">CH Sandbox: Connected</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
