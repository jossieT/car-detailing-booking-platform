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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      const res = await apiFetch(`/customers/${customerToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Customer deleted', 'success');
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err: any) {
      showMessage(err.message, 'error');
      setDeleteModalOpen(false);
    }
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Customer Management</h2>
        <button onClick={openCreateModal} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2 shadow-lg">
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
            <button onClick={() => setFilters({ name: '', email: '' })} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2 transition shadow-sm"><X size={16} /> Clear</button>
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
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(customer => {
                  const totalSpent = customer.bookings?.reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0) || 0;
                  return (
                    <tr key={customer.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm text-white font-medium">{customer.firstName} {customer.lastName}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{customer.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-white">${totalSpent.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-white">{customer.bookings?.length || 0}</td>
                      <td className="px-6 py-4 space-x-3">
                        <button onClick={() => setViewingBookings(customer)} className="text-blue-400 hover:text-blue-300 transition" title="View Bookings"><Eye size={18} /></button>
                        <button onClick={() => openEditModal(customer)} className="text-yellow-400 hover:text-yellow-300 transition" title="Edit Customer"><Edit size={18} /></button>
                        <button onClick={() => confirmDelete(customer)} className="text-red-400 hover:text-red-300 transition" title="Delete Customer"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">First Name</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-lg shadow-purple-500/20">{editingCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4 mx-auto">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Customer Record</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete <span className="text-white font-semibold">{customerToDelete.firstName} {customerToDelete.lastName}</span>? 
              <br/><span className="text-xs text-slate-500 mt-2 block">(Historical bookings will remain, but the customer profile will be removed.)</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setDeleteModalOpen(false); setCustomerToDelete(null); }} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition">Go Back</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Bookings Modal */}
      {viewingBookings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Bookings for {viewingBookings.firstName}</h3>
              <button onClick={() => setViewingBookings(null)} className="text-slate-400 hover:text-white transition"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1">
              {viewingBookings.bookings.length === 0 ? <p className="text-slate-400 text-center py-8">No booking history available.</p>
              : (
                <div className="space-y-3">
                  {viewingBookings.bookings.map((b: any) => (
                    <div key={b.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">{b.service?.name || 'Service'}</p>
                        <p className="text-slate-400 text-xs">{new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right text-xs">
                        <span className={`px-2 py-0.5 rounded-full border border-white/10 text-slate-300`}>{b.status}</span>
                        <p className="text-white font-medium mt-1">${parseFloat(b.totalPrice).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {message.text && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white shadow-lg z-50 animate-fade-in`}>
          {message.text}
        </div>
      )}
    </div>
  );
}