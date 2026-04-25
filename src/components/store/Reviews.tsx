import hero from "@/assets/hero-set-the-tone.png";

export function Reviews() {
  return (
    <section className="bg-background">
      <div className="relative w-full overflow-hidden">
        <img
          src={hero}
          alt="Ovetone — Set the tone"
          className="h-[60vh] min-h-[420px] w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-8 pb-12 md:pb-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-[11px] tracking-brand-wide uppercase text-background/80 mb-3">
              Drop 001 / Lookbook
            </p>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-background max-w-2xl">
              Worn by the ones who set the tone.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
