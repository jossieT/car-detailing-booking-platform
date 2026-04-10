'use client';

import { useState, useEffect } from 'react';

interface Booking {
  id: string;
  customerName: string;
  customerEmail?: string;
  serviceName: string;
  serviceId: string;
  date: string;
  time: string;
  startTime: string;
  endTime?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  vehicleInfo?: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    color: string;
  };
  notes?: string;
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    serviceId: '',
    date: '',
    time: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleLicensePlate: '',
    vehicleColor: '',
    notes: '',
    status: 'PENDING',
  });
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    startDate: '',
    endDate: '',
  });
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  // Fetch bookings and services on mount
  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.customerName) queryParams.append('customerName', filters.customerName);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const res = await fetch(`${API_BASE}/admin/bookings?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services');
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      serviceId: '',
      date: '',
      time: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      vehicleLicensePlate: '',
      vehicleColor: '',
      notes: '',
      status: 'PENDING',
    });
    setEditingBooking(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail || '',
      serviceId: booking.serviceId,
      date: booking.date,
      time: booking.time,
      vehicleMake: booking.vehicleInfo?.make || '',
      vehicleModel: booking.vehicleInfo?.model || '',
      vehicleYear: booking.vehicleInfo?.year || '',
      vehicleLicensePlate: booking.vehicleInfo?.licensePlate || '',
      vehicleColor: booking.vehicleInfo?.color || '',
      notes: booking.notes || '',
      status: booking.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const payload = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || undefined,
      serviceId: formData.serviceId,
      date: formData.date,
      time: formData.time,
      vehicleInfo: {
        make: formData.vehicleMake,
        model: formData.vehicleModel,
        year: formData.vehicleYear,
        licensePlate: formData.vehicleLicensePlate,
        color: formData.vehicleColor,
      },
      notes: formData.notes,
      status: formData.status,
    };

    try {
      let res;
      if (editingBooking) {
        res = await fetch(`${API_BASE}/admin/bookings/${editingBooking.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/admin/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error(editingBooking ? 'Update failed' : 'Creation failed');
      showMessage(editingBooking ? 'Booking updated' : 'Booking created', 'success');
      setModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      showMessage('Status updated', 'success');
      fetchBookings();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Booking deleted', 'success');
      fetchBookings();
    } catch (err: any) {
      showMessage(err.message, 'error');
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

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Manage Bookings</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"
        >
          + New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Customer name"
            value={filters.customerName}
            onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            placeholder="Start date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
          <input
            type="date"
            placeholder="End date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="text-center text-white py-12">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-slate-400 py-12">No bookings found.</div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{booking.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.serviceName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${booking.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(booking.status)} bg-transparent`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openEditModal(booking)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white shadow-lg`}>
          {message.text}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {editingBooking ? 'Edit Booking' : 'Create New Booking'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Customer Email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Select Service</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} - ${svc.price}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    required
                  />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    required
                  />
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Vehicle Make"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    placeholder="Vehicle Model"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    placeholder="Vehicle Year"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    placeholder="License Plate"
                    value={formData.vehicleLicensePlate}
                    onChange={(e) => setFormData({ ...formData, vehicleLicensePlate: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    placeholder="Vehicle Color"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    {editingBooking ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}