import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Palette, PanelsTopLeft, Layers, Waves, Globe, Armchair, UtensilsCrossed, Flame, Trees, Droplets, Table2, Lock, type LucideIcon } from "lucide-react";
import { PARTS, PartId, findOption, gbp, SKIPPED, isSkipped } from "@/data/dwellingParts";

/** One icon per part, in PARTS order. */
const PART_ICONS: Record<PartId, LucideIcon> = {
  rib: Palette,           // Rib Colour
  endwall: PanelsTopLeft, // no longer in PARTS (Walls Panels removed), key kept to satisfy Record<PartId, ...>
  platform: Layers,      // no longer in PARTS (Flooring removed), key kept to satisfy Record<PartId, ...>
  membrane: Waves,       // Membrane Pattern
  skylight: Globe,       // Off Grid Elements
  door: Armchair,        // Outdoor Furniture
};

// Outdoor Furniture options read as an actual catalogue rather than
// material swatches — each piece is different furniture, not a colour
// choice, so it gets its own icon instead of a colour chip.
const DOOR_OPTION_ICONS: Record<string, LucideIcon> = {
  "lounge-chair": Armchair,
  "picnic-bench": UtensilsCrossed,
  "fire-pit-seating": Flame,
  "hammock": Trees,
  "deck-table": Table2,
  "pool": Droplets,
};

type Props = {
  activePart: PartId | null;
  configured: Map<PartId, string>;
  onTogglePart: (p: PartId) => void;
  onSelectOption: (optionId: string) => void;
};

/**
 * Vertical stepper counterpart to PartsStrip: each add-on is a node on a
 * connected track, so progress through the six is legible at a glance.
 * The connector is a flex child that grows with its row, which keeps the
 * track unbroken when a step expands to show its options.
 *
 * PartsStrip stays as-is for the full-screen customizer on the portfolio page.
 */
export default function AddOnsPanel({
  activePart,
  configured,
  onTogglePart,
  onSelectOption,
}: Props) {
  // Steps unlock in order: the first unconfigured one is the furthest you can
  // reach. Everything after it stays locked until it's chosen.
  const firstIncomplete = PARTS.findIndex((p) => !p.locked && !configured.has(p.id));
  const allDone = firstIncomplete === -1;

  return (
    <div className="flex flex-col">
      {PARTS.map((p, i) => {
        const optId = configured.get(p.id);
        const opt = optId ? findOption(p.id, optId) : null;
        const isOpen = activePart === p.id;
        const skipped = isSkipped(optId);
        const done = !!opt;              // chosen an actual option
        const passed = done || skipped;  // decided either way — unlocks the next
        const comingSoon = !!p.locked;
        const locked = comingSoon || (!allDone && i > firstIncomplete);
        const isLast = i === PARTS.length - 1;
        const Icon = comingSoon ? Lock : PART_ICONS[p.id];
        const defaultOpt = p.options.find((o) => o.isDefault);

        return (
          <div key={p.id} className="flex gap-2.5">
            {/* Track: node + connector to the next node */}
            <div className="flex flex-col items-center shrink-0">
              <span
                className={[
                  // Outline only — a completed step reads as white ring + white
                  // icon rather than a filled disc. Locked steps sit well back
                  // so the one you can actually act on is obvious.
                  "w-8 h-8 rounded-full inline-flex items-center justify-center border bg-transparent transition-all duration-300 shrink-0",
                  done
                    ? "border-white text-white"
                    : skipped
                      ? "border-white/30 text-white/30 border-dashed"
                      : comingSoon
                        ? "border-white/25 text-white/45"
                      : locked
                        ? "border-white/10 text-white/15"
                        : isOpen
                          ? "border-white/70 text-white"
                          : "border-white/45 text-white/70",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              {!isLast && (
                <span
                  className={[
                    // Brightens once the step is decided, whether chosen or
                    // skipped — the track shows how far you've got.
                    "w-px flex-1 my-1 transition-colors duration-300",
                    done ? "bg-white/70" : passed ? "bg-white/40" : "bg-white/25",
                  ].join(" ")}
                />
              )}
            </div>

            {/* Label + options */}
            <div className={isLast ? "min-w-0 flex-1" : "min-w-0 flex-1 pb-3"}>
              <button
                onClick={() => !locked && onTogglePart(p.id)}
                disabled={locked}
                aria-expanded={isOpen}
                aria-disabled={locked}
                className={[
                  "w-full text-left group pt-1",
                  locked ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "block text-[9px] font-body uppercase tracking-[0.12em] transition-colors",
                    done ? "text-white/80" : comingSoon ? "text-white/45" : locked ? "text-white/20" : "text-white/60",
                  ].join(" ")}
                >
                  {p.label}
                </span>
                <span
                  className={[
                    "block text-[11px] font-body truncate transition-colors",
                    opt ? "text-white"
                      : skipped ? "text-white/35 italic"
                      : comingSoon ? "text-white/40"
                      : locked ? "text-white/15"
                      : "text-white/55 group-hover:text-white/85",
                  ].join(" ")}
                >
                  {opt ? opt.name : skipped ? "Skipped" : comingSoon ? "Coming soon" : locked ? "Locked" : defaultOpt ? `${defaultOpt.name} · default` : "Select"}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && !comingSoon && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 flex flex-col gap-1">
                      {p.options.map((o) => {
                        const selected = optId === o.id;
                        // Until something else is chosen, the default is what is already applied.
                        const appliedByDefault = !!o.isDefault && !optId;
                        const OptionIcon = p.id === "door" ? DOOR_OPTION_ICONS[o.id] : null;
                        return (
                          <button
                            key={o.id}
                            onClick={() => onSelectOption(o.id)}
                            aria-pressed={selected}
                            className={[
                              "w-full flex items-center gap-2 rounded-[0.5rem] px-2 py-1.5 text-left transition-colors",
                              selected ? "bg-white/15" : appliedByDefault ? "bg-white/[0.08] ring-1 ring-white/20" : "bg-white/[0.03] hover:bg-white/[0.08]",
                            ].join(" ")}
                          >
                            {OptionIcon ? (
                              <span className="w-4 h-4 rounded-[0.3rem] shrink-0 inline-flex items-center justify-center text-white/70">
                                <OptionIcon className="h-3 w-3" strokeWidth={1.75} />
                              </span>
                            ) : (
                              <span
                                className="w-4 h-4 rounded-[0.3rem] shrink-0 border border-white/25"
                                style={{ background: o.hex }}
                              />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-body text-white/85 truncate">
                                {o.name}
                              </span>
                              <span className="block text-[9px] font-body text-white/40 truncate">
                                {gbp(o.price)}{o.isDefault ? (appliedByDefault ? " · applied by default" : " · default") : ""}
                              </span>
                            </span>
                            {selected && (
                              <Check className="h-3 w-3 text-white/80 shrink-0" strokeWidth={2.5} />
                            )}
                            {appliedByDefault && (
                              <Check className="h-3 w-3 text-white/40 shrink-0" strokeWidth={2.5} />
                            )}
                          </button>
                        );
                      })}

                      {/* Rib Colour and Membrane Pattern pick the dwelling's
                          shell material — they're not optional add-ons, so
                          they can't be skipped. */}
                      {p.id !== "rib" && p.id !== "membrane" && (
                      <button
                        onClick={() => onSelectOption(SKIPPED)}
                        aria-pressed={skipped}
                        className={[
                          "w-full flex items-center gap-2 rounded-[0.5rem] px-2 py-1.5 text-left transition-colors",
                          skipped ? "bg-white/10" : "hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        <span className="w-4 h-4 rounded-[0.3rem] shrink-0 border border-dashed border-white/25 inline-flex items-center justify-center">
                          <Minus className="h-2.5 w-2.5 text-white/40" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-body text-white/60 truncate">
                            Skip this add-on
                          </span>
                          <span className="block text-[9px] font-body text-white/30">
                            No charge
                          </span>
                        </span>
                        {skipped && (
                          <Check className="h-3 w-3 text-white/70 shrink-0" strokeWidth={2.5} />
                        )}
                      </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
