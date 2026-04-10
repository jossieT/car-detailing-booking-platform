'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  Users,
  Briefcase,
  UserCircle,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Settings,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) setCollapsed(saved === 'true');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.firstName || user.email?.split('@')[0] || 'Admin');
        setUserEmail(user.email || 'admin@cardetailing.com');
      } catch (e) {}
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Services', href: '/dashboard/services', icon: Wrench },
    { name: 'Staff', href: '/dashboard/staff', icon: Users },
    { name: 'HR', href: '/dashboard/hr', icon: Briefcase },
    { name: 'Customers', href: '/dashboard/customers', icon: UserCircle },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ];

  return (
    <div className="h-screen flex overflow-hidden overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar - no horizontal overflow */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } transition-all duration-300 ease-in-out bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col flex-shrink-0 relative group`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">CD</span>
              </div>
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
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation - scrollable vertical only, no horizontal scroll */}
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
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-purple-500 rounded-full" />
                )}
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Empty bottom section - no extra elements */}
      </aside>

      {/* Main content area - prevents horizontal overflow */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 px-6 py-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold text-white truncate">Admin Dashboard</h1>
            <span className="text-slate-500 text-sm hidden md:inline">|</span>
            <span className="text-slate-400 text-sm hidden md:inline truncate">
              {navItems.find((i) => i.href === pathname)?.name || 'Overview'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            <button className="relative text-slate-300 hover:text-white">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* User dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus:outline-none group"
                aria-label="User menu"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-slate-400">{userEmail}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-md transition-transform group-hover:scale-105">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content - no horizontal overflow */}
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          {children}
        </main>
      </div>

      {/* Dropdown Portal - always on top */}
      {mounted && dropdownOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-end pointer-events-none">
          <div className="fixed inset-0 bg-black/20 pointer-events-auto" onClick={() => setDropdownOpen(false)} />
          <div className="relative mt-14 mr-4 w-48 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 pointer-events-auto">
            <div className="py-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
                onClick={() => {
                  setDropdownOpen(false);
                }}
              >
                <User size={16} /> Profile
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
                onClick={() => {
                  setDropdownOpen(false);
                }}
              >
                <Settings size={16} /> Settings
              </button>
              <hr className="border-white/10 my-1" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}