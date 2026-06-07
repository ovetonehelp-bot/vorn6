import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";

export const Route = createFileRoute("/collections/001")({
  head: () => ({
    meta: [
      { title: "Drop 001 — Ovetone" },
      { name: "description", content: "Shop Ovetone Drop 001. Limited quantities. No restocks." },
      { property: "og:title", content: "Drop 001 — Ovetone" },
      { property: "og:description", content: "Limited pieces. No restocks." },
    ],
  }),
  component: Drop001,
});

function Drop001() {
  const { products, loading } = useShopifyProducts();
  return (
    <StoreLayout>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 text-center">
          <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            Collections
          </p>
          <h1 className="font-display font-black text-5xl md:text-8xl tracking-tight">DROP 001</h1>
          <p className="mt-4 text-sm md:text-base tracking-brand uppercase text-muted-foreground">
            Our First Drop. Limited Quantities. No Restocks.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-14 md:py-20">
        {loading ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
