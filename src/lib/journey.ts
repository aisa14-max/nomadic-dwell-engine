import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TOTAL_PARTS, pruneConfigured } from "@/data/dwellingParts";
import { JOURNEY_EVENT, loadMyTribeId } from "@/lib/tribeStore";

export type JourneyStep = {
  id: "voyage" | "brief" | "reserve" | "tribe";
  label: string;
  to: string;
  done: boolean;
  detail?: string;
};

export type Journey = {
  steps: JourneyStep[];
  next: JourneyStep | null;
  doneCount: number;
};

/** True once an order has been confirmed — i.e. Voyages, the brief and Worlds are all done. */
export function hasFinishedOrder(): boolean {
  try { return localStorage.getItem("engineDelivered") === "true"; } catch { return false; }
}

/** Where the visitor is in Voyage → Brief → Reserve → Tribe, derived
    from the same storage the rest of the demo writes to. */
export function readJourney(): Journey {
  const read = (k: string) => {
    try { return localStorage.getItem(k); } catch { return null; }
  };

  let siteName: string | null = null;
  try {
    const raw = read("configuratorInit");
    if (raw) siteName = (JSON.parse(raw)?.site?.name as string) ?? null;
  } catch { /* ignore */ }

  let configured = 0;
  try {
    const raw = read("reservationProgress");
    if (raw) {
      const parsed = JSON.parse(raw);
      configured = Array.isArray(parsed.configured) ? pruneConfigured(parsed.configured).length : 0;
    }
  } catch { /* ignore */ }

  const ready = read("configuratorReady") === "true";
  const delivered = read("engineDelivered") === "true";
  // Designing and reserving both happen in the configurator, which needs a finished brief.
  const workshop = ready ? "/configurator" : "/discover";

  const steps: JourneyStep[] = [
    { id: "voyage",  label: "Choose a voyage",        to: "/discover", done: !!siteName, detail: siteName ?? undefined },
    { id: "brief",   label: "Answer your brief",      to: "/discover", done: ready },
    {
      id: "reserve", label: "Reserve your engine", to: workshop, done: delivered,
      detail: !delivered && configured ? `${configured} of ${TOTAL_PARTS} parts` : undefined,
    },
    { id: "tribe",   label: "Join a tribe",           to: "/tribe", done: !!loadMyTribeId() },
  ];

  return {
    steps,
    next: steps.find((s) => !s.done) ?? null,
    doneCount: steps.filter((s) => s.done).length,
  };
}

/** Live journey state: refreshes on navigation, storage changes and tribe/reset events. */
export function useJourney(): Journey {
  const { pathname } = useLocation();
  const [journey, setJourney] = useState(readJourney);
  useEffect(() => {
    const refresh = () => setJourney(readJourney());
    refresh();
    window.addEventListener(JOURNEY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [pathname]);
  return journey;
}
