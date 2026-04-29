import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { StoreLayout } from "@/components/store/StoreLayout";

const ADMIN_EMAIL = "ovetonehelp@gmail.com";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Admin — Leads" }, { name: "robots", content: "noindex" }] }),
  component: AdminLeadsPage,
});

interface Lead {
  id: string;
  email: string;
  interest: string;
  code: string;
  created_at: string;
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
  const [loadingLeads, setLoadingLeads] = useState(false);

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
    setLoadingLeads(true);
    supabase
      .from("discount_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLeads((data ?? []) as Lead[]);
        setLoadingLeads(false);
      });
  }, [isAdmin]);

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
            {authError && <p className="text-xs text-destructive">{authError}</p>}
            <button
              type="submit"
              disabled={authBusy}
              className="w-full bg-foreground text-background py-3 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {authBusy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => { setAuthError(null); setMode(mode === "signin" ? "signup" : "signin"); }}
              className="w-full text-[11px] tracking-brand-wide uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
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
          <button
            onClick={async () => { await signOut(); navigate({ to: "/admin/leads" }); }}
            className="mt-6 bg-foreground text-background px-6 py-3 text-[12px] tracking-brand-wide uppercase font-semibold"
          >
            Sign Out
          </button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl py-12 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl tracking-tight">Discount Leads</h1>
            <p className="mt-1 text-xs tracking-brand-wide uppercase text-muted-foreground">
              {leads.length} subscriber{leads.length === 1 ? "" : "s"}
            </p>
          </div>
          <button onClick={() => signOut()} className="text-[11px] tracking-brand-wide uppercase underline underline-offset-4">
            Sign Out
          </button>
        </div>

        <div className="mt-8 border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-[11px] tracking-brand-wide uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Interest</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingLeads && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loadingLeads && leads.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No leads yet.</td></tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3">{l.email}</td>
                  <td className="px-4 py-3 capitalize">{l.interest}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">← Back to store</Link>
        </p>
      </div>
    </StoreLayout>
  );
}
