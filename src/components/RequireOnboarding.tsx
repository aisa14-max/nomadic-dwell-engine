import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMockAuth } from "@/context/MockAuth";

export default function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user, onboardingComplete, openLogin, openOnboarding } = useMockAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const target = location.pathname;

  useEffect(() => {
    if (!user) {
      openLogin(() => navigate(target));
    } else if (!onboardingComplete) {
      openOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, onboardingComplete]);

  if (!user || !onboardingComplete) {
    return <Navigate to="/discover" replace />;
  }
  return <>{children}</>;
}
