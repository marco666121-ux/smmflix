import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };

const credSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(6, { message: "Password must be 6+ chars" }).max(72),
});

export const AuthModal = ({ open, onClose, onSuccess }: Props) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmail = async () => {
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "You're signed in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back" });
      }
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast({ title: "Auth failed", description: e?.message ?? "Try again" });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Google sign-in failed", description: String(result.error?.message ?? result.error) });
      }
      // if redirected: browser is leaving; if tokens: session set
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl tracking-wider">
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </DialogTitle>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full h-11 font-bold gap-2 rounded-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-border flex-1" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest font-bold">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest font-bold">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <Button onClick={handleEmail} disabled={busy} className="w-full h-11 font-black uppercase tracking-widest text-xs rounded-sm">
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
