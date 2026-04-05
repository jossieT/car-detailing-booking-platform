export interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  customerId: string;
  serviceId: string;
  staffId?: string;
  createdAt: Date;
}