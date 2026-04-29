import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Phone } from "lucide-react";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };

export const AuthModal = ({ open, onClose, onSuccess }: Props) => {
  const { signInWithPhone, signUpWithPhone } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      toast({ title: "Enter a valid mobile number" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters" });
      return;
    }
    setBusy(true);
    const { error } =
      mode === "login"
        ? await signInWithPhone(digits, password)
        : await signUpWithPhone(digits, password);
    setBusy(false);
    if (error) {
      toast({ title: mode === "login" ? "Sign in failed" : "Sign up failed", description: error });
      return;
    }
    toast({ title: mode === "login" ? "Welcome back" : "Account created" });
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl tracking-wider">
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest font-bold">Mobile Number</Label>
            <div className="relative">
              <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 918848490476"
                className="pl-9"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Country code + number (digits only). Example: 918848490476
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest font-bold">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <Button
            onClick={submit}
            disabled={busy}
            className="w-full h-11 font-black uppercase tracking-widest text-xs rounded-sm"
          >
            {mode === "login" ? "Sign In" : "Sign Up"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
