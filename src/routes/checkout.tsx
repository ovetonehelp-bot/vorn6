import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shopify";
import { createPaystackTransaction, verifyPaystackTransaction } from "@/lib/checkout.functions";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";

const PAYSTACK_SCRIPT = "https://js.paystack.co/v2/inline.js";

declare global {
  interface Window {
    PaystackPop?: { setup: (opts: Record<string, unknown>) => { openIframe: () => void } };
  }
}

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.PaystackPop) return resolve();
    const existing = document.querySelector(`script[src="${PAYSTACK_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack")));
      return;
    }
    const s = document.createElement("script");
    s.src = PAYSTACK_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(s);
  });
}

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Ovetone" },
      { name: "description", content: "Complete your Ovetone Drop 001 order. Secure payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clear } = useCart();
  const createTxn = useServerFn(createPaystackTransaction);
  const verifyTxn = useServerFn(verifyPaystackTransaction);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postal: "",
    country: "",
  });

  useEffect(() => {
    loadPaystack().catch(() => setError("Could not load secure payment. Please refresh."));
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!window.PaystackPop) {
      setError("Secure payment is still loading. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const init = await createTxn({
        data: {
          email: form.email.trim(),
          customer_name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone.trim(),
          shipping: {
            address1: form.address1.trim(),
            address2: form.address2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            postal_code: form.postal.trim(),
            country: form.country.trim(),
          },
          items: items.map((i) => ({
            variantId: i.variantId,
            productHandle: i.productHandle,
            productTitle: i.productTitle,
            variantTitle: i.variantTitle,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
          })),
          amount: totalPrice,
          currency: "USD",
        },
      });

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: form.email.trim(),
        amount: Math.round(totalPrice * 100),
        currency: "USD",
        ref: init.reference,
        accessCode: init.access_code,
        onClose: () => {
          setSubmitting(false);
        },
        callback: (response: { reference: string }) => {
          // Verify server-side
          verifyTxn({ data: { reference: response.reference } })
            .then((res) => {
              if (res.paid) {
                setSuccess(res.reference);
                clear();
                setTimeout(() => navigate({ to: "/" }), 200);
              } else {
                setError("Payment could not be verified. If you were charged, contact support with reference " + response.reference);
              }
            })
            .catch(() => {
              setError("Payment verification failed. Reference: " + response.reference);
            })
            .finally(() => setSubmitting(false));
        },
      });
      handler.openIframe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <ShieldCheck className="h-16 w-16 mx-auto text-emerald-500 mb-6" strokeWidth={1.25} />
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Thank you.</h1>
          <p className="text-muted-foreground">Your order is confirmed. A receipt is on the way.</p>
          <p className="mt-6 text-xs tracking-brand-wide uppercase text-muted-foreground">
            Reference: {success}
          </p>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="mb-10">
          <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground">Ovetone</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Secure Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12">
          {/* Form */}
          <form onSubmit={handlePay} className="space-y-10">
            <Section title="Contact">
              <Field label="Email" value={form.email} onChange={update("email")} type="email" required />
              <Field label="Phone" value={form.phone} onChange={update("phone")} type="tel" required />
            </Section>

            <Section title="Shipping address">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" value={form.firstName} onChange={update("firstName")} required />
                <Field label="Last name" value={form.lastName} onChange={update("lastName")} required />
              </div>
              <Field label="Address" value={form.address1} onChange={update("address1")} required />
              <Field label="Apartment, suite (optional)" value={form.address2} onChange={update("address2")} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={form.city} onChange={update("city")} required />
                <Field label="State / Region" value={form.state} onChange={update("state")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Postal code" value={form.postal} onChange={update("postal")} />
                <Field label="Country" value={form.country} onChange={update("country")} required />
              </div>
            </Section>

            {error && (
              <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full bg-foreground text-background py-5 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Pay {formatPrice(totalPrice)}
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-2 text-[11px] tracking-brand-wide uppercase text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Secured by Paystack · 256-bit SSL
            </p>
          </form>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 self-start bg-muted/40 border border-border p-6">
            <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-6">Your order</h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {items.map((it) => (
                    <li key={it.variantId} className="flex gap-4 py-4 first:pt-0">
                      <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-background">
                        <img src={it.image} alt={it.productTitle} className="h-full w-full object-cover" />
                        <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-full">
                          {it.quantity}
                        </span>
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium leading-tight">{it.productTitle}</p>
                        {it.variantTitle && it.variantTitle !== "Default Title" && (
                          <p className="text-xs text-muted-foreground mt-0.5">{it.variantTitle}</p>
                        )}
                      </div>
                      <p className="text-sm">{formatPrice(parseFloat(it.price) * it.quantity)}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                  <Row label="Subtotal" value={formatPrice(totalPrice)} />
                  <Row label="Shipping" value="Calculated after order" muted />
                  <div className="flex items-baseline justify-between pt-3 mt-3 border-t border-border">
                    <span className="text-[11px] tracking-brand-wide uppercase">Total</span>
                    <span className="text-xl font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
      />
    </label>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground text-xs" : ""}>{value}</span>
    </div>
  );
}