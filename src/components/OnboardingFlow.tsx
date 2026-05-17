import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, User, Users, Home, UsersRound, Sun, Snowflake, Wind, Leaf, Mountain, Waves, Trees, Sparkles, Zap, Battery, Flame, Gauge } from "lucide-react";
import { useMockAuth } from "@/context/MockAuth";
import heroBg from "@/assets/hero-landscape.jpg";

type Option = { id: string; label: string; subtitle: string; Icon: typeof User };

type Step = {
  question: string;
  options: Option[];
};

const steps: Step[] = [
  {
    question: "How many people will be staying?",
    options: [
      { id: "solo", label: "Solo", subtitle: "Just you", Icon: User },
      { id: "couple", label: "Couple", subtitle: "Two travelers", Icon: Users },
      { id: "family", label: "Family", subtitle: "3–5 people", Icon: Home },
      { id: "group", label: "Large group", subtitle: "6 or more", Icon: UsersRound },
    ],
  },
  {
    question: "What climate calls to you?",
    options: [
      { id: "warm", label: "Warm", subtitle: "Sun & coast", Icon: Sun },
      { id: "cold", label: "Cold", subtitle: "Snow & ice", Icon: Snowflake },
      { id: "temperate", label: "Temperate", subtitle: "Mild seasons", Icon: Wind },
      { id: "tropical", label: "Tropical", subtitle: "Humid & lush", Icon: Leaf },
    ],
  },
  {
    question: "Which terrain feels like home?",
    options: [
      { id: "mountain", label: "Mountain", subtitle: "High altitude", Icon: Mountain },
      { id: "coast", label: "Coast", subtitle: "Near the sea", Icon: Waves },
      { id: "forest", label: "Forest", subtitle: "Deep woods", Icon: Trees },
      { id: "desert", label: "Desert", subtitle: "Open expanse", Icon: Sun },
    ],
  },
  {
    question: "Pick a power source for the engine.",
    options: [
      { id: "solar", label: "Solar", subtitle: "Photovoltaic array", Icon: Sparkles },
      { id: "wind", label: "Wind", subtitle: "Turbine assist", Icon: Wind },
      { id: "battery", label: "Battery", subtitle: "Grid-tied cell", Icon: Battery },
      { id: "hybrid", label: "Hybrid", subtitle: "Combined system", Icon: Zap },
    ],
  },
  {
    question: "How long do you plan to stay?",
    options: [
      { id: "weekend", label: "Weekend", subtitle: "A short retreat", Icon: Flame },
      { id: "weeks", label: "Weeks", subtitle: "Extended visit", Icon: Gauge },
      { id: "season", label: "A season", subtitle: "Months at a time", Icon: Leaf },
      { id: "indef", label: "Indefinite", subtitle: "Living on-site", Icon: Home },
    ],
  },
];

export default function OnboardingFlow() {
  const { onboardingOpen, closeOnboarding } = useMockAuth();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const total = steps.length;
  const step = steps[stepIdx];
  const selected = answers[stepIdx];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeOnboarding();
      setStepIdx(0);
      setAnswers({});
    }
  };

  const goBack = () => {
    if (stepIdx === 0) handleOpenChange(false);
    else setStepIdx((i) => i - 1);
  };

  const goNext = () => {
    if (!selected) return;
    if (stepIdx === total - 1) handleOpenChange(false);
    else setStepIdx((i) => i + 1);
  };

  return (
    <DialogPrimitive.Root open={onboardingOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] w-screen h-screen overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >
          {/* Background image */}
          <div
            className="fixed inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
            aria-hidden
          />
          <div className="fixed inset-0 z-0 bg-black/30" aria-hidden />

          {/* Floating card */}
          <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
            <div className="w-full max-w-[860px] rounded-[2rem] bg-white text-neutral-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] p-8 md:p-10">
              {/* Header: handle + counter */}
              <div className="flex items-center justify-between mb-8">
                <div className="h-1.5 w-12 rounded-full bg-neutral-800/80" />
                <span className="text-xs font-body tracking-wider text-neutral-500">
                  {stepIdx + 1} / {total}
                </span>
              </div>

              <DialogPrimitive.Title className="font-heading text-3xl md:text-[2.25rem] tracking-[-1px] leading-tight text-center text-neutral-900">
                {step.question}
              </DialogPrimitive.Title>

              {/* Options */}
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
                {step.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [stepIdx]: opt.id }))}
                      className={[
                        "flex flex-col items-center text-center gap-2 rounded-2xl px-4 py-6 border transition-all",
                        isSelected
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                          : "bg-neutral-50 text-neutral-900 border-neutral-200 hover:bg-neutral-100",
                      ].join(" ")}
                    >
                      <opt.Icon
                        className={["h-7 w-7", isSelected ? "text-white" : "text-neutral-700"].join(" ")}
                        strokeWidth={1.5}
                      />
                      <span className="font-body font-semibold text-sm mt-1">{opt.label}</span>
                      <span
                        className={[
                          "font-body text-xs leading-snug",
                          isSelected ? "text-white/70" : "text-neutral-500",
                        ].join(" ")}
                      >
                        {opt.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-10">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 text-sm font-body text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!selected}
                  className="inline-flex items-center gap-2 text-sm font-body font-medium bg-neutral-900 text-white px-5 py-2.5 rounded-full hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {stepIdx === total - 1 ? "Finish" : "Continue"}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function _unusedTypeGuard(_: ReactNode) {}
