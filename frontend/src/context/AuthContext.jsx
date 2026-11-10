import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { clearUnlock } from '../utils/appLock';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try { const { data } = await authApi.profile(); setUser(data.data.user); }
    catch {
      try {
        // Access token expired but refresh (1 year) still valid — silent re-login
        await authApi.refresh();
        const { data } = await authApi.profile();
        setUser(data.data.user);
      } catch { setUser(null); }
    }
    finally { setLoading(false); }
  };
  useEffect(() => { loadProfile(); }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setUser(data.data.user);
    return data.data.user;
  };
  const logout = async () => { await authApi.logout(); setUser(null); clearUnlock(); window.location.href = '/login'; };

  return <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
};
