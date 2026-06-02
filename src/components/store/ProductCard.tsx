import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ShopifyProduct } from "@/lib/shopify";
import { useIsOutOfStock } from "@/hooks/useProductStatus";
import { useLocalPrice } from "@/hooks/useLocalPrice";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const [hover, setHover] = useState(false);
  const primary = product.images[0]?.src;
  const secondary = product.images[1]?.src ?? primary;
  const basePrice = parseFloat(product.variants[0]?.price ?? "0");
  const displayPrice = useLocalPrice(basePrice);
  const outOfStock = useIsOutOfStock(product.handle);

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.handle }}
      className="group block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`relative aspect-[4/5] overflow-hidden bg-muted transition-shadow duration-500 ${
          outOfStock ? "shadow-[0_0_30px_-2px_rgba(239,68,68,0.6)] ring-1 ring-red-500/40" : ""
        }`}
      >
        {primary && (
          <img
            src={primary}
            alt={product.title}
            width={800}
            height={1000}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              hover && secondary !== primary ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
        {secondary && secondary !== primary && (
          <img
            src={secondary}
            alt=""
            aria-hidden="true"
            width={800}
            height={1000}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              hover ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] tracking-brand-wide uppercase font-semibold">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                outOfStock ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                outOfStock
                  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                  : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              }`}
            />
          </span>
          {outOfStock ? "Sold Out" : "In Stock"}
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium tracking-tight line-clamp-1">{product.title}</h3>
        <p className="text-sm text-muted-foreground whitespace-nowrap">{displayPrice}</p>
      </div>
    </Link>
  );
}