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
      { id: "petg-black", name: "PETG Black", hex: "#1a1a1a", price: 850 },
      { id: "petg-white", name: "PETG White", hex: "#f5f5f5", price: 820 },
      { id: "petg-clear", name: "PETG Clear", hex: "#e6ece9", price: 950 },
    ],
  },
  {
    id: "membrane",
    label: "Membrane Pattern",
    hotspot: { x: 52, y: 28 },
    options: [
      { id: "etfe", name: "ETFE", hex: "#e8e2d4", price: 1200 },
      { id: "ptfe", name: "PTFE", hex: "#cfcfcf", price: 1350 },
      { id: "pvc", name: "PVC Coated Polyester", hex: "#5d6e4a", price: 1400 },
    ],
  },
  {
    id: "skylight",
    label: "Off Grid Elements",
    hotspot: { x: 53, y: 33 },
    options: [
      { id: "solar", name: "Solar Panel", hex: "#1c2a4a", price: 600 },
      { id: "bike", name: "Bike Holder", hex: "#8a8a8e", price: 750 },
      { id: "water", name: "Extra Water Tank", hex: "#7aa0b8", price: 1100 },
    ],
  },
  {
    id: "door",
    label: "Outdoor Furniture",
    hotspot: { x: 85, y: 62 },
    options: [
      { id: "lounge-chair", name: "Lounge Chair", hex: "#a06a3a", price: 620 },
      { id: "picnic-bench", name: "Picnic Bench", hex: "#8a6247", price: 780 },
      { id: "fire-pit-seating", name: "Fire Pit Seating", hex: "#4a4038", price: 250 },
      { id: "hammock", name: "Hammock", hex: "#d4a96a", price: 480 },
      { id: "deck-table", name: "Deck Table", hex: "#6b5240", price: 690 },
      { id: "pool", name: "Foldable Pool", hex: "#3a8ab8", price: 880 },
    ],
  },
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
