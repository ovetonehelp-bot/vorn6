import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shopify";
import { X, Plus, Minus, ShoppingBag, Copy, Check } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText("WELCOME20");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleCheckout = () => {
    // Only count as a real conversion / accepted offer here.
    items.forEach((it) => {
      trackEvent({
        event_type: "accept_offer",
        product_handle: it.productHandle,
        product_title: it.productTitle,
      });
    });
    setOpen(false);
    navigate({ to: "/checkout" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-6 h-16 border-b border-border">
          <h2 className="text-sm tracking-brand-wide uppercase font-semibold">
            Your Cart ({totalItems})
          </h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="p-2 -mr-2">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 p-6">
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden bg-muted">
                    <img src={item.image} alt={item.productTitle} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium leading-tight">{item.productTitle}</h3>
                        {item.variantTitle && item.variantTitle !== "Default Title" && (
                          <p className="text-xs text-muted-foreground mt-1">{item.variantTitle}</p>
                        )}
                      </div>
                      <p className="text-sm">{formatPrice(parseFloat(item.price) * item.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-2 hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-sm tabular-nums">{item.quantity}</span>
                        <button
                          aria-label="Increase"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-2 hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-[11px] tracking-brand-wide uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border p-6 space-y-4">
            <div className="border border-dashed border-foreground/40 bg-muted/40 p-3 text-center">
              <p className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">
                Use this code at checkout
              </p>
              <button
                onClick={copyCode}
                className="mt-1.5 inline-flex items-center gap-2 font-mono font-bold text-base tracking-wider hover:opacity-70 transition-opacity"
                aria-label="Copy discount code"
              >
                <span>WELCOME20</span>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {copied ? "Copied! Paste it at checkout." : "Tap to copy"}
              </p>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] tracking-brand-wide uppercase text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout.</p>
            <button
              onClick={handleCheckout}
              className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
            >
              Accept Offer · Checkout
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}