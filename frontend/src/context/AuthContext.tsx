import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { api } from "../api/client";
import type { PersonLevel } from "../types";

interface Person {
  id: number;
  username: string;
  email: string;
  level: PersonLevel;
  is_superuser: boolean;
  name: string;
  mobile: string;
  phone: string;
  line_id: string;
  address: string;
  member_level: number | null;
  points: number | null;
  total_spent: string | null;
  discount_percent: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: Person | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const { data } = await api.get<Person>("/accounts/me/");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username: string, password: string) {
    const { data } = await api.post("/accounts/login/", { username, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    await fetchMe();
  }

  async function register(payload: RegisterPayload) {
    await api.post("/accounts/register/", payload);
    await login(payload.username, payload.password);
  }

  async function logout() {
    const refresh = localStorage.getItem("refresh_token");
    try {
      if (refresh) {
        await api.post("/accounts/logout/", { refresh });
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
