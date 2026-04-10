'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Business {
  id: string;
  name: string;
}

// Updated Slot interface to match backend response
interface Slot {
  start: string;      // ISO string
  end: string;        // ISO string
  available: boolean;
  staffId: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(''); // stores the start time string
  const [vehicleInfo, setVehicleInfo] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'error' });
  const [token, setToken] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }
    setToken(accessToken);
    fetchBusinesses(accessToken);
    fetchServices(accessToken);
  }, [mounted, router]);

  const fetchBusinesses = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/businesses`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBusinesses(data);
      if (data.length > 0) setBusinessId(data[0].id);
    } catch (err) {
      console.error('Failed to fetch businesses');
    }
  };

  const fetchServices = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/services`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data);
      if (data.length > 0) setServiceId(data[0].id);
    } catch (err) {
      console.error('Failed to fetch services');
    }
  };

  const fetchSlots = async () => {
    if (!date || !serviceId || !businessId) {
      setMessage({ text: 'Please select date, service, and business', type: 'error' });
      return;
    }
    setFetchingSlots(true);
    setMessage({ text: '', type: 'error' });
    try {
      const res = await fetch(
        `${API_BASE}/bookings/slots?date=${date}&serviceId=${serviceId}&businessId=${businessId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      // data is array of { start, end, available, staffId }
      setSlots(data);
      setSelectedSlot('');
      if (data.length === 0) {
        setMessage({ text: 'No available slots for this date', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setFetchingSlots(false);
    }
  };

  const createBooking = async () => {
    if (!selectedSlot || !vehicleInfo.make || !vehicleInfo.model) {
      setMessage({ text: 'Please select a slot and fill vehicle make & model', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: 'error' });
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          businessId,
          startTime: selectedSlot,   // send the selected start time
          vehicleInfo,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');

      setMessage({ text: '✅ Booking created successfully!', type: 'success' });
      // Reset form
      setSelectedSlot('');
      setVehicleInfo({ make: '', model: '', year: '', licensePlate: '', color: '' });
      setNotes('');
      setDate('');
      setSlots([]);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to format ISO time to local time string
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid time';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Book a Detailing Service</h1>
          <p className="text-slate-400">Select your service, date, and vehicle details</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Business & Service Selection */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Business</label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Service</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} - ${svc.price} ({svc.duration} min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Check Slots Button */}
          <button
            onClick={fetchSlots}
            disabled={fetchingSlots || !date || !serviceId || !businessId}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {fetchingSlots ? 'Checking slots...' : 'Check Available Slots'}
          </button>

          {/* Available Slots */}
          {slots.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">Available Time Slots</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slots.map((slot, index) => (
                  <button
                    key={`${slot.start}-${index}`}
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      selectedSlot === slot.start
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-purple-500'
                    }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Information Form */}
          {selectedSlot && (
            <div className="border-t border-white/10 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Vehicle Information</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Make (e.g., Toyota)"
                  value={vehicleInfo.make}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <input
                  type="text"
                  placeholder="Model (e.g., Camry)"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={vehicleInfo.year}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <input
                  type="text"
                  placeholder="License Plate"
                  value={vehicleInfo.licensePlate}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, licensePlate: e.target.value })}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={vehicleInfo.color}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, color: e.target.value })}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <textarea
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-4"
              />
              <button
                onClick={createBooking}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Confirming Booking...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          )}

          {/* Message Display */}
          {message.text && (
            <div
              className={`mt-6 p-3 rounded-xl text-center ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                  : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}