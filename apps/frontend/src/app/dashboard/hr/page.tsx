'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface LeaveRequest {
  id: string;
  staffId: string;
  staff: Staff;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Attendance {
  id: string;
  staffId: string;
  staff: Staff;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  notes: string | null;
}

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<'leaves' | 'attendance'>('leaves');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    staffId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: '',
    status: 'PRESENT',
    notes: '',
  });
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchStaff();
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, selectedDate]);

  const fetchStaff = async () => {
    try {
      const res = await apiFetch(`/users`);
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setStaffList([]);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await apiFetch(`/hr/leave-requests`);
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      const data = await res.json();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showMessage(err.message, 'error');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      // Use query parameter instead of body for GET
      const res = await apiFetch(`/hr/attendance?date=${selectedDate}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showMessage(err.message, 'error');
      setAttendanceRecords([]);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/hr/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to submit leave request');
      showMessage('Leave request submitted', 'success');
      setShowLeaveModal(false);
      fetchLeaveRequests();
      setFormData({ staffId: '', startDate: '', endDate: '', reason: '' });
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/hr/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(attendanceForm),
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      showMessage('Attendance saved', 'success');
      setShowAttendanceModal(false);
      fetchAttendance();
      setAttendanceForm({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        clockIn: '',
        clockOut: '',
        status: 'PRESENT',
        notes: '',
      });
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const updateLeaveStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/hr/leave-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      showMessage(`Leave request ${status.toLowerCase()}`, 'success');
      fetchLeaveRequests();
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      APPROVED: 'bg-green-500/20 text-green-300 border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getAttendanceStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: 'bg-green-500/20 text-green-300',
      ABSENT: 'bg-red-500/20 text-red-300',
      LATE: 'bg-yellow-500/20 text-yellow-300',
      HALF_DAY: 'bg-blue-500/20 text-blue-300',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-300';
  };

  if (loading && activeTab === 'leaves') {
    return <div className="text-white text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">HR Management</h2>
        <button
          onClick={() => activeTab === 'leaves' ? setShowLeaveModal(true) : setShowAttendanceModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2"
        >
          <Plus size={18} /> {activeTab === 'leaves' ? 'Request Leave' : 'Mark Attendance'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === 'leaves' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Leave Requests
          </button>
          <button
            onClick={() => { setActiveTab('attendance'); fetchAttendance(); }}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === 'attendance' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Attendance
          </button>
        </nav>
      </div>

      {/* Leave Requests Tab */}
      {activeTab === 'leaves' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {leaveRequests.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No leave requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white">{req.staff.firstName} {req.staff.lastName}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{req.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {req.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateLeaveStatus(req.id, 'APPROVED')} className="text-green-400 hover:text-green-300">Approve</button>
                            <button onClick={() => updateLeaveStatus(req.id, 'REJECTED')} className="text-red-400 hover:text-red-300">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {attendanceRecords.length === 0 ? (
              <div className="text-center text-slate-400 py-12">No attendance records for this date.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Clock In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Clock Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendanceRecords.map((att) => (
                      <tr key={att.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-sm text-white">{att.staff.firstName} {att.staff.lastName}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : '—'}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${getAttendanceStatusBadge(att.status)}`}>{att.status}</span></td>
                        <td className="px-6 py-4 text-sm text-slate-300">{att.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Request Leave</h3>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                required
              >
                <option value="">Select Staff</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" required />
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" required />
              <textarea placeholder="Reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={3} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" required />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Mark Attendance</h3>
            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <select value={attendanceForm.staffId} onChange={(e) => setAttendanceForm({ ...attendanceForm, staffId: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" required>
                <option value="">Select Staff</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
              <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" required />
              <input type="time" value={attendanceForm.clockIn} onChange={(e) => setAttendanceForm({ ...attendanceForm, clockIn: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" placeholder="Clock In" />
              <input type="time" value={attendanceForm.clockOut} onChange={(e) => setAttendanceForm({ ...attendanceForm, clockOut: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" placeholder="Clock Out" />
              <select value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white">
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
              <textarea placeholder="Notes" value={attendanceForm.notes} onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAttendanceModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">Save</button>
              </div>
            </form>
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