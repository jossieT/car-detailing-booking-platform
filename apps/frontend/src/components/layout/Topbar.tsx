'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { navItems } from './navigation';
import UserDropdown from './UserDropdown';

export default function Topbar() {
  const pathname = usePathname();
  const currentPage = navItems.find((i) => i.href === pathname)?.name || 'Dashboard';

  return (
    <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 px-6 py-3 flex justify-between items-center flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-xl font-semibold text-white truncate">{currentPage}</h1>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button className="relative text-slate-300 hover:text-white">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>
        <UserDropdown />
      </div>
    </header>
  );
}