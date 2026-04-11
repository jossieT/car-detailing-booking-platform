'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingService } from '@/services/booking.service';
import { serviceService } from '@/services/service.service';
import { businessService } from '@/services/business.service';
import type { Booking } from '@/types/booking';
import type { Service } from '@/types/service';
import type { Business } from '@/types/business';

interface Slot {
  start: string;
  end: string;
  available: boolean;
  staffId: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
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

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [servicesData, businessesData] = await Promise.all([
        serviceService.getAll(),
        businessService.getAll(),
      ]);
      setServices(servicesData);
      setBusinesses(businessesData);
      if (businessesData.length === 1) setSelectedBusinessId(businessesData[0].id);
      if (servicesData.length > 0) setSelectedServiceId(servicesData[0].id);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const data = await bookingService.getAll(params);
      setBookings(data);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedDate || !selectedServiceId || !selectedBusinessId) {
      showMessage('Please select business, service, and date first', 'error');
      return;
    }
    setFetchingSlots(true);
    try {
      const data = await bookingService.getSlots(selectedDate, selectedServiceId, selectedBusinessId);
      setSlots(data);
      setSelectedSlot('');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setFetchingSlots(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const resetForm = () => {
    setSelectedBusinessId(businesses.length === 1 ? businesses[0].id : '');
    setSelectedServiceId(services.length > 0 ? services[0].id : '');
    setSelectedDate('');
    setSlots([]);
    setSelectedSlot('');
    setFormData({
      customerName: '',
      customerEmail: '',
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
    const startDate = new Date(booking.startTime);
    const dateStr = startDate.toISOString().split('T')[0];
    //setSelectedBusinessId(booking.businessId);
    setSelectedServiceId(booking.serviceId);
    setSelectedDate(dateStr);
    setSelectedSlot(booking.startTime);
    setFormData({
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      customerEmail: booking.customer.email,
      vehicleMake: booking.vehicleInfo?.make || '',
      vehicleModel: booking.vehicleInfo?.model || '',
      vehicleYear: booking.vehicleInfo?.year?.toString() || '',
      vehicleLicensePlate: booking.vehicleInfo?.licensePlate || '',
      vehicleColor: booking.vehicleInfo?.color || '',
      notes: booking.notes || '',
      status: booking.status,
    });
    setSlots([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      showMessage('Please select a time slot', 'error');
      return;
    }
    const payload = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || undefined,
      serviceId: selectedServiceId,
      businessId: selectedBusinessId,
      startTime: selectedSlot,
      vehicleInfo: {
        make: formData.vehicleMake,
        model: formData.vehicleModel,
        year: parseInt(formData.vehicleYear) || 0,
        licensePlate: formData.vehicleLicensePlate,
        color: formData.vehicleColor,
      },
      notes: formData.notes,
      status: formData.status,
    };
    try {
      if (editingBooking) {
        await bookingService.update(editingBooking.id, payload);
      } else {
        await bookingService.create(payload);
      }
      showMessage(editingBooking ? 'Booking updated' : 'Booking created', 'success');
      setModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await bookingService.updateStatus(id, newStatus);
      showMessage('Status updated', 'success');
      fetchBookings();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await bookingService.delete(id);
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
    return styles[status] || 'bg-gray-500/20 text-gray-300';
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSlotTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Customer Name</label>
            <input
              type="text"
              placeholder="Search customer..."
              value={filters.customerName}
              onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', customerName: '', startDate: '', endDate: '' })}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm"
            >
              Clear Filters
            </button>
          </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/dashboard/bookings/${booking.id}`} className="text-white hover:text-purple-400">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatDate(booking.startTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatTime(booking.startTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${parseFloat(booking.totalPrice).toFixed(2)}</td>
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
                      <button onClick={() => openEditModal(booking)} className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={() => handleDelete(booking.id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal with Slot Flow */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {editingBooking ? 'Edit Booking' : 'Create New Booking'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {businesses.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Business</label>
                    <select
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                      required
                    >
                      <option value="">Select Business</option>
                      {businesses.map((biz) => (
                        <option key={biz.id} value={biz.id}>{biz.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    required
                  >
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} - ${typeof svc.basePrice === 'string' ? parseFloat(svc.basePrice).toFixed(2) : svc.basePrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchSlots}
                  disabled={fetchingSlots || !selectedDate || !selectedServiceId || !selectedBusinessId}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {fetchingSlots ? 'Checking slots...' : 'Check Available Slots'}
                </button>

                {slots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Time Slot</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot.start)}
                          className={`px-3 py-2 text-sm rounded-lg border transition ${
                            selectedSlot === slot.start
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-purple-500'
                          }`}
                        >
                          {formatSlotTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    placeholder="Year"
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
                    placeholder="Color"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                />

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                    {editingBooking ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white shadow-lg z-50`}>
          {message.text}
        </div>
      )}
    </div>
  );
}