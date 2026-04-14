import { apiFetch } from '@/lib/api';
import type { Booking } from '@/types/booking';

export const bookingService = {
  async getAll(params?: URLSearchParams): Promise<Booking[]> {
    const query = params ? `?${params}` : '';
    const res = await apiFetch(`/bookings${query}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async getById(id: string): Promise<Booking> {
    const res = await apiFetch(`/bookings/${id}`);
    if (!res.ok) throw new Error('Booking not found');
    return res.json();
  },

  async create(data: any): Promise<Booking> {
    const res = await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return res.json();
  },

  async update(id: string, data: any): Promise<Booking> {
    const res = await apiFetch(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update booking');
    return res.json();
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const res = await apiFetch(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Status update failed');
  },

  async delete(id: string): Promise<void> {
    const res = await apiFetch(`/bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
  },

  async getSlots(date: string, serviceId: string, businessId: string, excludeBookingId?: string): Promise<any[]> {
    let url = `/bookings/slots?date=${date}&serviceId=${serviceId}&businessId=${businessId}`;
    if (excludeBookingId) url += `&excludeBookingId=${excludeBookingId}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch slots');
    return res.json();
  },
};