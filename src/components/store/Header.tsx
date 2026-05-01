import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function Header() {
  const [open, setOpen] = useState(false);
  const { totalItems, setOpen: setCartOpen } = useCart();
  const [bump, setBump] = useState(0);
  const prevTotal = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevTotal.current) setBump((n) => n + 1);
    prevTotal.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { to: "/collections/001", label: "001" },
    { to: "/shop", label: "Shop" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex h-16 md:h-20 items-center justify-between px-5 md:px-8">
        {/* Left: nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[12px] tracking-brand-wide uppercase font-medium hover:opacity-60 transition-opacity"
              activeProps={{ className: "text-[12px] tracking-brand-wide uppercase font-semibold underline underline-offset-8" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu trigger */}
        <button
          aria-label="Open menu"
          className="md:hidden -ml-1 p-2"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center: Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2" aria-label="Ovetone home">
          <Logo variant="mark" />
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/account"
            aria-label="Account"
            className="hover:opacity-60 transition-opacity"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Cart (${totalItems} items)`}
            className="relative hover:opacity-60 transition-opacity"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span
                key={bump}
                className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center animate-badge-pop"
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between h-16 px-5 border-b border-border">
            <Logo variant="lockup" />
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col p-8 gap-6">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-2xl font-display font-bold tracking-tight"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="text-2xl font-display font-bold tracking-tight mt-4"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}