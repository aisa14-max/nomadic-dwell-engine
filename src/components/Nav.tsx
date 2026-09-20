import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Check, Menu } from "lucide-react";
import { useMockAuth, type AvatarId } from "@/context/MockAuth";
import { useJourney } from "@/lib/journey";
import { ENGINE_PAGE_ENABLED } from "@/config/features";
import StartOverButton from "@/components/StartOverButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import nomadicLogo from "@/assets/nomadic-logo.png";
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

type NavItem = { to: string; label: string; hint: string };

// "Worlds" (Configurator) and "Engine" only appear once signed in — logged
// out, the only way into the configurator is Discover -> questionnaire ->
// signup, not a direct nav link. Each carries a one-line hint (shown on hover
// and in the mobile menu) because the names alone don't say what's behind them.
const baseItems: NavItem[] = [
  { to: "/", label: "Home", hint: "Back to the start" },
  { to: "/discover", label: "Voyages", hint: "Browse pre-cleared land around the world" },
];
const signedInItems: NavItem[] = [
  { to: "/configurator", label: "Worlds", hint: "Design your dwelling" },
  // Hidden for now — see config/features.ts
  ...(ENGINE_PAGE_ENABLED ? [{ to: "/engine", label: "Engine", hint: "Check on your engine's status" }] : []),
];
const TRIBE_ITEM: NavItem = { to: "/tribe", label: "Join the Tribe", hint: "Meet people drawn to the same things" };
const HOOD_ITEM: NavItem = { to: "/under-the-hood", label: "Under the Hood", hint: "How the Engine works" };
// On Home only, that same slot is the way in: sign in, then start at Voyages.
const CONFIGURE_ITEM: NavItem = { to: "/discover", label: "Configure", hint: "Sign in and start with a voyage" };

function Hint({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="bg-black/85 border-white/15 text-white/90 text-xs font-body"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, openLogin, onboardingOpen, loginOpen, planSelectionOpen } = useMockAuth();
  const journey = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = user ? [...baseItems, ...signedInItems] : baseItems;

  // "Join the Tribe" appears only once the order is finished (Voyages, brief and Worlds done).
  const tribeUnlocked = !!user && !!journey.steps.find((s) => s.id === "reserve")?.done;
  const isHome = pathname === "/";
  const hoodSlot = isHome ? CONFIGURE_ITEM : HOOD_ITEM;
  const menuItems = tribeUnlocked ? [...items, TRIBE_ITEM, hoodSlot] : [...items, hoodSlot];

  // Configure: signed-in visitors go straight to Voyages; everyone else signs in first.
  const startConfigure = () => {
    const go = () => navigate("/discover");
    if (user) go(); else openLogin(go);
  };

  // Hide while any full-panel modal is open — those overlays are semi
  // transparent and don't reach the very top of the screen, so the nav's
  // own tab pills were showing through, dimmed, above the modal's own
  // step/option UI (looked like two stacked rows of tabs).
  if (onboardingOpen || loginOpen || planSelectionOpen) return null;

  return (
    <nav className="fixed top-4 inset-x-0 z-50 px-5 md:px-8 lg:px-16">
      <div className="mx-auto max-w-[1400px] flex items-center justify-between">
        {/* Logo — going Home is a full reset (same as Sign out), so every return
            to the start really is a fresh run, not a resumed one. */}
        <Link
          to="/"
          onClick={signOut}
          className="flex items-center gap-3 text-white"
          aria-label="Nomadic Engine"
        >
          <span className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <img src={nomadicLogo} alt="" className="w-full h-full object-cover" />
          </span>
        </Link>

        {/* Center pill */}
        <div className="hidden md:flex liquid-glass rounded-full px-1.5 py-1.5 items-center gap-0">
          {items.map(({ to, label, hint }) => {
            const active = pathname === to;
            return (
              <Hint key={to} text={hint}>
                <Link
                  to={to}
                  // Home is a full reset, same as the logo above.
                  onClick={to === "/" ? signOut : undefined}
                  className="relative px-3 py-2 text-sm font-medium font-body rounded-full transition-colors"
                  style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)" }}
                >
                  {label}
                </Link>
              </Hint>
            );
          })}
          {tribeUnlocked && (
            <Hint text={TRIBE_ITEM.hint}>
              <Link
                to={TRIBE_ITEM.to}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium whitespace-nowrap font-body rounded-full text-white/70 hover:text-white transition-colors"
              >
                {TRIBE_ITEM.label} <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </Hint>
          )}
          <Hint text={hoodSlot.hint}>
            {isHome ? (
              <button
                type="button"
                onClick={startConfigure}
                className="ml-1 inline-flex items-center bg-white text-black hover:bg-white/90 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap font-body transition-colors"
              >
                {CONFIGURE_ITEM.label}
              </button>
            ) : (
              <Link
                to={HOOD_ITEM.to}
                className="ml-1 inline-flex items-center bg-white text-black hover:bg-white/90 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap font-body transition-colors"
              >
                {HOOD_ITEM.label}
              </Link>
            )}
          </Hint>
        </div>

        {/* Right: journey, menu, auth */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden liquid-glass w-9 h-9 rounded-full flex items-center justify-center text-white/90"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>

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
          {/* Exhibition: anyone can restart the whole app from any page (not needed on Home, which always starts fresh) */}
          {pathname !== "/" && (
            <StartOverButton className="hidden sm:inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90 hover:text-white" />
          )}
        </div>
      </div>

      {/* Mobile menu — the centre pill is hidden below md, so this is the only way around on a phone */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[300px] bg-[#02030a]/95 border-white/10 text-white p-6">
          <SheetTitle className="font-heading text-2xl text-white">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>

          <ul className="mt-6 space-y-1">
            {menuItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={(e) => {
                    if (item === CONFIGURE_ITEM) { e.preventDefault(); startConfigure(); }
                    if (item.to === "/") signOut();
                    setMenuOpen(false);
                  }}
                  className="block rounded-xl px-3 py-2.5 hover:bg-white/5"
                >
                  <span className={`block font-body text-base ${pathname === item.to ? "text-white" : "text-white/85"}`}>
                    {item.label}
                  </span>
                  <span className="block font-body text-xs text-white/45">{item.hint}</span>
                </Link>
              </li>
            ))}
          </ul>

          {user && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-body">
                Your journey · {journey.doneCount}/{journey.steps.length}
              </p>
              <ul className="mt-3 space-y-1.5">
                {journey.steps.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={s.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 text-sm font-body"
                    >
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          s.done ? "bg-emerald-400/20 border-emerald-400/60 text-emerald-300" : "border-white/25"
                        }`}
                      >
                        {s.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <span className={s.done ? "text-white/45" : "text-white/90"}>
                        {s.label}{s.detail ? ` · ${s.detail}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="liquid-glass rounded-full px-4 py-2.5 text-sm font-body text-white/90 text-center"
                >
                  Profile
                </Link>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); openLogin(() => navigate("/profile")); }}
                className="liquid-glass rounded-full px-4 py-2.5 text-sm font-body text-white/90"
              >
                Sign in
              </button>
            )}
            {pathname !== "/" && (
              <StartOverButton className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-body text-white/70 hover:text-white" />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
