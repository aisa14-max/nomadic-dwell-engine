import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import BlurText from "@/components/BlurText";

// Same near-black background as the Tribe page's layer-0 entrance, but a
// little cluster of meshing gears instead of Tribe's warm glow orb or a
// literal wireframe — playful "under the hood" motion rather than mood
// lighting or a blueprint. The rest of the page (actual logic content) is
// still TBD.
export default function UnderTheHood() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#02030a] text-white">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#02030a]/40 via-[#02030a]/55 to-[#02030a]/80" />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-10">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Big gear, slow clockwise */}
          <motion.div
            className="absolute"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 10px rgba(150,210,255,0.25))" }}
          >
            <Settings className="h-28 w-28 text-white/70" strokeWidth={1.25} />
          </motion.div>
          {/* Small gear, faster counter-clockwise, meshed top-right */}
          <motion.div
            className="absolute -top-2 right-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 8px rgba(150,210,255,0.25))" }}
          >
            <Settings className="h-14 w-14 text-white/50" strokeWidth={1.25} />
          </motion.div>
          {/* Smallest gear, quickest counter-clockwise, meshed bottom-left */}
          <motion.div
            className="absolute -bottom-3 -left-3"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(150,210,255,0.2))" }}
          >
            <Settings className="h-9 w-9 text-white/40" strokeWidth={1.25} />
          </motion.div>
        </div>
        <BlurText
          text="See how your Engine thinks."
          className="font-heading text-4xl md:text-5xl text-white/90 text-center"
        />
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/40 font-body text-center">
          (step inside the configurator's mind)
        </p>
      </div>
    </div>
  );
}
