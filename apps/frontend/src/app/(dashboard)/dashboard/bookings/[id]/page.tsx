'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface BookingDetail {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalPrice: string;
  depositPaid: string | null;
  notes: string | null;
  internalNotes: string | null;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
  businessId: string;
  service: {
    id: string;
    name: string;
    description: string;
    duration: number;
    basePrice: string;
  };
  staff: {
    id: string;
    firstName: string;
    lastName: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
    //   const token = localStorage.getItem('accessToken');
    //   const res = await fetch(`${API_BASE}/bookings/${id}`, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   });
      const res = await apiFetch(`/bookings/${id}`);
      if (!res.ok) throw new Error('Booking not found');
      const data = await res.json();
      setBooking(data);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const handleStatusUpdate = async () => {
    if (!targetStatus) return;
    const newStatus = targetStatus;
    setUpdating(true);
    try {
      const res = await apiFetch(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Status update failed');
      }
      showMessage(`Status updated to ${newStatus}`, 'success');
      setStatusConfirmOpen(false);
      setTargetStatus(null);
      fetchBooking();
    } catch (err: any) {
      showMessage(err.message, 'error');
      setStatusConfirmOpen(false);
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = (newStatus: string) => {
    setTargetStatus(newStatus);
    setStatusConfirmOpen(true);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading booking details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center text-white py-12">
        Booking not found.
        <div className="mt-4">
          <Link href="/dashboard/bookings" className="text-purple-400 hover:underline">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(booking.startTime);
  const totalPriceNum = parseFloat(booking.totalPrice);
  const depositPaidNum = booking.depositPaid ? parseFloat(booking.depositPaid) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-4">
      {/* Header with title and back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Details</h1>
          <p className="text-slate-400 text-sm mt-1">ID: {booking.id}</p>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-slate-400 hover:text-white flex items-center gap-1 transition text-sm"
        >
          ← Back to Bookings
        </Link>
      </div>

      {/* Status and Action Buttons (right-aligned) */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-slate-400 text-sm">Current Status</span>
            <div className="mt-1">
              <span className={`px-3 py-1 text-sm rounded-full border ${getStatusBadge(booking.status)}`}>
                {booking.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {booking.status === 'PENDING' && (
              <>
                <button
                  onClick={() => updateStatus('CONFIRMED')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                >
                  Approve Booking
                </button>
                <button
                  onClick={() => updateStatus('CANCELLED')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                >
                  Cancel Booking
                </button>
              </>
            )}
            {booking.status === 'CONFIRMED' && (
              <>
                <button
                  onClick={() => updateStatus('COMPLETED')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => updateStatus('CANCELLED')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                >
                  Cancel Booking
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout: Customer Info (left) & Appointment Details (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-sm">Full Name</label>
              <p className="text-white">{booking.customer.firstName} {booking.customer.lastName}</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Email</label>
              <p className="text-white">{booking.customer.email}</p>
            </div>
            {booking.customer.phone && (
              <div>
                <label className="text-slate-400 text-sm">Phone</label>
                <p className="text-white">{booking.customer.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Appointment Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-sm">Service</label>
              <p className="text-white font-medium">{booking.service.name}</p>
              <p className="text-slate-300 text-sm mt-1">{booking.service.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-sm">Date</label>
                <p className="text-white">{date}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Start Time</label>
                <p className="text-white">{time}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm">End Time</label>
                <p className="text-white">{formatDateTime(booking.endTime).time}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Duration</label>
                <p className="text-white">{booking.service.duration} min</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Assigned Staff</label>
                <p className="text-white">{booking.staff.firstName} {booking.staff.lastName}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Total Price</label>
                <p className="text-white font-semibold">${totalPriceNum.toFixed(2)}</p>
              </div>
              {depositPaidNum > 0 && (
                <div>
                  <label className="text-slate-400 text-sm">Deposit Paid</label>
                  <p className="text-white">${depositPaidNum.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details (full width) */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-400 text-sm">Make</label>
            <p className="text-white">{booking.vehicleInfo.make || '—'}</p>
          </div>
          <div>
            <label className="text-slate-400 text-sm">Model</label>
            <p className="text-white">{booking.vehicleInfo.model || '—'}</p>
          </div>
          <div>
            <label className="text-slate-400 text-sm">Year</label>
            <p className="text-white">{booking.vehicleInfo.year || '—'}</p>
          </div>
          <div>
            <label className="text-slate-400 text-sm">Color</label>
            <p className="text-white">{booking.vehicleInfo.color || '—'}</p>
          </div>
          <div>
            <label className="text-slate-400 text-sm">License Plate</label>
            <p className="text-white font-mono">{booking.vehicleInfo.licensePlate || '—'}</p>
          </div>
        </div>
      </div>

      {/* Notes if any */}
      {booking.notes && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
          <p className="text-slate-300 whitespace-pre-wrap">{booking.notes}</p>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusConfirmOpen && targetStatus && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white text-center mb-2">Update Booking Status</h3>
            <p className="text-slate-400 text-center mb-6">
              Are you sure you want to change the booking status to <span className={`font-semibold ${getStatusBadge(targetStatus)} px-2 py-0.5 rounded text-xs`}>{targetStatus}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStatusConfirmOpen(false);
                  setTargetStatus(null);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-slate-500 text-right pt-2 border-t border-white/10">
        Created: {new Date(booking.createdAt).toLocaleString()}
        <br />
        Last updated: {new Date(booking.updatedAt).toLocaleString()}
      </div>

      {/* Toast message */}
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white shadow-lg z-50`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}