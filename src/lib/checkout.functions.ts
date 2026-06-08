import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ItemSchema = z.object({
  variantId: z.number(),
  productHandle: z.string(),
  productTitle: z.string(),
  variantTitle: z.string(),
  image: z.string(),
  price: z.string(),
  quantity: z.number().int().min(1).max(50),
});

const CreateSchema = z.object({
  email: z.string().email(),
  customer_name: z.string().min(1).max(200),
  phone: z.string().min(3).max(40),
  shipping: z.object({
    address1: z.string().min(1).max(300),
    address2: z.string().max(300).optional().default(""),
    city: z.string().min(1).max(120),
    state: z.string().max(120).optional().default(""),
    postal_code: z.string().max(40).optional().default(""),
    country: z.string().min(2).max(120),
  }),
  items: z.array(ItemSchema).min(1).max(50),
  amount: z.number().positive().max(1_000_000),
  currency: z.enum(["USD", "GHS", "NGN", "ZAR", "KES"]).default("USD"),
});

/** Create a pending order + Paystack transaction. Returns access_code + reference for inline popup. */
export const createPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateSchema.parse(input))
  .handler(async ({ data }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payment provider not configured");

    // Recompute amount server-side from items to prevent tampering
    const computed = data.items.reduce(
      (s, i) => s + parseFloat(i.price) * i.quantity,
      0,
    );
    const amount = Math.round(computed * 100); // minor units

    const reference = `OVT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount,
        currency: data.currency,
        reference,
        metadata: {
          customer_name: data.customer_name,
          phone: data.phone,
          shipping: data.shipping,
          items: data.items.map((i) => ({
            title: i.productTitle,
            variant: i.variantTitle,
            qty: i.quantity,
            price: i.price,
          })),
        },
      }),
    });

    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { access_code: string; reference: string; authorization_url: string };
    };

    if (!json.status || !json.data) {
      console.error("Paystack init failed", json);
      throw new Error(json.message || "Could not initialize payment");
    }

    // Save pending order
    await supabaseAdmin.from("orders").insert({
      paystack_reference: reference,
      email: data.email,
      customer_name: data.customer_name,
      phone: data.phone,
      shipping_address: data.shipping,
      items: data.items,
      amount: computed,
      currency: data.currency,
      status: "pending",
    });

    return {
      access_code: json.data.access_code,
      reference: json.data.reference,
      authorization_url: json.data.authorization_url,
    };
  });

const VerifySchema = z.object({ reference: z.string().min(3).max(200) });

/** Verify a Paystack transaction by reference and mark the order paid/failed. */
export const verifyPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((input) => VerifySchema.parse(input))
  .handler(async ({ data }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payment provider not configured");

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const json = (await res.json()) as {
      status: boolean;
      data?: { status: string; amount: number; currency: string; reference: string };
    };

    const paid = json.status && json.data?.status === "success";
    const newStatus = paid ? "paid" : "failed";

    await supabaseAdmin
      .from("orders")
      .update({ status: newStatus, paystack_response: JSON.parse(JSON.stringify(json)) })
      .eq("paystack_reference", data.reference);

    return { paid, reference: data.reference };
  });