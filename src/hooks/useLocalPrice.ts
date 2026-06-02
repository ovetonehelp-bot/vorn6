import { useEffect, useState } from "react";
import { getVisitorGeo } from "@/lib/analytics";
import { getMoneyForCountry, formatLocal, type Money } from "@/lib/money";

export function useMoney(): Money {
  const [m, setM] = useState<Money>(() => {
    if (typeof window === "undefined") return getMoneyForCountry(null);
    return getMoneyForCountry(localStorage.getItem("ovetone_country"));
  });
  useEffect(() => {
    let alive = true;
    getVisitorGeo().then((g) => {
      if (!alive) return;
      setM(getMoneyForCountry(g.country));
    });
    return () => { alive = false; };
  }, []);
  return m;
}

export function useLocalPrice(usd: number): string {
  const m = useMoney();
  return formatLocal(usd, m);
}