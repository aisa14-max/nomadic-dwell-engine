export type PartId =
  | "membrane"
  | "endwall"
  | "interior"
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
    label: "Ribs",
    hotspot: { x: 59, y: 32 },
    options: [
      { id: "steel", name: "Cold Steel", hex: "#7a808a", price: 760 },
      { id: "bronze", name: "Bronze", hex: "#8a5a32", price: 920 },
      { id: "matte", name: "Matte Black", hex: "#1a1a1c", price: 820 },
    ],
  },
  {
    id: "platform",
    label: "Terraribs",
    hotspot: { x: 70, y: 65 },
    options: [
      { id: "stone", name: "Quarry Stone", hex: "#8a8278", price: 2100 },
      { id: "deck", name: "Cedar Deck", hex: "#a67648", price: 1980 },
      { id: "concrete", name: "Poured Concrete", hex: "#9e9e9c", price: 2240 },
    ],
  },
  {
    id: "endwall",
    label: "Solid Walls",
    hotspot: { x: 24, y: 33 },
    options: [
      { id: "oak", name: "Smoked Oak", hex: "#6e5440", price: 980 },
      { id: "alu", name: "Brushed Aluminum", hex: "#b5b8bd", price: 1180 },
      { id: "ink", name: "Ink Black", hex: "#141416", price: 1100 },
    ],
  },
  {
    id: "interior",
    label: "Interior",
    hotspot: { x: 52, y: 30 },
    options: [
      { id: "ash", name: "Pale Ash", hex: "#d6cfc0", price: 1640 },
      { id: "walnut", name: "Walnut", hex: "#5a3a2a", price: 1880 },
      { id: "sage", name: "Sage Felt", hex: "#9aa890", price: 1720 },
    ],
  },
  {
    id: "membrane",
    label: "Membrane",
    hotspot: { x: 52, y: 28 },
    options: [
      { id: "linen", name: "Linen White", hex: "#e8e2d4", price: 1200 },
      { id: "graphite", name: "Graphite", hex: "#3a3a3e", price: 1350 },
      { id: "moss", name: "Moss", hex: "#5d6e4a", price: 1400 },
    ],
  },
  {
    id: "skylight",
    label: "Additions",
    hotspot: { x: 53, y: 33 },
    options: [
      { id: "clear", name: "Clear", hex: "#cfe6f2", price: 600 },
      { id: "tinted", name: "Tinted", hex: "#5a7280", price: 750 },
      { id: "smart", name: "Smart Glass", hex: "#92b8c8", price: 1100 },
    ],
  },
  {
    id: "door",
    label: "Exterior",
    hotspot: { x: 85, y: 62 },
    options: [
      { id: "cedar", name: "Cedar Plank", hex: "#a06a3a", price: 540 },
      { id: "steel", name: "Steel Pivot", hex: "#4a4e54", price: 720 },
      { id: "glass", name: "Glass Slider", hex: "#b8d4dc", price: 880 },
    ],
  },
];

export const TOTAL_PARTS = PARTS.length;
export const TAX_RATE = 0.06;
export const DEPOSIT_RATE = 0.1;

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
