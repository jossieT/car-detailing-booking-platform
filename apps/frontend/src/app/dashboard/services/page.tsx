'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';

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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Manage Services</h2>
        <Link
          href="/dashboard/services/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2"
        >
          <Plus size={18} /> Add Service
        </Link>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="text-center text-white py-12">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center text-slate-400 py-12">No services found. Create your first service.</div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.map((service) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <Link
                        href={`/dashboard/services/${service.id}`}
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        <Eye size={16} /> View
                      </Link>
                      <Link
                        href={`/dashboard/services/${service.id}/edit`}
                        className="text-yellow-400 hover:text-yellow-300 inline-flex items-center gap-1"
                      >
                        <Pencil size={16} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
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