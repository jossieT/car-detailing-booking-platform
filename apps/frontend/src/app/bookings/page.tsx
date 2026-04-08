import { useState } from 'react';

export default function BookingsPage() {
  const [date, setDate] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [businessId, setBusinessId] = useState(''); // You'll need to get this from user or config
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Replace with your actual API base URL
  const API_BASE = 'http://localhost:4000';

  // Assume JWT is stored in localStorage after login
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchSlots = async () => {
    if (!date || !serviceId || !businessId) {
      setMessage('Please fill in date, service, and business.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/bookings/slots?date=${date}&serviceId=${serviceId}&businessId=${businessId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch slots');
      const data = await response.json();
      setSlots(data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching slots: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    if (!selectedSlot || !vehicleInfo.make) {
      setMessage('Please select a slot and fill vehicle info.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          startTime: selectedSlot,
          vehicleInfo,
          notes,
        }),
      });
      if (!response.ok) throw new Error('Failed to create booking');
      const data = await response.json();
      setMessage('Booking created successfully!');
      // Reset form
      setSelectedSlot('');
      setVehicleInfo({ make: '', model: '', year: '', licensePlate: '', color: '' });
      setNotes('');
    } catch (error) {
      setMessage('Error creating booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book a Car Detailing Service</h1>

      <div className="mb-4">
        <label className="block mb-2">Business ID:</label>
        <input
          type="text"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="border p-2 w-full"
          placeholder="Enter business ID"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Service ID:</label>
        <input
          type="text"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="border p-2 w-full"
          placeholder="Enter service ID (e.g., cmnlnfs2g000buq04bnehw3hk)"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2"
        />
      </div>

      <button
        onClick={fetchSlots}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Loading...' : 'Check Available Slots'}
      </button>

      {slots.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Available Slots:</h2>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">Select a slot</option>
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {new Date(slot).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedSlot && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Vehicle Information:</h2>
          <input
            type="text"
            placeholder="Make"
            value={vehicleInfo.make}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="text"
            placeholder="Model"
            value={vehicleInfo.model}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="number"
            placeholder="Year"
            value={vehicleInfo.year}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="text"
            placeholder="License Plate"
            value={vehicleInfo.licensePlate}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, licensePlate: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="text"
            placeholder="Color"
            value={vehicleInfo.color}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, color: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <button
            onClick={createBooking}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {loading ? 'Booking...' : 'Book Now'}
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
}