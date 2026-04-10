'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  basePrice: number;
  isActive: boolean;
  bufferMinutes: number;
  capacity: number;
}

export default function EditServicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 60,
    basePrice: 0,
    isActive: true,
    bufferMinutes: 30,
    capacity: 1,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Service not found');
      const data = await res.json();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      showMessage('Service updated successfully', 'success');
      setTimeout(() => router.push('/dashboard/services'), 1500);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Service</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Service Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
              onChange={handleChange}
              className="w-4 h-4 accent-purple-500"
            />
            <label className="text-sm text-slate-300">Active (visible to customers)</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/services')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

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