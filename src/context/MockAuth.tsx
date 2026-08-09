import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AvatarId = "pink" | "blue" | "purple" | "yellow";

interface MockUser {
  name: string;
  avatar: AvatarId;
}

export type SitePayload = Record<string, unknown>;

interface MockAuthValue {
  user: MockUser | null;
  signIn: (name: string, avatar: AvatarId) => void;
  signOut: () => void;
  loginOpen: boolean;
  openLogin: (onSuccess?: () => void) => void;
  closeLogin: () => void;
  onboardingOpen: boolean;
  closeOnboarding: () => void;
  /** Site selected on the Voyages page — fed into POST /onboarding */
  pendingSite: SitePayload | null;
  /** Open onboarding with a chosen site — sign-up happens after, not before */
  openOnboardingWithSite: (site: SitePayload) => void;
  /** Landing page "quick start" — opens onboarding with no site chosen yet;
      OnboardingFlow falls back to the last-used or default site. */
  openOnboardingQuickStart: () => void;
  /** internal: consumed by the global LoginDialog */
  _pendingSuccess: (() => void) | null;
  _clearPendingSuccess: () => void;
  /** Plan tier chosen at sign-up, e.g. "starter" | "standard" | "premium" */
  selectedPlan: string | null;
  planSelectionOpen: boolean;
  /** Opens the plan picker; onSuccess runs after a plan is confirmed */
  openPlanSelection: (onSuccess?: () => void) => void;
  closePlanSelection: () => void;
  confirmPlan: (planId: string) => void;
  /** internal: consumed by PlanSelection */
  _planPendingSuccess: (() => void) | null;
  _clearPlanPendingSuccess: () => void;
}

const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

// Persisted across refreshes/new tabs — without this, `user` resets to null on
// reload while `configuratorReady` (localStorage) survives, silently kicking
// signed-in users out of gated pages (RequireOnboarding, Tribe, Dashboard).
function loadStoredUser(): MockUser | null {
  try {
    const raw = localStorage.getItem("mockUser");
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

function loadStoredPlan(): string | null {
  try {
    return localStorage.getItem("selectedPlan");
  } catch {
    return null;
  }
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(loadStoredUser);
  const [loginOpen, setLoginOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void) | null>(null);
  const [pendingSite, setPendingSite] = useState<SitePayload | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(loadStoredPlan);
  const [planSelectionOpen, setPlanSelectionOpen] = useState(false);
  const [planPendingSuccess, setPlanPendingSuccess] = useState<(() => void) | null>(null);

  const signIn = useCallback((name: string, avatar: AvatarId) => {
    const newUser = { name, avatar };
    setUser(newUser);
    localStorage.setItem("mockUser", JSON.stringify(newUser));
    // Does NOT open onboarding automatically anymore — sign-up now happens
    // *after* the questionnaire (see OnboardingFlow), so what happens next
    // is decided by whoever called openLogin(onSuccess), via LoginDialog's
    // _pendingSuccess callback. A plain nav-bar sign-in should just sign in.
  }, []);
  // Full demo reset, not just sign-out — this is a mocked single-user demo,
  // not a real multi-account system, so "sign out" doubles as "start over"
  // for testing: clears every piece of session/design state, not just
  // identity, so the whole flow (onboarding -> signup -> plan -> configure
  // -> order) can be retested cleanly from Landing each time.
  const signOut = useCallback(() => {
    setUser(null);
    setSelectedPlan(null);
    for (const key of ["mockUser", "selectedPlan", "configuratorReady",
                        "configuratorInit", "reservationProgress", "engineDelivered"]) {
      localStorage.removeItem(key);
    }
    for (const key of ["configuratorReady", "configuratorInit", "pendingSite"]) {
      sessionStorage.removeItem(key);
    }
  }, []);

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

  const openOnboardingQuickStart = useCallback(() => {
    setOnboardingOpen(true);
  }, []);

  const _clearPendingSuccess = useCallback(() => setPendingSuccess(null), []);

  const openPlanSelection = useCallback((onSuccess?: () => void) => {
    setPlanPendingSuccess(() => onSuccess ?? null);
    setPlanSelectionOpen(true);
  }, []);
  const closePlanSelection = useCallback(() => setPlanSelectionOpen(false), []);
  const confirmPlan = useCallback((planId: string) => {
    setSelectedPlan(planId);
    localStorage.setItem("selectedPlan", planId);
  }, []);
  const _clearPlanPendingSuccess = useCallback(() => setPlanPendingSuccess(null), []);

  const value = useMemo(
    () => ({
      user, signIn, signOut,
      loginOpen, openLogin, closeLogin,
      onboardingOpen, closeOnboarding,
      pendingSite, openOnboardingWithSite, openOnboardingQuickStart,
      _pendingSuccess: pendingSuccess, _clearPendingSuccess,
      selectedPlan, planSelectionOpen, openPlanSelection, closePlanSelection, confirmPlan,
      _planPendingSuccess: planPendingSuccess, _clearPlanPendingSuccess,
    }),
    [user, signIn, signOut, loginOpen, openLogin, closeLogin,
     onboardingOpen, closeOnboarding, pendingSite, openOnboardingWithSite,
     openOnboardingQuickStart, pendingSuccess, _clearPendingSuccess,
     selectedPlan, planSelectionOpen, openPlanSelection, closePlanSelection, confirmPlan,
     planPendingSuccess, _clearPlanPendingSuccess],
  );
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}
