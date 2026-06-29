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
    label: "Indoor Furniture",
    hotspot: { x: 59, y: 32 },
    options: [
      { id: "square", name: "Square", hex: "#ffffff", price: 920 },
      { id: "organic", name: "Organic", hex: "#f4a7c3", price: 760 },
      { id: "rectangular", name: "Rectangular", hex: "#f5e642", price: 820 },
    ],
  },
  {
    id: "platform",
    label: "Flooring",
    hotspot: { x: 70, y: 65 },
    options: [
      { id: "light-ash", name: "Light Ash", hex: "#d4c4a0", price: 2100 },
      { id: "european-oak", name: "European Oak", hex: "#a07848", price: 1980 },
      { id: "smoked-walnut", name: "Smoked Walnut", hex: "#4a3020", price: 2240 },
    ],
  },
  {
    id: "endwall",
    label: "Walls Panels",
    hotspot: { x: 24, y: 33 },
    options: [
      { id: "white", name: "White Panels", hex: "#ececec", price: 980 },
      { id: "pink", name: "Pink Panels", hex: "#f4a7c3", price: 1180 },
      { id: "grey", name: "Grey Panels", hex: "#8a8a8e", price: 1100 },
    ],
  },
  {
    id: "membrane",
    label: "Membrane",
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
      { id: "sitting", name: "Sitting", hex: "#a06a3a", price: 540 },
      { id: "plants", name: "Plants", hex: "#4a7a3a", price: 720 },
      { id: "pool", name: "Foldable Pool", hex: "#3a8ab8", price: 880 },
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
