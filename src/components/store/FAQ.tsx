import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Will 001 restock?",
    a: "001 is our first drop. Limited pieces. No restocks. When it's gone, it's gone.",
  },
  {
    q: "How does the giveaway work?",
    a: "We're giving away 20 sets of unreleased product for 001! Every purchase = 1 entry into the giveaway.",
  },
  {
    q: "How long is shipping?",
    a: "Products are shipped within 24 hours. U.S.: 3–5 business days. International: 1–3 weeks.",
  },
  {
    q: "How does sizing fit?",
    a: "Full measurements and recommended heights are listed on each product page.",
  },
  {
    q: "Can I return or exchange?",
    a: "Yes, within 14 days of delivery. Contact shop@ovetone.com for support and refund inquiries.",
  },
  {
    q: "More questions?",
    a: "Reach us anytime at shop@ovetone.com.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-3xl px-5 py-20 md:py-28 md:px-8">
        <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight text-center mb-12">
          FAQ
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm md:text-base tracking-brand uppercase font-semibold pr-6">
                    {f.q}
                  </span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 group-hover:rotate-90 transition-transform" strokeWidth={1.5} />
                  )}
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-muted-foreground leading-relaxed pr-8">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}