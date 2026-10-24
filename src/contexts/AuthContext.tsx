import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/auth.service";
import type { User } from "../services/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      if (!authService.getStoredToken()) {
        if (active) {
          setUser(null);
          setInitializing(false);
        }
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (active) setUser(profile);
      } catch {
        authService.logout();
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    };

    void verifySession();

    const handleSessionExpired = () => {
      authService.logout();
      setUser(null);
      setInitializing(false);
    };

    window.addEventListener("nicabliss:session-expired", handleSessionExpired);
    return () => {
      active = false;
      window.removeEventListener("nicabliss:session-expired", handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [initializing, login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
