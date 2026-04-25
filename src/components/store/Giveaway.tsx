import box from "@/assets/giveaway-box.jpg";

export function Giveaway() {
  return (
    <section className="bg-foreground text-background">
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-square md:aspect-auto md:min-h-[560px] overflow-hidden">
          <img
            src={box}
            alt="OVETONE 001 mystery giveaway box"
            loading="lazy"
            width={1600}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-8 py-16 md:px-16 md:py-24">
          <p className="text-[11px] tracking-brand-wide uppercase opacity-60 mb-4">
            Drop 001 / Reward
          </p>
          <h2 className="font-display font-black text-5xl md:text-7xl leading-[0.95] mb-6">
            001 GIVEAWAY
          </h2>
          <p className="text-base md:text-lg max-w-md opacity-80 leading-relaxed">
            We're giving away <span className="text-background font-semibold">20 mystery sets</span> for 001.
            <br />
            <br />
            1 piece purchased = 1 entry into the giveaway.
          </p>
          <div className="mt-10 flex items-center gap-3 text-[11px] tracking-brand-wide uppercase opacity-60">
            <span className="h-px w-10 bg-background/40" />
            No restocks. When it's gone, it's gone.
          </div>
        </div>
      </div>
    </section>
  );
}