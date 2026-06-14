import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useCart } from "@/context/CartContext";
import { useMoney } from "@/hooks/useLocalPrice";
import { formatLocal } from "@/lib/money";
import { createPaystackTransaction, verifyPaystackTransaction } from "@/lib/checkout.functions";
import { validateDiscountCode } from "@/lib/discount.functions";
import { Lock, ShieldCheck, Loader2, Tag, Check, Truck, Mail, MapPin } from "lucide-react";

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
  const money = useMoney();
  const fmt = (usd: number) => formatLocal(usd, money);
  const createTxn = useServerFn(createPaystackTransaction);
  const verifyTxn = useServerFn(verifyPaystackTransaction);
  const checkCode = useServerFn(validateDiscountCode);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; discount_usd: number; message: string } | null>(null);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    country: "",
  });

  useEffect(() => {
    loadPaystack().catch(() => setError("Could not load secure payment. Please refresh."));
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const discountedTotal = Math.max(0, totalPrice - (applied?.discount_usd ?? 0));

  const handleApplyCode = async () => {
    setCodeError(null);
    const code = codeInput.trim();
    if (!code) return;
    if (totalPrice <= 0) {
      setCodeError("Add items to your cart first.");
      return;
    }
    setCodeBusy(true);
    try {
      const res = await checkCode({ data: { code, subtotal_usd: totalPrice } });
      if (res.ok && res.code) {
        setApplied({ code: res.code, discount_usd: res.discount_usd ?? 0, message: res.message });
      } else {
        setApplied(null);
        setCodeError(res.message);
      }
    } catch {
      setCodeError("Could not validate code");
    } finally {
      setCodeBusy(false);
    }
  };

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
            postal_code: "",
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
          amount: discountedTotal,
          currency: "GHS",
          discount_code: applied?.code,
        },
      });

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: form.email.trim(),
        amount: Math.round(init.amount_ghs * 100),
        currency: "GHS",
        ref: init.reference,
        accessCode: init.access_code,
        onClose: () => {
          setSubmitting(false);
        },
        callback: (response: { reference: string }) => {
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
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-6">
            <ShieldCheck className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
          </div>
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
      <div className="bg-gradient-to-b from-muted/20 to-background min-h-screen">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 lg:py-16">
          <div className="mb-8 lg:mb-12 text-center lg:text-left">
            <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground">Ovetone</p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mt-2">Checkout</h1>
            <p className="mt-2 text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-2">
              <Lock className="h-3.5 w-3.5" /> Encrypted &amp; secured by Paystack
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12">
            {/* Form */}
            <form onSubmit={handlePay} className="space-y-6">
              <Section title="Contact" icon={<Mail className="h-3.5 w-3.5" />}>
                <Field label="Email" value={form.email} onChange={update("email")} type="email" required />
                <Field label="Phone" value={form.phone} onChange={update("phone")} type="tel" required />
              </Section>

              <Section title="Shipping address" icon={<MapPin className="h-3.5 w-3.5" />}>
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
                <Field label="Country" value={form.country} onChange={update("country")} required />
              </Section>

              {error && (
                <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="w-full bg-foreground text-background py-5 rounded-md text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 inline-flex items-center justify-center gap-3 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Pay {fmt(discountedTotal)}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 text-[11px] tracking-brand-wide uppercase text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> 256-bit SSL</span>
                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Worldwide shipping</span>
              </div>
            </form>

            {/* Order summary */}
            <aside className="lg:sticky lg:top-24 self-start bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-6 flex items-center gap-2">
                <span>Your order</span>
                <span className="ml-auto text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
              </h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              ) : (
                <>
                  <ul className="divide-y divide-border">
                    {items.map((it) => (
                      <li key={it.variantId} className="flex gap-4 py-4 first:pt-0">
                        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-background rounded-md border border-border">
                          <img src={it.image} alt={it.productTitle} className="h-full w-full object-cover" />
                          <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-full shadow">
                            {it.quantity}
                          </span>
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-medium leading-tight">{it.productTitle}</p>
                          {it.variantTitle && it.variantTitle !== "Default Title" && (
                            <p className="text-xs text-muted-foreground mt-0.5">{it.variantTitle}</p>
                          )}
                        </div>
                        <p className="text-sm font-medium">{fmt(parseFloat(it.price) * it.quantity)}</p>
                      </li>
                    ))}
                  </ul>

                  {/* Discount code */}
                  <div className="border-t border-border mt-2 pt-5">
                    {applied ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-emerald-800">
                          <Check className="h-4 w-4" />
                          <span className="font-mono font-medium">{applied.code}</span>
                          <span className="text-xs">— {applied.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setApplied(null); setCodeInput(""); }}
                          className="text-[10px] tracking-brand-wide uppercase text-emerald-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Tag className="h-3 w-3" /> Discount code
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            className="flex-1 bg-background border border-border rounded-md px-3 py-2.5 text-sm uppercase tracking-wider focus:outline-none focus:border-foreground transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCode}
                            disabled={codeBusy || !codeInput.trim()}
                            className="px-4 py-2.5 text-[11px] tracking-brand-wide uppercase font-semibold border border-foreground hover:bg-foreground hover:text-background transition-colors rounded-md disabled:opacity-50"
                          >
                            {codeBusy ? "…" : "Apply"}
                          </button>
                        </div>
                        {codeError && <p className="mt-1.5 text-xs text-red-600">{codeError}</p>}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                    <Row label="Subtotal" value={fmt(totalPrice)} />
                    {applied && applied.discount_usd > 0 && (
                      <Row label={`Discount (${applied.code})`} value={`− ${fmt(applied.discount_usd)}`} highlight />
                    )}
                    <Row label="Shipping" value="Calculated after order" muted />
                    <div className="flex items-baseline justify-between pt-3 mt-3 border-t border-border">
                      <span className="text-[11px] tracking-brand-wide uppercase">Total</span>
                      <span className="text-2xl font-semibold tracking-tight">{fmt(discountedTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 sm:p-6 shadow-sm">
      <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
        {icon}<span>{title}</span>
      </h2>
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
        className="mt-1 w-full bg-background border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition"
      />
    </label>
  );
}

function Row({ label, value, muted, highlight }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={highlight ? "text-emerald-700" : "text-muted-foreground"}>{label}</span>
      <span className={highlight ? "text-emerald-700 font-medium" : muted ? "text-muted-foreground text-xs" : ""}>{value}</span>
    </div>
  );
}