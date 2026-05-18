import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useMockAuth } from "@/context/MockAuth";

const items = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Voyages" },
  { to: "/configurator", label: "Worlds" },
  { to: "/dashboard", label: "Engine" },
];

export default function Nav() {
  const { pathname } = useLocation();
  const { user, signOut, openLogin } = useMockAuth();
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
          <Link
            to="/tribe"
            className="ml-1 inline-flex items-center gap-1 bg-white text-black rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap font-body"
          >
            Join the Tribe <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {/* Right: auth action */}
        <div className="flex items-center justify-end">
          {user ? (
            <button
              onClick={signOut}
              className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90"
            >
              Sign out
            </button>
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
