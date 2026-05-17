import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
    <Dialog open={loginOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="liquid-glass border-white/10 bg-black/85 text-white sm:max-w-md rounded-3xl p-8">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-heading text-3xl tracking-[-1px] leading-tight">
            Sign in to configure
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-white/70">
            Voyages are open to browse. Configuring a site needs an account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@nomad.engine"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border-white/15 text-white placeholder:text-white/40"
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            maxLength={100}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/5 border-white/15 text-white placeholder:text-white/40"
          />
          {error && <p className="text-xs font-body text-red-300">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-white text-black px-4 py-2.5 text-sm font-body font-medium mt-2"
          >
            Sign in
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
