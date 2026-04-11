import { apiFetch } from '@/lib/api';
import type { Service } from '@/types/service';

export const serviceService = {
  async getAll(): Promise<Service[]> {
    const res = await apiFetch('/services');
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },
  // add other methods as needed (getById, create, update, delete)
};