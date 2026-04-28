import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero-set-the-tone.png";

interface HeroProps {
  image?: string;
}

export function Hero({ image }: HeroProps = {}) {
  const src = image || hero;
  return (
    <section className="relative h-[68vh] min-h-[460px] max-h-[720px] w-full overflow-hidden bg-foreground text-background">
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
          className="font-display font-black text-[10vw] leading-[0.9] md:text-6xl lg:text-7xl tracking-tight text-background drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] animate-fade-up"
        >
          SET THE TONE.
        </h1>
        <p
          className="mt-4 text-[10px] md:text-xs tracking-brand-wide uppercase opacity-90 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          Drop 001 — Limited Quantities. No Restocks.
        </p>
        <Link
          to="/shop"
          className="mt-7 inline-flex items-center justify-center bg-background text-foreground px-10 py-3.5 text-[11px] tracking-brand-wide uppercase font-semibold hover:bg-foreground hover:text-background border border-background transition-all duration-300 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          Shop The Drop
        </Link>
      </div>
    </section>
  );
}