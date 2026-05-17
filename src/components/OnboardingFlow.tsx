import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Home,
  UsersRound,
  CalendarDays,
  CalendarRange,
  Leaf,
  Infinity as InfinityIcon,
  Laptop,
  Flower2,
  PartyPopper,
  Microscope,
  Zap,
  Lock,
  Sofa,
  Wifi,
  Minimize2,
  Square,
  Maximize2,
} from "lucide-react";
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
      { id: "solo", label: "Solo", subtitle: "Just me, full independence", Icon: User },
      { id: "couple", label: "Couple", subtitle: "Two people, shared space", Icon: Users },
      { id: "family", label: "Family", subtitle: "3–4 people, shared setup", Icon: Home },
      { id: "group", label: "Large group", subtitle: "5+ people, full capacity", Icon: UsersRound },
    ],
  },
  {
    question: "How long are you planning to stay?",
    options: [
      { id: "weeks", label: "1–4 weeks", subtitle: "Medium-term immersion", Icon: CalendarDays },
      { id: "months", label: "1–3 months", subtitle: "Extended stay, full comfort", Icon: CalendarRange },
      { id: "season", label: "A season", subtitle: "3–6 months, deep immersion", Icon: Leaf },
      { id: "open", label: "Open-ended", subtitle: "Nomadic lifestyle, flexible", Icon: InfinityIcon },
    ],
  },
  {
    question: "What's the primary purpose of this stay?",
    options: [
      { id: "work", label: "Remote work", subtitle: "Focus & deep work", Icon: Laptop },
      { id: "retreat", label: "Retreat", subtitle: "Rest & reset", Icon: Flower2 },
      { id: "social", label: "Socialising", subtitle: "Gather with others", Icon: PartyPopper },
      { id: "research", label: "Field research", subtitle: "Study & observe", Icon: Microscope },
    ],
  },
  {
    question: "What matters most to you?",
    options: [
      { id: "energy", label: "Energy", subtitle: "Off-grid autonomy", Icon: Zap },
      { id: "privacy", label: "Privacy", subtitle: "Quiet & secluded", Icon: Lock },
      { id: "comfort", label: "Comfort", subtitle: "Refined living", Icon: Sofa },
      { id: "connectivity", label: "Connectivity", subtitle: "Always online", Icon: Wifi },
    ],
  },
  {
    question: "How much space do you need?",
    options: [
      { id: "compact", label: "Compact", subtitle: "Efficient footprint", Icon: Minimize2 },
      { id: "standard", label: "Standard", subtitle: "Balanced layout", Icon: Square },
      { id: "generous", label: "Generous", subtitle: "Room to breathe", Icon: Maximize2 },
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
  const isLast = stepIdx === total - 1;

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
    if (isLast) handleOpenChange(false);
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
              {/* Header: progress dashes + counter */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={[
                        "h-1.5 w-8 rounded-full transition-colors",
                        i <= stepIdx ? "bg-neutral-900" : "bg-neutral-200",
                      ].join(" ")}
                    />
                  ))}
                </div>
                <span className="text-xs font-body tracking-wider text-neutral-500">
                  {stepIdx + 1} / {total}
                </span>
              </div>

              <DialogPrimitive.Title className="font-heading text-3xl md:text-[2.25rem] tracking-[-1px] leading-tight text-center text-neutral-900">
                {step.question}
              </DialogPrimitive.Title>

              {/* Options */}
              <div
                className={[
                  "mt-10 grid gap-3",
                  step.options.length === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-2 md:grid-cols-4",
                ].join(" ")}
              >
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
                  {isLast ? "See my proposal" : "Continue"}
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
