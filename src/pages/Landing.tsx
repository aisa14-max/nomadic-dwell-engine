import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play, Timer, Globe2 } from "lucide-react";
import FadingVideo from "@/components/FadingVideo";
import StarfieldScene from "@/components/StarfieldScene";
import BlurText from "@/components/BlurText";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4";
const CAP_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4";

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Landing() {
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
            {/* Badge */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
              className="liquid-glass rounded-full inline-flex items-center gap-2 pl-1 pr-3 py-1"
            >
              <span className="bg-white text-black rounded-full px-3 py-1 text-xs font-semibold font-body">New</span>
              <span className="text-sm text-white/90 font-body">First Engine Deployment Lands Q3 2026</span>
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
              className="flex items-center gap-6 mt-6"
            >
              <Link
                to="/discover"
                className="liquid-glass-strong group rounded-full px-5 py-2.5 text-sm font-medium text-white font-body inline-flex items-center gap-2 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/15 hover:border-white/40 hover:shadow-[0_0_40px_rgba(251,191,36,0.35)] hover:text-amber-200"
              >
                Start Your Voyage <ArrowUpRight className="h-5 w-5 transition-colors duration-300 group-hover:text-amber-300" strokeWidth={2} />
              </Link>
              <Link to="/configurator" className="text-sm font-body text-white inline-flex items-center gap-2">
                View Liftoff <Play className="h-4 w-4 fill-white" strokeWidth={0} />
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
            className="flex flex-col items-center gap-4 pb-8 px-4 mt-8"
          >
            <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body">
              Collaborating with off-grid pioneers globally
            </div>
            <div className="flex flex-wrap justify-center gap-12 md:gap-16 font-heading text-white text-2xl md:text-3xl tracking-tight">
              <span>Aeon</span>
              <span>Vela</span>
              <span>Apex</span>
              <span>Orbit</span>
              <span>Zeno</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CAPABILITIES ============ */}
      <section className="relative w-full overflow-hidden bg-black">
        <StarfieldScene className="absolute inset-0 w-full h-full z-0" />
        {/* top fade from hero */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#070b1f] to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 px-8 md:px-16 lg:px-20 pt-24 pb-20 flex flex-col">
          <div>
            <p className="text-sm font-body text-white/80 mb-6">// Capabilities</p>
            <h2 className="font-heading text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
              Habitat
              <br />
              evolved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <CapCard
              title="Site Intelligence"
              body="The engine analyses your terrain to compose an indistinguishable natural fit — from Icelandic moss to misty pine forest."
              tags={["Solar Yield", "Wind Mapping", "Water Sources", "Climate Sync"]}
              iconPath="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z"
            />
            <CapCard
              title="Modular Assembly"
              body="Compose your habitat in minutes. A unified architectural language for every terrain — without months of bespoke engineering."
              tags={["Scale Fast", "Visual Cohesion", "Rapid Deploy", "Move Anywhere"]}
              iconPath="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z"
            />
            <CapCard
              title="Live Operation"
              body="Automatic energy and climate balancing. Achieve full off-grid autonomy with realtime telemetry and predictive forecasting."
              tags={["Energy Routing", "Storm Mode", "Studio Quiet", "Sunlight Sync"]}
              iconPath="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z"
            />
          </div>

          <footer className="mt-16 pt-8 border-t border-white/10 text-white/60 text-sm font-body">
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
}: {
  title: string;
  body: string;
  tags: string[];
  iconPath: string;
}) {
  return (
    <motion.div
      initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
      whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="liquid-glass group rounded-[1.25rem] p-6 min-h-[360px] flex flex-col cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/15 hover:border-white/40 hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]"
    >
      <div className="flex items-start justify-between gap-4">
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
      <div className="flex-1" />
      <div className="mt-6">
        <h3 className="font-heading text-white text-3xl md:text-4xl tracking-[-1px] leading-none transition-colors duration-300 group-hover:text-amber-200">{title}</h3>
        <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch] transition-colors duration-300 group-hover:text-white/90">{body}</p>
      </div>
    </motion.div>
  );
}
