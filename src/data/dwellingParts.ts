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
      { id: "white", name: "White", hex: "#f2f2f2", price: 760 },
      { id: "grey", name: "Grey", hex: "#7a808a", price: 920 },
      { id: "black", name: "Black", hex: "#1a1a1c", price: 820 },
    ],
  },
  {
    id: "platform",
    label: "Terraribs",
    hotspot: { x: 70, y: 65 },
    options: [
      { id: "white", name: "White", hex: "#ece9e2", price: 2100 },
      { id: "grey", name: "Grey", hex: "#9e9e9c", price: 1980 },
      { id: "black", name: "Black", hex: "#1d1d1f", price: 2240 },
    ],
  },
  {
    id: "endwall",
    label: "Solid Walls",
    hotspot: { x: 24, y: 33 },
    options: [
      { id: "wooden", name: "Wooden Panels", hex: "#a67648", price: 980 },
      { id: "purple", name: "Purple Panels", hex: "#6b4a8a", price: 1180 },
      { id: "white", name: "White Panels", hex: "#ececec", price: 1100 },
    ],
  },
  {
    id: "interior",
    label: "Interior",
    hotspot: { x: 52, y: 30 },
    options: [
      { id: "green-boxy", name: "Green Boxy", hex: "#4a6b3a", price: 1640 },
      { id: "yellow-organic", name: "Yellow Organic", hex: "#d8b04a", price: 1880 },
      { id: "cotton-grey", name: "Cotton Grey", hex: "#bdbcb6", price: 1720 },
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
    label: "Additions",
    hotspot: { x: 53, y: 33 },
    options: [
      { id: "solar", name: "Solar Panel", hex: "#1c2a4a", price: 600 },
      { id: "bike", name: "Bike Holder", hex: "#8a8a8e", price: 750 },
      { id: "water", name: "Extra Water Tank", hex: "#7aa0b8", price: 1100 },
    ],
  },
  {
    id: "door",
    label: "Exterior",
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
