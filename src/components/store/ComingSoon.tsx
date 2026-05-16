import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/ovetone-crown.png";
import { Link } from "@tanstack/react-router";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";

interface Props {
  launchAt: string;
}

function diff(target: number) {
  const now = Date.now();
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return { d, h, m, s };
}

export function ComingSoon({ launchAt }: Props) {
  const target = new Date(launchAt).getTime();
  const [t, setT] = useState(() => diff(target));
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { products } = useShopifyProducts();
  const bgImages = products.flatMap((p) => p.images.map((i) => i.src)).filter(Boolean);
  const [bgIdx, setBgIdx] = useState(0);

  useEffect(() => {
    if (bgImages.length < 2) return;
    const id = setInterval(() => {
      setBgIdx((i) => (i + 1) % bgImages.length);
    }, 10000);
    return () => clearInterval(id);
  }, [bgImages.length]);

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setErr(null);
    try {
      let country: string | undefined, region: string | undefined, city: string | undefined;
      try {
        const { getVisitorGeo } = await import("@/lib/analytics");
        const g = await getVisitorGeo();
        country = g.country ?? undefined;
        region = g.region ?? undefined;
        city = g.city ?? undefined;
      } catch {}
      const { error } = await (supabase as any)
        .from("coming_soon_leads")
        .insert({ email, country, region, city });
      if (error) throw error;
      try {
        const { subscribeToKlaviyo } = await import("@/lib/klaviyo");
        await subscribeToKlaviyo({ email, source: "coming_soon", properties: { launch_at: launchAt } });
      } catch {}
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const launchDate = new Date(launchAt).toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });

  const cells: { v: number; label: string }[] = [
    { v: t.d, label: "Days" },
    { v: t.h, label: "Hours" },
    { v: t.m, label: "Minutes" },
    { v: t.s, label: "Seconds" },
  ];

  return (
    <main className="min-h-screen bg-foreground text-background flex flex-col items-center justify-center px-5 py-12 text-center relative overflow-hidden">
      {bgImages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out pointer-events-none"
          style={{ opacity: i === bgIdx ? 0.55 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-foreground/40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <img src={logo} alt="Ovetone" className="h-20 w-20 md:h-24 md:w-24 object-contain mb-6" style={{ filter: "invert(1)" }} />
        <p className="text-[10px] md:text-xs tracking-brand-wide uppercase opacity-70">Drop 001</p>
        <h1 className="mt-3 font-display font-black text-4xl md:text-6xl tracking-tight leading-[0.95]">
          Set The Tone.
        </h1>
        <p className="mt-4 text-xs md:text-sm tracking-brand-wide uppercase opacity-80">
          Launching {launchDate}
        </p>

        <div className="mt-10 grid grid-cols-4 gap-2 md:gap-4 w-full max-w-md">
          {cells.map((c) => (
            <div key={c.label} className="border border-background/20 bg-background/5 backdrop-blur-sm py-4 md:py-6">
              <div className="font-display font-black text-2xl md:text-4xl tabular-nums">
                {String(c.v).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[9px] md:text-[10px] tracking-brand-wide uppercase opacity-60">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 w-full max-w-md">
          <p className="text-xs md:text-sm tracking-brand-wide uppercase opacity-80 mb-4">
            Drop your email — be the first alerted
          </p>
          {done ? (
            <p className="text-sm tracking-brand-wide uppercase">You're on the list ✦</p>
          ) : (
            <form onSubmit={submit} className="flex w-full border-b border-background/40 focus-within:border-background transition-colors">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent py-3 px-1 text-sm placeholder:text-background/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="text-[11px] tracking-brand-wide uppercase font-semibold py-3 px-2 hover:opacity-60 transition-opacity disabled:opacity-50"
              >
                {busy ? "…" : "Notify Me →"}
              </button>
            </form>
          )}
          {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
        </div>

        <p className="mt-12 text-[10px] tracking-brand-wide uppercase opacity-50">
          © Ovetone — Limited Quantities. No Restocks.
        </p>
        <Link
          to="/admin/leads"
          className="mt-4 text-[10px] text-background/30 hover:text-background/70 tracking-wide"
          aria-label="Admin"
        >
          ·
        </Link>
      </div>
    </main>
  );
}