import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, sessionExpired, tokenStore } from '../lib/api';
import type { User } from '../lib/types';

type AuthValue = {
  user: User | null;
  ready: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  register: (fullName: string, username: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the session on load; an invalid token just lands on the login page.
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const drop = () => setUser(null);
    sessionExpired.addEventListener('expired', drop);
    return () => sessionExpired.removeEventListener('expired', drop);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    tokenStore.set(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (fullName: string, username: string, password: string) => {
      const result = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: { fullName, username, password },
      });
      tokenStore.set(result.token);
      setUser(result.user);
    },
    [],
  );

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, register, signOut }),
    [user, ready, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
