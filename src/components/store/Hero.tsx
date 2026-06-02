import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero-set-the-tone.png";
import { useEffect, useState } from "react";
import img1 from "@/assets/IMG_0496.jpg.asset.json";
import img2 from "@/assets/IMG_0497.jpg.asset.json";
import img3 from "@/assets/IMG_0498.jpg.asset.json";
import img4 from "@/assets/IMG_0499.jpg.asset.json";
import img5 from "@/assets/IMG_0500.jpg.asset.json";
import img6 from "@/assets/IMG_0501.jpg.asset.json";

interface HeroProps {
  image?: string;
}

export function Hero({ image }: HeroProps = {}) {
  const images = image
    ? [image]
    : [img5.url, img6.url, img1.url, img2.url, img3.url, img4.url, hero];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % images.length), 6000);
    return () => clearInterval(id);
  }, [images.length]);
  return (
    <section className="relative h-[78svh] md:h-[100svh] w-full overflow-hidden bg-foreground text-background">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt="Ovetone Drop 001 — Set the tone"
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
          width={1920}
          height={1080}
        />
      ))}
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
          className="mt-7 inline-flex items-center justify-center bg-background text-foreground px-10 py-3.5 text-[11px] tracking-brand-wide uppercase font-semibold hover:bg-foreground hover:text-background border border-background rounded-2xl animate-cta-glow transition-colors duration-300"
          style={{ animationDelay: "0.4s" }}
        >
          Shop The Drop
        </Link>
        <p className="mt-4 text-[11px] md:text-xs tracking-brand-wide uppercase text-background/85">
          In Ghana? DM us on TikTok{" "}
          <a
            href="https://www.tiktok.com/@ovetone"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:opacity-80"
          >
            @ovetone
          </a>
        </p>
        <a
          href="#drop"
          aria-label="Scroll to drop"
          className="mt-6 text-background/80 hover:text-background transition-colors animate-bounce-slow"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="m6 13 6 6 6-6" />
          </svg>
        </a>
      </div>
    </section>
  );
}