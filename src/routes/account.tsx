import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Ovetone" },
      { name: "description", content: "Log in or create an account at Ovetone." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  // AccountPage may be reached as a top-level route; AuthProvider is already in StoreLayout.
  return (
    <StoreLayout>
      <AccountInner />
    </StoreLayout>
  );
}

function AccountInner() {
  const { user, signIn, signUp, signOut, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <section className="mx-auto max-w-md px-5 md:px-8 py-24 md:py-32 text-center">
        <p className="text-sm tracking-brand uppercase text-muted-foreground">Loading…</p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="mx-auto max-w-md px-5 md:px-8 py-24 md:py-32 text-center">
        <h1 className="font-display font-black text-4xl tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-8">{user.email}</p>
        <button
          onClick={() => signOut()}
          className="bg-foreground text-background px-10 py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
        >
          Sign Out
        </button>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) setError(error);
    else if (mode === "signup") {
      setInfo("Welcome to Ovetone — check your inbox for your 20% off code.");
      // Fire-and-forget: subscribe to Klaviyo + send our welcome email
      try {
        const { subscribeToKlaviyo } = await import("@/lib/klaviyo");
        subscribeToKlaviyo({
          email,
          source: "signup",
          properties: { discount_code: "WELCOME20" },
        }).catch(() => {});
      } catch {}
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        supabase.functions
          .invoke("send-welcome-email", {
            body: { email, code: "WELCOME20", source: "signup" },
          })
          .catch(() => {});
      } catch {}
    }
  };

  return (
    <section className="mx-auto max-w-md px-5 md:px-8 py-24 md:py-32">
      <h1 className="font-display font-black text-4xl tracking-tight text-center mb-2">
        {mode === "signin" ? "Log in" : "Create account"}
      </h1>
      <p className="text-center text-xs tracking-brand uppercase text-muted-foreground mb-8">
        Members get early access to drops
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {busy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-6">
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="text-foreground underline underline-offset-4"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </section>
  );
}

// satisfy unused import lint if any
void AuthProvider;
