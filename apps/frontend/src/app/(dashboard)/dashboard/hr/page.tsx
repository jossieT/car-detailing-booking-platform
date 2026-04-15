'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function HrDashboardPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/hr/leaves');
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      const data = await res.json();
      setLeaves(data);
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/hr/leaves/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update leave status');
      showMessage(`Leave request ${status.toLowerCase()} successfully`, 'success');
      fetchLeaves();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Leave Requests</h2>
          <p className="text-sm text-slate-400">Manage time-off requests for all staff members.</p>
        </div>
        <button
          onClick={fetchLeaves}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center text-white py-12">Loading requests...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center text-slate-400 py-12 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          No leave requests found.
        </div>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <div key={leave.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-white/10">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold text-white">
                    {leave.staff.firstName} {leave.staff.lastName}
                  </span>
                  <span className="text-xs text-slate-400">({leave.staff.email})</span>
                  <span className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded-full border ${
                    leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {leave.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                    <Calendar size={14} className="text-purple-400" />
                    {format(new Date(leave.startDate), 'MMM dd, yyyy')} 
                    <span className="mx-1 text-slate-500">→</span>
                    {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                  </span>
                  {leave.reason && (
                    <span className="text-slate-400 italic">"{leave.reason}"</span>
                  )}
                </div>
              </div>

              {leave.status === 'PENDING' && (
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-white/5">
                  <button
                    onClick={() => updateStatus(leave.id, 'APPROVED')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl transition font-medium"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(leave.id, 'REJECTED')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition font-medium"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}