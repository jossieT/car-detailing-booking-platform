export interface Business {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string;
  workingHours?: any; // JSON object – can be more specific later
  closedDays?: number[];
  createdAt: string;
  updatedAt: string;
}