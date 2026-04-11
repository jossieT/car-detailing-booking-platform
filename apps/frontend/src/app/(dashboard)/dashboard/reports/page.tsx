'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, Users, Briefcase } from 'lucide-react';

interface RevenueSummary {
  totalRevenue: number;
  avgBookingValue: number;
  totalBookings: number;
}

interface BookingVolumePoint {
  date: string;
  count: number;
  revenue: number;
}

interface ServiceRevenue {
  serviceName: string;
  revenue: number;
  count: number;
}

interface CustomerMetrics {
  newCustomers: number;
  returningCustomers: number;
}

interface StaffPerformance {
  staffName: string;
  completedBookings: number;
  totalRevenue: number;
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [bookingVolume, setBookingVolume] = useState<BookingVolumePoint[]>([]);
  const [revenueByService, setRevenueByService] = useState<ServiceRevenue[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff'>('overview');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [summaryRes, volumeRes, serviceRes, customerRes, staffRes] = await Promise.all([
        apiFetch(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
        apiFetch(`/reports/booking-volume?startDate=${startDate}&endDate=${endDate}`),
        apiFetch(`/reports/revenue-by-service?startDate=${startDate}&endDate=${endDate}`),
        apiFetch(`/reports/customer-metrics?startDate=${startDate}&endDate=${endDate}`),
        apiFetch(`/reports/staff-performance?startDate=${startDate}&endDate=${endDate}`),
      ]);

      if (summaryRes.ok) setRevenueSummary(await summaryRes.json());
      if (volumeRes.ok) setBookingVolume(await volumeRes.json());
      if (serviceRes.ok) setRevenueByService(await serviceRes.json());
      if (customerRes.ok) setCustomerMetrics(await customerRes.json());
      if (staffRes.ok) setStaffPerformance(await staffRes.json());
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const exportCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(h => JSON.stringify(row[h] ?? ''));
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a'];

  if (loading) {
    return <div className="text-white text-center py-12">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Range */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {revenueSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400"><DollarSign size={18} /> Total Revenue</div>
            <p className="text-2xl font-bold text-white">${revenueSummary.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400"><TrendingUp size={18} /> Avg. Booking Value</div>
            <p className="text-2xl font-bold text-white">${revenueSummary.avgBookingValue.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400"><Briefcase size={18} /> Total Bookings</div>
            <p className="text-2xl font-bold text-white">{revenueSummary.totalBookings}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {['overview', 'services', 'staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-sm font-medium transition ${
                activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'services' ? 'Revenue by Service' : 'Staff Performance'}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Booking Volume Chart */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Daily Booking Volume & Revenue</h3>
              <button
                onClick={() => exportCSV(bookingVolume, 'booking_volume', ['date', 'count', 'revenue'])}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name="Bookings" stroke="#6366f1" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* New vs Returning Customers */}
          {customerMetrics && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4">New vs Returning Customers</h3>
              <div className="flex justify-center">
                <ResponsiveContainer width={300} height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New Customers', value: customerMetrics.newCustomers },
                        { name: 'Returning', value: customerMetrics.returningCustomers },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1].map((idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue by Service Tab */}
      {activeTab === 'services' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue by Service</h3>
            <button
              onClick={() => exportCSV(revenueByService, 'revenue_by_service', ['serviceName', 'revenue', 'count'])}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueByService} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="serviceName" stroke="#94a3b8" width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} formatter={(value) => `$${value}`} />
              <Bar dataKey="revenue" name="Revenue ($)" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Staff Performance Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Staff Performance</h3>
            <button
              onClick={() => exportCSV(staffPerformance, 'staff_performance', ['staffName', 'completedBookings', 'totalRevenue'])}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr><th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Staff</th><th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Completed Bookings</th><th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Total Revenue</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffPerformance.map((staff) => (
                  <tr key={staff.staffName} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white">{staff.staffName}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{staff.completedBookings}</td>
                    <td className="px-6 py-4 text-sm text-white">${staff.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}