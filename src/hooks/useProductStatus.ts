import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type StatusMap = Record<string, boolean>;
let cache: StatusMap | null = null;
const listeners = new Set<(m: StatusMap) => void>();
let inflight: Promise<StatusMap> | null = null;

async function load(): Promise<StatusMap> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("product_status")
      .select("product_handle, out_of_stock");
    const map: StatusMap = {};
    (data ?? []).forEach((r: any) => {
      map[r.product_handle] = !!r.out_of_stock;
    });
    cache = map;
    listeners.forEach((l) => l(map));
    return map;
  })();
  return inflight;
}

export function refreshProductStatus() {
  inflight = null;
  return load();
}

export function useProductStatusMap(): StatusMap {
  const [map, setMap] = useState<StatusMap>(cache ?? {});
  useEffect(() => {
    listeners.add(setMap);
    if (!cache) load();
    return () => {
      listeners.delete(setMap);
    };
  }, []);
  return map;
}

export function useIsOutOfStock(handle: string): boolean {
  const map = useProductStatusMap();
  return !!map[handle];
}