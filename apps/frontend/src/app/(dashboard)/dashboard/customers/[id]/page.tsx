'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { 
  ArrowLeft, Mail, Phone, Calendar as CalendarIcon, 
  MapPin, DollarSign, CalendarCheck, Clock, CheckCircle2, XCircle
} from 'lucide-react';

interface Booking {
  id: string;
  startTime: string;
  totalPrice: string | number;
  status: string;
  service: { name: string };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  bookings: Booking[];
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/customers/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch customer details');
      const data = await res.json();
      setCustomer(data);
    } catch (err: any) {
      console.error("Fetch customer error:", err);
      setError(err?.message || JSON.stringify(err) || 'Failed to fetch customer details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-900 rounded-2xl min-h-[400px]">
        <div className="text-blue-400">Loading customer profile...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-2xl min-h-[400px]">
        <div className="text-red-400">{error || 'Customer not found.'}</div>
        <button onClick={() => router.back()} className="mt-4 text-blue-400 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const totalSpent = customer.bookings?.reduce((sum, b) => sum + parseFloat(b.totalPrice as string || '0'), 0) || 0;
  const recentBookings = [...(customer.bookings || [])].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'NO_SHOW': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={16} className="mr-1.5" />;
      case 'CANCELLED': return <XCircle size={16} className="mr-1.5" />;
      default: return <Clock size={16} className="mr-1.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/customers" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition text-slate-300">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {customer.firstName} {customer.lastName}
              {!customer.isActive && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  Inactive
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400">Customer Profile</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-lg shadow-blue-500/20">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Stats */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-slate-300 shadow-sm">
                <Mail size={18} className="text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Email Address</p>
                  <p className="text-sm text-blue-400 hover:underline cursor-pointer">{customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 text-slate-300 shadow-sm">
                <Phone size={18} className="text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Phone Number</p>
                  <p className="text-sm">{customer.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-slate-300 shadow-sm">
                <MapPin size={18} className="text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Address</p>
                  <p className="text-sm">{customer.address || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 text-slate-300 shadow-sm pt-2 border-t border-slate-800">
                <CalendarIcon size={18} className="text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Member Since</p>
                  <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-[#0f172a] border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="text-sm text-blue-200/60 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-900/40 to-[#0f172a] border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <CalendarCheck size={20} />
                </div>
              </div>
              <p className="text-sm text-emerald-200/60 font-medium">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{customer.bookings?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Bookings History */}
        <div className="lg:col-span-2">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Booking History</h3>
              <Link href={`/dashboard/bookings?customer=${customer.id}`} className="text-sm text-blue-400 hover:text-blue-300 transition">
                View All
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 border border-dashed border-slate-800 rounded-xl">
                <CalendarIcon size={48} className="text-slate-600 mb-4 opacity-50" />
                <p>No bookings found for this customer.</p>
                <button className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition text-sm">
                  Create New Booking
                </button>
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date & Time</th>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5">
                          <Link href={`/dashboard/bookings/${booking.id}`} className="block group">
                            <span className="text-sm text-white font-medium group-hover:text-blue-400 transition">
                              {new Date(booking.startTime).toLocaleDateString()}
                            </span>
                            <br />
                            <span className="text-xs text-slate-400">
                              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-300">
                          {booking.service?.name || 'Unknown Service'}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-white">
                          ${parseFloat(booking.totalPrice as string || '0').toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
