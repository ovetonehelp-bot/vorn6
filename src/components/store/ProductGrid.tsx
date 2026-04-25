import { Link } from "@tanstack/react-router";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/products";

type Props = {
  title: string;
  products: Product[];
  viewAllHref?: string;
};

export function ProductGrid({ title, products, viewAllHref }: Props) {
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
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}