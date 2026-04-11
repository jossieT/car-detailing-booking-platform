'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();


  useEffect(() => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    router.push('/login');
  }
}, []);

//   if (!mounted) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-white">Loading...</div>
//       </div>
//     );
//   }

  return (
    <div className="h-screen flex overflow-hidden overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}