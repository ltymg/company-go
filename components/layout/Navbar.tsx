import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '../ui/Button';
import { clearToken, isAuthed as isAuthedFn } from '../../lib/auth';

const Navbar: React.FC = () => {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setIsAuthed(isAuthedFn());
      if (typeof window !== 'undefined') {
        setRole(localStorage.getItem('role'));
      }
    };
    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') sync();
    };
    const onAuthChanged = () => sync();
    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleGetStarted = () => {
    if (!isAuthed) {
      router.push('/login');
    } else {
      router.push('/setup');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/50 backdrop-blur-lg">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          GlobalCorp
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
          <Link href="/#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthed && role === 'ADMIN' && (
            <Link href="/admin" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium mr-2">
              Admin Panel
            </Link>
          )}
          {isAuthed && (
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium mr-2">
              Dashboard
            </Link>
          )}
          {isAuthed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearToken();
                router.push('/login');
              }}
            >
              Logout
            </Button>
          ) : (
            <Button href="/login" variant="outline" size="sm">Login</Button>
          )}
          <Button variant="primary" size="sm" onClick={handleGetStarted}>Get Started</Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
