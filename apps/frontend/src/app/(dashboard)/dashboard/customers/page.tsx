'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Eye, Edit, Trash2, Plus, Search, X, UserCheck, UserX } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  totalSpent: number;
  bookings: any[];
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingBookings, setViewingBookings] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [filters, setFilters] = useState({ name: '', email: '' });
  const [message, setMessage] = useState({ text: '', type: 'success' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredList = [...customers];
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      filteredList = filteredList.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(nameLower));
    }
    if (filters.email) {
      filteredList = filteredList.filter(c => c.email.toLowerCase().includes(filters.email.toLowerCase()));
    }
    setFiltered(filteredList);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '' });
    setEditingCustomer(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    try {
      let res;
      if (editingCustomer) {
        res = await apiFetch(`/customers/${editingCustomer.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error(editingCustomer ? 'Update failed' : 'Creation failed');
      showMessage(editingCustomer ? 'Customer updated' : 'Customer created', 'success');
      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? All their bookings will remain but customer record will be removed.')) return;
    try {
      const res = await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Customer deleted', 'success');
      fetchCustomers();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Customer Management</h2>
        <button onClick={openCreateModal} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2">
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search by name..." value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input type="email" placeholder="Search by email..." value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={() => setFilters({ name: '', email: '' })} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"><X size={16} /> Clear</button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? <div className="text-center text-white py-12">Loading customers...</div>
      : filtered.length === 0 ? <div className="text-center text-slate-400 py-12">No customers found.</div>
      : (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white">{customer.firstName} {customer.lastName}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{customer.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-white">${customer.totalSpent.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-white">{customer.bookings.length}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => setViewingBookings(customer)} className="text-blue-400 hover:text-blue-300"><Eye size={16} /></button>
                      <button onClick={() => openEditModal(customer)} className="text-yellow-400 hover:text-yellow-300"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(customer.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals omitted for brevity – similar to before but without password/isActive */}
      {/* ... */}
    </div>
  );
}