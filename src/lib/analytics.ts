import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ovetone_session_id";
const ADMIN_EMAIL = "ovetonehelp@gmail.com";

let cachedIsAdmin: boolean | null = null;
async function isAdminViewer(): Promise<boolean> {
  if (cachedIsAdmin !== null) return cachedIsAdmin;
  try {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email?.toLowerCase() ?? "";
    cachedIsAdmin = email === ADMIN_EMAIL;
  } catch {
    cachedIsAdmin = false;
  }
  return cachedIsAdmin;
}
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_e, s) => {
    cachedIsAdmin = (s?.user?.email?.toLowerCase() ?? "") === ADMIN_EMAIL;
  });
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface GeoInfo {
  country: string | null;
  region: string | null;
  city: string | null;
}

let cachedGeo: GeoInfo | null = null;
async function getGeo(): Promise<GeoInfo> {
  if (cachedGeo) return cachedGeo;
  const empty: GeoInfo = { country: null, region: null, city: null };
  try {
    const cachedRaw = localStorage.getItem("ovetone_geo");
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as GeoInfo;
      cachedGeo = parsed;
      return parsed;
    }
    const res = await fetch("https://ipapi.co/json/");
    const json = await res.json();
    const geo: GeoInfo = {
      country: json?.country_name ?? null,
      region: json?.region ?? null,
      city: json?.city ?? null,
    };
    cachedGeo = geo;
    try {
      localStorage.setItem("ovetone_geo", JSON.stringify(geo));
      if (geo.country) localStorage.setItem("ovetone_country", geo.country);
    } catch {}
    return geo;
  } catch {}
  return empty;
}

interface TrackArgs {
  event_type: "product_view" | "add_to_cart" | "page_view" | "accept_offer";
  product_handle?: string;
  product_title?: string;
  path?: string;
}

export async function trackEvent(args: TrackArgs): Promise<void> {
  if (typeof window === "undefined") return;
  if (await isAdminViewer()) return;
  try {
    const geo = await getGeo();
    await supabase.from("analytics_events").insert({
      ...args,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      session_id: getSessionId(),
      path: args.path ?? window.location.pathname,
    });
  } catch {
    // best-effort
  }
}

export async function getVisitorGeo(): Promise<GeoInfo> {
  return getGeo();
}
