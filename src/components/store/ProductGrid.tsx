import { Link } from "@tanstack/react-router";
import { ProductCard } from "./ProductCard";
import type { ShopifyProduct } from "@/lib/shopify";

type Props = {
  title: string;
  products: ShopifyProduct[];
  viewAllHref?: string;
  loading?: boolean;
};

export function ProductGrid({ title, products, viewAllHref, loading }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="mb-10 flex items-end justify-between border-b border-border pb-6">
        <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="text-[12px] tracking-brand-wide uppercase font-medium underline underline-offset-4 hover:opacity-60"
          >
            View All
          </Link>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
  );
}