'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Mail, Phone, Calendar, Clock, Edit2, Shield, Settings, Activity } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function StaffDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'skills' | 'hours'>('profile');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  
  // Tab states
  const [skills, setSkills] = useState<any[]>([]);
  const [workingHours, setWorkingHours] = useState<any[]>([]);

  useEffect(() => {
    fetchStaff();
  }, [params.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/users/${params.id}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setStaff(data);
      // Populate tabs from embedded relations
      if (data.skills) setSkills(data.skills);
      if (data.workingHours) setWorkingHours(data.workingHours);
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

  if (loading) return <div className="text-center text-white py-12">Loading staff profile...</div>;
  if (!staff) return <div className="text-center text-white py-12">Staff member not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/staff" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition text-slate-300">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {staff.firstName} {staff.lastName}
              {!staff.isActive && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  Inactive
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400">Staff Profile</p>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 flex items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
          {staff.firstName[0]}{staff.lastName[0]}
        </div>
        <div className="flex flex-col z-10">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">{staff.firstName} {staff.lastName}</h2>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30 font-medium">
              {staff.role}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <span className="flex items-center gap-1.5"><Mail size={16} /> {staff.email}</span>
            <span className="flex items-center gap-1.5"><Phone size={16} /> {staff.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/10 overflow-x-auto scroller-hide pt-2">
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap outline-none ${activeTab === 'profile' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-300'}`}>
          <span className="flex items-center gap-2"><Shield size={16} /> Contact Details</span>
        </button>
        <button onClick={() => setActiveTab('skills')} className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap outline-none ${activeTab === 'skills' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-300'}`}>
          <span className="flex items-center gap-2"><Settings size={16} /> Skills & Services</span>
        </button>
        <button onClick={() => setActiveTab('hours')} className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap outline-none ${activeTab === 'hours' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-300'}`}>
          <span className="flex items-center gap-2"><Clock size={16} /> Working Hours</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detail Body Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'profile' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Activity size={18} className="text-purple-400"/> Employment Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <p className="text-sm font-medium text-white">{staff.isActive ? 'Active Member' : 'Inactive / Suspended'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Role Configuration</p>
                  <p className="text-sm font-medium text-white uppercase">{staff.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Member Since</p>
                  <p className="text-sm font-medium text-white">{format(new Date(staff.createdAt), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-white">{format(new Date(staff.updatedAt), 'MMMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Assigned Services</h3>
                <button className="text-sm text-purple-400 flex items-center gap-1 hover:underline"><Edit2 size={14}/> Manage</button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.length > 0 ? skills.map((skill, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 text-sm text-slate-200">
                    {skill.name}
                  </div>
                )) : (
                  <div className="col-span-full py-8 text-center text-slate-500 text-sm bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                    No services formally assigned into skill matrix yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Weekly Schedule Limit</h3>
                <button className="text-sm text-purple-400 flex items-center gap-1 hover:underline"><Edit2 size={14}/> Edit Schedule</button>
              </div>
              {workingHours.length > 0 ? (
                <div className="space-y-3">
                  {workingHours.map((wh) => (
                    <div key={wh.id} className={`flex justify-between p-4 rounded-xl border ${wh.isDayOff ? 'bg-red-500/5 border-red-500/10' : 'bg-slate-800/50 border-slate-700'}`}>
                      <span className={`font-medium ${wh.isDayOff ? 'text-slate-500' : 'text-white'}`}>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][wh.dayOfWeek]}
                      </span>
                      <span className={`text-sm ${wh.isDayOff ? 'text-red-400' : 'text-slate-300'}`}>
                        {wh.isDayOff ? 'Day Off' : `${wh.startTime} - ${wh.endTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                  No standard working hours defined. Default business hours likely apply.
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Context Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5">
             <h4 className="text-slate-300 text-sm font-semibold mb-2 flex items-center gap-2"><Calendar size={16}/> Upcoming Schedule</h4>
             <p className="text-xs text-slate-400 mb-4">You can view upcoming bookings specifically assigned to this profile under the Bookings tab on the main nav.</p>
             <Link href="/dashboard/bookings" className="block text-center text-xs font-semibold py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition shadow">
               Go to Bookings
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}