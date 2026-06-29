import { AnimatePresence, motion } from "framer-motion";
import { PartId } from "@/data/dwellingParts";
import ribs from "@/assets/parts/Ribs.png";
import darkFloor from "@/assets/panels-dark-floor.png";
import pinkWalls from "@/assets/panels-pink-walls.png";
import panelsMembrane from "@/assets/panels-membrane-v2.png";
import solarPanels from "@/assets/panels-solar-v2.png";
import seating from "@/assets/panels-seating-v2.png";
import defaultImg from "@/assets/parts/Default.png";
import indoorSquare from "@/assets/panels-square.png";
import indoorOrganic from "@/assets/panels-organic.png";

const PART_IMAGES: Record<PartId, string> = {
  rib: ribs,
  platform: darkFloor,
  endwall: pinkWalls,
  membrane: panelsMembrane,
  skylight: solarPanels,
  door: seating,
};

const OPTION_IMAGES: Partial<Record<PartId, Record<string, string>>> = {
  rib: {
    square: indoorSquare,
    organic: indoorOrganic,
  },
};

export default function PartImageOverlay({ activePart, activeOption }: { activePart: PartId | null; activeOption?: string }) {
  const optionSrc = activePart && activeOption ? OPTION_IMAGES[activePart]?.[activeOption] : undefined;
  const src = optionSrc ?? (activePart ? PART_IMAGES[activePart] : defaultImg);
  const key = activePart ? `${activePart}-${activeOption ?? "default"}` : "__default__";
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

