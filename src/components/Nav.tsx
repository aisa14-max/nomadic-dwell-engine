import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useMockAuth, type AvatarId } from "@/context/MockAuth";
import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";

const AVATAR_IMAGES: Record<AvatarId, string> = {
  a1: avatar1,
  a2: avatar2,
  a3: avatar3,
  a4: avatar4,
  a5: avatar5,
  a6: avatar6,
};

// "Worlds" (Configurator) and "Engine" only appear once signed in — logged
// out, the only way into the configurator is Discover -> questionnaire ->
// signup, not a direct nav link.
const baseItems = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Voyages" },
];
const signedInItems = [
  { to: "/configurator", label: "Worlds" },
  // Engine is now one tab inside Profile, so the nav names the destination.
  { to: "/profile", label: "Profile" },
];

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, openLogin, onboardingOpen, loginOpen, planSelectionOpen } = useMockAuth();
  const items = user ? [...baseItems, ...signedInItems] : baseItems;

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
              <Link
                to="/profile"
                className="liquid-glass w-9 h-9 rounded-full overflow-hidden shrink-0 block"
                aria-label={`${user.name} — open profile`}
                title={`${user.name} — profile`}
              >
                <img
                  src={AVATAR_IMAGES[user.avatar]}
                  alt=""
                  className="w-full h-full object-cover scale-100"
                />
              </Link>
              <button
                onClick={signOut}
                className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              // Signing in directly (rather than as the last step of a brief)
              // has no design in flight to return to, so land on the profile.
              onClick={() => openLogin(() => navigate("/profile"))}
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
