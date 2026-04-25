import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Ovetone" },
      { name: "description", content: "Shop the full Ovetone collection." },
      { property: "og:title", content: "Shop — Ovetone" },
      { property: "og:description", content: "Shop the full Ovetone collection." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { products, loading } = useShopifyProducts();
  return (
    <StoreLayout>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-12 md:py-16">
          <h1 className="font-display font-black text-4xl md:text-6xl tracking-tight">Shop</h1>
          <p className="mt-2 text-sm tracking-brand uppercase text-muted-foreground">
            {loading ? "Loading…" : `${products.length} products`}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-14 md:py-20">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
