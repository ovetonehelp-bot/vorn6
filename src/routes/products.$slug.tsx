import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchShopifyProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCart } from "@/context/CartContext";
import { Plus, Minus } from "lucide-react";

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
  const { addItem } = useCart();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined);
  const [variantId, setVariantId] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<ShopifyProduct[]>([]);

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

  const handleAdd = () => {
    if (!variant) return;
    addItem(
      {
        variantId: variant.id,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: variant.title,
        image: firstImage ?? "",
        price: variant.price,
      },
      quantity,
    );
  };

  return (
    <StoreLayout>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-8 pb-20 md:pt-12 md:pb-28">
        <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <span className="mx-2">/</span>
          {product.title}
        </p>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              {activeImage && (
                <img src={activeImage} alt={product.title} width={800} height={1000} className="h-full w-full object-cover" />
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {product.images.slice(0, 8).map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.src)}
                    className={`aspect-square overflow-hidden bg-muted border ${
                      activeImage === img.src ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:pt-4">
            <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight">
              {product.title}
            </h1>
            <p className="mt-3 text-xl">{formatPrice(variant?.price ?? "0")}</p>

            <div className="mt-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
              </span>
              <span className="text-xs tracking-brand-wide uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                In Stock — Ships in 24 hrs
              </span>
            </div>

            {product.body_html && (
              <div
                className="mt-6 text-sm text-muted-foreground leading-relaxed [&>p]:mb-3"
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            )}

            {sizes.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] tracking-brand-wide uppercase font-semibold">Size</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {sizes.map((s) => {
                    const v = product.variants.find((vv) => vv.option1 === s);
                    const selected = variant?.option1 === s;
                    return (
                      <button
                        key={s}
                        onClick={() => v && setVariantId(v.id)}
                        className={`py-3 text-xs tracking-brand uppercase font-medium border transition-colors ${
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

            <div className="mt-8">
              <span className="text-[11px] tracking-brand-wide uppercase font-semibold mb-3 block">Quantity</span>
              <div className="inline-flex items-center border border-border">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-muted"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-6 text-sm tabular-nums font-medium">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-3 hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="mt-8 w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
            >
              Add to Cart — {formatPrice(parseFloat(variant?.price ?? "0") * quantity)}
            </button>

            <ul className="mt-10 space-y-3 text-xs text-muted-foreground border-t border-border pt-6">
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
