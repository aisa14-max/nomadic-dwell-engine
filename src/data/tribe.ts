// Shared tribe data: the people, tribes and chapters behind the Tribe map,
// also read by Profile (your tribe) and the Engine dashboard (neighbours).

// ── Data ─────────────────────────────────────────────────────────────────────
export type Intention = "create" | "travel" | "work" | "rest" | "explore";

export type Person = {
  id: string;
  alias: string;
  city: string;
  lat: number;
  lng: number;
  intention: Intention;
  tags: string[];
  stayDays: number;
  age: number;
  occupation: string;
  openToExchange: boolean;
};

export const RAW_PEOPLE: Omit<Person, "age" | "occupation" | "openToExchange">[] = [
  { id: "p1",  alias: "Kestrel", city: "Lisbon",        lat: 38.7,  lng: -9.1,  intention: "create",  tags: ["writing","ocean"],      stayDays: 28 },
  { id: "p2",  alias: "Aria",    city: "Tbilisi",       lat: 41.7,  lng: 44.8,  intention: "work",    tags: ["code","wine"],          stayDays: 21 },
  { id: "p3",  alias: "Mira",    city: "Chiang Mai",    lat: 18.8,  lng: 98.9,  intention: "create",  tags: ["film","monsoon"],       stayDays: 40 },
  { id: "p4",  alias: "Ilya",    city: "Mexico City",   lat: 19.4,  lng: -99.1, intention: "create",  tags: ["sound","design"],       stayDays: 18 },
  { id: "p5",  alias: "Noor",    city: "Marrakech",     lat: 31.6,  lng: -7.99, intention: "rest",    tags: ["weaving","tea"],        stayDays: 12 },
  { id: "p6",  alias: "Søren",   city: "Reykjavík",     lat: 64.1,  lng: -21.9, intention: "explore", tags: ["geology","ice"],        stayDays: 9  },
  { id: "p7",  alias: "Luma",    city: "Bali",          lat: -8.4,  lng: 115.2, intention: "rest",    tags: ["yoga","ocean"],         stayDays: 35 },
  { id: "p8",  alias: "Atlas",   city: "Cape Town",     lat: -33.9, lng: 18.4,  intention: "travel",  tags: ["mountain","wind"],      stayDays: 14 },
  { id: "p9",  alias: "Yara",    city: "Istanbul",      lat: 41.0,  lng: 28.9,  intention: "create",  tags: ["bazaar","writing"],     stayDays: 22 },
  { id: "p10", alias: "Theo",    city: "Tokyo",         lat: 35.6,  lng: 139.7, intention: "work",    tags: ["code","ramen"],         stayDays: 30 },
  { id: "p11", alias: "Iris",    city: "Buenos Aires",  lat: -34.6, lng: -58.4, intention: "create",  tags: ["tango","film"],         stayDays: 16 },
  { id: "p12", alias: "Bram",    city: "Berlin",        lat: 52.5,  lng: 13.4,  intention: "work",    tags: ["code","techno"],        stayDays: 45 },
  { id: "p13", alias: "Sana",    city: "Dakar",         lat: 14.7,  lng: -17.5, intention: "explore", tags: ["ocean","textile"],      stayDays: 11 },
  { id: "p14", alias: "Onyx",    city: "Medellín",      lat: 6.25,  lng: -75.6, intention: "travel",  tags: ["mountain","coffee"],    stayDays: 19 },
  { id: "p15", alias: "Kai",     city: "Honolulu",      lat: 21.3,  lng: -157.8,intention: "rest",    tags: ["surf","ocean"],         stayDays: 25 },
  { id: "p16", alias: "Vega",    city: "Stockholm",     lat: 59.3,  lng: 18.07, intention: "create",  tags: ["design","ice"],         stayDays: 17 },
  { id: "p17", alias: "Rhea",    city: "Athens",        lat: 37.98, lng: 23.7,  intention: "create",  tags: ["ruins","wine"],         stayDays: 23 },
  { id: "p18", alias: "Juno",    city: "Kyoto",         lat: 35.01, lng: 135.7, intention: "rest",    tags: ["tea","writing"],        stayDays: 31 },
  { id: "p19", alias: "Calla",   city: "Oaxaca",        lat: 17.06, lng: -96.7, intention: "create",  tags: ["weaving","sound"],      stayDays: 26 },
  { id: "p20", alias: "Echo",    city: "Tallinn",       lat: 59.43, lng: 24.75, intention: "work",    tags: ["code","forest"],        stayDays: 13 },
  { id: "p21", alias: "Wren",    city: "Porto",         lat: 41.15, lng: -8.61, intention: "create",  tags: ["wine","writing"],       stayDays: 24 },
  { id: "p22", alias: "Hale",    city: "Edinburgh",     lat: 55.95, lng: -3.19, intention: "create",  tags: ["writing","fog"],        stayDays: 19 },
  { id: "p23", alias: "Sable",   city: "Marseille",     lat: 43.30, lng: 5.37,  intention: "rest",    tags: ["ocean","tea"],          stayDays: 17 },
  { id: "p24", alias: "Orin",    city: "Prague",        lat: 50.08, lng: 14.43, intention: "work",    tags: ["code","beer"],          stayDays: 33 },
  { id: "p25", alias: "Lior",    city: "Tel Aviv",      lat: 32.08, lng: 34.78, intention: "work",    tags: ["code","ocean"],         stayDays: 27 },
  { id: "p26", alias: "Nyra",    city: "Cairo",         lat: 30.04, lng: 31.24, intention: "explore", tags: ["ruins","desert"],       stayDays: 10 },
  { id: "p27", alias: "Tovi",    city: "Nairobi",       lat: -1.29, lng: 36.82, intention: "travel",  tags: ["mountain","coffee"],    stayDays: 15 },
  { id: "p28", alias: "Indra",   city: "Mumbai",        lat: 19.08, lng: 72.88, intention: "create",  tags: ["film","monsoon"],       stayDays: 29 },
  { id: "p29", alias: "Kavi",    city: "Goa",           lat: 15.30, lng: 74.12, intention: "rest",    tags: ["yoga","ocean"],         stayDays: 36 },
  { id: "p30", alias: "Suri",    city: "Seoul",         lat: 37.57, lng: 126.98,intention: "work",    tags: ["code","design"],        stayDays: 22 },
  { id: "p31", alias: "Renji",   city: "Taipei",        lat: 25.03, lng: 121.57,intention: "work",    tags: ["code","ramen"],         stayDays: 26 },
  { id: "p32", alias: "Mei",     city: "Hanoi",         lat: 21.03, lng: 105.85,intention: "create",  tags: ["film","tea"],           stayDays: 20 },
  { id: "p33", alias: "Pax",     city: "Singapore",     lat: 1.35,  lng: 103.82,intention: "work",    tags: ["code","ocean"],         stayDays: 18 },
  { id: "p34", alias: "Coral",   city: "Sydney",        lat: -33.87,lng: 151.21,intention: "rest",    tags: ["surf","ocean"],         stayDays: 31 },
  { id: "p35", alias: "Linnea",  city: "Wellington",    lat: -41.29,lng: 174.78,intention: "explore", tags: ["mountain","wind"],      stayDays: 14 },
  { id: "p36", alias: "Mara",    city: "Lima",          lat: -12.05,lng: -77.04,intention: "create",  tags: ["weaving","ocean"],      stayDays: 23 },
  { id: "p37", alias: "Tieve",   city: "Bogotá",        lat: 4.71,  lng: -74.07,intention: "travel",  tags: ["mountain","coffee"],    stayDays: 16 },
  { id: "p38", alias: "Soto",    city: "Havana",        lat: 23.13, lng: -82.38,intention: "create",  tags: ["sound","tango"],        stayDays: 21 },
  { id: "p39", alias: "Quill",   city: "Montreal",      lat: 45.50, lng: -73.57,intention: "work",    tags: ["code","writing"],       stayDays: 28 },
  { id: "p40", alias: "Esha",    city: "Portland",      lat: 45.52, lng: -122.68,intention: "create", tags: ["design","forest"],      stayDays: 25 },
];

export const OCCUPATIONS: Record<Intention, string[]> = {
  create:  ["Writer", "Filmmaker", "Sound Designer", "Ceramicist", "Illustrator", "Poet"],
  work:    ["Software Engineer", "Product Designer", "Researcher", "Architect"],
  travel:  ["Photographer", "Travel Journalist", "Mountain Guide"],
  rest:    ["Yoga Teacher", "Herbalist", "Tea Curator", "Translator"],
  explore: ["Geologist", "Marine Biologist", "Cartographer"],
};

export const PEOPLE: Person[] = RAW_PEOPLE.map((p, i) => {
  const occs = OCCUPATIONS[p.intention];
  return {
    ...p,
    age: 24 + ((i * 7) % 22),
    occupation: occs[i % occs.length],
    openToExchange: i % 3 !== 0,
  };
});

// Equirectangular projection
export const project = (lat: number, lng: number, w: number, h: number) => ({
  x: ((lng + 180) / 360) * w,
  y: ((90 - lat) / 180) * h,
});

export const shareScore = (a: Person, b: Person) => {
  const shared = a.tags.filter((t) => b.tags.includes(t)).length;
  const intent = a.intention === b.intention ? 1 : 0;
  const overlap = Math.min(a.stayDays, b.stayDays) / Math.max(a.stayDays, b.stayDays);
  return shared * 0.4 + intent * 0.25 + overlap * 0.35;
};

// ── Tribes: persistent, interest-based (not geography) ─────────────────────
export type Tribe = { id: string; name: string; tagline: string; color: string; intentions: Intention[]; tags: string[] };

export const TRIBES: Tribe[] = [
  { id: "adventure-writers",  name: "Adventure Writers",  color: "#e6cf96", tagline: "Chronicling the road, one page at a time",  intentions: ["create", "explore"],        tags: ["writing", "ruins", "desert", "fog", "bazaar"] },
  { id: "travel-vloggers",    name: "Travel Vloggers",    color: "#f5a9d0", tagline: "Capturing motion, sharing the frame",       intentions: ["create", "travel"],         tags: ["film", "sound", "tango", "techno"] },
  { id: "code-nomads",        name: "Code Nomads",        color: "#a48bff", tagline: "Shipping from wherever the wifi holds",     intentions: ["work"],                     tags: ["code", "design"] },
  { id: "slow-living-circle", name: "Slow Living Circle", color: "#ffb6a3", tagline: "Tea, yoga, and unhurried days",              intentions: ["rest"],                     tags: ["tea", "yoga", "weaving", "textile"] },
  { id: "trail-seekers",      name: "Trail Seekers",      color: "#b4e0aa", tagline: "Mountains, ice, and open horizons",          intentions: ["explore", "travel"],        tags: ["mountain", "geology", "ice", "wind", "coffee"] },
];

// Scores an intention + interests against a tribe's profile, the same
// intention+tag idea as shareScore above but person-to-tribe.
export const tribeScore = (p: { intention: Intention | null; tags: string[] }, t: Tribe) => {
  const intentMatch = p.intention && t.intentions.includes(p.intention) ? 0.55 : 0;
  const tagHits = p.tags.filter((tag) => t.tags.includes(tag)).length;
  const tagScore = (tagHits / Math.max(1, p.tags.length)) * 0.45;
  return intentMatch + tagScore;
};

export const rankTribes = (intention: Intention | null, tags: string[]) =>
  TRIBES.map((tribe) => ({ tribe, score: tribeScore({ intention, tags }, tribe) }))
    .sort((a, b) => b.score - a.score);

export const tribeOf = new Map<string, Tribe>();
for (const p of PEOPLE) tribeOf.set(p.id, rankTribes(p.intention, p.tags)[0].tribe);

export const tribeMembers = new Map<string, Person[]>();
for (const t of TRIBES) tribeMembers.set(t.id, PEOPLE.filter((p) => tribeOf.get(p.id)?.id === t.id));

export const tribeInfo = new Map<string, { cities: string[]; tags: string[] }>();
for (const t of TRIBES) {
  const members = tribeMembers.get(t.id) ?? [];
  const counts = new Map<string, number>();
  for (const m of members) for (const tag of m.tags) if (t.tags.includes(tag)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  tribeInfo.set(t.id, {
    cities: members.map((m) => m.city),
    tags: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag),
  });
}

export type TribeLink = { a: Person; b: Person; s: number };

// Each member links to their two closest tribe-mates, so a spotlighted tribe reads as a web.
export const tribeLinks = new Map<string, TribeLink[]>();
for (const t of TRIBES) {
  const members = tribeMembers.get(t.id) ?? [];
  const seen = new Set<string>();
  const links: TribeLink[] = [];
  for (const m of members) {
    const closest = members
      .filter((o) => o.id !== m.id)
      .map((o) => ({ o, s: shareScore(m, o) }))
      .sort((x, y) => y.s - x.s)
      .slice(0, 2);
    for (const { o, s } of closest) {
      const key = [m.id, o.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ a: m, b: o, s });
    }
  }
  tribeLinks.set(t.id, links);
}

// Cross-tribe connections, revealed as you explore
export const CONNECTIONS: TribeLink[] = [];
for (let i = 0; i < PEOPLE.length; i++) {
  for (let j = i + 1; j < PEOPLE.length; j++) {
    const s = shareScore(PEOPLE[i], PEOPLE[j]);
    if (s > 0.45) CONNECTIONS.push({ a: PEOPLE[i], b: PEOPLE[j], s });
  }
}

// ── Chapters: a tribe's members who live near each other ───────────────────
export type Chapter = { id: string; tribe: Tribe; city: string; members: Person[]; lat: number; lng: number };

export const CHAPTERS: Chapter[] = [];
for (const t of TRIBES) {
  const pool = tribeMembers.get(t.id) ?? [];
  const seen = new Set<string>();
  for (const p of pool) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const group = [p];
    for (const q of pool) {
      if (seen.has(q.id)) continue;
      if (Math.hypot(p.lat - q.lat, p.lng - q.lng) < 15) { group.push(q); seen.add(q.id); }
    }
    if (group.length < 2) continue;
    const lat = group.reduce((s, m) => s + m.lat, 0) / group.length;
    const lng = group.reduce((s, m) => s + m.lng, 0) / group.length;
    const anchor = group.reduce((best, m) =>
      Math.hypot(m.lat - lat, m.lng - lng) < Math.hypot(best.lat - lat, best.lng - lng) ? m : best);
    CHAPTERS.push({ id: `${t.id}:${anchor.id}`, tribe: t, city: anchor.city, members: group, lat, lng });
  }
}
export const chapterRadius = (c: Chapter) => 50 + c.members.length * 12;

export const PURPOSE_TO_INTENTION: Record<string, Intention> = {
  remote_work: "work",
  retreat: "rest",
  socialising: "travel",
  field_research: "explore",
};

export const INTENTIONS: Intention[] = ["create", "travel", "work", "rest", "explore"];

export const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

/** Who in the tribe lives within `km` of a point, and which tribe dominates there. */
export function tribePresenceNear(lat: number, lng: number, km = 2500) {
  const near = PEOPLE.filter((p) => haversineKm(lat, lng, p.lat, p.lng) <= km);
  const counts = new Map<string, number>();
  for (const p of near) {
    const id = tribeOf.get(p.id)!.id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    total: near.length,
    topTribe: top ? TRIBES.find((t) => t.id === top[0])! : null,
  };
}

export function nearestChapter(lat: number, lng: number): Chapter | null {
  return CHAPTERS.reduce<Chapter | null>(
    (best, c) =>
      !best || haversineKm(lat, lng, c.lat, c.lng) < haversineKm(lat, lng, best.lat, best.lng) ? c : best,
    null,
  );
}
