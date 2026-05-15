import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteMode = "countdown" | "live";

export interface SiteConfig {
  mode: SiteMode;
  launch_at: string; // ISO
}

const DEFAULT: SiteConfig = { mode: "countdown", launch_at: "2026-06-15T12:00:00Z" };

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("site_config")
      .select("mode, launch_at")
      .eq("id", "singleton")
      .maybeSingle();
    setConfig(data ? (data as SiteConfig) : DEFAULT);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = (supabase as any)
      .channel("site_config_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_config" }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, []);

  return { config, loading, reload: load };
}