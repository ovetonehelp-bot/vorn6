import { useEffect, useState } from "react";
import { getVisitorGeo } from "@/lib/analytics";

type Money = { symbol: string; code: string; rate: number };

// Fixed conversion table (USD base). Intentional — we don't want live FX noise.
// All converted prices are rounded to end in 0 or 5.
const TABLE: Record<string, Money> = {
  US: { symbol: "$", code: "USD", rate: 1 },
  CA: { symbol: "CA$", code: "CAD", rate: 1.37 },
  GB: { symbol: "£", code: "GBP", rate: 0.79 },
  AU: { symbol: "A$", code: "AUD", rate: 1.52 },
  NZ: { symbol: "NZ$", code: "NZD", rate: 1.65 },
  GH: { symbol: "GH₵", code: "GHS", rate: 15.5 },
  NG: { symbol: "₦", code: "NGN", rate: 1600 },
  KE: { symbol: "KSh", code: "KES", rate: 130 },
  ZA: { symbol: "R", code: "ZAR", rate: 18.5 },
  IN: { symbol: "₹", code: "INR", rate: 83 },
  JP: { symbol: "¥", code: "JPY", rate: 155 },
  CH: { symbol: "CHF ", code: "CHF", rate: 0.88 },
  AE: { symbol: "AED ", code: "AED", rate: 3.67 },
  SA: { symbol: "SAR ", code: "SAR", rate: 3.75 },
};
const EUR: Money = { symbol: "€", code: "EUR", rate: 0.92 };
const EUR_COUNTRIES = new Set([
  "FR","DE","ES","IT","NL","BE","IE","PT","AT","FI","GR","LU","SK","SI","EE","LV","LT","MT","CY","HR"
]);

// country name -> ISO code (ipapi returns full name)
const NAME_TO_CODE: Record<string, string> = {
  "United States": "US", "Canada": "CA", "United Kingdom": "GB",
  "Australia": "AU", "New Zealand": "NZ", "Ghana": "GH", "Nigeria": "NG",
  "Kenya": "KE", "South Africa": "ZA", "India": "IN", "Japan": "JP",
  "Switzerland": "CH", "United Arab Emirates": "AE", "Saudi Arabia": "SA",
  "France": "FR", "Germany": "DE", "Spain": "ES", "Italy": "IT",
  "Netherlands": "NL", "Belgium": "BE", "Ireland": "IE", "Portugal": "PT",
  "Austria": "AT", "Finland": "FI", "Greece": "GR",
};

function roundTo5(n: number): number {
  if (n >= 1000) return Math.round(n / 10) * 10; // bigger numbers: nearest 10
  return Math.max(5, Math.round(n / 5) * 5);
}

export function useMoney(): Money {
  const [m, setM] = useState<Money>(TABLE.US);
  useEffect(() => {
    let alive = true;
    getVisitorGeo().then((g) => {
      if (!alive) return;
      const name = g.country ?? "";
      const code = NAME_TO_CODE[name];
      if (code && TABLE[code]) setM(TABLE[code]);
      else if (code && EUR_COUNTRIES.has(code)) setM(EUR);
    });
    return () => { alive = false; };
  }, []);
  return m;
}

export function formatLocal(usd: number, m: Money): string {
  const converted = usd * m.rate;
  const rounded = roundTo5(converted);
  const s = rounded.toLocaleString("en-US");
  return `${m.symbol}${s}`;
}

export function useLocalPrice(usd: number): string {
  const m = useMoney();
  return formatLocal(usd, m);
}