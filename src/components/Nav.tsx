import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Cube, MagnifyingGlass, ChartLine, Lightning } from "@phosphor-icons/react";

const items = [
  { to: "/", label: "Home", icon: Compass },
  { to: "/discover", label: "Discover", icon: MagnifyingGlass },
  { to: "/configurator", label: "Configurator", icon: Cube },
  { to: "/dashboard", label: "Dashboard", icon: ChartLine },
];

export default function Nav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-[1400px] px-6 pt-5">
        <div className="flex items-center justify-between rounded-full px-3 py-2"
          style={{ background: "#0F0F0D", color: "#E8E3D8" }}>
          <Link to="/" className="flex items-center gap-2 pl-3 pr-4">
            <Lightning weight="fill" size={18} className="text-[#8AB86E]" />
            <span className="font-display text-[15px] tracking-tight">Nomadic Engine</span>
          </Link>

          <ul className="relative flex items-center gap-1">
            {items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <li key={to} className="relative">
                  <Link
                    to={to}
                    className="relative z-10 flex items-center gap-2 px-4 h-9 rounded-full text-[13px] font-medium transition-colors duration-150"
                    style={{ color: active ? "#E8E3D8" : "#9A9589" }}
                  >
                    <Icon size={16} weight="regular" />
                    <span>{label}</span>
                  </Link>
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "#1C1C19" }}
                      transition={{ type: "spring", stiffness: 400, damping: 38 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <Link to="/configurator" className="btn-pill sm" style={{ background: "#2A2A25", color: "#E8E3D8" }}>
            Build my setup
          </Link>
        </div>
      </div>
    </nav>
  );
}
