import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ovetone_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

let cachedCountry: string | null = null;
async function getCountry(): Promise<string | null> {
  if (cachedCountry) return cachedCountry;
  try {
    const cached = localStorage.getItem("ovetone_country");
    if (cached) {
      cachedCountry = cached;
      return cached;
    }
    const res = await fetch("https://ipapi.co/json/");
    const json = await res.json();
    if (json?.country_name) {
      cachedCountry = json.country_name;
      localStorage.setItem("ovetone_country", json.country_name);
      return cachedCountry;
    }
  } catch {}
  return null;
}

interface TrackArgs {
  event_type: "product_view" | "add_to_cart" | "page_view";
  product_handle?: string;
  product_title?: string;
  path?: string;
}

export async function trackEvent(args: TrackArgs): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const country = await getCountry();
    await supabase.from("analytics_events").insert({
      ...args,
      country,
      session_id: getSessionId(),
      path: args.path ?? window.location.pathname,
    });
  } catch {
    // best-effort
  }
}
