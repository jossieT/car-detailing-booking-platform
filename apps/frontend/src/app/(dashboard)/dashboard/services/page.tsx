'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, Plus, Search, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  basePrice: number;
  isActive: boolean;
  bufferMinutes: number;
  capacity: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [filters, setFilters] = useState({
    name: '',
    minPrice: '',
    maxPrice: '',
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchServices();
  }, []);

  // Apply filters whenever services or filters change
  useEffect(() => {
    applyFilters();
  }, [services, filters]);

  const fetchServices = async () => {
    setLoading(true);
    try {

      const res = await apiFetch(`/services`);
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...services];

    // Filter by name (case-insensitive)
    if (filters.name.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by min price
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(service => {
          const price = typeof service.basePrice === 'string' ? parseFloat(service.basePrice) : service.basePrice;
          return price >= min;
        });
      }
    }

    // Filter by max price
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter(service => {
          const price = typeof service.basePrice === 'string' ? parseFloat(service.basePrice) : service.basePrice;
          return price <= max;
        });
      }
    }

    setFilteredServices(filtered);
  };

  const clearFilters = () => {
    setFilters({ name: '', minPrice: '', maxPrice: '' });
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Service deleted', 'success');
      fetchServices();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const businessId = user?.businessId;

      if (!businessId) {
        throw new Error('Business ID not found. Please log in again.');
      }

      const res = await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({ ...formData, businessId }),
      });
      if (!res.ok) throw new Error('Creation failed');
      showMessage('Service created successfully', 'success');
      setAddModalOpen(false);
      setFormData({
        name: '',
        description: '',
        duration: 60,
        basePrice: 0,
        isActive: true,
        bufferMinutes: 30,
        capacity: 1,
      });
      fetchServices();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Manage Services</h2>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Service Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Min Price ($)</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              step="1"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Price ($)</label>
            <input
              type="number"
              placeholder="Any"
              min="0"
              step="1"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm flex items-center gap-2"
            >
              <X size={16} /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="text-center text-white py-12">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          No services match your filters.
          {services.length > 0 && (
            <button
              onClick={clearFilters}
              className="ml-2 text-purple-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/services/${service.id}`}
                        className="text-white hover:text-purple-400 transition font-medium"
                      >
                        {service.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {service.duration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatPrice(service.basePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${
                          service.isActive
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Service</h2>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Service Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Premium Hand Wash"
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
                    placeholder="Describe what this service includes..."
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
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium disabled:opacity-50 shadow-lg shadow-purple-500/20"
                  >
                    {submitting ? 'Creating...' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
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