import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Check } from "lucide-react";
import { useMockAuth } from "@/context/MockAuth";
import VoyageScene from "@/components/VoyageScene";
import BlurText from "@/components/BlurText";

// Tiers live in one place so the configurator's inline picker and this modal
// can't drift apart.
import { PLANS } from "@/data/plans";

export default function PlanSelection() {
  const { planSelectionOpen, closePlanSelection, confirmPlan, _planPendingSuccess, _clearPlanPendingSuccess } = useMockAuth();
  const [selected, setSelected] = useState<string>("standard");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closePlanSelection();
      _clearPlanPendingSuccess();
    }
  };

  const handleConfirm = () => {
    confirmPlan(selected);
    closePlanSelection();
    const cb = _planPendingSuccess;
    _clearPlanPendingSuccess();
    cb?.();
  };

  return (
    <DialogPrimitive.Root open={planSelectionOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >
          <div className="relative w-full h-full md:w-[80vw] md:h-[80vh] md:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            <div className="absolute inset-0 z-0 bg-[#01030f]" aria-hidden />
            <VoyageScene className="absolute inset-0 w-full h-full z-0 opacity-70 pointer-events-none" />
            <div className="absolute inset-0 z-0 bg-[#020618]/70 pointer-events-none" aria-hidden />

            <div className="relative z-10 h-full overflow-y-auto flex items-center justify-center px-6 py-16">
              <div className="liquid-glass border border-white/10 w-full max-w-[1100px] rounded-[2rem] p-8 md:p-12 text-white">
                <p className="text-xs font-body text-white/60 mb-3 text-center tracking-wider">
                  // Choose your plan
                </p>
                <DialogPrimitive.Title asChild>
                  <div className="text-center">
                    <BlurText
                      text="Pick the engine that fits."
                      className="font-heading text-white text-4xl md:text-5xl leading-[0.95] tracking-[-2px]"
                    />
                  </div>
                </DialogPrimitive.Title>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => {
                    const isSelected = selected === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelected(plan.id)}
                        className={[
                          "group relative flex flex-col items-start text-left gap-4 rounded-2xl px-5 py-6 border transition-all",
                          isSelected
                            ? "bg-white text-black border-white shadow-[0_8px_30px_-10px_rgba(255,255,255,0.4)]"
                            : "bg-white/[0.03] text-white border-white/10 hover:bg-white/[0.06] hover:border-white/20",
                        ].join(" ")}
                      >
                        {plan.highlight && (
                          <span className={`text-[10px] uppercase tracking-[0.18em] font-body px-2 py-0.5 rounded-full ${isSelected ? "bg-black/10 text-black/70" : "bg-white/10 text-white/70"}`}>
                            Most popular
                          </span>
                        )}
                        <div>
                          <div className="font-heading text-2xl leading-none tracking-[-1px]">{plan.name}</div>
                          <div className="font-heading text-3xl leading-none tracking-[-1px] mt-2">{plan.price}</div>
                          <div className={`font-body text-xs mt-2 leading-snug ${isSelected ? "text-black/60" : "text-white/55"}`}>
                            {plan.tagline}
                          </div>
                        </div>
                        <ul className="space-y-1.5 mt-2">
                          {plan.features.map((f) => (
                            <li key={f} className={`flex items-start gap-2 text-xs font-body ${isSelected ? "text-black/75" : "text-white/70"}`}>
                              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center mt-12">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex items-center gap-2 text-sm font-body font-medium bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
                  >
                    Continue with {PLANS.find((p) => p.id === selected)?.name}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
