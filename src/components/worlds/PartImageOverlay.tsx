import { AnimatePresence, motion } from "framer-motion";
import { PartId } from "@/data/dwellingParts";
import ribs from "@/assets/parts/Ribs.png";
import terraribs from "@/assets/parts/Terraribs.png";
import solidWalls from "@/assets/parts/Solid_Walls.png";
import interior from "@/assets/parts/Interior.png";
import membrane from "@/assets/parts/Membrane.png";
import additions from "@/assets/parts/Additions.png";
import exterior from "@/assets/parts/Exterior.png";
import defaultImg from "@/assets/parts/Default.png";

const IMAGES: Record<PartId, string> = {
  rib: ribs,
  platform: terraribs,
  endwall: solidWalls,
  interior,
  membrane,
  skylight: additions,
  door: exterior,
};

export default function PartImageOverlay({ activePart }: { activePart: PartId | null }) {
  const src = activePart ? IMAGES[activePart] : defaultImg;
  const key = activePart ?? "__default__";
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={key}
          src={src}
          alt=""
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 0.85, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.6, 0.2, 0.2, 1] }}
          className="max-w-[90%] max-h-[90%] object-contain"
          style={{
            mixBlendMode: "screen",
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
          }}
        />
      </AnimatePresence>
    </div>
  );
}

