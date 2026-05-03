import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchShopifyProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/analytics";
import { flyToCart } from "@/lib/flyToCart";
import { useIsOutOfStock } from "@/hooks/useProductStatus";

export const Route = createFileRoute("/products/$slug")({
  head: () => ({
    meta: [
      { title: "Product — Ovetone" },
      { property: "og:title", content: "Ovetone Drop 001" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem, setOpen: setCartOpen } = useCart();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const outOfStock = useIsOutOfStock(slug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined);
  const [variantId, setVariantId] = useState<number>(0);
  const [related, setRelated] = useState<ShopifyProduct[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [addedBundle, setAddedBundle] = useState<number | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeImage || !thumbsRef.current) return;
    const el = thumbsRef.current.querySelector<HTMLElement>(`[data-img-src="${activeImage}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeImage]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchShopifyProducts()
      .then((all) => {
        if (!mounted) return;
        const found = all.find((p) => p.handle === slug) ?? null;
        setProduct(found);
        if (found) {
          setActiveImage(found.images[0]?.src);
          setVariantId(found.variants[0]?.id ?? 0);
          setRelated(all.filter((p) => p.handle !== found.handle).slice(0, 4));
          trackEvent({
            event_type: "product_view",
            product_handle: found.handle,
            product_title: found.title,
          });
        }
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load product");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 animate-pulse">
            <div className="aspect-[4/5] bg-muted" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 bg-muted" />
              <div className="h-6 w-24 bg-muted" />
              <div className="h-4 w-full bg-muted" />
              <div className="h-4 w-5/6 bg-muted" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (error || !product) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md text-center py-32 px-5">
          <h1 className="font-display font-black text-4xl mb-4">
            {error ? "Couldn't load product" : "Product not found"}
          </h1>
          {error && <p className="text-sm text-muted-foreground mb-6">{error}</p>}
          <Link to="/shop" className="text-sm tracking-brand uppercase underline underline-offset-4">
            Back to shop
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const firstImage = product.images[0]?.src;

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const sizeOption = product.options.find((o) => o.name.toLowerCase() === "size");
  const sizes = sizeOption?.values ?? [];
  const colorOption = product.options.find((o) => {
    const n = o.name.toLowerCase();
    return n === "color" || n === "colour";
  });
  const colors = colorOption?.values ?? [];
  const colorOptionIndex = colorOption
    ? product.options.findIndex((o) => o.name === colorOption.name)
    : -1;
  const sizeOptionIndex = sizeOption
    ? product.options.findIndex((o) => o.name === sizeOption.name)
    : -1;

  const getOptionValue = (v: typeof variant, idx: number): string | null => {
    if (!v || idx < 0) return null;
    if (idx === 0) return v.option1;
    if (idx === 1) return v.option2;
    if (idx === 2) return v.option3;
    return null;
  };

  const currentSize = getOptionValue(variant, sizeOptionIndex);
  const currentColor = getOptionValue(variant, colorOptionIndex);

  const selectSize = (s: string) => {
    const match =
      product.variants.find((v) => {
        const vSize = getOptionValue(v, sizeOptionIndex);
        const vColor = getOptionValue(v, colorOptionIndex);
        return vSize === s && (colorOptionIndex < 0 || vColor === currentColor);
      }) ?? product.variants.find((v) => getOptionValue(v, sizeOptionIndex) === s);
    if (match) setVariantId(match.id);
  };

  const selectColor = (c: string) => {
    const match =
      product.variants.find((v) => {
        const vColor = getOptionValue(v, colorOptionIndex);
        const vSize = getOptionValue(v, sizeOptionIndex);
        return vColor === c && (sizeOptionIndex < 0 || vSize === currentSize);
      }) ?? product.variants.find((v) => getOptionValue(v, colorOptionIndex) === c);
    if (match) {
      setVariantId(match.id);
      const img = match.featured_image?.src;
      if (img) setActiveImage(img);
    }
  };

  // Strip HTML for description and truncate
  const plainDesc = product.body_html
    ? product.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";
  const DESC_LIMIT = 220;
  const isLong = plainDesc.length > DESC_LIMIT;
  const shortDesc = isLong ? plainDesc.slice(0, DESC_LIMIT).trimEnd() + "…" : plainDesc;
  // Bullet split: prefer existing <li>, else split by sentence
  const bullets: string[] = (() => {
    const liMatches = product.body_html?.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (liMatches && liMatches.length > 0) {
      return liMatches
        .map((m) => m.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean);
    }
    return plainDesc
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  })();

  // Bundle pricing logic — customer never sees the raw base price.
  // Option 1 = base +20%, Option 2 = base +10%, Option 3 = base (still labeled as biggest discount).
  const basePrice = parseFloat(variant?.price ?? "0");
  const bundles = [
    { units: 1, multiplier: 1.00, label: null as string | null, badge: null as string | null },
    { units: 2, multiplier: 0.90, label: "10% OFF", badge: "POPULAR" },
    { units: 3, multiplier: 0.80, label: "20% OFF", badge: "BEST VALUE" },
  ];
  const displayUnitPrice = basePrice.toFixed(2);

  const selectBundle = (units: number, multiplier: number, sourceEl: HTMLElement | null) => {
    if (!variant || outOfStock) return;
    setSelectedBundle(units);
    // Per-unit price stored in cart so totals reflect the chosen bundle exactly.
    const perUnit = (basePrice * multiplier).toFixed(2);
    setAddedBundle(units);
    window.setTimeout(() => setAddedBundle((v) => (v === units ? null : v)), 1200);

    const doAdd = () => {
      addItem(
        {
          variantId: variant.id,
          productHandle: product.handle,
          productTitle: product.title,
          variantTitle: variant.title,
          image: firstImage ?? "",
          price: perUnit,
        },
        units,
        { openDrawer: false, replace: true },
      );
      trackEvent({
        event_type: "add_to_cart",
        product_handle: product.handle,
        product_title: product.title,
      });
    };

    // Brief highlight, then fly-to-cart, then update count + open drawer.
    window.setTimeout(() => {
      if (sourceEl && firstImage) {
        flyToCart(sourceEl, firstImage, () => {
          doAdd();
          window.setTimeout(() => {
            setCartOpen(true);
            setSelectedBundle(null);
          }, 200);
        });
      } else {
        doAdd();
        setCartOpen(true);
        setSelectedBundle(null);
      }
    }, 120);
  };

  return (
    <StoreLayout>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-4 pb-12 md:pt-6 md:pb-20 animate-fade-in">
        <p className="text-[10px] tracking-brand-wide uppercase text-muted-foreground mb-3">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <span className="mx-2">/</span>
          {product.title}
        </p>

        <div className="grid md:grid-cols-2 gap-5 md:gap-10 lg:gap-14">
          <div className="animate-fade-in" style={{ animationDelay: "0.05s", animationFillMode: "backwards" }}>
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              {activeImage && (
                <img src={activeImage} alt={product.title} width={800} height={1000} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              )}
            </div>
            {product.images.length > 1 && (
              <div ref={thumbsRef} className="mt-2 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    data-img-src={img.src}
                    onClick={() => setActiveImage(img.src)}
                    className={`flex-shrink-0 w-16 md:w-20 aspect-square overflow-hidden bg-muted border snap-start transition-all hover:opacity-80 ${
                      activeImage === img.src ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:pt-2 animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}>
            <h1 className="font-display font-black text-2xl md:text-4xl tracking-tight">
              {product.title}
            </h1>
            <p className="mt-2 text-lg">{formatPrice(displayUnitPrice)}</p>

            <div className="mt-3 flex items-center gap-2">
              {outOfStock ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                  </span>
                  <span className="text-[10px] tracking-brand-wide uppercase font-semibold text-red-600 dark:text-red-400">
                    Out of Stock — Sorry
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="text-[10px] tracking-brand-wide uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                    In Stock — Ships in 24 hrs
                  </span>
                </>
              )}
            </div>

            {sizes.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] tracking-brand-wide uppercase font-semibold">Size</span>
                  {currentSize && (
                    <span className="text-[11px] tracking-brand-wide uppercase text-muted-foreground">
                      {currentSize}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {sizes.map((s) => {
                    const selected = currentSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => selectSize(s)}
                        className={`py-2.5 text-xs tracking-brand uppercase font-medium border transition-all duration-200 hover:-translate-y-0.5 ${
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] tracking-brand-wide uppercase font-semibold">Color</span>
                  {currentColor && (
                    <span className="text-[11px] tracking-brand-wide uppercase text-muted-foreground">
                      {currentColor}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((c) => {
                    const selected = currentColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => selectColor(c)}
                        className={`px-4 py-2.5 text-xs tracking-brand uppercase font-medium border transition-all duration-200 hover:-translate-y-0.5 ${
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bundle & Save section */}
            <div className="mt-6 border-t border-border pt-5 relative">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold">Choose Your Bundle</h2>
                <span className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Limited time</span>
              </div>
              <div className={`grid grid-cols-3 gap-2 pt-3 relative ${outOfStock ? "opacity-50 pointer-events-none" : ""}`}>
                {outOfStock && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <div className="w-full h-1 bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                    <span className="absolute bg-red-600 text-white text-[10px] tracking-brand-wide uppercase font-bold px-3 py-1 rounded-full">
                      Out of Stock
                    </span>
                  </div>
                )}
                {bundles.map((b, i) => {
                  const total = basePrice * b.units * b.multiplier;
                  const compareTotal = basePrice * b.units;
                  const hasSavings = b.units > 1;
                  const isBest = i === 2;
                  return (
                    <button
                      key={b.units}
                      onClick={(e) => selectBundle(b.units, b.multiplier, e.currentTarget)}
                      className={`relative text-left border p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
                        selectedBundle === b.units
                          ? "border-foreground bg-foreground text-background scale-[1.03]"
                          : isBest
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground"
                      } ${addedBundle === b.units ? "animate-button-pulse" : ""}`}
                    >
                      {addedBundle === b.units && (
                        <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-[10px] tracking-brand-wide uppercase font-bold text-emerald-600 dark:text-emerald-400 animate-float-up">
                          + Added
                        </span>
                      )}
                      {b.badge && (
                        <span className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] tracking-brand-wide uppercase font-bold whitespace-nowrap ${
                          isBest ? "bg-emerald-500 text-white" : "bg-foreground text-background"
                        }`}>
                          {b.badge}
                        </span>
                      )}
                      <div className="text-[10px] tracking-brand-wide uppercase font-semibold text-muted-foreground">
                        {b.units} {b.units === 1 ? "Unit" : "Units"}
                      </div>
                      <div className="mt-1 font-display font-black text-lg leading-tight">
                        {formatPrice(total)}
                      </div>
                      {hasSavings && (
                        <div className="text-[10px] text-muted-foreground line-through">
                          {formatPrice(compareTotal)}
                        </div>
                      )}
                      {b.label && (
                        <div className="mt-1 inline-block text-[9px] tracking-brand-wide uppercase font-bold text-emerald-600 dark:text-emerald-400">
                          {b.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Tap a bundle to add it to your cart.
              </p>
            </div>

            {plainDesc && (
              <div className="mt-7 border-t border-border pt-5">
                <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-3">
                  Description
                </h2>
                {descExpanded ? (
                  <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-foreground/60 mt-1">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{shortDesc}</p>
                )}
                {isLong && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-3 text-xs tracking-brand-wide uppercase font-semibold underline underline-offset-4 hover:opacity-70"
                  >
                    {descExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            <ul className="mt-7 space-y-2 text-xs text-muted-foreground border-t border-border pt-5">
              <li>✦ Free U.S. shipping on orders over $100</li>
              <li>✦ Ships within 24 hours</li>
              <li>✦ 14-day returns & exchanges</li>
              <li>✦ Secure checkout via Shopify</li>
            </ul>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-10 tracking-tight">
              You may also like
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
