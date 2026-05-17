import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMockAuth } from "@/context/MockAuth";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function LoginDialog({ open, onOpenChange, onSuccess }: LoginDialogProps) {
  const { signIn } = useMockAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="liquid-glass border-white/10 bg-black/80 text-white sm:max-w-md rounded-3xl p-8">
        <DialogHeader>
          <DialogTitle className="font-heading text-3xl tracking-[-1px]">Sign in to configure</DialogTitle>
          <DialogDescription className="font-body text-sm text-white/70">
            Voyages are open to browse. Configuring a site needs an account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
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
            className="w-full rounded-full bg-white text-black px-4 py-2.5 text-sm font-body font-medium"
          >
            Sign in
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
