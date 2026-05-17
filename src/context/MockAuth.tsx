import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface MockUser {
  email: string;
}

interface MockAuthValue {
  user: MockUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
  loginOpen: boolean;
  openLogin: (onSuccess?: () => void) => void;
  closeLogin: () => void;
  /** internal: consumed by the global LoginDialog */
  _pendingSuccess: (() => void) | null;
  _clearPendingSuccess: () => void;
}

const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void) | null>(null);

  const signIn = useCallback((email: string) => setUser({ email }), []);
  const signOut = useCallback(() => setUser(null), []);
  const openLogin = useCallback((onSuccess?: () => void) => {
    setPendingSuccess(() => onSuccess ?? null);
    setLoginOpen(true);
  }, []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const _clearPendingSuccess = useCallback(() => setPendingSuccess(null), []);

  const value = useMemo(
    () => ({
      user,
      signIn,
      signOut,
      loginOpen,
      openLogin,
      closeLogin,
      _pendingSuccess: pendingSuccess,
      _clearPendingSuccess,
    }),
    [user, signIn, signOut, loginOpen, openLogin, closeLogin, pendingSuccess, _clearPendingSuccess],
  );
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}
