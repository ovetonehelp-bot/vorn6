import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero-set-the-tone.png";

interface HeroProps {
  image?: string;
}

export function Hero({ image }: HeroProps = {}) {
  const src = image || hero;
  return (
    <section className="relative h-[88vh] min-h-[620px] w-full overflow-hidden bg-foreground text-background">
      <img
        src={src}
        alt="Ovetone Drop 001 — Set the tone"
        className="absolute inset-0 h-full w-full object-cover animate-slow-zoom-out"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/55" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-5 text-center md:px-12">
        <h1
          className="font-display font-black text-[12vw] leading-[0.9] md:text-7xl lg:text-8xl tracking-tight text-background drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] animate-fade-up"
        >
          SET THE TONE.
        </h1>
        <p
          className="mt-6 text-[11px] md:text-sm tracking-brand-wide uppercase opacity-90 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          Drop 001 — Limited Quantities. No Restocks.
        </p>
        <Link
          to="/shop"
          className="mt-10 inline-flex items-center justify-center bg-background text-foreground px-12 py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:bg-foreground hover:text-background border border-background transition-all duration-300 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          Shop The Drop
        </Link>
      </div>
    </section>
  );
}