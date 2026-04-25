import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          width={800}
          height={1000}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            hover ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={product.hoverImage}
          alt=""
          aria-hidden="true"
          width={800}
          height={1000}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />
        {product.soldOut && (
          <span className="absolute left-3 top-3 z-10 bg-foreground text-background px-2.5 py-1 text-[10px] tracking-brand-wide uppercase font-semibold">
            Sold Out
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium tracking-tight">{product.name}</h3>
        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}