const SHOPIFY_DOMAIN = "ovetone.myshopify.com";

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
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
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.products as ShopifyProduct[];
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
  return `$${n.toFixed(2)}`;
}