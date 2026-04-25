import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="lockup" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Limited drops. Premium construction. Built to outlast trends.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/collections/001" className="hover:text-foreground">Drop 001</Link></li>
              <li><Link to="/shop" className="hover:text-foreground">All Products</Link></li>
              <li><Link to="/account" className="hover:text-foreground">Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-4">
              Help
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><a href="mailto:shop@ovetone.com" className="hover:text-foreground">shop@ovetone.com</a></li>
              <li><Link to="/contact" className="hover:text-foreground">Returns</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OVETONE. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-3 text-[10px] tracking-brand-wide uppercase text-muted-foreground">
            {["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "Shop Pay", "PayPal"].map((p) => (
              <span key={p} className="border border-border px-2 py-1">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}