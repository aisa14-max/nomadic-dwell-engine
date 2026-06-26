import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import Discover from "./pages/Discover.tsx";
import Configurator from "./pages/Configurator.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Tribe from "./pages/Tribe.tsx";
import NotFound from "./pages/NotFound.tsx";
import Nav from "./components/Nav.tsx";
import PageTransition from "./components/PageTransition.tsx";
import LoginDialog from "./components/LoginDialog.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import { MockAuthProvider, useMockAuth } from "./context/MockAuth";

const queryClient = new QueryClient();

/** Blocks /configurator unless the user has signed in AND completed onboarding. */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user } = useMockAuth();
  const ready = localStorage.getItem("configuratorReady") === "true"
             || sessionStorage.getItem("configuratorReady") === "true";
  if (!user || !ready) return <Navigate to="/discover" replace />;
  return <>{children}</>;
}

const RoutedApp = () => {
  const location = useLocation();
  return (
    <>
      <Nav />
      <PageTransition>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/configurator" element={<RequireOnboarding><Configurator /></RequireOnboarding>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tribe" element={<Tribe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      <LoginDialog />
      <OnboardingFlow />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MockAuthProvider>
        <BrowserRouter>
          <RoutedApp />
        </BrowserRouter>
      </MockAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
