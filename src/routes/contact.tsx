import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StoreLayout } from "@/components/store/StoreLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — OVETONE" },
      { name: "description", content: "Get in touch with the OVETONE team." },
      { property: "og:title", content: "Contact — OVETONE" },
      { property: "og:description", content: "Get in touch with the OVETONE team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <StoreLayout>
      <section className="mx-auto max-w-2xl px-5 md:px-8 py-20 md:py-28">
        <p className="text-[11px] tracking-brand-wide uppercase text-muted-foreground mb-3">
          Get in touch
        </p>
        <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight mb-6">
          Contact
        </h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Questions about your order, sizing, or returns? Email us directly at{" "}
          <a href="mailto:shop@ovetone.com" className="text-foreground underline underline-offset-4">
            shop@ovetone.com
          </a>{" "}
          or use the form below.
        </p>

        {sent ? (
          <div className="border border-border p-8 text-center">
            <p className="text-sm tracking-brand uppercase">Message sent ✦</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll get back to you within 24 hours.
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

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] tracking-brand-wide uppercase font-medium text-muted-foreground mb-2">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={6}
          className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      )}
    </label>
  );
}