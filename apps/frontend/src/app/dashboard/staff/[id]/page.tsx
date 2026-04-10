'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  BadgeCheck,
  User,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface StaffDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  skills: { id: string; name: string; basePrice: string }[];
  createdAt: Date;  
  workingHours: WorkingHour[];
}

interface WorkingHour {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
}

interface Service {
  id: string;
  name: string;
  basePrice: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, [id]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Staff not found');
      const data = await res.json();
      setStaff(data);
      setSelectedSkills(data.skills?.map((s: any) => s.id) || []);
      if (data.workingHours) setWorkingHours(data.workingHours);
      else initWorkingHours();
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAllServices(data);
  };

  const initWorkingHours = () => {
    const hours = DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      startTime: '09:00',
      endTime: '17:00',
      isDayOff: idx === 0 || idx === 6,
    }));
    setWorkingHours(hours);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const saveSkills = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/users/${id}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceIds: selectedSkills }),
      });
      if (!res.ok) throw new Error('Failed to save skills');
      showMessage('Skills updated', 'success');
      fetchStaff();
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveWorkingHours = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/users/${id}/working-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hours: workingHours }),
      });
      if (!res.ok) throw new Error('Failed to save working hours');
      showMessage('Working hours updated', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: any) => {
    const updated = [...workingHours];
    updated[index] = { ...updated[index], [field]: value };
    setWorkingHours(updated);
  };

  if (loading) return <div className="text-white text-center py-12">Loading...</div>;
  if (!staff) return <div className="text-white text-center py-12">Staff not found.</div>;

  const fullName = `${staff.firstName} ${staff.lastName}`;
  const avatarInitials = `${staff.firstName[0]}${staff.lastName[0]}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff" className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{fullName}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {['profile', 'skills', 'hours'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'profile'
                ? 'Profile'
                : tab === 'skills'
                ? 'Skills & Services'
                : 'Working Hours'}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab - Enhanced with icons and better layout */}
      {activeTab === 'profile' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {/* Avatar and header section */}
          <div className="flex flex-col items-center p-6 border-b border-white/10 bg-white/5">
            <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-3">
              <span className="text-3xl font-bold text-white">{avatarInitials}</span>
            </div>
            <h2 className="text-xl font-semibold text-white">{fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  staff.role === 'ADMIN'
                    ? 'bg-red-500/20 text-red-300'
                    : staff.role === 'MANAGER'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}
              >
                {staff.role}
              </span>
              <div className="flex items-center gap-1">
                {staff.isActive ? (
                  <CheckCircle size={14} className="text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    staff.isActive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {staff.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Mail size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email Address</p>
                <p className="text-sm text-white">{staff.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Phone size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone Number</p>
                <p className="text-sm text-white">{staff.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Calendar size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm text-white">
                  {new Date(staff.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                <BadgeCheck size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Staff ID</p>
                <p className="text-sm text-white font-mono">{staff.id.slice(0, 12)}...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab - unchanged */}
      {activeTab === 'skills' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Assigned Services</h3>
          <div className="space-y-3">
            {allServices.map((service) => (
              <label key={service.id} className="flex items-center gap-3 text-white">
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(service.id)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedSkills([...selectedSkills, service.id]);
                    else
                      setSelectedSkills(selectedSkills.filter((id) => id !== service.id));
                  }}
                  className="w-4 h-4 accent-purple-500"
                />
                <span>
                  {service.name} - ${parseFloat(service.basePrice).toFixed(2)}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={saveSkills}
            disabled={saving}
            className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Skills'}
          </button>
        </div>
      )}

      {/* Working Hours Tab - unchanged */}
      {activeTab === 'hours' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h3>
          <div className="space-y-3">
            {workingHours.map((hour, idx) => (
              <div
                key={hour.dayOfWeek}
                className="flex flex-wrap items-center gap-3 p-2 border-b border-white/10"
              >
                <div className="w-24 text-white font-medium">{DAYS[hour.dayOfWeek]}</div>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={hour.isDayOff}
                    onChange={(e) => updateWorkingHour(idx, 'isDayOff', e.target.checked)}
                    className="w-4 h-4 accent-red-500"
                  />
                  Day off
                </label>
                {!hour.isDayOff && (
                  <>
                    <input
                      type="time"
                      value={hour.startTime}
                      onChange={(e) => updateWorkingHour(idx, 'startTime', e.target.value)}
                      className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-white text-sm"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={hour.endTime}
                      onChange={(e) => updateWorkingHour(idx, 'endTime', e.target.value)}
                      className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-white text-sm"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={saveWorkingHours}
            disabled={saving}
            className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      )}

      {/* Toast message */}
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