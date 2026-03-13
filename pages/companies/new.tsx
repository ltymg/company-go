import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';

export default function NewCompany() {
  const router = useRouter();
  const [form, setForm] = useState({ legalName: '', jurisdiction: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/companies', form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="card w-full max-w-lg" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold mb-4">Create Company</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <input
          name="legalName"
          placeholder="Legal Name"
          className="input mb-3"
          value={form.legalName}
          onChange={handleChange}
          required
        />
        <input
          name="jurisdiction"
          placeholder="Jurisdiction (e.g. SG, US)"
          className="input mb-6"
          value={form.jurisdiction}
          onChange={handleChange}
          required
        />
        <button className="btn btn-primary w-full" type="submit">Create</button>
      </form>
    </div>
  );
}
