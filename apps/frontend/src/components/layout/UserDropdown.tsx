'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, LogOut } from 'lucide-react';

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.firstName || user.email?.split('@')[0] || 'Admin');
        setUserEmail(user.email);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const avatarInitials = userName.charAt(0).toUpperCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 focus:outline-none group"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{userName}</p>
          <p className="text-xs text-slate-400">{userEmail}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-md transition-transform group-hover:scale-105">
          {avatarInitials}
        </div>
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-end pointer-events-none">
          <div className="fixed inset-0 bg-black/20 pointer-events-auto" onClick={() => setOpen(false)} />
          <div className="relative mt-14 mr-4 w-48 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 pointer-events-auto">
            <div className="py-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
                onClick={() => setOpen(false)}
              >
                <User size={16} /> Profile
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
                onClick={() => setOpen(false)}
              >
                <Settings size={16} /> Settings
              </button>
              <hr className="border-white/10 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}