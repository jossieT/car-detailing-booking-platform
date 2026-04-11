import { getLocalStorage, setLocalStorage, removeLocalStorage } from './storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const getToken = () => getLocalStorage(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => getLocalStorage(REFRESH_TOKEN_KEY);
export const setTokens = (accessToken: string, refreshToken?: string) => {
  setLocalStorage(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) setLocalStorage(REFRESH_TOKEN_KEY, refreshToken);
};
export const removeToken = () => {
  removeLocalStorage(ACCESS_TOKEN_KEY);
  removeLocalStorage(REFRESH_TOKEN_KEY);
  removeLocalStorage(USER_KEY);
};
export const getUser = () => {
  const user = getLocalStorage(USER_KEY);
  return user ? JSON.parse(user) : null;
};
export const setUser = (user: any) => setLocalStorage(USER_KEY, JSON.stringify(user));