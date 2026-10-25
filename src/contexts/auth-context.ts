import { createContext } from "react";
import type { User } from "../services/types";

export type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
