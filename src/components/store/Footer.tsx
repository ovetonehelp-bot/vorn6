import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import payments from "@/assets/payment-methods-v2.png";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="lockup" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Drop 001. Limited drops. Premium construction. Built to outlast trends.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/collections/001" className="hover:text-foreground">Drop 001</Link></li>
              <li><Link to="/shop" className="hover:text-foreground">All Products</Link></li>
              <li><Link to="/account" className="hover:text-foreground">Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-4">Help</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><a href="mailto:ovetonehelp@gmail.com" className="hover:text-foreground">ovetonehelp@gmail.com</a></li>
              <li><a href="https://instagram.com/ovetonebrand" target="_blank" rel="noreferrer" className="hover:text-foreground">Instagram @ovetonebrand</a></li>
              <li><a href="https://tiktok.com/@ovetone" target="_blank" rel="noreferrer" className="hover:text-foreground">TikTok @ovetone</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ovetone. All rights reserved.
          </p>
          <img
            src={payments}
            alt="Accepted payment methods: Amazon, Amex, Apple Pay, Diners, Discover, Google Pay, Mastercard, PayPal, Shop Pay, Visa"
            className="h-12 md:h-14 w-auto object-contain"
            loading="lazy"
          />
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            to="/admin/leads"
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground tracking-wide"
          >
            ·
          </Link>
        </div>
      </div>
    </footer>
  );
}
