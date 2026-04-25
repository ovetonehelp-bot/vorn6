import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StoreLayout } from "@/components/store/StoreLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Ovetone" },
      { name: "description", content: "Get in touch with the Ovetone team." },
      { property: "og:title", content: "Contact Us — Ovetone" },
      { property: "og:description", content: "Have questions, feedback, or collaboration inquiries? We'd love to hear from you." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <StoreLayout>
      <section className="mx-auto max-w-3xl px-5 md:px-8 py-20 md:py-28">
        <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground mb-3">
          Get in touch
        </p>
        <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight mb-6">
          Contact Us
        </h1>
        <p className="text-muted-foreground mb-12 leading-relaxed text-base md:text-lg">
          Have questions, feedback, or collaboration inquiries? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-14">
          <div className="border border-border p-6">
            <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-3">
              Social Media
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The fastest way to reach us is through our social channels. DM us on Instagram{" "}
              <a href="https://instagram.com/ovetonebrand" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
                @ovetonebrand
              </a>{" "}
              or TikTok{" "}
              <a href="https://tiktok.com/@ovetone" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
                @ovetone
              </a>{" "}
              for quick responses.
            </p>
          </div>

          <div className="border border-border p-6">
            <h2 className="text-[11px] tracking-brand-wide uppercase font-semibold mb-3">
              Email
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For business inquiries,{" "}
              <a href="mailto:ovetonehelp@gmail.com" className="text-foreground underline underline-offset-4">
                ovetonehelp@gmail.com
              </a>{" "}
              wholesale, or press: reach out via our social media pages. We typically respond
              within 24-48 hours.
            </p>
          </div>
        </div>

        {sent ? (
          <div className="border border-border p-8 text-center">
            <p className="text-sm tracking-brand uppercase">Message sent ✦</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll get back to you within 24-48 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-5"
          >
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Subject" name="subject" />
            <Field label="Message" name="message" textarea required />
            <button
              type="submit"
              className="w-full bg-foreground text-background py-4 text-[12px] tracking-brand-wide uppercase font-semibold hover:opacity-80 transition-opacity"
            >
              Send Message
            </button>
          </form>
        )}
      </section>
    </StoreLayout>
  );
}

function Field({ label, name, type = "text", required, textarea }: { label: string; name: string; type?: string; required?: boolean; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[11px] tracking-brand-wide uppercase font-medium text-muted-foreground mb-2">
        {label}
      </span>
      {textarea ? (
        <textarea name={name} required={required} rows={6} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
      ) : (
        <input name={name} type={type} required={required} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
      )}
    </label>
  );
}
