import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="bg-foreground text-background py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-5 text-center md:px-8">
        <h2 className="font-display font-black text-3xl md:text-5xl tracking-tight mb-3">
          Be first for the next drop.
        </h2>
        <p className="text-sm opacity-60 mb-8 tracking-brand uppercase">
          Drop 002 alerts. Early access. Nothing else.
        </p>
        {submitted ? (
          <p className="text-sm tracking-brand uppercase">You're on the list ✦</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubmitted(true);
            }}
            className="flex w-full max-w-md mx-auto border-b border-background/40 focus-within:border-background transition-colors"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent py-3 px-1 text-sm placeholder:text-background/40 focus:outline-none"
            />
            <button
              type="submit"
              className="text-[11px] tracking-brand-wide uppercase font-semibold py-3 px-2 hover:opacity-60 transition-opacity"
            >
              Subscribe →
            </button>
          </form>
        )}
      </div>
    </section>
  );
}