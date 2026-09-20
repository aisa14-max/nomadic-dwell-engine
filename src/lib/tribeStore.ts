import { SITES } from "@/data/sites";
import { PURPOSE_TO_INTENTION, TRIBES, type Intention } from "@/data/tribe";

// Everything the Tribe page remembers, plus the brief it reuses. Kept in one
// place so Profile, the nav and the Tribe read the same data, and so a reset
// clears all of it.
export const TRIBE_KEYS = {
  myTribe: "nomadic_my_tribe",
  intros: "nomadic_tribe_intros",
  exchanges: "nomadic_exchange_requests",
  presence: "nomadic_presence",
} as const;

// "nomadic_profile" held the removed interests answers; still cleared so old browsers reset cleanly.
export const TRIBE_STORAGE_KEYS: string[] = [...Object.values(TRIBE_KEYS), "nomadic_profile"];

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function loadMyTribeId(): string | null {
  try {
    const saved = localStorage.getItem(TRIBE_KEYS.myTribe);
    return saved && TRIBES.some((t) => t.id === saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveMyTribeId(id: string) {
  try { localStorage.setItem(TRIBE_KEYS.myTribe, id); } catch { /* ignore */ }
  notifyJourney();
}

export type ExchangeRequest = { id: string; at: number };

export function loadExchangeRequests(): ExchangeRequest[] {
  try {
    const raw = localStorage.getItem(TRIBE_KEYS.exchanges);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Older builds stored bare person ids with no timestamp.
    return parsed.map((r) => (typeof r === "string" ? { id: r, at: 0 } : r as ExchangeRequest))
      .filter((r) => r && typeof r.id === "string");
  } catch {
    return [];
  }
}

export function saveExchangeRequests(list: ExchangeRequest[]) {
  saveJSON(TRIBE_KEYS.exchanges, list);
}

export function loadIntros(): Record<string, string> {
  return loadJSON<Record<string, string>>(TRIBE_KEYS.intros, {});
}

const PURPOSE_LABEL: Record<string, string> = {
  remote_work: "Remote work",
  retreat: "Retreat",
  socialising: "Socialising",
  field_research: "Field research",
};

const DURATION: Record<string, { label: string; days: number | null }> = {
  "1_4_weeks": { label: "1–4 weeks", days: 21 },
  "1_3_months": { label: "1–3 months", days: 60 },
  season: { label: "A season", days: 120 },
  open_ended: { label: "Open-ended", days: null },
};

export type Brief = {
  site: { name: string; region: string; lat: number; lng: number } | null;
  purposeLabel: string | null;
  intention: Intention | null;
  durationLabel: string | null;
  stayDays: number | null;
};

/** The onboarding answers, translated into what the Tribe cares about. */
export function readBrief(): Brief | null {
  try {
    const raw = localStorage.getItem("configuratorInit");
    if (!raw) return null;
    const init = JSON.parse(raw) as {
      site?: { name?: string };
      answers?: { purpose?: string; duration?: string };
    };
    const site = SITES.find((s) => s.title === init.site?.name);
    const purpose = init.answers?.purpose;
    const duration = init.answers?.duration ? DURATION[init.answers.duration] : undefined;
    return {
      site: site ? { name: site.title, region: site.region, lat: site.coords[1], lng: site.coords[0] } : null,
      purposeLabel: purpose ? PURPOSE_LABEL[purpose] ?? null : null,
      intention: purpose ? PURPOSE_TO_INTENTION[purpose] ?? null : null,
      durationLabel: duration?.label ?? null,
      stayDays: duration?.days ?? null,
    };
  } catch {
    return null;
  }
}

export function timeAgo(at: number): string {
  if (!at) return "earlier";
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export const JOURNEY_EVENT = "nomadic:journey";

/** Lets the nav's "next step" refresh when something changes without a route change. */
export function notifyJourney() {
  try { window.dispatchEvent(new Event(JOURNEY_EVENT)); } catch { /* ignore */ }
}
