import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Car Detailing Booking Platform</h1>
      <p className="mb-4">Welcome! Please login to book a service.</p>
      <div className="space-x-4">
        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded">
          Login
        </Link>
        <Link href="/bookings" className="bg-green-500 text-white px-4 py-2 rounded">
          Book a Service
        </Link>
      </div>
    </main>
  );
}