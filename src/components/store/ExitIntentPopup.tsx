import { useEffect, useRef, useState } from "react";
import { X, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToKlaviyo } from "@/lib/klaviyo";

const SHOWN_KEY = "ovetone_exit_intent_shown_v1";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const armed = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(SHOWN_KEY)) return;
    } catch {}
    armed.current = true;

    const trigger = () => {
      if (!armed.current) return;
      armed.current = false;
      setOpen(true);
      try { localStorage.setItem(SHOWN_KEY, "1"); } catch {}
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 8) return;
      trigger();
    };

    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => { lastTouchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (window.scrollY <= 0 && y - lastTouchY > 80) trigger();
    };

    const onVisibility = () => { if (document.visibilityState === "hidden") trigger(); };

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      await supabase.from("discount_leads").insert({
        email,
        interest: "exit_intent",
        code: "WELCOME20",
      });
      subscribeToKlaviyo(email, { source: "exit_intent" }).catch(() => {});
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md bg-background border border-border shadow-2xl p-7 animate-fade-up">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 hover:opacity-60"
        >
          <X className="h-4 w-4" />
        </button>
        {done ? (
          <div className="text-center py-4">
            <h2 className="font-display font-black text-2xl tracking-tight">You're on the list ✦</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your inbox — your code is on its way.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 bg-foreground text-background px-6 py-3 text-[11px] tracking-brand-wide uppercase font-semibold"
            >
              Keep browsing
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-3">
              <Mail className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="font-display font-black text-2xl tracking-tight text-center">
              Wait — before you go
            </h2>
            <p className="mt-2 text-sm text-muted-foreground text-center leading-relaxed">
              Drop your email and join the list for early access to Drop 002 and member-only releases.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-foreground text-background py-3 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {busy ? "Joining…" : "Join The List"}
              </button>
            </form>
            <p className="mt-4 text-center text-[11px] text-muted-foreground leading-relaxed">
              Didn't see something you like? <br />
              You can always{" "}
              <a href="/contact" className="underline underline-offset-4 text-foreground">
                contact us
              </a>{" "}
              and we'll help you find it.
            </p>
          </>
        )}
      </div>
    </div>
  );
}