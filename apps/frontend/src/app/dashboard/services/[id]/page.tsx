'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
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
      setService(data);
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
    if (!confirm('Delete this service?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/dashboard/services');
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  if (!service) {
    return <div className="text-white text-center py-12">Service not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">Service Details</h2>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/services/${id}/edit`}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm">Name</label>
            <p className="text-white text-lg">{service.name}</p>
          </div>
          <div>
            <label className="text-slate-400 text-sm">Description</label>
            <p className="text-white">{service.description || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-sm">Duration</label>
              <p className="text-white">{service.duration} minutes</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Price</label>
              <p className="text-white">{formatPrice(service.basePrice)}</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Buffer Minutes</label>
              <p className="text-white">{service.bufferMinutes} min</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Capacity</label>
              <p className="text-white">{service.capacity}</p>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm">Status</label>
            <p>
              <span
                className={`px-2 py-1 text-xs rounded-full border ${
                  service.isActive
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}
              >
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-slate-400 text-sm">Business ID</label>
            <p className="text-white text-sm font-mono">{service.businessId}</p>
          </div>
          <div className="text-xs text-slate-500 pt-4 border-t border-white/10">
            Created: {new Date(service.createdAt).toLocaleString()}
            <br />
            Updated: {new Date(service.updatedAt).toLocaleString()}
          </div>
        </div>
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