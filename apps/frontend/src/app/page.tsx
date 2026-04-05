import { Booking } from '@car-detailing/shared';

export default function Home() {
  const sampleBooking: Booking = {
    id: '1',
    startTime: new Date(),
    endTime: new Date(),
    status: 'pending',
    customerId: 'cust_123',
    serviceId: 'svc_456',
    createdAt: new Date(),
  };
  return (
    <main className="p-8">
      <h1>Car Detailing Booking</h1>
      <pre>{JSON.stringify(sampleBooking, null, 2)}</pre>
    </main>
  );
}