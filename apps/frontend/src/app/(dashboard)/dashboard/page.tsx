'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeServices: number;
  totalCustomers: number;
  pendingBookings: number;
  confirmedBookings: number;
}

interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  amount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    activeServices: 0,
    totalCustomers: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
    }
    if (!accessToken) {
      router.push('/login');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.firstName || user.email || 'Admin');
      } catch (e) {}
    }

    setToken(accessToken);
    fetchDashboardData(accessToken);
  }, [mounted, router]);

  const fetchDashboardData = async (authToken: string) => {
    setLoading(true);
    try {
      // Fetch stats (replace with your actual endpoints)
      const [statsRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/admin/recent-bookings?limit=5`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (!statsRes.ok || !bookingsRes.ok) throw new Error('Failed to fetch data');

      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();

      setStats(statsData);
      setRecentBookings(bookingsData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      // Fallback mock data (for development)
      setStats({
        totalBookings: 42,
        totalRevenue: 12850,
        activeServices: 8,
        totalCustomers: 156,
        pendingBookings: 12,
        confirmedBookings: 30,
      });
      setRecentBookings([
        { id: '1', customerName: 'John Doe', serviceName: 'Essential Wash', date: '2026-05-15', time: '10:00 AM', status: 'CONFIRMED', amount: 45 },
        { id: '2', customerName: 'Jane Smith', serviceName: 'Premium Interior', date: '2026-05-14', time: '2:30 PM', status: 'PENDING', amount: 89 },
        { id: '3', customerName: 'Mike Johnson', serviceName: 'The Works', date: '2026-05-13', time: '11:15 AM', status: 'COMPLETED', amount: 129 },
        { id: '4', customerName: 'Sarah Williams', serviceName: 'Ceramic Shield', date: '2026-05-12', time: '9:00 AM', status: 'CONFIRMED', amount: 299 },
        { id: '5', customerName: 'David Brown', serviceName: 'Essential Wash', date: '2026-05-11', time: '3:45 PM', status: 'CANCELLED', amount: 45 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      COMPLETED: 'bg-green-500/20 text-green-300 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Services</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.activeServices}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Customers</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Pending & Confirmed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Pending Bookings</h3>
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingBookings}</p>
            <p className="text-slate-400 text-sm mt-1">Awaiting confirmation</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Confirmed Bookings</h3>
            <p className="text-3xl font-bold text-blue-400">{stats.confirmedBookings}</p>
            <p className="text-slate-400 text-sm mt-1">Ready for service</p>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Recent Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{booking.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.serviceName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${booking.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentBookings.length === 0 && (
            <div className="text-center py-8 text-slate-400">No recent bookings found.</div>
          )}
        </div>
      </main>
    </div>
  );
}