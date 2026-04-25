const reviews = [
  { name: "Jacob", product: "Charcoal Sweatpants", text: "So comfy and sits at the perfect length." },
  { name: "Brody", product: "Cream Hoodie", text: "Hands down the most comfortable hoodie I've ever owned. Better than tracksuits I've paid 5x for." },
  { name: "Gavin", product: "Charcoal Hoodie", text: "Great quality. The hood crosses where it connects, keeping strain off the neck. Kangaroo pocket is double stitched." },
  { name: "Memphis", product: "Charcoal Sweatpants", text: "Fits perfectly around the waist and baggy at the ankles. Highly recommend." },
  { name: "Adrianne", product: "Cream Sweatpants", text: "Customer service is on point and delivery was super fast — would order again." },
  { name: "Hossannah", product: "Cream Hoodie", text: "The fabric feels soft and premium. Totally worth it." },
  { name: "C.S.", product: "Cream Sweatpants", text: "Just got these — really soft and baggy exactly how I wanted." },
  { name: "Valentino", product: "Charcoal Sweatpants", text: "5'10, 129 lbs and got medium. Perfect size." },
];

export function Reviews() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="text-center mb-14">
          <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground mb-3">
            Take Action
          </p>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight">
            3,000+ Happy Customers
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r, i) => (
            <figure
              key={i}
              className="border border-border bg-card p-6 flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex gap-0.5 mb-3 text-foreground" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground">
                  "{r.text}"
                </blockquote>
              </div>
              <figcaption className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.product}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}