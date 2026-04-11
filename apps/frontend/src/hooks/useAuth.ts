import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken, getUser, setUser } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUserState] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const userData = getUser();
    setIsAuthenticated(!!token);
    setUserState(userData);
  }, []);

  const logout = () => {
    removeToken();
    setUserState(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return { isAuthenticated, user, logout };
}