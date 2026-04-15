'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

//import { navItems } from '@/config/navigation';
import { navItems } from './navigation';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } transition-all duration-300 ease-in-out bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col flex-shrink-0 relative group`}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between px-6 py-3 h-14">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">CD</span>
            </div>
            <span className="text-white font-semibold tracking-wide">CarDetailing</span>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">CD</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
<nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'text-white bg-purple-600/40 shadow-md' 
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {isActive && <div className="absolute left-0 w-1 h-6 bg-purple-500 rounded-full" />}
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}