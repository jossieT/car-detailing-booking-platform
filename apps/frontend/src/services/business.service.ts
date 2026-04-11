import { apiFetch } from '@/lib/api';
import type { Business } from '@/types/business';


export const businessService = {
  async getAll(): Promise<Business[]> {
    const res = await apiFetch('/businesses');
    if (!res.ok) throw new Error('Failed to fetch businesses');
    return res.json();
  },
};