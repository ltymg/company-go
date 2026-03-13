import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { isAuthed, setToken } from '../lib/auth';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthed()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.access_token);
      
      // 根据角色重定向
      const role = localStorage.getItem('role');
      if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-black">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome Back</h1>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mt-8">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Sign In
              </Button>
            </div>
            <p className="mt-6 text-sm text-center text-gray-400">
              No account?{' '}
              <a href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Sign up
              </a>
            </p>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
