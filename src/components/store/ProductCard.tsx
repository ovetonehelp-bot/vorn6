import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { ShopifyProduct } from "@/lib/shopify";
import { useIsOutOfStock } from "@/hooks/useProductStatus";
import { useLocalPrice } from "@/hooks/useLocalPrice";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const images = product.images.map((i) => i.src).filter(Boolean);
  if (images.length === 0 && product.images[0]?.src) images.push(product.images[0].src);
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const basePrice = parseFloat(product.variants[0]?.price ?? "0");
  const displayPrice = useLocalPrice(basePrice);
  const outOfStock = useIsOutOfStock(product.handle);

  const go = (dir: 1 | -1) => {
    if (images.length < 2) return;
    setIdx((i) => (i + dir + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
    if (Math.abs(deltaX.current) > 8) setDragging(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (Math.abs(deltaX.current) > 40) {
      e.preventDefault();
      go(deltaX.current < 0 ? 1 : -1);
    }
    startX.current = null;
    setTimeout(() => setDragging(false), 0);
    deltaX.current = 0;
  };
  const handleLinkClick = (e: React.MouseEvent) => {
    if (dragging) e.preventDefault();
  };

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.handle }}
      className="group block"
      onClick={handleLinkClick}
    >
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative aspect-[4/5] overflow-hidden bg-muted transition-shadow duration-500 touch-pan-y ${
          outOfStock ? "shadow-[0_0_30px_-2px_rgba(239,68,68,0.6)] ring-1 ring-red-500/40" : ""
        }`}
      >
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={i === 0 ? product.title : ""}
            aria-hidden={i === 0 ? undefined : true}
            width={800}
            height={1000}
            loading="lazy"
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(-1); }}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(1); }}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === idx ? "w-4 bg-background" : "w-1.5 bg-background/50"
                  }`}
                />
              ))}
            </div>
          </>
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