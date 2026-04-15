'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Clock, DollarSign, Calendar, Users, CheckCircle, XCircle, Edit, Trash2, ArrowLeft, X } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  basePrice: string | number;
  isActive: boolean;
  imageUrl: string | null;
  bufferMinutes: number;
  capacity: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  basePrice: number;
  isActive: boolean;
  bufferMinutes: number;
  capacity: number;
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 60,
    basePrice: 0,
    isActive: true,
    bufferMinutes: 30,
    capacity: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const res = await apiFetch(`/services/${id}`);
      if (!res.ok) throw new Error('Service not found');
      const data = await res.json();
      setService(data);
      // Pre-fill form data for modal
      setFormData({
        name: data.name,
        description: data.description || '',
        duration: data.duration,
        basePrice: typeof data.basePrice === 'string' ? parseFloat(data.basePrice) : data.basePrice,
        isActive: data.isActive,
        bufferMinutes: data.bufferMinutes,
        capacity: data.capacity,
      });
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

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch(`/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Service deleted successfully', 'success');
      setTimeout(() => router.push('/dashboard/services'), 1500);
    } catch (err: any) {
      showMessage(err.message, 'error');
      setDeleteModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      showMessage('Service updated successfully', 'success');
      setEditModalOpen(false);
      fetchService(); // refresh the displayed service
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-lg animate-pulse">Loading service details...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center text-white py-12">
        <p className="text-xl">Service not found.</p>
        <Link href="/dashboard/services" className="text-purple-400 hover:underline mt-4 inline-block">
          ← Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/dashboard/services"
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft size={18} /> Back to Services
      </Link>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{service.name}</h1>
          <p className="text-slate-400 mt-1">Service ID: {service.id.slice(0, 8)}...</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition shadow-md"
          >
            <Edit size={18} /> Edit
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 rounded-xl transition shadow-md"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Horizontal stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Clock size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Duration</p>
            <p className="text-xl font-bold text-white">{service.duration} min</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <DollarSign size={20} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Price</p>
            <p className="text-xl font-bold text-white">{formatPrice(service.basePrice)}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Calendar size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Buffer</p>
            <p className="text-xl font-bold text-white">{service.bufferMinutes} min</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Users size={20} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Capacity</p>
            <p className="text-xl font-bold text-white">{service.capacity}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            {service.isActive ? <CheckCircle size={20} className="text-emerald-400" /> : <XCircle size={20} className="text-red-400" />}
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Status</p>
            <p className={`text-xl font-bold ${service.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
              {service.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Description & additional info */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-slate-400 text-sm font-medium">Description</label>
          <p className="text-white mt-1 leading-relaxed">{service.description || 'No description provided.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-white/10">
          <div>
            <label className="text-slate-400 text-sm">Business ID</label>
            <p className="text-white font-mono text-sm mt-1">{service.businessId}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Created: {new Date(service.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(service.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4 mx-auto">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Delete Service</h3>
            <p className="text-slate-400 text-center mb-6">
              Are you sure you want to permanently delete <span className="text-white font-semibold">"{service.name}"</span>? 
              This action will remove all associated data and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Edit Service</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Service Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleFormChange}
                      required
                      min={1}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Base Price ($) *</label>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleFormChange}
                      required
                      min={0}
                      step={0.01}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Buffer Minutes</label>
                    <input
                      type="number"
                      name="bufferMinutes"
                      value={formData.bufferMinutes}
                      onChange={handleFormChange}
                      min={0}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      min={1}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <label className="text-sm text-slate-300">Active (visible to customers)</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast message */}
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white shadow-lg z-50 animate-fade-in`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}