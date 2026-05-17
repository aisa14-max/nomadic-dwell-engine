export type RegionId =
  | "europe"
  | "north-america"
  | "south-america"
  | "africa"
  | "asia"
  | "oceania"
  | "antarctica";

export interface Region {
  id: RegionId;
  label: string;
  /** [lng, lat] used for map flyTo */
  center: [number, number];
}

export const REGIONS: Region[] = [
  { id: "europe",        label: "Europe",        center: [15,   54] },
  { id: "north-america", label: "North America", center: [-100, 45] },
  { id: "south-america", label: "South America", center: [-60, -15] },
  { id: "africa",        label: "Africa",        center: [20,    3] },
  { id: "asia",          label: "Asia",          center: [95,   40] },
  { id: "oceania",       label: "Oceania",       center: [140, -25] },
  { id: "antarctica",    label: "Antarctica",    center: [0,   -80] },
];

export const REGION_LABEL: Record<RegionId, string> = REGIONS.reduce(
  (acc, r) => ({ ...acc, [r.id]: r.label }),
  {} as Record<RegionId, string>,
);
