import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { getProduct, dropProducts } from "@/data/products";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — OVETONE` },
          {
            name: "description",
            content: `${loaderData.product.name} from OVETONE Drop 001. $${loaderData.product.price.toFixed(2)}.`,
          },
          { property: "og:title", content: `${loaderData.product.name} — OVETONE` },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <StoreLayout>
      <div className="mx-auto max-w-md text-center py-32 px-5">
        <h1 className="font-display font-black text-4xl mb-4">Product not found</h1>
        <Link to="/shop" className="text-sm tracking-brand uppercase underline underline-offset-4">
          Back to shop
        </Link>
      </div>
    </StoreLayout>
  ),
  component: ProductPage,
});

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [size, setSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(product.image);
  const related = dropProducts.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <StoreLayout>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-8 pb-20 md:pt-12 md:pb-28">
        <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <span className="mx-2">/</span>
          {product.name}
        </p>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              <img
                src={activeImage}
                alt={product.name}
                width={800}
                height={1000}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[product.image, product.hoverImage].map((img) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square overflow-hidden bg-muted border ${
                    activeImage === img ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="md:pt-4">
            <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight">
              {product.name}
            </h1>
            <p className="mt-3 text-xl">${product.price.toFixed(2)}</p>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
              Premium heavyweight construction. Oversized fit. Built for the
              001 drop with limited quantities — once it's gone, it's gone.
            </p>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-brand-wide uppercase font-semibold">
                  Size
                </span>
                <button className="text-[11px] tracking-brand-wide uppercase text-muted-foreground hover:text-foreground underline underline-offset-4">
                  Size guide
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-3 text-xs tracking-brand uppercase font-medium border transition-colors ${
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={product.soldOut}
              className="mt-8 w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {product.soldOut ? "Sold Out" : size ? "Add to Cart" : "Select a Size"}
            </button>

            <ul className="mt-10 space-y-3 text-xs text-muted-foreground border-t border-border pt-6">
              <li>✦ Free U.S. shipping on orders over $100</li>
              <li>✦ Ships within 24 hours</li>
              <li>✦ 14-day returns & exchanges</li>
              <li>✦ Every purchase = 1 entry into the 001 giveaway</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-10 tracking-tight">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}