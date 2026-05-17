import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface MockUser {
  email: string;
}

interface MockAuthValue {
  user: MockUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  const signIn = useCallback((email: string) => setUser({ email }), []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}
