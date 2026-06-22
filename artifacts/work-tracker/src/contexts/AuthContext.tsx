import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("wt_token"));

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: ["getMe", token] as const,
    }
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    if (error) {
      setToken(null);
      localStorage.removeItem("wt_token");
      setLocation("/login");
    }
  }, [error, setLocation]);

  const login = (newToken: string) => {
    localStorage.setItem("wt_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    if (token) {
      logoutMutation.mutate(undefined, {
        onSettled: () => {
          localStorage.removeItem("wt_token");
          setToken(null);
          setLocation("/login");
        }
      });
    }
  };

  const value = {
    user: user ?? null,
    isLoading: isLoading && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}