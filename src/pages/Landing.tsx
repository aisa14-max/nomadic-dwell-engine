import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronDown, Timer, Globe2 } from "lucide-react";
import FadingVideo from "@/components/FadingVideo";
import StarfieldScene from "@/components/StarfieldScene";
import BlurText from "@/components/BlurText";
import PageReveal from "@/components/PageReveal";
import { useMockAuth } from "@/context/MockAuth";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4";
const CAP_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4";

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

function loadRevealed() {
  try {
    return sessionStorage.getItem("homeRevealed") === "1";
  } catch {
    return false;
  }
}

export default function Landing() {
  const [revealed, setRevealed] = useState(loadRevealed);
  // Arriving on the home page always starts from scratch — there is no resuming.
  // A configuration is finished in one go, or it goes back to the default.
  const { signOut } = useMockAuth();
  useEffect(() => { signOut(); }, [signOut]);
  const capabilitiesRef = useRef<HTMLElement | null>(null);
  const lifecycleRef = useRef<HTMLElement | null>(null);
  const closingCtaRef = useRef<HTMLElement | null>(null);

  if (!revealed) {
    return (
      <PageReveal
        onComplete={() => {
          try {
            sessionStorage.setItem("homeRevealed", "1");
          } catch {
            /* private browsing / storage disabled */
          }
          setRevealed(true);
        }}
      />
    );
  }

  return (
    <div className="bg-black text-white">
      {/* ============ HERO ============ */}
      <section className="relative h-screen min-h-[760px] w-full overflow-hidden bg-black">
        <video
          src="/hero-bg.mp4"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full z-0 object-cover pointer-events-none"
        />
        {/* bottom fade into capabilities */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#070b1f] to-transparent z-10 pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
            {/* Badge — plain label, not styled as a clickable button/pill */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-2"
            >
              <span className="text-amber-300 text-xs font-semibold uppercase tracking-wide font-body">New</span>
              <span className="text-sm text-white/90 font-body">Engines Now Deploying</span>
            </motion.div>

            {/* Headline */}
            <div className="mt-6 max-w-2xl">
              <BlurText
                text="Live anywhere across the wild Earth"
                className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading text-white leading-[0.85] tracking-[-4px]"
                enableSweep
              />
            </div>

            {/* Subheading */}
            <motion.p
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
              className="mt-4 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight"
            >
              A modular off-grid micro-dwelling system that learns its terrain.
              Discover land, configure your habitat, and operate it remotely —
              one continuous engine.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.1, ease: "easeOut" }}
              className="flex items-center gap-6 mt-6 flex-wrap"
            >
              <Link
                to="/discover"
                className="group rounded-full px-5 py-2.5 text-sm font-semibold text-black bg-white font-body inline-flex items-center gap-2 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-amber-200 hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]"
              >
                Start Your Voyage <ArrowUpRight className="h-5 w-5 transition-colors duration-300" strokeWidth={2} />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.3, ease: "easeOut" }}
              className="flex items-stretch gap-4 mt-8"
            >
              <StatGlass
                value="7.2 Hours"
                label="Average Engine Setup Time"
                icon={<Timer className="w-7 h-7 text-white" strokeWidth={1.5} />}
              />
              <StatGlass
                value="1.2K+"
                label="Operators Across the Globe"
                icon={<Globe2 className="w-7 h-7 text-white" strokeWidth={1.5} />}
              />
            </motion.div>
          </div>

          {/* Partners */}
          <motion.div
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 1.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 pb-20 px-4 mt-4"
          >
            <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body">
              Collaborating with off-grid pioneers globally
            </div>
            <div className="flex flex-wrap justify-center gap-12 md:gap-16 font-heading text-white text-2xl md:text-3xl tracking-tight mt-3">
              <span>Aeon</span>
              <span>Vela</span>
              <span>Apex</span>
              <span>Orbit</span>
              <span>Zeno</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue — clicking it smooth-scrolls down to Capabilities ("Habitat evolved") */}
        <motion.button
          type="button"
          onClick={() => capabilitiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label="Scroll to Habitat evolved"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{
            opacity: { duration: 0.7, delay: 1.7, ease: "easeOut" },
            y: { duration: 1.8, delay: 1.7, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/30 shadow-[0_2px_12px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
        >
          <ChevronDown className="h-4 w-4 text-white" strokeWidth={2.25} />
        </motion.button>
      </section>

      {/* ============ CAPABILITIES ============ */}
      <section ref={capabilitiesRef} className="relative w-full overflow-hidden bg-black">
        <StarfieldScene className="absolute inset-0 w-full h-full z-0" />
        {/* top fade from hero */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#070b1f] to-transparent z-10 pointer-events-none" />
        {/* bottom fade into lifecycle */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#03040d] to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 px-8 md:px-16 lg:px-20 pt-24 pb-20 flex flex-col">
          <div className="text-center">
            <h2 className="font-heading text-white text-5xl md:text-6xl leading-tight tracking-[-2px]">
              Habitat evolved
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/70 max-w-3xl mx-auto font-body leading-relaxed">
              A dwelling is no longer a fixed object — it's a living, adaptive system that responds
              to the changing needs of its occupants, and to its climate and environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <CapCard
              index={0}
              title="Adaptive by Design"
              body="Every habitat is a living system, not a static structure, shifting with the preferences of the people who live in it, and the climate and terrain around them."
              tags={["Occupant-Responsive", "Climate-Aware", "Living System", "Continuous Feedback"]}
              iconPath="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 0 1 6 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"
            />
            <CapCard
              index={1}
              title="Computational Engine"
              body="Define your needs, preferences and conditions through a web interface, and the engine translates them into a personalised, buildable dwelling, adapted to where it will be assembled."
              tags={["User-Defined Inputs", "Generative Design", "Digital Fabrication", "Site-Adapted"]}
              iconPath="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"
            />
            <CapCard
              index={2}
              title="Continuous by Nature"
              body="The dwelling reports on itself continuously: solar, power, wind, system status, the same way you'd monitor an engine, not check on a house. What it's built from stays in the loop, reused and reconfigured rather than built once and discarded."
              tags={["Live Telemetry", "Real-Time Alerts", "Closed-Loop", "Reconfigurable"]}
              iconPath="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
            />
          </div>
        </div>

        {/* Scroll cue — clicking it smooth-scrolls down to the Life Cycle section */}
        <motion.button
          type="button"
          onClick={() => lifecycleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label="Scroll to From Order to Return: The Life Cycle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1, y: [0, 6, 0] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            opacity: { duration: 0.7, ease: "easeOut" },
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/30 shadow-[0_2px_12px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
        >
          <ChevronDown className="h-4 w-4 text-white" strokeWidth={2.25} />
        </motion.button>
      </section>

      {/* ============ LIFECYCLE ============ */}
      <section ref={lifecycleRef} className="relative w-full overflow-hidden bg-transparent">
        <div className="absolute inset-0 bg-[url('/background-for-video.jpg')] bg-cover bg-center bg-no-repeat opacity-50" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#03040d]/60 to-transparent z-10 pointer-events-none" />
        {/* Fade into the closing section below, which starts from the same #03040d — without it the image ends in a hard line. */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#03040d] via-[#03040d]/60 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 px-8 md:px-16 lg:px-20 py-20 mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-white text-5xl md:text-6xl leading-tight tracking-[-2px]">
              From Order to Return: The Life Cycle
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/70 max-w-3xl mx-auto font-body leading-relaxed">
              Watch how Nomadic Engine transforms assembly, habitation, disassembly, and reuse into one continuous life cycle.
            </p>
          </div>

          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="liquid-glass group rounded-[1.25rem] p-5 w-full max-w-4xl mx-auto flex flex-col cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/15 hover:border-white/40"
          >
            <div className="relative overflow-hidden rounded-[1rem] h-[260px] sm:h-[340px] md:h-[400px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <FadingVideo
                src="/videos/production-to-assembly-lifecycle-1.mp4"
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                playOnVisible
              />
              <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-md">
                Life Cycle
              </div>
            </div>

            <div className="mt-3 flex-1 flex flex-col justify-start">
              <div className="flex flex-wrap gap-2">
                {[
                  "Assembly",
                  "Habitation",
                  "Disassembly",
                  "Reuse",
                  "Return",
                ].map((tag) => (
                  <span key={tag} className="liquid-glass tag-glass text-xs font-semibold text-white/90">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue — mirrors the one above the Life Cycle section, this
            time carrying you on down to the closing CTA. */}
        <motion.button
          type="button"
          onClick={() => closingCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label="Scroll to closing call to action"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1, y: [0, 6, 0] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            opacity: { duration: 0.7, ease: "easeOut" },
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/30 shadow-[0_2px_12px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
        >
          <ChevronDown className="h-4 w-4 text-white" strokeWidth={2.25} />
        </motion.button>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section ref={closingCtaRef} className="relative w-full overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[url('/background-for-video.jpg')] bg-cover bg-center bg-no-repeat opacity-50 -scale-y-100" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#03040d] to-transparent z-10 pointer-events-none" />
        <div className="relative z-20 px-8 md:px-16 lg:px-20 py-28 flex flex-col items-center text-center">
          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h2 className="font-heading text-white text-5xl md:text-6xl leading-tight tracking-[-2px]">
              Ready to deploy your Engine?
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/70 max-w-xl mx-auto font-body leading-relaxed">
              Find land, configure your habitat, and operate it remotely — start the voyage today.
            </p>
            <Link
              to="/discover"
              className="group rounded-full px-5 py-2.5 text-sm font-semibold text-black bg-white font-body inline-flex items-center gap-2 mt-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-amber-200 hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]"
            >
              Start Your Voyage <ArrowUpRight className="h-5 w-5 transition-colors duration-300" strokeWidth={2} />
            </Link>
          </motion.div>

          <footer className="mt-24 pt-8 border-t border-white/10 text-white/60 text-sm font-body w-full">
            <div className="flex flex-wrap justify-between gap-4">
              <span>© 2026 Nomadic Engine</span>
              <span>Designed for terrain. Built for return.</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}

function StatGlass({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="liquid-glass group p-5 w-[220px] rounded-[1.25rem] text-left cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/15 hover:border-white/40 hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]">
      <div className="w-7 h-7 text-white transition-colors duration-300 group-hover:text-amber-300">{icon}</div>
      <p className="font-heading text-white text-4xl tracking-[-1px] leading-none mt-6 transition-colors duration-300 group-hover:text-amber-200">{value}</p>
      <p className="text-xs text-white font-body font-light mt-2 transition-colors duration-300 group-hover:text-white/90">{label}</p>
    </div>
  );
}

function CapCard({
  title,
  body,
  tags,
  iconPath,
  index = 0,
}: {
  title: string;
  body: string;
  tags: string[];
  iconPath: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
      whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.15 }}
      className="liquid-glass group rounded-[1.25rem] p-6 min-h-[360px] flex flex-col cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/15 hover:border-white/40 hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]"
    >
      <div className="flex items-start justify-between gap-4 min-h-[92px]">
        <div className="liquid-glass icon-box-glass">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white transition-colors duration-300 group-hover:text-amber-300">
            <path d={iconPath} />
          </svg>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
          {tags.map((t) => (
            <span key={t} className="liquid-glass tag-glass">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-16">
        <h3 className="font-heading text-white text-3xl md:text-4xl tracking-[-1px] leading-none transition-colors duration-300 group-hover:text-amber-200">{title}</h3>
        <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch] transition-colors duration-300 group-hover:text-white/90">{body}</p>
      </div>
    </motion.div>
  );
}
