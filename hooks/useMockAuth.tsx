"use client";
import { useState, useEffect, createContext, useContext } from "react";

export type User = { email: string; name?: string; loggedIn: boolean } | null;

interface AuthContextType {
  user: User;
  isModalOpen: boolean;
  login: (email: string) => void;
  logout: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("resumerefine_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (email: string) => {
    const u = { email, name: email.split('@')[0], loggedIn: true };
    setUser(u);
    localStorage.setItem("resumerefine_user", JSON.stringify(u));
    setIsModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("resumerefine_user");
    sessionStorage.clear();
  };

  // Always wrap children in provider. The 'mounted' check was causing child components to not see the context on first render
  return (
    <AuthContext.Provider value={{ user, login, logout, isModalOpen, openModal: () => setIsModalOpen(true), closeModal: () => setIsModalOpen(false) }}>
      {mounted ? children : <div className="hidden">{children}</div>}
    </AuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useMockAuth must be used within AuthProvider");
  return context;
}
