import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft, ArrowRight,
  User, Users, Home, UsersRound,
  CalendarDays, CalendarRange, Leaf, Infinity as InfinityIcon,
  Laptop, Flower2, PartyPopper, Microscope,
  Zap, Lock, Sofa, Wifi,
  Minimize2, Square, Maximize2, Loader2,
} from "lucide-react";
import { useMockAuth } from "@/context/MockAuth";
import BlurText from "@/components/BlurText";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Longest the questionnaire will wait on the backend before proceeding with
    defaults. Generous enough for a normal LLM reply, short enough that a dead
    backend doesn't strand the user on the last question. */
const SUBMIT_TIMEOUT_MS = 12000;

const WAIT_PHASES = [
  "Matching your brief to the terrain",
  "Sizing your dwelling",
  "Placing power, water and shelter",
  "Almost there",
];

const _DEFAULT_SITE = {
  name: "Skye Moor", location: "Highlands, UK",
  temperature: "Temperate", precipitation: "Rainy",
  climate_zone: "temperate",
};

type Option = { id: string; label: string; subtitle: string; Icon: typeof User; locked?: boolean };
type Step   = { question: string; options: Option[] };

// Only 2 dwellings are actually built right now (compact-solo and
// couple-standard), plus a 3rd (solo-generous/"spacious") that has a route
// but no dwelling yet — see CONFIGURATOR_ROUTES below. Family and large
// group have no dwelling variant at all, so they're locked out here rather
// than silently falling back to the wrong build.
const steps: Step[] = [
  {
    question: "How many people will be staying?",
    options: [
      { id: "solo",        label: "Solo",        subtitle: "Just me, full independence",  Icon: User },
      { id: "couple",      label: "Couple",      subtitle: "Two people, shared space",    Icon: Users },
      { id: "family",      label: "Family",      subtitle: "3–4 people, shared setup",    Icon: Home, locked: true },
      { id: "large_group", label: "Large group", subtitle: "5+ people, full capacity",    Icon: UsersRound, locked: true },
    ],
  },
  {
    question: "How long are you planning to stay?",
    options: [
      { id: "1_4_weeks",  label: "1–4 weeks",  subtitle: "Medium-term immersion",       Icon: CalendarDays },
      { id: "1_3_months", label: "1–3 months", subtitle: "Extended stay, full comfort", Icon: CalendarRange },
      { id: "season",     label: "A season",   subtitle: "3–6 months, deep immersion",  Icon: Leaf },
      { id: "open_ended", label: "Open-ended", subtitle: "Nomadic lifestyle, flexible", Icon: InfinityIcon },
    ],
  },
  {
    question: "What's the primary purpose of this stay?",
    options: [
      { id: "remote_work",    label: "Remote work",    subtitle: "Focus & deep work",  Icon: Laptop },
      { id: "retreat",        label: "Retreat",        subtitle: "Rest & reset",       Icon: Flower2 },
      { id: "socialising",    label: "Socialising",    subtitle: "Gather with others", Icon: PartyPopper },
      { id: "field_research", label: "Field research", subtitle: "Study & observe",    Icon: Microscope },
    ],
  },
  {
    question: "What matters most to you?",
    options: [
      { id: "energy",       label: "Energy",       subtitle: "Off-grid autonomy", Icon: Zap },
      { id: "privacy",      label: "Privacy",      subtitle: "Quiet & secluded",  Icon: Lock },
      { id: "comfort",      label: "Comfort",      subtitle: "Refined living",    Icon: Sofa },
      { id: "connectivity", label: "Connectivity", subtitle: "Always online",     Icon: Wifi },
    ],
  },
  {
    question: "How much space do you need?",
    options: [
      { id: "compact",  label: "Compact",  subtitle: "Efficient footprint", Icon: Minimize2 },
      { id: "standard", label: "Standard", subtitle: "Balanced layout",     Icon: Square },
      { id: "generous", label: "Generous", subtitle: "Room to breathe",     Icon: Maximize2 },
    ],
  },
];

// Which scale options are available depends on who's staying — each
// occupant only has certain dwellings actually built. Computed per-render
// (not baked into `steps`) since it depends on the occupants answer.
function isScaleLocked(scaleId: string, occupants: string | undefined): boolean {
  if (occupants === "solo")   return scaleId === "standard";
  if (occupants === "couple") return scaleId === "compact" || scaleId === "generous";
  return false;
}

// occupants + scale together pick the dwelling. All three of compact-solo,
// solo-generous ("Generous Single") and couple-standard are built. Anything
// not listed here (shouldn't be reachable, since isScaleLocked/the occupants
// lock rule out every other combination) falls back to the couple-standard
// build.
const CONFIGURATOR_ROUTES: Record<string, string> = {
  "solo:compact":     "/configurator-solo",
  "solo:generous":    "/configurator-solo-generous",
  "couple:standard":  "/configurator",
};

export default function OnboardingFlow() {
  const { onboardingOpen, closeOnboarding, pendingSite, user, openLogin } = useMockAuth();
  const navigate = useNavigate();
  const [stepIdx, setStepIdx]   = useState(0);
  const [answers, setAnswers]   = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const total    = steps.length;
  const step     = steps[stepIdx];
  const selected = answers[stepIdx];
  const isLast   = stepIdx === total - 1;

  useEffect(() => {
    if (!isSubmitting) { setElapsed(0); return; }
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [isSubmitting]);

  // pendingSite already carries all required fields from Discover.tsx.
  // Use it directly — no SITES lookup needed, no silent lookup failures.
  // If the user signed in from the Nav (no site clicked), fall back to
  // the site stored from the last completed onboarding session.
  // 1. pendingSite context (set when user clicked a site this session)
  // 2. sessionStorage fallback (survives React re-renders and page navigations within the tab)
  // 3. last localStorage session (repeat visitor signed in from Nav without clicking a site)
  // 4. hardcoded default
  // Did the user actually pick a site, or are they on the "quick start" path
  // (questionnaire straight from the Landing page)? A real pick comes from the
  // context or this tab's sessionStorage; the localStorage/default fallbacks
  // below are guesses, not choices, so they don't count as "chosen".
  const siteWasChosen = (() => {
    if (pendingSite?.name) return true;
    try {
      const raw = sessionStorage.getItem("pendingSite");
      return !!(raw && (JSON.parse(raw) as { name?: string })?.name);
    } catch { return false; }
  })();

  const sitePayload = (() => {
    const src = pendingSite ?? (() => {
      try {
        const raw = sessionStorage.getItem("pendingSite");
        return raw ? JSON.parse(raw) as Record<string, unknown> : null;
      } catch { return null; }
    })();
    if (src?.name) {
      return {
        name:          String(src.name),
        location:      String(src.location ?? ""),
        temperature:   String(src.temperature ?? ""),
        precipitation: String(src.precipitation ?? ""),
        climate_zone:  String(src.climate_zone ?? ""),
      };
    }
    try {
      const stored = localStorage.getItem("configuratorInit");
      if (stored) {
        const parsed = JSON.parse(stored) as { site?: Record<string, string> };
        if (parsed?.site?.name) return parsed.site as typeof _DEFAULT_SITE;
      }
    } catch { /* ignore */ }
    return _DEFAULT_SITE;
  })();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeOnboarding();
      setStepIdx(0);
      setAnswers({});
    }
  };

  const goBack = () => {
    if (stepIdx === 0) handleOpenChange(false);
    else setStepIdx(i => i - 1);
  };

  // Both halves of the brief are required before a dwelling can be configured:
  // the answers AND a site. Entry is always Voyages first (site chosen), then
  // the questionnaire, then the configurator.
  // Plan/subscription selection happens later, inside the reservation
  // customizer (after parts customization, before checkout).
  //
  // Occupants (question 0) + scale (question 4) together pick which
  // dwelling variant to land on — see CONFIGURATOR_ROUTES above.
  const goToConfigurator = () => {
    const occupants = answers[0];
    const scale = answers[4];
    navigate(CONFIGURATOR_ROUTES[`${occupants}:${scale}`] ?? "/configurator");
  };
  const goPickSite = () => {
    // Discover reads this and skips re-opening the questionnaire, sending the
    // user straight into the configurator once they choose.
    sessionStorage.setItem("awaitingSite", "true");
    navigate("/discover");
  };
  const revealResults = () => {
    handleOpenChange(false);
    // Sign-in is asked for once, at the end, and only when the brief is
    // complete — so a user is never interrupted mid-way to make an account.
    // If the site is still missing, go collect it first; Discover handles the
    // sign-in prompt at that point instead.
    if (!siteWasChosen) { goPickSite(); return; }
    if (user) goToConfigurator();
    else openLogin(goToConfigurator);
  };

  // Selecting an option advances immediately on the first 4 questions — no
  // separate "Continue" click, and "Back" is what changing your mind is for.
  // The last question is different: picking an option there just selects it
  // (same as before), and a separate "See your design" button submits —
  // since submitting is a bigger, less reversible action than moving between
  // questions, it gets its own explicit confirmation.
  const selectOption = (optionId: string) => {
    if (isSubmitting) return;
    const locked = step.options.find(o => o.id === optionId)?.locked
      || (stepIdx === 4 && isScaleLocked(optionId, answers[0]));
    if (locked) return;
    setAnswers(a => {
      const next = { ...a, [stepIdx]: optionId };
      // Changing occupants can invalidate a scale already picked on a
      // previous pass through the last question (e.g. solo → compact →
      // back → couple: compact is locked for couple) — clear it instead of
      // leaving a locked value selected underneath the last question.
      if (stepIdx === 0 && next[4] && isScaleLocked(next[4], optionId)) {
        delete next[4];
      }
      return next;
    });
    if (!isLast) setStepIdx(i => i + 1);
  };

  const submitProposal = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    // The design service can be slow or down — aborted at SUBMIT_TIMEOUT_MS
    // so the questionnaire can't spin forever, falling back to defaults.
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), SUBMIT_TIMEOUT_MS);
    const keys = ["occupants", "duration", "purpose", "priority", "scale"];
    const namedAnswers = Object.fromEntries(
      Object.entries(answers).map(([i, v]) => [keys[Number(i)], v]),
    );
    try {
      // /onboarding does an LLM round-trip, so it can be slow — and if the
      // Python backend is down or can't reach the model it never answers at
      // all. Without a deadline the questionnaire spins forever on the last
      // question. On timeout we fall through to the catch, which stores the
      // brief with null spec fields; the configurator already handles that by
      // falling back to defaults.
      const resp = await fetch(`${API}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: sitePayload, answers: namedAnswers }),
        signal: ctrl.signal,
      });
      const data = resp.ok ? await resp.json() : null;
      localStorage.setItem("configuratorInit", JSON.stringify({
        spec:          data?.spec          ?? null,
        dwelling_spec: data?.dwelling_spec ?? null,
        image_b64:     data?.image_b64     ?? null,
        reply:         data?.reply         ?? null,
        suggestions:   data?.suggestions   ?? null,
        site:          sitePayload,
        answers:       namedAnswers,
      }));
      localStorage.setItem("configuratorReady", "true");
      revealResults();
    } catch {
      localStorage.setItem("configuratorInit", JSON.stringify({
        spec: null, image_b64: null, reply: null, suggestions: null,
        site: sitePayload, answers: namedAnswers,
      }));
      localStorage.setItem("configuratorReady", "true");
      revealResults();
    } finally {
      window.clearTimeout(timer);
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={onboardingOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* Darker overlay — now has to read as "still on the page behind it", not full-bleed */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center px-6 py-16 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >
          {/* Single panel — frosted/translucent (liquid-glass-strong, same as the
              rest of the app) instead of a solid backdrop, so Discover shows
              through blurred rather than being fully hidden. */}
          <div className="relative liquid-glass-strong border border-white/10 w-full max-w-[920px] rounded-[2rem] p-8 md:p-12 text-white">
            {/* Final step — the brief is being turned into a dwelling. Covers the
                panel so the wait reads as progress instead of a frozen dialog. */}
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 z-20 rounded-[2rem] flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-xl"
                >
                  <div className="absolute w-64 h-64 rounded-full bg-white/5 blur-3xl animate-pulse" aria-hidden />
                  <Loader2 className="relative h-10 w-10 text-white/80 animate-spin" strokeWidth={1.5} />
                  <div className="relative text-center">
                    <p className="font-body text-white/85 text-sm tracking-wide">
                      {siteWasChosen
                        ? `Configuring your engine for ${sitePayload.name}…`
                        : "Reading your brief…"}
                    </p>
                    <p className="font-body text-white/40 text-[11px] uppercase tracking-[0.18em] mt-2">
                      {siteWasChosen
                        ? WAIT_PHASES[Math.min(WAIT_PHASES.length - 1, Math.floor(elapsed / 3))]
                        : "Next: choose your terrain"}
                    </p>
                    {/* No manual "give up early" option — the wait just runs
                        out to SUBMIT_TIMEOUT_MS on its own (falling back to
                        defaults there, same as before), so the loading state
                        reads as progress rather than offering a bail-out
                        every time the design service is a little slow. */}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


              {/* Progress */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={[
                        "h-[3px] w-10 rounded-full transition-colors",
                        i <= stepIdx ? "bg-white" : "bg-white/15",
                      ].join(" ")}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-body tracking-[0.18em] uppercase text-white/50">
                  {String(stepIdx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              </div>

              <p className="text-xs font-body text-white/60 mb-3 text-center tracking-wider">
                // {sitePayload.name}
              </p>

              <DialogPrimitive.Title asChild>
                <div className="text-center">
                  <BlurText
                    key={stepIdx}
                    text={step.question}
                    className="font-heading text-white text-4xl md:text-5xl leading-[0.95] tracking-[-2px]"
                  />
                </div>
              </DialogPrimitive.Title>

              <div
                className={[
                  "mt-12 grid gap-3",
                  step.options.length === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-2 md:grid-cols-4",
                ].join(" ")}
              >
                {step.options.map(opt => {
                  const isSelected = selected === opt.id;
                  // Static lock (family/large group) or, on the last
                  // question, a lock that depends on the occupants answer —
                  // see isScaleLocked/CONFIGURATOR_ROUTES above.
                  const isLocked = !!opt.locked || (stepIdx === 4 && isScaleLocked(opt.id, answers[0]));
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitting || isLocked}
                      onClick={() => selectOption(opt.id)}
                      className={[
                        "group relative flex flex-col items-start text-left gap-3 rounded-2xl px-5 py-6 border transition-all disabled:cursor-not-allowed disabled:opacity-40",
                        isLocked
                          ? "grayscale bg-white/[0.03] text-white border-white/10"
                          : isSelected
                          ? "bg-white text-black border-white shadow-[0_8px_30px_-10px_rgba(255,255,255,0.4)]"
                          : "bg-white/[0.03] text-white border-white/10 hover:bg-white/[0.06] hover:border-white/20",
                      ].join(" ")}
                    >
                      {isLocked && (
                        <span className="absolute top-4 right-4 text-white/60">
                          <Lock className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                      )}
                      <opt.Icon
                        className={["h-6 w-6", isSelected && !isLocked ? "text-black" : "text-white/80"].join(" ")}
                        strokeWidth={1.25}
                      />
                      <div className="space-y-1">
                        <div className="font-heading text-xl leading-none tracking-[-1px]">{opt.label}</div>
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-body font-medium uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/15">
                            Coming soon
                          </span>
                        ) : (
                          <div className={["font-body text-xs leading-snug", isSelected ? "text-black/60" : "text-white/55"].join(" ")}>
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer — Back always; on the last question, an explicit
                  submit button too (picking an option there only selects
                  it, doesn't submit) */}
              <div className="flex items-center justify-between mt-12">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 text-sm font-body text-white/60 hover:text-white px-3 py-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  Back
                </button>
                {isLast && (
                  <button
                    type="button"
                    onClick={submitProposal}
                    disabled={!selected || isSubmitting}
                    className="inline-flex items-center gap-2 text-sm font-body font-medium bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Preparing…" : "See your design"}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>

            </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
