import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — OVETONE" },
      { name: "description", content: "Log in to your OVETONE account." },
    ],
  }),
  component: Account,
});

function Account() {
  return (
    <StoreLayout>
      <section className="mx-auto max-w-md px-5 md:px-8 py-24 md:py-32">
        <h1 className="font-display font-black text-4xl tracking-tight text-center mb-8">
          Log in
        </h1>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
          />
          <button
            type="button"
            className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/contact" className="text-foreground underline underline-offset-4">
            Contact us
          </Link>
        </p>
      </section>
    </StoreLayout>
  );
}