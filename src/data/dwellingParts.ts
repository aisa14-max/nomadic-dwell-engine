export type PartId =
  | "membrane"
  | "endwall"
  | "rib"
  | "platform"
  | "skylight"
  | "door";

export type PartOption = { id: string; name: string; hex: string; price: number };

export type Part = {
  id: PartId;
  label: string;
  options: PartOption[];
  /** SVG hotspot position in % of viewport */
  hotspot: { x: number; y: number };
};

export const PARTS: Part[] = [
  {
    id: "rib",
    label: "Rib Colour",
    hotspot: { x: 59, y: 32 },
    options: [
      { id: "petg-clear", name: "PETG Clear", hex: "#e6ece9", price: 0 },
      { id: "petg-black", name: "PETG Black", hex: "#1a1a1a", price: 850 },
    ],
  },
  {
    id: "membrane",
    label: "Membrane Pattern",
    hotspot: { x: 52, y: 28 },
    options: [
      { id: "beige", name: "Beige", hex: "#e3d5b8", price: 0 },
      { id: "green", name: "Green", hex: "#4a6b3a", price: 850 },
      { id: "red", name: "Red", hex: "#8a3a3a", price: 850 },
    ],
  },
  // "skylight" (Off Grid Elements) and "door" (Outdoor Furniture) are
  // pulled from PARTS for now at the user's request, to be reinstated
  // later — not deleted. Their PartId union members and every static
  // Record<PartId, ...> entry (icons, images, colours) stay in place so
  // nothing else needs touching when they come back; they just render
  // nowhere while absent from this array, same pattern already used for
  // "endwall" and "platform" (see the comments in AddOnsPanel.tsx).
];

export const TOTAL_PARTS = PARTS.length;

/**
 * Stored in `configured` when the user passes on an add-on. It counts as a
 * decision (so the next step unlocks) but matches no option, so `findOption`
 * returns undefined and it contributes £0 to the totals.
 */
export const SKIPPED = "__skipped__";
export const isSkipped = (optionId: string | undefined) => optionId === SKIPPED;
export const TAX_RATE = 0.06;
export const DEPOSIT_RATE = 0.1;
/** The dwelling itself is rented via the monthly subscription, not bought
    outright — this is its full asset value, shown for context alongside the
    one-off add-on total rather than added into it. */
export const DWELLING_VALUE = 20000;

export const findOption = (partId: PartId, optionId: string) =>
  PARTS.find((p) => p.id === partId)?.options.find((o) => o.id === optionId);

export const computeTotals = (configured: Map<PartId, string>) => {
  let subtotal = 0;
  for (const [pid, oid] of configured) subtotal += findOption(pid, oid)?.price ?? 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const dueToday = Math.round(total * DEPOSIT_RATE);
  return { subtotal, tax, total, dueToday };
};

export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
