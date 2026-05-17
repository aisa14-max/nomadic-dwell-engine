## Wire climate pills to filter results

### Data model

**`src/data/climates.ts`** (new)
```ts
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
```

**`src/data/sites.ts`** — add `climateId: ClimateId` to each site (keep existing free-text `climate` tag for cards):

| Site            | Existing `climate` | New `climateId`    |
|-----------------|--------------------|--------------------|
| Pine Hollow     | Sub-arctic         | `polar`            |
| Mýrar Cliff     | Maritime           | `temperate`        |
| Atacama Plateau | Arid alpine        | `mountain-alpine`  |
| Skye Moor       | Temperate          | `temperate`        |
| Mosi Plains     | Sub-arctic         | `polar`            |
| Black Pines     | Boreal             | `continental`      |

Tropical and Dry/Arid will show the empty state until more sites exist.

### Page logic

**`src/pages/Discover.tsx`**
- Replace `filters` array + numeric `active` state with `selectedClimate: ClimateId | "all"` (default `"all"`).
- Render a leading "All climates" pill plus one pill per `CLIMATES` entry.
- `visibleSites` memo combines both filters:
  `(selectedRegion === "all" || s.regionId === selectedRegion) && (selectedClimate === "all" || s.climateId === selectedClimate)`

### Out of scope
- Renaming card `climate` tag text.
- Adding new sites.
- A separate active-climate chip (pill highlight is enough).
