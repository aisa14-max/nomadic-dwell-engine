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
  onboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  completeOnboarding: () => void;
  onboardingComplete: boolean;
  /** internal: consumed by OnboardingFlow when onboarding completes */
  _pendingSuccess: (() => void) | null;
  _clearPendingSuccess: () => void;
}

const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void) | null>(null);

  const signIn = useCallback((email: string) => {
    setUser({ email });
    setOnboardingComplete(false);
    setOnboardingOpen(true);
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    setOnboardingComplete(false);
  }, []);
  const openLogin = useCallback((onSuccess?: () => void) => {
    setPendingSuccess(() => onSuccess ?? null);
    setLoginOpen(true);
  }, []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const openOnboarding = useCallback(() => setOnboardingOpen(true), []);
  const closeOnboarding = useCallback(() => setOnboardingOpen(false), []);
  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    setOnboardingOpen(false);
  }, []);
  const _clearPendingSuccess = useCallback(() => setPendingSuccess(null), []);

  const value = useMemo(
    () => ({
      user,
      signIn,
      signOut,
      loginOpen,
      openLogin,
      closeLogin,
      onboardingOpen,
      openOnboarding,
      closeOnboarding,
      completeOnboarding,
      onboardingComplete,
      _pendingSuccess: pendingSuccess,
      _clearPendingSuccess,
    }),
    [user, signIn, signOut, loginOpen, openLogin, closeLogin, onboardingOpen, openOnboarding, closeOnboarding, completeOnboarding, onboardingComplete, pendingSuccess, _clearPendingSuccess],
  );
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}
