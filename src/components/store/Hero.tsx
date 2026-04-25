import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero-drop-001.jpg";

export function Hero() {
  return (
    <section className="relative h-[88vh] min-h-[620px] w-full overflow-hidden bg-foreground text-background">
      <img
        src={hero}
        alt="OVETONE Drop 001 lookbook"
        className="absolute inset-0 h-full w-full object-cover animate-slow-zoom"
        width={1920}
        height={1280}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-end px-5 pb-20 text-center md:items-start md:px-12 md:text-left">
        <p className="mb-4 text-[11px] tracking-brand-wide uppercase opacity-80 animate-fade-up">
          OVETONE Presents
        </p>
        <h1
          className="font-display font-black text-[18vw] leading-[0.9] md:text-[10rem] animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          DROP 001
        </h1>
        <p
          className="mt-6 text-xs md:text-sm tracking-brand uppercase opacity-90 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          Limited Quantities. No Restocks.
        </p>
        <Link
          to="/collections/001"
          className="mt-8 inline-flex items-center justify-center bg-background text-foreground px-10 py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:bg-foreground hover:text-background border border-background transition-all duration-300 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          Enter Drop
        </Link>
      </div>
    </section>
  );
}