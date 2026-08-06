import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { PARTS, TOTAL_PARTS, PartId, computeTotals } from "@/data/dwellingParts";

export type Stage = "configure" | "summary" | "payment" | "confirmed";

type State = {
  stage: Stage;
  activePart: PartId | null;
  configured: Map<PartId, string>;
  flashed: Set<PartId>;
  reservationRef: string;
};

// Mocked "save midway" — persisted so closing the customizer or refreshing
// the page doesn't lose progress. Map/Set aren't JSON-serializable directly,
// so they're stored as plain arrays and reconstructed on load.
//
// Deliberately separate from DELIVERED_KEY below: this key holds the
// CURRENT/ACTIVE configuration only. Once an order is confirmed it's no
// longer "in progress" — reopening the customizer after that should start a
// fresh configuration, not resume the old completed one (see loadStoredState).
const STORAGE_KEY = "reservationProgress";

// Set once, permanently, the moment an order is actually confirmed — this is
// what Dashboard reads to know "something was delivered," independent of
// whatever reservationProgress holds afterward (which resets to fresh).
const DELIVERED_KEY = "engineDelivered";

function loadStoredState(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      stage: Stage; reservationRef: string;
      configured: [PartId, string][]; flashed: PartId[];
    };
    // A confirmed order is a finished transaction, not work to resume —
    // reopening the customizer should start fresh, not replay the old
    // "Congratulations" screen every time.
    if (parsed.stage === "confirmed") return null;
    return {
      stage: parsed.stage,
      activePart: null,
      configured: new Map(parsed.configured),
      flashed: new Set(parsed.flashed),
      reservationRef: parsed.reservationRef,
    };
  } catch {
    return null;
  }
}

function saveState(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stage: state.stage,
      reservationRef: state.reservationRef,
      configured: Array.from(state.configured.entries()),
      flashed: Array.from(state.flashed),
    }));
  } catch { /* ignore */ }
}

type Action =
  | { type: "setActive"; part: PartId | null }
  | { type: "selectOption"; part: PartId; optionId: string }
  | { type: "setStage"; stage: Stage }
  | { type: "reset" };

const makeRef = () => {
  const r = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(6, "X");
  return `HBTR-${r}`;
};

const initial: State = {
  stage: "configure",
  activePart: null,
  configured: new Map(),
  flashed: new Set(),
  reservationRef: makeRef(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setActive":
      return { ...state, activePart: action.part };
    case "selectOption": {
      const configured = new Map(state.configured);
      configured.set(action.part, action.optionId);
      const flashed = new Set(state.flashed);
      flashed.add(action.part);
      return { ...state, configured, flashed };
    }
    case "setStage":
      if (state.stage === action.stage) return state;
      return { ...state, stage: action.stage, activePart: null };
    case "reset":
      return { ...initial, reservationRef: makeRef(), configured: new Map(), flashed: new Set() };
  }
}

export function useReservation() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadStoredState() ?? initial);
  const submittingRef = useRef(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const totals = useMemo(() => computeTotals(state.configured), [state.configured]);
  const isComplete = state.configured.size === TOTAL_PARTS;
  const progress = state.configured.size / TOTAL_PARTS;

  const colors = useMemo(() => {
    const out: Partial<Record<PartId, string>> = {};
    for (const [pid, oid] of state.configured) {
      const opt = PARTS.find((p) => p.id === pid)?.options.find((o) => o.id === oid);
      if (opt) out[pid] = opt.hex;
    }
    return out;
  }, [state.configured]);

  const setActive = useCallback((part: PartId | null) => dispatch({ type: "setActive", part }), []);
  const selectOption = useCallback(
    (part: PartId, optionId: string) => dispatch({ type: "selectOption", part, optionId }),
    [],
  );
  const setStage = useCallback((stage: Stage) => {
    if (submittingRef.current && stage !== "confirmed") return;
    dispatch({ type: "setStage", stage });
  }, []);

  const submitPayment = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    dispatch({ type: "setStage", stage: "confirmed" });
    try {
      localStorage.setItem(DELIVERED_KEY, "true");
    } catch { /* ignore */ }
    setTimeout(() => {
      submittingRef.current = false;
    }, 800);
  }, []);

  return {
    ...state,
    totals,
    isComplete,
    progress,
    colors,
    setActive,
    selectOption,
    setStage,
    submitPayment,
  };
}
