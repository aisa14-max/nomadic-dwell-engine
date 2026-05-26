import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import VoyageScene from "@/components/VoyageScene";
import BlurText from "@/components/BlurText";


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
  const navigate = useNavigate();
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
    if (isLast) {
      handleOpenChange(false);
      navigate("/configurator");
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  return (
    <DialogPrimitive.Root open={onboardingOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] w-screen h-screen overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >
          {/* Cinematic backdrop — Voyages aesthetic */}
          <div className="fixed inset-0 z-0 bg-[#01030f]" aria-hidden />
          <VoyageScene className="fixed inset-0 w-full h-full z-0 opacity-70 pointer-events-none" />
          <div className="fixed inset-0 z-0 bg-[#020618]/70 pointer-events-none" aria-hidden />

          {/* Floating glass card */}
          <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
            <div className="liquid-glass border border-white/10 w-full max-w-[920px] rounded-[2rem] p-8 md:p-12 text-white">
              {/* Header: progress dashes + counter */}
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

              <p className="text-xs font-body text-white/60 mb-3 text-center tracking-wider">// Onboarding</p>
              <DialogPrimitive.Title asChild>
                <div className="text-center">
                  <BlurText
                    key={stepIdx}
                    text={step.question}
                    className="font-heading text-white text-4xl md:text-5xl leading-[0.95] tracking-[-2px]"
                  />
                </div>
              </DialogPrimitive.Title>

              {/* Options */}
              <div
                className={[
                  "mt-12 grid gap-3",
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
                        "group relative flex flex-col items-start text-left gap-3 rounded-2xl px-5 py-6 border transition-all",
                        isSelected
                          ? "bg-white text-black border-white shadow-[0_8px_30px_-10px_rgba(255,255,255,0.4)]"
                          : "bg-white/[0.03] text-white border-white/10 hover:bg-white/[0.06] hover:border-white/20",
                      ].join(" ")}
                    >
                      <opt.Icon
                        className={["h-6 w-6", isSelected ? "text-black" : "text-white/80"].join(" ")}
                        strokeWidth={1.25}
                      />
                      <div className="space-y-1">
                        <div className="font-heading text-xl leading-none tracking-[-1px]">{opt.label}</div>
                        <div
                          className={[
                            "font-body text-xs leading-snug",
                            isSelected ? "text-black/60" : "text-white/55",
                          ].join(" ")}
                        >
                          {opt.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-12">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 text-sm font-body text-white/60 hover:text-white px-3 py-2 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!selected}
                  className="inline-flex items-center gap-2 text-sm font-body font-medium bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
