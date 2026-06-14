import { getMoneyForCountry, formatLocal } from "@/lib/money";
import { getBackupProducts } from "@/lib/backup.functions";
const SHOPIFY_DOMAIN = "ovetone.myshopify.com";

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  featured_image?: { id: number; src: string } | null;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  images: ShopifyImage[];
  options: { name: string; values: string[] }[];
  variants: ShopifyVariant[];
  _source?: "shopify" | "admin";
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  try {
    const [res, backup] = await Promise.all([
      fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=50`),
      getBackupProducts().catch(() => ({ products: [], hidden_handles: [] })),
    ]);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const products = data.products as ShopifyProduct[];
    if (!products || products.length === 0) throw new Error("empty");
    const managed = (backup.products ?? []).filter(
      (p: any) => p._source === "admin",
    ) as ShopifyProduct[];
    const managedHandles = new Set(managed.map((p) => p.handle));
    const hiddenHandles = new Set(backup.hidden_handles ?? []);
    return [
      ...products.filter((p) => !managedHandles.has(p.handle) && !hiddenHandles.has(p.handle)),
      ...managed,
    ];
  } catch (e) {
    // Shopify unavailable (account closed, network, etc.) — use safe backup.
    try {
      const backup = await getBackupProducts();
      return (backup.products ?? []) as ShopifyProduct[];
    } catch {
      throw new Error("Failed to fetch products");
    }
  }
}

export async function fetchShopifyProduct(handle: string): Promise<ShopifyProduct | null> {
  const products = await fetchShopifyProducts();
  return products.find((p) => p.handle === handle) ?? null;
}

/**
 * Build a permalink to Shopify checkout for given cart items.
 * Format: https://ovetone.com/cart/{variantId}:{qty},{variantId}:{qty}
 */
export function buildCheckoutUrl(items: { variantId: number; quantity: number }[]): string {
  const base = "https://ovetone.com";
  if (items.length === 0) return `${base}/cart`;
  const path = items.map((i) => `${i.variantId}:${i.quantity}`).join(",");
  return `${base}/cart/${path}`;
}

export function formatPrice(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  const country = typeof window !== "undefined" ? localStorage.getItem("ovetone_country") : null;
  return formatLocal(n, getMoneyForCountry(country));
}
