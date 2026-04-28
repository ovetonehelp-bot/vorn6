import { useCart } from "@/context/CartContext";
import { buildCheckoutUrl, formatPrice } from "@/lib/shopify";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useState } from "react";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const [showDiscountWarning, setShowDiscountWarning] = useState(false);

  const goToCheckout = () => {
    const url = buildCheckoutUrl(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCheckout = () => {
    try {
      const tried = localStorage.getItem("ovetone_discount_popup_tried_v3");
      if (!tried) {
        setShowDiscountWarning(true);
        return;
      }
    } catch {}
    goToCheckout();
  };

  const claimDiscount = () => {
    setShowDiscountWarning(false);
    setOpen(false);
    try {
      localStorage.removeItem("ovetone_discount_popup_minimized_v3");
    } catch {}
    // Trigger popup by reloading flag and dispatching event
    window.dispatchEvent(new CustomEvent("ovetone:open-discount-popup"));
  };

  const skipDiscount = () => {
    try {
      localStorage.setItem("ovetone_discount_popup_tried_v3", "1");
    } catch {}
    setShowDiscountWarning(false);
    goToCheckout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col">
        {showDiscountWarning && (
          <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="text-center max-w-sm">
              <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight leading-tight">
                Wait — don't pay full price.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                You could be getting <span className="font-semibold text-foreground">20% off</span> this order. Claim your code first?
              </p>
              <div className="mt-6 grid gap-2.5">
                <button
                  onClick={claimDiscount}
                  className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
                >
                  Yes — Get My 20% Off
                </button>
                <button
                  onClick={skipDiscount}
                  className="text-[11px] tracking-brand-wide uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  No thanks, continue to checkout
                </button>
              </div>
            </div>
          </div>
        )}
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