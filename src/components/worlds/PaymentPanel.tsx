import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { gbp } from "@/data/dwellingParts";

type Totals = { subtotal: number; tax: number; total: number; dueToday: number };

type Props = {
  totals: Totals;
  onSubmit: () => void;
};

const EASE = [0.6, 0.2, 0.2, 1] as const;

const formatCard = (digits: string) =>
  digits.replace(/(.{4})/g, "$1 ").trim();

export default function PaymentPanel({ totals, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [country, setCountry] = useState("");
  const [save, setSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <motion.aside
      initial={{ x: 560, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 560, opacity: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
      className="fixed top-4 bottom-4 right-4 z-40 w-[460px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-body">Secure checkout</p>
        <h2 className="font-heading text-2xl text-white mt-0.5">Payment</h2>
      </div>

      <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
        {/* Card preview */}
        <div className="liquid-glass rounded-2xl p-5 mb-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-700/20 via-transparent to-white/5 pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-body">Card preview</p>
            <p className="font-heading text-white text-xl mt-2 tracking-[2px]">
              {formatCard(card.padEnd(16, "•"))}
            </p>
            <div className="mt-4 flex justify-between text-[11px] font-body text-white/70 uppercase">
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

        <div className="flex items-center justify-between pt-5">
          <span className="text-xs font-body text-white/80">Save payment for next time</span>
          <button
            type="button"
            tabIndex={6}
            onClick={() => setSave((s) => !s)}
            className={`relative w-12 h-7 rounded-full transition-all ${
              save ? "bg-gradient-to-r from-amber-500 to-amber-300" : "bg-white/15"
            }`}
            aria-pressed={save}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                save ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="pt-5 space-y-1.5">
          <Row label="Total" value={gbp(totals.total)} muted />
          <Row label="Due today (10%)" value={gbp(totals.dueToday)} bold />
        </div>

        <button
          type="submit"
          tabIndex={7}
          disabled={submitting}
          className="mt-5 w-full bg-white text-black rounded-full px-5 py-3 text-sm font-body font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Lock className="h-4 w-4" strokeWidth={2} />
          Pay & Confirm <ArrowRight className="h-4 w-4" strokeWidth={2} />
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
    <div className="relative pt-2 pb-1">
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

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-body ${muted ? "text-white/55" : "text-white/80"}`}>{label}</span>
      <span
        className={`font-body ${
          bold ? "font-heading text-white text-xl tracking-[-.5px]" : "text-sm text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
