import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { StoreLayout } from "@/components/store/StoreLayout";

const ADMIN_EMAIL = "ovetonehelp@gmail.com";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Admin — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: AdminLeadsPage,
});

interface Lead {
  id: string;
  email: string;
  interest: string;
  code: string;
  country: string | null;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  product_handle: string | null;
  product_title: string | null;
  country: string | null;
  path: string | null;
  session_id: string | null;
  created_at: string;
}

type Range = "24h" | "7d" | "30d" | "all";

function rangeStart(r: Range): Date | null {
  const now = Date.now();
  if (r === "24h") return new Date(now - 24 * 3600 * 1000);
  if (r === "7d") return new Date(now - 7 * 24 * 3600 * 1000);
  if (r === "30d") return new Date(now - 30 * 24 * 3600 * 1000);
  return null;
}

function AdminLeadsPage() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [range, setRange] = useState<Range>("7d");

  useEffect(() => {
    if (!user) {
      setIsAdmin(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingData(true);
    Promise.all([
      supabase.from("discount_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5000),
    ]).then(([l, e]) => {
      setLeads((l.data ?? []) as Lead[]);
      setEvents((e.data ?? []) as AnalyticsEvent[]);
      setLoadingData(false);
    });
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const start = rangeStart(range);
    const evs = start ? events.filter((e) => new Date(e.created_at) >= start) : events;
    const lds = start ? leads.filter((l) => new Date(l.created_at) >= start) : leads;
    return { evs, lds };
  }, [events, leads, range]);

  const stats = useMemo(() => {
    const { evs } = filtered;
    const views = evs.filter((e) => e.event_type === "product_view");
    const adds = evs.filter((e) => e.event_type === "add_to_cart");
    const uniqueVisitors = new Set(evs.map((e) => e.session_id).filter(Boolean)).size;
    const conversion = views.length > 0 ? (adds.length / views.length) * 100 : 0;
    return {
      views: views.length,
      adds: adds.length,
      uniqueVisitors,
      conversion,
      leads: filtered.lds.length,
    };
  }, [filtered]);

  const productStats = useMemo(() => {
    const map = new Map<string, { title: string; views: number; adds: number }>();
    for (const e of filtered.evs) {
      if (!e.product_handle) continue;
      const k = e.product_handle;
      const cur = map.get(k) ?? { title: e.product_title ?? k, views: 0, adds: 0 };
      if (e.event_type === "product_view") cur.views++;
      if (e.event_type === "add_to_cart") cur.adds++;
      map.set(k, cur);
    }
    return [...map.entries()]
      .map(([handle, v]) => ({ handle, ...v, rate: v.views ? (v.adds / v.views) * 100 : 0 }))
      .sort((a, b) => b.views - a.views);
  }, [filtered]);

  const countryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered.evs) {
      const c = e.country ?? "Unknown";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filtered]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setAuthBusy(false);
    if (error) setAuthError(error);
  };

  if (authLoading) {
    return <StoreLayout><div className="py-32 text-center text-sm">Loading…</div></StoreLayout>;
  }

  if (!user) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md py-20 px-5">
          <h1 className="font-display font-black text-3xl tracking-tight text-center">Admin Access</h1>
          <p className="mt-2 text-xs tracking-brand-wide uppercase text-muted-foreground text-center">
            {mode === "signin" ? "Sign in" : "Create your admin password"}
          </p>
          <form onSubmit={handleAuth} className="mt-8 space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
            {authError && <p className="text-xs text-destructive">{authError}</p>}
            <button type="submit" disabled={authBusy}
              className="w-full bg-foreground text-background py-3 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-50">
              {authBusy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            <button type="button" onClick={() => { setAuthError(null); setMode(mode === "signin" ? "signup" : "signin"); }}
              className="w-full text-[11px] tracking-brand-wide uppercase text-muted-foreground hover:text-foreground underline underline-offset-4">
              {mode === "signin" ? "First time? Create password" : "Already have an account? Sign in"}
            </button>
          </form>
        </div>
      </StoreLayout>
    );
  }

  if (isAdmin === null) {
    return <StoreLayout><div className="py-32 text-center text-sm">Checking access…</div></StoreLayout>;
  }

  if (!isAdmin) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md py-20 px-5 text-center">
          <h1 className="font-display font-black text-2xl">Not Authorized</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This account ({user.email}) is not an admin. Sign in with {ADMIN_EMAIL}.
          </p>
          <button onClick={async () => { await signOut(); navigate({ to: "/admin/leads" }); }}
            className="mt-6 bg-foreground text-background px-6 py-3 text-[12px] tracking-brand-wide uppercase font-semibold">
            Sign Out
          </button>
        </div>
      </StoreLayout>
    );
  }

  const ranges: { id: Range; label: string }[] = [
    { id: "24h", label: "Last 24h" },
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "all", label: "All time" },
  ];

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl py-12 px-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-black text-3xl tracking-tight">Analytics</h1>
            <p className="mt-1 text-xs tracking-brand-wide uppercase text-muted-foreground">
              Ovetone admin dashboard
            </p>
          </div>
          <button onClick={() => signOut()} className="text-[11px] tracking-brand-wide uppercase underline underline-offset-4">
            Sign Out
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {ranges.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 text-[11px] tracking-brand-wide uppercase border transition-colors ${
                range === r.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Visitors" value={stats.uniqueVisitors} />
          <StatCard label="Product Views" value={stats.views} />
          <StatCard label="Add to Cart" value={stats.adds} />
          <StatCard label="Conversion" value={`${stats.conversion.toFixed(1)}%`} />
          <StatCard label="Subscribers" value={stats.leads} />
        </div>

        {loadingData && <p className="mt-8 text-center text-sm text-muted-foreground">Loading data…</p>}

        {/* Product performance */}
        <section className="mt-10">
          <h2 className="font-display font-black text-xl tracking-tight">Product Performance</h2>
          <div className="mt-4 border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] tracking-brand-wide uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Added to Cart</th>
                  <th className="px-4 py-3 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {productStats.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No product data yet.</td></tr>
                )}
                {productStats.map((p) => (
                  <tr key={p.handle} className="border-t border-border">
                    <td className="px-4 py-3">{p.title}</td>
                    <td className="px-4 py-3 text-right">{p.views}</td>
                    <td className="px-4 py-3 text-right">{p.adds}</td>
                    <td className="px-4 py-3 text-right">{p.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top countries */}
        <section className="mt-10">
          <h2 className="font-display font-black text-xl tracking-tight">Top Countries</h2>
          <div className="mt-4 border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] tracking-brand-wide uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-right">Events</th>
                </tr>
              </thead>
              <tbody>
                {countryStats.length === 0 && (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">No data yet.</td></tr>
                )}
                {countryStats.map(([c, n]) => (
                  <tr key={c} className="border-t border-border">
                    <td className="px-4 py-3">{c}</td>
                    <td className="px-4 py-3 text-right">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subscribers */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display font-black text-xl tracking-tight">Promo Subscribers</h2>
            <span className="text-xs text-muted-foreground">{filtered.lds.length} in range</span>
          </div>
          <div className="mt-4 border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] tracking-brand-wide uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Interest</th>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.lds.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No subscribers yet.</td></tr>
                )}
                {filtered.lds.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-3">{l.email}</td>
                    <td className="px-4 py-3 capitalize">{l.interest}</td>
                    <td className="px-4 py-3">{l.country ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-10 text-[11px] text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">← Back to store</Link>
        </p>
      </div>
    </StoreLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border p-4">
      <p className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-display font-black text-2xl tracking-tight">{value}</p>
    </div>
  );
}
