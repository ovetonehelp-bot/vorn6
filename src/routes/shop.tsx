import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { allProducts } from "@/data/products";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — OVETONE" },
      { name: "description", content: "Shop all OVETONE products." },
      { property: "og:title", content: "Shop — OVETONE" },
      { property: "og:description", content: "Shop all OVETONE products." },
    ],
  }),
  component: Shop,
});

function Shop() {
  return (
    <StoreLayout>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-12 md:py-16">
          <h1 className="font-display font-black text-4xl md:text-6xl tracking-tight">
            Shop
          </h1>
          <p className="mt-2 text-sm tracking-brand uppercase text-muted-foreground">
            {allProducts.length} products
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {allProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </StoreLayout>
  );
}