import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useMockAuth } from "@/context/MockAuth";

// "Worlds" (Configurator) and "Engine" only appear once signed in — logged
// out, the only way into the configurator is Discover -> questionnaire ->
// signup, not a direct nav link.
const baseItems = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Voyages" },
];
const signedInItems = [
  { to: "/configurator", label: "Worlds" },
  { to: "/dashboard", label: "Engine" },
];

// Placeholder display name, derived from the mock email since MockUser has
// no real name field yet — e.g. "afra.lavaei@gmail.com" -> "Afra Lavaei".
function displayNameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, openLogin, onboardingOpen, loginOpen, planSelectionOpen } = useMockAuth();
  const items = user ? [...baseItems, ...signedInItems] : baseItems;
  const displayName = user ? displayNameFromEmail(user.email) : "";

  const handleTribeClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openLogin(() => navigate("/tribe"));
    }
  };

  // Hide while any full-panel modal is open — those overlays are semi
  // transparent and don't reach the very top of the screen, so the nav's
  // own tab pills were showing through, dimmed, above the modal's own
  // step/option UI (looked like two stacked rows of tabs).
  if (onboardingOpen || loginOpen || planSelectionOpen) return null;

  return (
    <nav className="fixed top-4 inset-x-0 z-50 px-8 lg:px-16">
      <div className="mx-auto max-w-[1400px] flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-white"
          aria-label="Nomadic Engine"
        >
          <span className="font-heading text-2xl leading-none -mt-0.5">n</span>
        </Link>

        {/* Center pill */}
        <div className="hidden md:flex liquid-glass rounded-full px-1.5 py-1.5 items-center gap-0">
          {items.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="relative px-3 py-2 text-sm font-medium font-body rounded-full transition-colors"
                style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)" }}
              >
                {label}
              </Link>
            );
          })}
          {/* Always visible — clicking without an account opens sign-in first */}
          <Link
            to="/tribe"
            onClick={handleTribeClick}
            className="ml-1 inline-flex items-center gap-1 bg-white text-black rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap font-body"
          >
            Join the Tribe <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {/* Right: auth action */}
        <div className="flex items-center justify-end gap-2">
          {user ? (
            <>
              {/* Placeholder profile tab — avatar circle + name, not wired to anything yet */}
              <button
                className="liquid-glass rounded-full pl-1.5 pr-4 py-1.5 inline-flex items-center gap-2 text-sm font-body font-medium text-white/90"
              >
                <span className="w-7 h-7 rounded-full bg-white/15 border border-white/20 inline-flex items-center justify-center text-[11px] font-medium uppercase shrink-0">
                  {displayName.charAt(0)}
                </span>
                {displayName}
              </button>
              <button
                onClick={signOut}
                className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => openLogin()}
              className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
