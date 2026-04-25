import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — OVETONE" },
      { name: "description", content: "Your OVETONE cart." },
    ],
  }),
  component: Cart,
});

function Cart() {
  return (
    <StoreLayout>
      <section className="mx-auto max-w-2xl px-5 md:px-8 py-24 md:py-32 text-center">
        <h1 className="font-display font-black text-5xl tracking-tight mb-4">
          Your Cart
        </h1>
        <p className="text-muted-foreground mb-8">Your cart is currently empty.</p>
        <Link
          to="/collections/001"
          className="inline-flex bg-foreground text-background px-10 py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
        >
          Shop Drop 001
        </Link>
      </section>
    </StoreLayout>
  );
}