import { useState, type FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMockAuth, type AvatarId } from "@/context/MockAuth";
import avatarPink from "@/assets/avatars/avatar-pink.png";
import avatarBlue from "@/assets/avatars/avatar-blue.png";
import avatarPurple from "@/assets/avatars/avatar-purple.png";
import avatarYellow from "@/assets/avatars/avatar-yellow.png";

const AVATARS: { id: AvatarId; image: string; label: string; ring: string; glow: string }[] = [
  { id: "pink",   image: avatarPink,   label: "Pink",   ring: "border-pink-300/70",   glow: "rgba(249,168,212,0.35)" },
  { id: "blue",   image: avatarBlue,   label: "Blue",   ring: "border-sky-300/70",    glow: "rgba(125,211,252,0.35)" },
  { id: "purple", image: avatarPurple, label: "Purple", ring: "border-violet-300/70", glow: "rgba(196,181,253,0.35)" },
  { id: "yellow", image: avatarYellow, label: "Yellow", ring: "border-yellow-300/70", glow: "rgba(253,224,71,0.35)" },
];

export default function LoginDialog() {
  const { signIn, loginOpen, closeLogin, _pendingSuccess, _clearPendingSuccess } = useMockAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLogin();
      _clearPendingSuccess();
      setError(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tell us what to call you.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Keep it under 60 characters.");
      return;
    }
    if (!avatar) {
      setError("Pick an avatar to continue.");
      return;
    }
    setError(null);
    signIn(trimmed, avatar);
    setName("");
    setAvatar(null);
    closeLogin();
    const cb = _pendingSuccess;
    _clearPendingSuccess();
    cb?.();
  };

  return (
    <DialogPrimitive.Root open={loginOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* Darker overlay — blurs whatever page is behind it, same as the
            questionnaire, instead of a custom full-screen scene. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 w-screen h-screen overflow-y-auto text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >

          {/* Close */}
          <DialogPrimitive.Close
            className="fixed top-6 right-6 z-20 liquid-glass w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </DialogPrimitive.Close>

          {/* Centered card */}
          <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
            <div className="liquid-glass-strong border border-white/10 rounded-[2rem] w-full max-w-[560px] overflow-hidden">
              {/* Form pane */}
              <div className="p-8 sm:p-12 md:p-14 flex flex-col justify-center gap-6">
                <div className="space-y-2">
                  <DialogPrimitive.Title className="font-heading text-3xl md:text-4xl tracking-[-1px] leading-tight">
                    Who's exploring?
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="font-body text-sm text-white/70">
                    Give yourself a name and pick an avatar to enter the configurator.
                  </DialogPrimitive.Description>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-body text-white/60 uppercase tracking-wider">
                      Your name
                    </label>
                    <input
                      type="text"
                      autoComplete="nickname"
                      placeholder="What should we call you?"
                      value={name}
                      maxLength={60}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 px-4 text-base bg-white/5 border border-white/15 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-body text-white/60 uppercase tracking-wider">
                      Pick an avatar
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {AVATARS.map(({ id, image, label, ring, glow }) => {
                        const selected = avatar === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setAvatar(id)}
                            aria-label={`Choose ${label} avatar`}
                            aria-pressed={selected}
                            className={[
                              "aspect-square rounded-full border flex items-center justify-center transition-all overflow-hidden",
                              selected
                                ? `${ring} bg-white/10 scale-105`
                                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
                            ].join(" ")}
                            style={selected ? { boxShadow: `0 0 24px ${glow}` } : undefined}
                          >
                            <img
                              src={image}
                              alt={label}
                              className={[
                                "w-full h-full object-cover scale-100 transition-opacity",
                                selected ? "opacity-100" : "opacity-70",
                              ].join(" ")}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && <p className="text-xs font-body text-red-300">{error}</p>}
                  <button
                    type="submit"
                    className="w-full h-12 rounded-full bg-white text-black text-sm font-body font-medium hover:bg-white/90 transition-colors mt-2"
                  >
                    Enter the Engine
                  </button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-body text-white/40 uppercase tracking-[0.2em]">Mocked auth</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <p className="font-body text-xs text-white/50 text-center">
                  No account needed — just tell us who you are.
                </p>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
