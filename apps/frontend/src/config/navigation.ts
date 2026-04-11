import {
  LayoutDashboard,
  Calendar,
  Wrench,
  Users,
  Briefcase,
  UserCircle,
  BarChart3,
} from 'lucide-react';

export const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Services', href: '/dashboard/services', icon: Wrench },
  { name: 'Staff', href: '/dashboard/staff', icon: Users },
  { name: 'HR', href: '/dashboard/hr', icon: Briefcase },
  { name: 'Customers', href: '/dashboard/customers', icon: UserCircle },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
];