import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Hero } from "@/components/store/Hero";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Giveaway } from "@/components/store/Giveaway";
import { Reviews } from "@/components/store/Reviews";
import { FAQ } from "@/components/store/FAQ";
import { Newsletter } from "@/components/store/Newsletter";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { ComingSoon } from "@/components/store/ComingSoon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ovetone — Drop 001" },
      { name: "description", content: "Ovetone Drop 001 — Set the tone. Limited quantities. No restocks." },
      { property: "og:title", content: "Ovetone — Drop 001" },
      { property: "og:description", content: "Set the tone. Our first drop. Limited pieces, no restocks." },
    ],
  }),
  component: Index,
});

function Index() {
  const { products, loading } = useShopifyProducts();
  const { config, loading: cfgLoading } = useSiteConfig();

  if (cfgLoading) {
    return <div className="min-h-screen bg-foreground" />;
  }

  if (config?.mode === "countdown") {
    return <ComingSoon launchAt={config.launch_at} />;
  }

  return (
    <StoreLayout>
      <Hero />
      <ProductGrid
        title="Drop 001 — Now Available"
        products={products}
        loading={loading}
        viewAllHref="/collections/001"
      />
      <Giveaway />
      <Reviews />
      <FAQ />
      <Newsletter />
    </StoreLayout>
  );
}
