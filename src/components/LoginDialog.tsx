import { useState, type FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMockAuth, type AvatarId } from "@/context/MockAuth";
import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";

// Numbered rather than colour-named — the set sits in one violet/magenta
// family (two share a hue), so colour names would be ambiguous. Ring/glow
// values are sampled from each portrait's own accent so the selected state
// picks up that avatar's colour.
const AVATARS: { id: AvatarId; image: string; label: string; glow: string }[] = [
  { id: "a1", image: avatar1, label: "Avatar 1", glow: "rgba(149,117,169,0.45)" },
  { id: "a2", image: avatar2, label: "Avatar 2", glow: "rgba(158,116,185,0.45)" },
  { id: "a3", image: avatar3, label: "Avatar 3", glow: "rgba(153,60,136,0.45)" },
  { id: "a4", image: avatar4, label: "Avatar 4", glow: "rgba(163,123,137,0.45)" },
  { id: "a5", image: avatar5, label: "Avatar 5", glow: "rgba(203,152,139,0.45)" },
  { id: "a6", image: avatar6, label: "Avatar 6", glow: "rgba(169,96,158,0.45)" },
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
                    <div className="grid grid-cols-3 gap-3">
                      {AVATARS.map(({ id, image, label, glow }) => {
                        const selected = avatar === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setAvatar(id)}
                            aria-label={`Choose ${label}`}
                            aria-pressed={selected}
                            className={[
                              // No CSS border — each portrait already has its own
                              // glowing ring baked in, and a second drawn circle on
                              // top read as a double ring. Selection is expressed by
                              // growing that ring and lighting it with the avatar's
                              // own accent colour instead.
                              "aspect-square rounded-full flex items-center justify-center overflow-hidden",
                              "transition-all duration-300",
                              selected ? "scale-110" : "hover:scale-105",
                            ].join(" ")}
                            style={selected ? { boxShadow: `0 0 28px ${glow}` } : undefined}
                          >
                            <img
                              src={image}
                              alt={label}
                              // The source art is pre-cropped to each portrait's own
                              // glowing ring (they sat at 81–93% of frame, which left a
                              // black margin the circular clip read as a second ring),
                              // so the ring itself is now the outer edge at scale 1.
                              className={[
                                "w-full h-full object-cover transition-opacity duration-300",
                                selected ? "opacity-100" : "opacity-60 hover:opacity-85",
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
