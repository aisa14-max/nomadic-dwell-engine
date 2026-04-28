import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Compass, Sun, Wind, Drop, House } from "@phosphor-icons/react";
import hero from "@/assets/hero-landscape.jpg";
import forest from "@/assets/dest-forest.jpg";
import coast from "@/assets/dest-coast.jpg";
import desert from "@/assets/dest-desert.jpg";
import highland from "@/assets/dest-highland.jpg";

const ease = [0.16, 1, 0.3, 1] as const;
const enterEase = [0, 0, 0.2, 1] as const;

const headlineWords = ["Live", "anywhere.", "Your", "engine", "adapts."];
const tags = ["Off-grid", "Modular", "Climate-responsive", "Deployable anywhere"];

const destinations = [
  { img: forest, title: "Boreal Forest", region: "Lapland, Sweden", climate: "Sub-arctic" },
  { img: coast, title: "Atlantic Cliffs", region: "Faroe Islands", climate: "Maritime" },
  { img: desert, title: "High Desert", region: "Atacama, Chile", climate: "Arid alpine" },
  { img: highland, title: "Highland Moor", region: "Isle of Skye", climate: "Temperate wet" },
];

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15, once: true });
  return (
    <section ref={ref} className={className} data-inview={inView}>
      {children}
    </section>
  );
}

export default function Landing() {
  return (
    <div className="pt-28">
      {/* HERO */}
      <header className="px-6">
        <div className="mx-auto max-w-[1280px]">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="text-[13px] tracking-[0.02em]"
            style={{ color: "#6B9455" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-2" style={{ background: "#6B9455" }} />
            Off-grid living, made intelligent
          </motion.p>

          <h1 className="mt-6 font-display text-[clamp(48px,8.4vw,128px)] leading-[0.95] tracking-[-0.04em] text-foreground">
            {headlineWords.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.22em]">
                <motion.span
                  className="inline-block"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0, ease }}
            className="mt-8 max-w-[560px] text-[17px] leading-[1.55] font-light"
            style={{ color: "#6B6660" }}
          >
            A modular off-grid micro-dwelling system that learns its terrain.
            Discover land, configure your habitat, and operate it remotely —
            one continuous engine.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {[
              { to: "/discover", label: "Explore destinations", primary: true },
              { to: "/configurator", label: "Build my setup", primary: false },
            ].map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 1.4 + i * 0.08, ease }}
              >
                <Link to={b.to} className={`btn-pill lg ${b.primary ? "btn-primary" : "btn-secondary"}`}>
                  {b.label} <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]" style={{ color: "#6B6660" }}>
            {tags.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.7 + i * 0.04, ease }}
                className="inline-flex items-center gap-2"
              >
                {i > 0 && <span className="opacity-40">·</span>}
                <span>{t}</span>
              </motion.span>
            ))}
          </div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.0, ease }}
            className="mt-14 rounded-[20px] overflow-hidden relative"
          >
            <img src={hero} alt="Modular dwelling on Icelandic moss plains at golden hour" className="w-full h-[60vh] object-cover img-tint" />
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
              <span className="tag-pill tag-green bg-black/20 backdrop-blur-sm">
                <Sun size={12} weight="bold" /> 6.4 kWh / day
              </span>
              <span className="tag-pill tag-green bg-black/20 backdrop-blur-sm">
                <Wind size={12} weight="bold" /> 18 km/h avg
              </span>
              <span className="tag-pill tag-green bg-black/20 backdrop-blur-sm">
                <Drop size={12} weight="bold" /> Rain-fed water
              </span>
            </div>
          </motion.div>
        </div>
      </header>

      {/* TRENDING */}
      <Section className="mt-32 px-6">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "#6B6660" }}>Trending terrain</p>
              <h2 className="mt-2 font-display text-[40px] leading-tight">Land currently optimal for deployment</h2>
            </div>
            <Link to="/discover" className="hidden md:inline-flex btn-pill btn-secondary">View all <ArrowRight size={14} /></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {destinations.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease }}
                className="group card-a overflow-hidden"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={d.img} alt={d.title} loading="lazy" className="w-full h-full object-cover img-tint transition-transform duration-[300ms] group-hover:scale-[1.04]" />
                </div>
                <div className="p-5">
                  <p className="text-[12px]" style={{ color: "#6B6660" }}>{d.region}</p>
                  <h3 className="mt-1 font-display text-[20px]">{d.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="tag-pill tag-green">{d.climate}</span>
                    <span className="tag-pill tag-neutral">Available</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="mt-32 px-6">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "#6B6660" }}>How it works</p>
          <h2 className="mt-2 font-display text-[40px] leading-tight max-w-2xl">Three layers, one continuous system.</h2>

          <div className="mt-12 relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <ConnectingLine />
            {[
              { icon: Compass, title: "Discover", body: "Browse pre-cleared parcels worldwide. Every site reports live solar, wind, and water yields." },
              { icon: House, title: "Configure", body: "Compose modules in 3D. The configurator validates against the site's environmental envelope." },
              { icon: Leaf, title: "Operate", body: "Deploy your engine and monitor it from anywhere. Energy, water, and climate, on one panel." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease }}
                className="relative"
              >
                <div className="icon-box" style={{ width: 56, height: 56 }}>
                  <s.icon size={26} weight="regular" />
                </div>
                <p className="mt-5 text-[12px]" style={{ color: "#6B6660" }}>0{i + 1}</p>
                <h3 className="mt-1 font-display text-[24px]">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.55] font-light max-w-xs" style={{ color: "#6B6660" }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* SUBSCRIPTION TIERS */}
      <Section className="mt-32 px-6">
        <div className="mx-auto max-w-[1280px]">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "#6B6660" }}>Membership</p>
            <h2 className="mt-2 font-display text-[40px] leading-tight">Stay short. Stay long. Stay anywhere.</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { x: -24, y: 0, name: "Drift", price: "€180", per: "/ night", body: "Weekend deployments at any partner site. Includes operations.", tag: "Flexible" },
              { x: 0, y: 16, name: "Reside", price: "€2,400", per: "/ month", body: "Long stays with portable configuration. Move between sites.", tag: "Recommended" },
              { x: 24, y: 0, name: "Sovereign", price: "€48k", per: "/ year", body: "Own your engine. Lifetime relocation. Full configurator access.", tag: "Owner" },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: t.x, y: t.y }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: i * 0.06, ease }}
                className="card-a p-7"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[22px]">{t.name}</h3>
                  <span className={`tag-pill ${t.name === "Reside" ? "tag-green" : "tag-neutral"}`}>{t.tag}</span>
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-[40px]">{t.price}</span>
                  <span className="text-[13px]" style={{ color: "#6B6660" }}>{t.per}</span>
                </div>
                <p className="mt-4 text-[14px] leading-[1.55] font-light" style={{ color: "#6B6660" }}>{t.body}</p>
                <button className="btn-pill btn-secondary w-full mt-7">Choose {t.name}</button>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* COMMUNITY DARK */}
      <CommunitySection />

      <footer className="px-6 py-12 mt-20 border-t border-black/10">
        <div className="mx-auto max-w-[1280px] flex flex-wrap justify-between gap-4 text-[13px]" style={{ color: "#6B6660" }}>
          <span>© 2026 Nomadic Engine</span>
          <span>Designed for terrain. Built for return.</span>
        </div>
      </footer>
    </div>
  );
}

function ConnectingLine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4, once: true });
  return (
    <div ref={ref} className="hidden md:block absolute top-7 left-0 right-0 h-px overflow-hidden">
      <div
        className="h-full origin-left"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.18), transparent)",
          transform: inView ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 1200ms cubic-bezier(0.16,1,0.3,1) 200ms",
        }}
      />
    </div>
  );
}

function CommunitySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, 1 - r.top / vh));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref} className="relative mt-32 px-6 overflow-hidden">
      <div
        className="rounded-[28px] py-24 px-10 md:px-16 relative"
        style={{
          background: `rgba(15,15,13,${Math.min(1, progress * 1.2)})`,
          color: progress > 0.4 ? "#E8E3D8" : "#1A1A17",
          transition: "color 400ms ease",
        }}
      >
        <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: progress > 0.4 ? "#8AB86E" : "#6B9455" }}>
          The exchange
        </p>
        <h2 className="mt-3 font-display text-[clamp(36px,5vw,64px)] max-w-3xl leading-[1.05]">
          A community of operators trading terrain, modules, and time.
        </h2>
        <p className="mt-6 max-w-xl text-[16px] font-light" style={{ color: progress > 0.4 ? "#9A9589" : "#6B6660" }}>
          Loan your engine when you're away. Borrow another in a new climate.
          The network is the platform.
        </p>
        <div className="mt-10 flex gap-3">
          <Link to="/discover" className="btn-pill btn-primary">Enter the exchange</Link>
        </div>
      </div>
    </section>
  );
}
