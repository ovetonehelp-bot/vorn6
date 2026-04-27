import { useEffect, useState } from "react";
import { X, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToKlaviyo } from "@/lib/klaviyo";
import logo from "@/assets/ovetone-crown.png";

const STORAGE_KEY = "ovetone_discount_popup_v2";
const MINIMIZED_KEY = "ovetone_discount_popup_minimized_v2";
const SHOW_DELAY_MS = 2500;

type Step = "interest" | "email" | "thanks";
type Interest = "hoodie" | "pants" | "both";

export function DiscountPopup() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [step, setStep] = useState<Step>("interest");
  const [interest, setInterest] = useState<Interest | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed) return; // user already converted — don't show
    const wasMinimized = localStorage.getItem(MINIMIZED_KEY);
    if (wasMinimized) {
      setMinimized(true);
      return;
    }
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const minimize = () => {
    setOpen(false);
    setMinimized(true);
    try {
      localStorage.setItem(MINIMIZED_KEY, "1");
    } catch {}
  };

  const reopen = () => {
    setMinimized(false);
    setOpen(true);
  };

  const completeAndClose = () => {
    setOpen(false);
    setMinimized(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      localStorage.removeItem(MINIMIZED_KEY);
    } catch {}
  };

  const pickInterest = (i: Interest) => {
    setInterest(i);
    setStep("email");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interest || !email) return;
    setBusy(true);
    setError(null);
    try {
      // 1. Save the lead in our DB (best-effort)
      try {
        await supabase.from("discount_leads").insert({
          email,
          interest,
          code: "WELCOME20",
        });
      } catch {}

      // 2. Subscribe via Klaviyo (handles the email send on their side)
      await subscribeToKlaviyo({
        email,
        source: "discount_popup",
        properties: { interest, discount_code: "WELCOME20" },
      });

      // 3. Also try our own welcome email (no-op if not configured)
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: { email, code: "WELCOME20", source: "discount_popup" },
        });
      } catch {}

      setStep("thanks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // Minimized tag
  if (minimized && !open) {
    return (
      <button
        onClick={reopen}
        aria-label="Open 20% off offer"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[70] bg-foreground text-background px-2.5 py-3 shadow-lg hover:opacity-90 transition-all flex flex-col items-center gap-1.5 [writing-mode:vertical-rl] rotate-180"
      >
        <span className="text-[10px] tracking-brand-wide uppercase font-bold">20% Off</span>
      </button>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-in fade-in"
        onClick={minimize}
      />
      <div className="relative w-full max-w-md bg-background shadow-2xl border border-border animate-in fade-in zoom-in-95">
        <button
          onClick={minimize}
          aria-label="Minimize"
          className="absolute right-3 top-3 p-2 hover:opacity-60 transition-opacity z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-10 pb-8 md:px-10 md:pt-12 md:pb-10 text-center">
          <img src={logo} alt="Ovetone" className="mx-auto h-14 w-14 object-contain mb-4" />

          {step === "interest" && (
            <>
              <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight leading-tight">
                Get 20% Off
                <br />
                Your First Order
              </h2>
              <p className="mt-3 text-xs tracking-brand-wide uppercase text-muted-foreground">
                Tell us what you're looking for
              </p>
              <div className="mt-7 grid gap-2.5">
                <button
                  onClick={() => pickInterest("hoodie")}
                  className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
                >
                  A — Hoodie
                </button>
                <button
                  onClick={() => pickInterest("pants")}
                  className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
                >
                  B — Pants
                </button>
                <button
                  onClick={() => pickInterest("both")}
                  className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
                >
                  C — Both
                </button>
                <button
                  onClick={minimize}
                  className="mt-2 text-[11px] tracking-brand-wide uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  No thanks, I'd rather pay full price
                </button>
              </div>
            </>
          )}

          {step === "email" && (
            <>
              <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight leading-tight">
                Almost there.
              </h2>
              <p className="mt-3 text-xs tracking-brand-wide uppercase text-muted-foreground">
                Drop your email — we'll send your code
              </p>
              <form onSubmit={submit} className="mt-7 space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-border bg-background px-4 py-4 text-sm focus:outline-none focus:border-foreground"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {busy ? "…" : "Send My Code"}
                </button>
              </form>
            </>
          )}

          {step === "thanks" && (
            <>
              <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight leading-tight">
                You're in. ✦
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Thanks — we just sent you an email with your discount code{" "}
                <span className="font-semibold text-foreground">WELCOME20</span> for 20% off.
              </p>
              <button
                onClick={completeAndClose}
                className="mt-7 w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
              >
                Start Shopping
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Mark the lucide Tag import as used (kept for future tag iconography)
void Tag;