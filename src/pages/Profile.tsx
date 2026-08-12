import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, MapPin, Package, CheckCircle2, Clock, Layers } from "lucide-react";
import { useMockAuth, type AvatarId } from "@/context/MockAuth";
import Dashboard from "@/pages/Dashboard";
import { PARTS, TOTAL_PARTS, computeTotals, findOption, gbp, type PartId } from "@/data/dwellingParts";
import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";

const AVATAR_IMAGES: Record<AvatarId, string> = {
  a1: avatar1, a2: avatar2, a3: avatar3, a4: avatar4, a5: avatar5, a6: avatar6,
};

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

const TABS = ["Overview", "My Designs", "Orders", "Engine"] as const;
type Tab = typeof TABS[number];

/** Everything the profile shows is derived from the same storage the rest of
    the demo writes to — no separate account backend. */
function readProfileState() {
  const read = (k: string) => {
    try { return localStorage.getItem(k); } catch { return null; }
  };
  let site: { name?: string; location?: string } | null = null;
  let answers: Record<string, string> = {};
  try {
    const raw = read("configuratorInit");
    if (raw) {
      const parsed = JSON.parse(raw) as { site?: typeof site; answers?: Record<string, string> };
      site = parsed?.site ?? null;
      answers = parsed?.answers ?? {};
    }
  } catch { /* ignore */ }

  let configured = new Map<PartId, string>();
  let reservationRef: string | null = null;
  let stage: string | null = null;
  try {
    const raw = read("reservationProgress");
    if (raw) {
      const parsed = JSON.parse(raw) as {
        configured?: [PartId, string][]; reservationRef?: string; stage?: string;
      };
      if (Array.isArray(parsed.configured)) configured = new Map(parsed.configured);
      reservationRef = parsed.reservationRef ?? null;
      stage = parsed.stage ?? null;
    }
  } catch { /* ignore */ }

  return {
    site,
    answers,
    configured,
    reservationRef,
    stage,
    delivered: read("engineDelivered") === "true",
    hasDesign: read("configuratorReady") === "true",
  };
}

const ANSWER_LABEL: Record<string, string> = {
  occupants: "Occupants", duration: "Duration", purpose: "Purpose",
  priority: "Priority", scale: "Scale",
};
const prettify = (v: string) =>
  v
    // "1_3_months" would otherwise read as "1 3 Months" (i.e. thirteen) —
    // keep numeric ranges joined by a dash.
    .replace(/^(\d+)_(\d+)_/, "$1–$2 ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Profile() {
  const navigate = useNavigate();
  const { user, selectedPlan } = useMockAuth();
  const [tab, setTab] = useState<Tab>("Overview");
  const s = useMemo(readProfileState, []);
  const totals = useMemo(() => computeTotals(s.configured), [s.configured]);

  // The Engine tab reuses the existing Dashboard page wholesale — it brings its
  // own full-bleed background, so it renders outside the profile's card layout.
  if (tab === "Engine") {
    return (
      <div className="relative">
        <TabBar tab={tab} setTab={setTab} floating />
        <Dashboard />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <video
        src="/engine-bg.mp4"
        autoPlay muted loop playsInline
        className="fixed inset-0 w-full h-full z-0 object-cover pointer-events-none opacity-70"
      />
      <div className="fixed inset-0 z-0 bg-black/70" aria-hidden />

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-16">
        <div className="mx-auto max-w-[1100px]">
          {/* Identity header */}
          <motion.div
            initial={blurInit} animate={blurIn}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center gap-5 flex-wrap"
          >
            <span className="liquid-glass w-20 h-20 rounded-full overflow-hidden shrink-0">
              {user && (
                <img src={AVATAR_IMAGES[user.avatar]} alt="" className="w-full h-full object-cover" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-body text-white/60">// Profile</p>
              <h1 className="font-heading text-4xl md:text-5xl tracking-[-2px] leading-tight">
                {user?.name ?? "Nomad"}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPlan && (
                  <span className="liquid-glass tag-glass">
                    Plan: {prettify(selectedPlan)}
                  </span>
                )}
                {s.site?.name && (
                  <span className="liquid-glass tag-glass">
                    <MapPin className="h-3 w-3" strokeWidth={1.75} /> {s.site.name}
                  </span>
                )}
                <span className="liquid-glass tag-glass">
                  {s.delivered ? "Engine delivered" : s.hasDesign ? "Design in progress" : "No design yet"}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="mt-8">
            <TabBar tab={tab} setTab={setTab} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-6"
            >
              {tab === "Overview" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card title="Your brief">
                    {Object.keys(s.answers).length ? (
                      <dl className="space-y-2">
                        {Object.entries(s.answers).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 text-sm">
                            <dt className="text-white/50 font-body">{ANSWER_LABEL[k] ?? prettify(k)}</dt>
                            <dd className="text-white/90 font-body text-right">{prettify(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <Empty text="No questionnaire answers yet." cta="Start the questionnaire" onClick={() => navigate("/discover")} />
                    )}
                  </Card>

                  <Card title="Site">
                    {s.site?.name ? (
                      <>
                        <p className="font-heading text-3xl tracking-[-1px]">{s.site.name}</p>
                        {s.site.location && (
                          <p className="text-sm text-white/55 font-body mt-1">{s.site.location}</p>
                        )}
                        <button
                          onClick={() => navigate("/discover")}
                          className="mt-4 text-xs font-body text-white/70 hover:text-white inline-flex items-center gap-1"
                        >
                          Change site <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </>
                    ) : (
                      <Empty text="No site chosen yet." cta="Browse Voyages" onClick={() => navigate("/discover")} />
                    )}
                  </Card>
                </div>
              )}

              {tab === "My Designs" && (
                <div className="grid gap-4">
                  {s.hasDesign ? (
                    <Card title={s.site?.name ? `Engine · ${s.site.name}` : "Your engine"}>
                      <div className="flex items-center gap-3 text-sm font-body text-white/70">
                        <Layers className="h-4 w-4 text-white/50" strokeWidth={1.75} />
                        {s.configured.size} of {TOTAL_PARTS} parts customised
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-white/70 rounded-full transition-all"
                          style={{ width: `${Math.round((s.configured.size / TOTAL_PARTS) * 100)}%` }}
                        />
                      </div>
                      <button
                        onClick={() => navigate("/configurator")}
                        className="mt-5 bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center gap-2"
                      >
                        {s.configured.size ? "Continue configuring" : "Open configurator"}
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </Card>
                  ) : (
                    <Card title="No designs yet">
                      <Empty text="Answer a few questions and pick a site to generate your first engine." cta="Start" onClick={() => navigate("/discover")} />
                    </Card>
                  )}
                </div>
              )}

              {tab === "Orders" && (
                <div className="grid gap-4">
                  {s.delivered || s.configured.size > 0 ? (
                    <Card title={s.delivered ? "Order confirmed" : "Order in progress"}>
                      <div className="flex items-center gap-2 text-sm font-body">
                        {s.delivered
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                          : <Clock className="h-4 w-4 text-white/50" strokeWidth={1.75} />}
                        <span className="text-white/80">
                          {s.delivered ? "Your engine is on its way." : `Stage: ${prettify(s.stage ?? "configure")}`}
                        </span>
                      </div>
                      {s.reservationRef && (
                        <p className="mt-3 text-xs font-mono-data text-white/50">
                          Ref {s.reservationRef}
                        </p>
                      )}
                      {s.configured.size > 0 && (
                        <ul className="mt-4 space-y-1.5">
                          {[...s.configured].map(([pid, oid]) => {
                            const part = PARTS.find((p) => p.id === pid);
                            const opt = findOption(pid, oid);
                            if (!part || !opt) return null;
                            return (
                              <li key={pid} className="flex justify-between gap-4 text-sm font-body">
                                <span className="text-white/55">{part.label}</span>
                                <span className="text-white/85">{opt.name} · {gbp(opt.price)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm font-body">
                        <span className="text-white/55">Total</span>
                        <span className="text-white font-medium">{gbp(totals.total)}</span>
                      </div>
                    </Card>
                  ) : (
                    <Card title="No orders yet">
                      <Empty text="Once you reserve an engine it'll appear here." cta="Open configurator" onClick={() => navigate("/configurator")} />
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab, floating }: { tab: Tab; setTab: (t: Tab) => void; floating?: boolean }) {
  return (
    <div
      className={
        floating
          ? "fixed top-24 left-1/2 -translate-x-1/2 z-30 flex gap-1 liquid-glass rounded-full p-1"
          : "inline-flex gap-1 bg-white/5 rounded-full p-1"
      }
    >
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={[
            "px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] transition-all whitespace-nowrap",
            tab === t ? "bg-white text-black font-medium" : "text-white/50 hover:text-white/80",
          ].join(" ")}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="liquid-glass border border-white/10 rounded-[1.25rem] p-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50 font-body">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm font-body text-white/55">{text}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-body text-white transition-colors"
      >
        <Package className="h-3.5 w-3.5" strokeWidth={1.75} /> {cta}
      </button>
    </div>
  );
}
