'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(form),
      }, true);

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center">Create Your Business</h1>
          <p className="text-slate-400 text-center text-sm mt-2 mb-6">Start your car detailing journey</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
              required
            />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
              required
            />
            <input
              type="text"
              placeholder="Business Name"
              value={form.businessName}
              onChange={(e) => setForm({...form, businessName: e.target.value})}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
              required
            />
            <input
              type="text"
              placeholder="Business Address (optional)"
              value={form.businessAddress}
              onChange={(e) => setForm({...form, businessAddress: e.target.value})}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            />
            <input
              type="tel"
              placeholder="Business Phone (optional)"
              value={form.businessPhone}
              onChange={(e) => setForm({...form, businessPhone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            />
            <input
              type="email"
              placeholder="Business Email (optional)"
              value={form.businessEmail}
              onChange={(e) => setForm({...form, businessEmail: e.target.value})}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            />
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Business & Sign Up'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Already have an account? <Link href="/login" className="text-purple-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}