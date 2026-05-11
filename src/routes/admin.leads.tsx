import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { refreshProductStatus } from "@/hooks/useProductStatus";

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
  region?: string | null;
  city?: string | null;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  product_handle: string | null;
  product_title: string | null;
  country: string | null;
  region?: string | null;
  city?: string | null;
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
  const [clearing, setClearing] = useState(false);
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const { products: shopifyProducts } = useShopifyProducts();
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [savingHandle, setSavingHandle] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

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
    loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("product_status").select("product_handle, out_of_stock").then(({ data }) => {
      const m: Record<string, boolean> = {};
      (data ?? []).forEach((r: any) => { m[r.product_handle] = !!r.out_of_stock; });
      setStatusMap(m);
    });
  }, [isAdmin]);

  const toggleStock = async (handle: string) => {
    const next = !statusMap[handle];
    setSavingHandle(handle);
    const { error } = await supabase
      .from("product_status")
      .upsert({ product_handle: handle, out_of_stock: next, updated_at: new Date().toISOString() });
    setSavingHandle(null);
    if (error) { alert("Failed: " + error.message); return; }
    setStatusMap((m) => ({ ...m, [handle]: next }));
    refreshProductStatus();
  };

  const loadData = () => {
    setLoadingData(true);
    Promise.all([
      supabase.from("discount_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5000),
    ]).then(([l, e]) => {
      setLeads((l.data ?? []) as Lead[]);
      setEvents((e.data ?? []) as AnalyticsEvent[]);
      setLoadingData(false);
    });
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL analytics events and promo subscribers? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? This wipes every record.")) return;
    setClearing(true);
    const [evRes, ldRes] = await Promise.all([
      supabase.from("analytics_events").delete().not("id", "is", null),
      supabase.from("discount_leads").delete().not("id", "is", null),
    ]);
    setClearing(false);
    if (evRes.error || ldRes.error) {
      alert("Failed to clear: " + (evRes.error?.message ?? ldRes.error?.message));
      return;
    }
    setEvents([]);
    setLeads([]);
  };

  const handleDeleteSession = async (sid: string) => {
    if (!confirm("Delete all events from this session? This cannot be undone.")) return;
    setDeletingSession(sid);
    const { error } = await supabase
      .from("analytics_events")
      .delete()
      .eq("session_id", sid);
    setDeletingSession(null);
    if (error) {
      alert("Failed: " + error.message);
      return;
    }
    setEvents((evs) => evs.filter((e) => e.session_id !== sid));
  };

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
    const accepts = evs.filter((e) => e.event_type === "accept_offer");
    const uniqueVisitors = new Set(evs.map((e) => e.session_id).filter(Boolean)).size;
    const conversion = views.length > 0 ? (accepts.length / views.length) * 100 : 0;
    return {
      views: views.length,
      adds: adds.length,
      accepts: accepts.length,
      uniqueVisitors,
      conversion,
      leads: filtered.lds.length,
    };
  }, [filtered]);

  const productStats = useMemo(() => {
    const map = new Map<string, { title: string; views: number; adds: number; accepts: number }>();
    for (const e of filtered.evs) {
      if (!e.product_handle) continue;
      const k = e.product_handle;
      const cur = map.get(k) ?? { title: e.product_title ?? k, views: 0, adds: 0, accepts: 0 };
      if (e.event_type === "product_view") cur.views++;
      if (e.event_type === "add_to_cart") cur.adds++;
      if (e.event_type === "accept_offer") cur.accepts++;
      map.set(k, cur);
    }
    return [...map.entries()]
      .map(([handle, v]) => ({ handle, ...v, rate: v.views ? (v.accepts / v.views) * 100 : 0 }))
      .sort((a, b) => b.views - a.views);
  }, [filtered]);

  // Country -> { sessions: Map<sessionId, events[]>, total events count }
  const countryStats = useMemo(() => {
    const map = new Map<string, { sessions: Map<string, AnalyticsEvent[]>; events: number }>();
    for (const e of filtered.evs) {
      const c = e.country ?? "Unknown";
      const sid = e.session_id ?? "anon";
      const cur = map.get(c) ?? { sessions: new Map(), events: 0 };
      cur.events++;
      const arr = cur.sessions.get(sid) ?? [];
      arr.push(e);
      cur.sessions.set(sid, arr);
      map.set(c, cur);
    }
    return [...map.entries()]
      .map(([country, v]) => ({
        country,
        events: v.events,
        visitors: v.sessions.size,
        sessions: v.sessions,
      }))
      .sort((a, b) => b.visitors - a.visitors);
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

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="text-[11px] tracking-brand-wide uppercase border border-destructive text-destructive px-3 py-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          >
            {clearing ? "Clearing…" : "Clear All Data"}
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatCard label="Visitors" value={stats.uniqueVisitors} />
          <StatCard label="Product Views" value={stats.views} />
          <StatCard label="Add to Cart" value={stats.adds} />
          <StatCard label="Accepted Offers" value={stats.accepts} />
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
                  <th className="px-4 py-3 text-right">Accepted</th>
                  <th className="px-4 py-3 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {productStats.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No product data yet.</td></tr>
                )}
                {productStats.map((p) => (
                  <tr key={p.handle} className="border-t border-border">
                    <td className="px-4 py-3">{p.title}</td>
                    <td className="px-4 py-3 text-right">{p.views}</td>
                    <td className="px-4 py-3 text-right">{p.adds}</td>
                    <td className="px-4 py-3 text-right">{p.accepts}</td>
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
          <p className="text-[11px] text-muted-foreground mt-1">Tap a country to see each visitor's product activity.</p>
          <div className="mt-4 border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] tracking-brand-wide uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-right">Visitors</th>
                  <th className="px-4 py-3 text-right">Events</th>
                </tr>
              </thead>
              <tbody>
                {countryStats.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No data yet.</td></tr>
                )}
                {countryStats.map((c) => {
                  const isOpen = openCountry === c.country;
                  const sessionList = isOpen ? [...c.sessions.entries()] : [];
                  return (
                    <Fragment key={c.country}>
                      <tr
                        onClick={() => setOpenCountry(isOpen ? null : c.country)}
                        className="border-t border-border cursor-pointer hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-medium">
                          <span className="inline-block w-3 mr-1 text-muted-foreground">{isOpen ? "▾" : "▸"}</span>
                          {c.country}
                        </td>
                        <td className="px-4 py-3 text-right">{c.visitors}</td>
                        <td className="px-4 py-3 text-right">{c.events}</td>
                      </tr>
                      {isOpen && sessionList.map(([sid, evs], idx) => {
                        const productMap = new Map<string, { title: string; views: number; adds: number; accepts: number }>();
                        for (const e of evs) {
                          if (!e.product_handle) continue;
                          const cur = productMap.get(e.product_handle) ?? { title: e.product_title ?? e.product_handle, views: 0, adds: 0, accepts: 0 };
                          if (e.event_type === "product_view") cur.views++;
                          if (e.event_type === "add_to_cart") cur.adds++;
                          if (e.event_type === "accept_offer") cur.accepts++;
                          productMap.set(e.product_handle, cur);
                        }
                        const products = [...productMap.values()].sort((a, b) => b.views - a.views);
                        const lastSeen = evs.reduce((d, e) => {
                          const t = new Date(e.created_at).getTime();
                          return t > d ? t : d;
                        }, 0);
                        const locParts = [
                          evs.find((e) => e.city)?.city,
                          evs.find((e) => e.region)?.region,
                        ].filter(Boolean);
                        const locLabel = locParts.length ? locParts.join(", ") : "Unknown area";
                        return (
                          <tr key={sid} className="border-t border-border bg-muted/20">
                            <td colSpan={3} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="text-[11px] tracking-brand-wide uppercase font-semibold">
                                  {locLabel} · {c.country} #{idx + 1} · <span className="text-muted-foreground normal-case tracking-normal">last seen {new Date(lastSeen).toLocaleString()}</span>
                                </div>
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); handleDeleteSession(sid); }}
                                  disabled={deletingSession === sid}
                                  className="shrink-0 text-[10px] tracking-brand-wide uppercase border border-destructive text-destructive px-2 py-1 hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                                >
                                  {deletingSession === sid ? "…" : "Delete"}
                                </button>
                              </div>
                              {products.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Browsed without viewing a product.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {products.map((p) => (
                                    <li key={p.title} className="text-xs flex flex-wrap justify-between gap-2 py-1 border-b border-border/40 last:border-0">
                                      <span className="font-medium">{p.title}</span>
                                      <span className="text-muted-foreground tabular-nums">
                                        {p.views} view{p.views === 1 ? "" : "s"} · {p.adds} cart · {p.accepts} accepted
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subscribers */}
        <section className="mt-10">
          <h2 className="font-display font-black text-xl tracking-tight">Inventory</h2>
          <p className="text-[11px] text-muted-foreground mt-1">Toggle a product to mark it as sold out — the storefront badge turns red.</p>
          <div className="mt-4 border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] tracking-brand-wide uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {shopifyProducts.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Loading products…</td></tr>
                )}
                {shopifyProducts.map((p) => {
                  const oos = !!statusMap[p.handle];
                  return (
                    <tr key={p.handle} className="border-t border-border">
                      <td className="px-4 py-3">{p.title}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] tracking-brand-wide uppercase font-semibold ${oos ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${oos ? "bg-red-500" : "bg-emerald-500"}`} />
                          {oos ? "Out of stock" : "In stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleStock(p.handle)}
                          disabled={savingHandle === p.handle}
                          className="text-[11px] tracking-brand-wide uppercase border border-border px-3 py-1.5 hover:border-foreground transition-colors disabled:opacity-50"
                        >
                          {savingHandle === p.handle ? "…" : oos ? "Mark In Stock" : "Mark Sold Out"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

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
