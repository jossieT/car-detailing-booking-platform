export interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  basePrice: string | number;
  isActive: boolean;
  imageUrl?: string | null;
  bufferMinutes: number;
  capacity: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}