import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// We map phone -> synthetic email so we can use Supabase email/password auth
// without needing an SMS provider. Customers only ever see "phone + password".
export const phoneToEmail = (phone: string) => {
  const digits = String(phone).replace(/\D/g, "");
  return `${digits}@smmflix.app`;
};

export const normalizePhone = (phone: string) => String(phone).replace(/\D/g, "");

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<{ error?: string }>;
  signUpWithPhone: (phone: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  signInWithPhone: async () => ({}),
  signUpWithPhone: async () => ({}),
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        // Track last_ip + last_seen on each session change (deferred to avoid deadlock)
        setTimeout(async () => {
          try {
            const r = await fetch("https://api.ipify.org?format=json");
            const j = await r.json();
            await supabase
              .from("profiles")
              .update({ last_ip: j.ip ?? null, last_seen_at: new Date().toISOString() })
              .eq("id", s.user.id);
          } catch {
            /* ignore */
          }
        }, 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPhone = async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUpWithPhone = async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { phone: normalizePhone(phone) },
      },
    });
    return error ? { error: error.message } : {};
  };

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithPhone,
        signUpWithPhone,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
