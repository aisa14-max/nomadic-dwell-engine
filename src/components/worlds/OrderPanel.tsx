import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { PARTS, TOTAL_PARTS, PartId, findOption, gbp, DEPOSIT_RATE, isSkipped } from "@/data/dwellingParts";
import { PLANS, findPlan, MAX_DISCOUNT, applyPlanDiscount } from "@/data/plans";

type Totals = { subtotal: number; tax: number; total: number; dueToday: number };

type Props = {
  configured: Map<PartId, string>;
  totals: Totals;
  /** Show the subscription tiers above the itemised order. */
  showPlans?: boolean;
  /** Collapse to a narrow read-only column (payment stage). */
  compact?: boolean;
  /** Payment stage drives its own actions, so this panel's buttons step aside. */
  hideActions?: boolean;
  selectedPlan: string | null;
  onSelectPlan: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

/**
 * Inline price/order summary that takes the chat column from the customise
 * stage onward. SummaryPanel does a similar job but is a `fixed` overlay for
 * the full-screen customizer, so it can't sit in a grid cell.
 *
 * The subscription is a recurring cost and is never added into the one-off
 * total — a plan's only effect here is the discount it applies to add-ons.
 */
export default function OrderPanel({
  configured,
  totals,
  showPlans,
  compact,
  hideActions,
  selectedPlan,
  onSelectPlan,
  onBack,
  onContinue,
}: Props) {
  const count = configured.size;
  const plan = findPlan(selectedPlan);
  const priced = applyPlanDiscount(totals, selectedPlan, DEPOSIT_RATE);
  const { discount } = priced;
  const discountedTotal = priced.total;

  return (
    <div className="liquid-glass rounded-[1.25rem] p-5 flex flex-col h-[calc(58vh+10rem)]">
      <div className="shrink-0 pb-3 border-b border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-body">
          Your reservation
        </p>
        <h3 className="font-heading text-2xl text-white mt-0.5 tracking-[-0.5px]">
          {showPlans ? "Choose your plan" : "Price & Order"}
        </h3>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
        {/* Subscription tiers sit above the order so the discount is visible
            against the basket the user has already built. */}
        <AnimatePresence initial={false}>
          {showPlans && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 pb-4 mb-3 border-b border-white/10">
                {PLANS.map((p) => {
                  const active = selectedPlan === p.id;
                  const saving = Math.round(totals.subtotal * p.discount);
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPlan(p.id)}
                      aria-pressed={active}
                      className={[
                        "w-full text-left rounded-[0.75rem] px-3 py-2.5 transition-all border",
                        active
                          ? "bg-white/15 border-white/50"
                          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/25",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-body font-medium text-white truncate">
                            {p.name}
                          </span>
                          {p.highlight && !active && (
                            <span className="text-[8px] font-body uppercase tracking-[0.1em] text-white/50 border border-white/20 rounded-full px-1.5 py-0.5 shrink-0">
                              Popular
                            </span>
                          )}
                          {active && <Check className="h-3 w-3 text-white shrink-0" strokeWidth={2.5} />}
                        </span>
                        <span className="text-[11px] font-body text-white/80 shrink-0">{p.price}</span>
                      </div>
                      <p className="text-[10px] font-body text-white/45 mt-0.5 leading-snug">
                        {p.tagline}
                      </p>
                      <ul className="mt-1.5 space-y-0.5">
                        {p.features.map((f) => (
                          <li key={f} className="text-[9px] font-body text-white/55 flex items-start gap-1">
                            <span className="text-white/30 mt-[1px]">·</span>
                            <span className="min-w-0">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-[10px] font-body text-emerald-300/90">
                        {Math.round(p.discount * 100)}% off add-ons
                        {saving > 0 && ` — saves ${gbp(saving)}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Itemised add-ons */}
        {count === 0 ? (
          <p className="text-[11px] font-body text-white/40 leading-relaxed">
            No add-ons selected — your engine ships in its standard configuration.
            You can add them later from your profile.
          </p>
        ) : (
          <ul className="space-y-2">
            {PARTS.map((p) => {
              const optId = configured.get(p.id);
              const opt = optId ? findOption(p.id, optId) : null;
              const skipped = isSkipped(optId);
              if (compact && !opt) return null;
              return (
                <li key={p.id} className="flex items-center gap-2.5">
                  <span
                    className={[
                      "w-2.5 h-2.5 rounded-full shrink-0 border",
                      opt ? "border-white/50" : "border-white/15",
                    ].join(" ")}
                    style={{ background: opt ? opt.hex : "transparent" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9px] font-body uppercase tracking-[0.12em] text-white/40">
                      {p.label}
                    </span>
                    <span
                      className={[
                        "block text-[11px] font-body truncate",
                        opt ? "text-white/85" : skipped ? "text-white/35 italic" : "text-white/35",
                      ].join(" ")}
                    >
                      {opt ? opt.name : skipped ? "Skipped" : "Not selected"}
                    </span>
                  </span>
                  <span
                    className={[
                      "text-[11px] font-body shrink-0",
                      opt ? "text-white/75" : "text-white/25",
                    ].join(" ")}
                  >
                    {opt ? gbp(opt.price) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 mt-3 pt-3 border-t border-white/10 space-y-1">
        <Row label="Add-ons" value={gbp(totals.subtotal)} />
        {plan && discount > 0 && (
          <Row label={`${plan.name} plan discount`} value={`−${gbp(discount)}`} accent />
        )}
        <Row label="Tax" value={gbp(totals.tax)} />
        <Row label="Total" value={gbp(discountedTotal)} strong />
        {plan && (
          <Row label={`Subscription (${plan.name})`} value={`${plan.price}`} muted />
        )}
        {!showPlans && !plan && totals.subtotal > 0 && (
          <p className="pt-1 text-[10px] font-body text-emerald-300/80">
            Plans save up to {Math.round(MAX_DISCOUNT * 100)}% on add-ons
          </p>
        )}
      </div>

      <div className={`shrink-0 mt-3 items-center gap-2 ${hideActions ? "hidden" : "flex"}`}>
        <button
          onClick={onBack}
          className="liquid-glass rounded-full w-10 h-10 inline-flex items-center justify-center text-white/70 hover:text-white shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          onClick={onContinue}
          className="flex-1 bg-white text-black rounded-full px-4 py-3 text-[13px] font-body font-medium inline-flex items-center justify-center gap-2"
        >
          {showPlans
            ? "Continue to payment"
            : count === 0
              ? "See subscription options"
              : `See subscription options (${count}/${TOTAL_PARTS})`}
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, strong, muted, accent }: {
  label: string; value: string; strong?: boolean; muted?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={`font-body ${muted ? "text-[10px] text-white/40" : "text-[11px] text-white/55"}`}>
        {label}
      </span>
      <span
        className={[
          "font-body shrink-0",
          strong ? "text-white text-base font-medium"
            : accent ? "text-emerald-300/90 text-[11px]"
            : muted ? "text-white/60 text-[10px]"
            : "text-white/80 text-[11px]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
