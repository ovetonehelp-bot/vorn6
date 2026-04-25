import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Hero } from "@/components/store/Hero";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Giveaway } from "@/components/store/Giveaway";
import { Reviews } from "@/components/store/Reviews";
import { FAQ } from "@/components/store/FAQ";
import { Newsletter } from "@/components/store/Newsletter";
import { dropProducts, previousProducts } from "@/data/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OVETONE — Drop 001" },
      { name: "description", content: "OVETONE Drop 001. Limited quantities. No restocks." },
      { property: "og:title", content: "OVETONE — Drop 001" },
      { property: "og:description", content: "Limited pieces. No restocks. When it's gone, it's gone." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <StoreLayout>
      <Hero />
      <ProductGrid
        title="Drop 001 — Now Available"
        products={dropProducts}
        viewAllHref="/collections/001"
      />
      <Giveaway />
      <ProductGrid title="Previous Drops" products={previousProducts} />
      <Reviews />
      <FAQ />
      <Newsletter />
    </StoreLayout>
  );
}
