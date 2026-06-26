import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface MockUser {
  email: string;
}

export type SitePayload = Record<string, unknown>;

interface MockAuthValue {
  user: MockUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
  loginOpen: boolean;
  openLogin: (onSuccess?: () => void) => void;
  closeLogin: () => void;
  onboardingOpen: boolean;
  closeOnboarding: () => void;
  /** Site selected on the Voyages page — fed into POST /onboarding */
  pendingSite: SitePayload | null;
  /** Open onboarding immediately (user already logged in) with a site */
  openOnboardingWithSite: (site: SitePayload) => void;
  /** Open login first (user not logged in); onboarding opens after sign-in */
  openLoginForSite: (site: SitePayload) => void;
  /** internal: consumed by the global LoginDialog */
  _pendingSuccess: (() => void) | null;
  _clearPendingSuccess: () => void;
}

const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void) | null>(null);
  const [pendingSite, setPendingSite] = useState<SitePayload | null>(null);

  const signIn = useCallback((email: string) => {
    setUser({ email });
    setOnboardingOpen(true);
  }, []);
  const signOut = useCallback(() => setUser(null), []);

  const openLogin = useCallback((onSuccess?: () => void) => {
    setPendingSuccess(() => onSuccess ?? null);
    setLoginOpen(true);
  }, []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const closeOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    setPendingSite(null);
    sessionStorage.removeItem("pendingSite");
  }, []);

  const openOnboardingWithSite = useCallback((site: SitePayload) => {
    sessionStorage.setItem("pendingSite", JSON.stringify(site));
    setPendingSite(site);
    setOnboardingOpen(true);
  }, []);

  const openLoginForSite = useCallback((site: SitePayload) => {
    sessionStorage.setItem("pendingSite", JSON.stringify(site));
    setPendingSite(site);
    setLoginOpen(true);
  }, []);

  const _clearPendingSuccess = useCallback(() => setPendingSuccess(null), []);

  const value = useMemo(
    () => ({
      user, signIn, signOut,
      loginOpen, openLogin, closeLogin,
      onboardingOpen, closeOnboarding,
      pendingSite, openOnboardingWithSite, openLoginForSite,
      _pendingSuccess: pendingSuccess, _clearPendingSuccess,
    }),
    [user, signIn, signOut, loginOpen, openLogin, closeLogin,
     onboardingOpen, closeOnboarding, pendingSite, openOnboardingWithSite,
     openLoginForSite, pendingSuccess, _clearPendingSuccess],
  );
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}
