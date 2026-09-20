export type PartId =
  | "membrane"
  | "endwall"
  | "rib"
  | "platform"
  | "skylight"
  | "door";

export type PartOption = {
  id: string;
  name: string;
  hex: string;
  price: number;
  /** The standard finish that comes applied unless the customer picks another. */
  isDefault?: boolean;
};

export type Part = {
  id: PartId;
  label: string;
  options: PartOption[];
  /** SVG hotspot position in % of viewport */
  hotspot: { x: number; y: number };
  /** Shown as "Coming soon": visible, but can't be opened, chosen, priced or required. */
  locked?: boolean;
};

export const PARTS: Part[] = [
  {
    id: "rib",
    label: "Rib Colour",
    hotspot: { x: 59, y: 32 },
    options: [
      { id: "petg-clear", name: "PETG Clear", hex: "#e6ece9", price: 0, isDefault: true },
      { id: "petg-black", name: "PETG Black", hex: "#1a1a1a", price: 850 },
    ],
  },
  {
    id: "membrane",
    label: "Membrane Pattern",
    hotspot: { x: 52, y: 28 },
    options: [
      { id: "beige", name: "Beige", hex: "#e3d5b8", price: 0, isDefault: true },
      { id: "green", name: "Green", hex: "#4a6b3a", price: 850 },
      { id: "red", name: "Red", hex: "#8a3a3a", price: 850 },
    ],
  },
  {
    id: "skylight",
    label: "Off Grid Elements",
    locked: true,
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
    locked: true,
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

/** Parts a customer can actually choose today — everything except "Coming soon". */
export const AVAILABLE_PARTS = PARTS.filter((p) => !p.locked);

export const TOTAL_PARTS = AVAILABLE_PARTS.length;

/** Drops saved [partId, optionId] entries for parts that are gone or locked, so
    old progress can't push the "configured" count past TOTAL_PARTS. */
export const pruneConfigured = <T extends [string, unknown]>(entries: T[]): T[] =>
  entries.filter(([pid]) => AVAILABLE_PARTS.some((p) => p.id === pid));

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
  AVAILABLE_PARTS.find((p) => p.id === partId)?.options.find((o) => o.id === optionId);

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
