export type ClimateId =
  | "tropical"
  | "dry-arid"
  | "temperate"
  | "continental"
  | "polar"
  | "mountain-alpine";

export const CLIMATES: { id: ClimateId; label: string }[] = [
  { id: "tropical",        label: "Tropical" },
  { id: "dry-arid",        label: "Dry/Arid" },
  { id: "temperate",       label: "Temperate" },
  { id: "continental",     label: "Continental" },
  { id: "polar",           label: "Polar" },
  { id: "mountain-alpine", label: "Mountain/Alpine" },
];
