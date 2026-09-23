import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { gbp, DWELLING_VALUE } from "@/data/dwellingParts";
import { findPlan } from "@/data/plans";

type Totals = { subtotal: number; tax: number; total: number; dueToday: number; discount?: number };

type Props = {
  totals: Totals;
  onSubmit: () => void;
  /** Render inside a layout column instead of as a fixed full-height overlay.
      The staged configurator puts this in a grid cell; the full-screen
      customizer (portfolio page) still uses the fixed positioning. */
  inline?: boolean;
  /** The recurring subscription never showed up on this screen at all before
      — only its discount did — so the actual ongoing cost was invisible at
      the exact moment someone's about to pay. */
  selectedPlan?: string | null;
};

const EASE = [0.6, 0.2, 0.2, 1] as const;

const formatCard = (digits: string) =>
  digits.replace(/(.{4})/g, "$1 ").trim();

// Demo checkout — nobody should have to type fake card details to see the
// rest of the flow, so every field starts pre-filled with placeholder data
// (Stripe's well-known 4242 test number) and this step is skippable outright.
export default function PaymentPanel({ totals, onSubmit, inline, selectedPlan }: Props) {
  const plan = findPlan(selectedPlan ?? null);
  const [name, setName] = useState("Jane Nomad");
  const [card, setCard] = useState("4242424242424242");
  const [exp, setExp] = useState("12/29");
  const [cvv, setCvv] = useState("123");
  const [country, setCountry] = useState("United Kingdom");
  const [save, setSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // This renders inside a fixed full-screen modal (see the configurator
  // pages), and a `fixed` overlay does NOT stop the page underneath from
  // scrolling on its own — wheel events over the backdrop, or the scroll
  // chaining that kicks in once the form below hits its own top/bottom,
  // both fall through to the page behind unless body scroll is locked here.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !card.trim() || !exp.trim() || !cvv.trim()) {
      alert("Please complete all payment fields.");
      return;
    }
    setSubmitting(true);
    onSubmit();
  };

  const skip = () => {
    if (submitting) return;
    setSubmitting(true);
    onSubmit();
  };

  return (
    <motion.aside
      initial={inline ? { opacity: 0 } : { x: 560, opacity: 0 }}
      animate={inline ? { opacity: 1 } : { x: 0, opacity: 1 }}
      exit={inline ? { opacity: 0 } : { x: 560, opacity: 0 }}
      transition={{ duration: inline ? 0.4 : 0.65, ease: EASE }}
      className={[
        // min-h-0 matters here: without it, a flex column's default
        // min-height:auto lets it grow to fit ALL its content regardless of
        // max-h-full/the 85vh modal cap below, which is exactly what was
        // pushing the bottom of this panel off-screen on shorter screens
        // instead of the form scrolling internally within the capped box.
        "liquid-glass-strong overflow-hidden flex flex-col min-h-0",
        inline
          ? "w-full max-h-full rounded-[1.25rem]"
          : "fixed top-4 bottom-4 right-4 z-40 w-[400px] rounded-2xl",
      ].join(" ")}
    >
      <div className="px-5 py-3 border-b border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-body">Secure checkout</p>
        <h2 className="font-heading text-lg text-white mt-0.5">Payment</h2>
      </div>

      <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-3 space-y-0.5">
        {/* Demo notice — the fields below are already filled in with
            placeholder details, and this whole step can be skipped; this is
            the thing that actually needs to be obvious, not just the button
            at the bottom which is easy to miss on first glance. */}
        <div className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-xs font-body text-emerald-300 leading-snug">
            Demo checkout — details are pre-filled. Feel free to just skip ahead.
          </p>
          <button
            type="button"
            onClick={skip}
            disabled={submitting}
            className="shrink-0 text-xs font-body font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200 disabled:opacity-50"
          >
            Skip
          </button>
        </div>

        {/* Card preview */}
        <div className="liquid-glass rounded-2xl p-3 mb-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-body">Card preview</p>
            <p className="font-heading text-white text-base mt-1.5 tracking-[2px]">
              {formatCard(card.padEnd(16, "•"))}
            </p>
            <div className="mt-2 flex justify-between text-[11px] font-body text-white/70 uppercase">
              <span>{name || "Cardholder"}</span>
              <span>{exp || "MM/YY"}</span>
            </div>
          </div>
        </div>

        <Field label="Cardholder name" value={name} onChange={(v) => setName(v)} tabIndex={1} />
        <Field
          label="Card number"
          value={card}
          onChange={(v) => setCard(v.replace(/\D/g, "").slice(0, 16))}
          tabIndex={2}
          inputMode="numeric"
          formatted={formatCard(card)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Expiry MM/YY"
            value={exp}
            onChange={(v) => {
              const d = v.replace(/\D/g, "").slice(0, 4);
              setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
            }}
            tabIndex={3}
            inputMode="numeric"
          />
          <Field
            label="CVV"
            value={cvv}
            onChange={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
            tabIndex={4}
            inputMode="numeric"
          />
        </div>
        <Field label="Country" value={country} onChange={setCountry} tabIndex={5} />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-body text-white/80">Save payment for next time</span>
          <button
            type="button"
            tabIndex={6}
            onClick={() => setSave((s) => !s)}
            className={`relative w-10 h-6 rounded-full transition-all ${
              save ? "bg-white" : "bg-white/15"
            }`}
            aria-pressed={save}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                save ? "left-5 bg-black" : "left-1 bg-white"
              }`}
            />
          </button>
        </div>

        {/* Add-ons and Due today are what's actually charged — Due today is
            always exactly 10% of the Total shown right above it. Dwelling
            value sits apart, explicitly marked as not part of today's
            charge, instead of being folded into "Total" (it used to be,
            which made Due today look like the wrong percentage of Total). */}
        <div className="pt-2 space-y-1">
          <Row label="Add-ons" value={gbp(totals.subtotal)} muted />
          {!!totals.discount && (
            <Row label="Plan discount" value={`−${gbp(totals.discount)}`} accent />
          )}
          <Row label="Tax" value={gbp(totals.tax)} muted />
          <Row label="Total" value={gbp(totals.total)} />
          <Row label="Due today (10% deposit)" value={gbp(totals.dueToday)} bold />
          {/* The recurring subscription is the real ongoing cost — it used
              to not appear on this screen at all (only its discount did),
              so the actual number someone's about to commit to was
              invisible right at the moment they're paying. */}
          {plan && (
            <Row label={`Subscription (${plan.name})`} value={plan.price} bold />
          )}
          <Row
            label="Dwelling value — rented via subscription, not billed today"
            value={gbp(DWELLING_VALUE)}
            muted
          />
        </div>

        <button
          type="submit"
          tabIndex={7}
          disabled={submitting}
          className="mt-3 w-full bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Lock className="h-4 w-4" strokeWidth={2} />
          Pay & Confirm <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          tabIndex={8}
          disabled={submitting}
          onClick={skip}
          className="mt-2 mb-1 w-full border border-white/25 hover:border-white/50 hover:bg-white/5 text-white/80 hover:text-white rounded-full px-5 py-2.5 text-sm font-body font-medium transition-colors disabled:opacity-50"
        >
          Skip this & continue
        </button>
      </form>
    </motion.aside>
  );
}

function Field({
  label,
  value,
  onChange,
  tabIndex,
  inputMode,
  formatted,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tabIndex: number;
  inputMode?: "text" | "numeric";
  formatted?: string;
}) {
  return (
    <div className="relative pt-1 pb-0.5">
      <input
        className="float-input"
        value={formatted ?? value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={tabIndex}
        inputMode={inputMode}
        placeholder=" "
      />
      <label className="float-label">{label}</label>
      <span className="float-underline" />
    </div>
  );
}

function Row({ label, value, muted, bold, accent }: {
  label: string; value: string; muted?: boolean; bold?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs font-body ${muted ? "text-white/45" : "text-white/80"}`}>{label}</span>
      <span
        className={[
          "font-body shrink-0",
          bold ? "font-heading text-white text-xl tracking-[-.5px]"
            : accent ? "text-emerald-300/90 text-sm"
            : muted ? "text-white/55 text-xs"
            : "text-sm text-white",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
