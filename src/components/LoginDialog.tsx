import { useState, type FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import BlurText from "@/components/BlurText";
import VoyageScene from "@/components/VoyageScene";
import { useMockAuth } from "@/context/MockAuth";

export default function LoginDialog() {
  const { signIn, loginOpen, closeLogin, _pendingSuccess, _clearPendingSuccess } = useMockAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Enter an email and password to continue.");
      return;
    }
    if (trimmed.length > 255 || password.length > 100) {
      setError("Inputs are too long.");
      return;
    }
    setError(null);
    signIn(trimmed);
    setEmail("");
    setPassword("");
    closeLogin();
    const cb = _pendingSuccess;
    _clearPendingSuccess();
    cb?.();
  };

  return (
    <DialogPrimitive.Root open={loginOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 w-screen h-screen overflow-y-auto bg-[#01030f] text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >
          {/* Backdrop scene */}
          <VoyageScene className="fixed inset-0 w-full h-full z-0 opacity-70 pointer-events-none" />
          <div className="fixed inset-0 z-0 bg-[#020618]/85 pointer-events-none" aria-hidden />

          {/* Close */}
          <DialogPrimitive.Close
            className="fixed top-6 right-6 z-20 liquid-glass w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </DialogPrimitive.Close>

          {/* Centered card */}
          <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
            <div className="liquid-glass border border-white/10 rounded-[2rem] w-full max-w-[1100px] grid md:grid-cols-2 overflow-hidden">
              {/* Left brand pane */}
              <div className="hidden md:flex flex-col justify-between p-12 border-r border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent">
                <p className="text-sm font-body text-white/70">// Access</p>
                <div className="space-y-6">
                  <BlurText
                    text="Sign in to claim a parcel."
                    className="font-heading text-white text-5xl lg:text-[3.5rem] leading-[0.95] tracking-[-2px]"
                  />
                  <p className="font-body text-white/70 text-base leading-relaxed max-w-sm">
                    Voyages are open to browse. Configuring a site, claiming terrain, and tuning an engine
                    needs an account.
                  </p>
                </div>
                <ul className="space-y-2 font-body text-sm text-white/60">
                  <li>— Live site telemetry</li>
                  <li>— Pre-cleared parcels worldwide</li>
                  <li>— Configurable engines</li>
                </ul>
              </div>

              {/* Right form pane */}
              <div className="p-8 sm:p-12 md:p-14 flex flex-col justify-center gap-6">
                <div className="space-y-2">
                  <DialogPrimitive.Title className="font-heading text-3xl md:text-4xl tracking-[-1px] leading-tight">
                    Sign in to configure
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="font-body text-sm text-white/70">
                    Enter your credentials to access the configurator and engine dashboard.
                  </DialogPrimitive.Description>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-body text-white/60 uppercase tracking-wider">Email</label>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@nomad.engine"
                      value={email}
                      maxLength={255}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base bg-white/5 border-white/15 text-white placeholder:text-white/40 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-body text-white/60 uppercase tracking-wider">Password</label>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      maxLength={100}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base bg-white/5 border-white/15 text-white placeholder:text-white/40 rounded-xl"
                    />
                  </div>
                  {error && <p className="text-xs font-body text-red-300">{error}</p>}
                  <button
                    type="submit"
                    className="w-full h-12 rounded-full bg-white text-black text-sm font-body font-medium hover:bg-white/90 transition-colors mt-2"
                  >
                    Sign in
                  </button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-body text-white/40 uppercase tracking-[0.2em]">Mocked auth</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <p className="font-body text-xs text-white/50 text-center">
                  No account needed — any email + password unlocks the demo.
                </p>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
