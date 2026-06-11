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
  discount_code: z.string().min(1).max(64).optional(),
});

// USD -> GHS conversion rate used to charge in Paystack (Ghana account only supports GHS).
const USD_TO_GHS = 11.14;

/** Create a pending order + Paystack transaction. Returns access_code + reference for inline popup. */
export const createPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateSchema.parse(input))
  .handler(async ({ data }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payment provider not configured");

    // Recompute amount server-side from items to prevent tampering.
    // Prices are stored in USD; Paystack (Ghana) charges in GHS, so we convert.
    const computedUsd = data.items.reduce(
      (s, i) => s + parseFloat(i.price) * i.quantity,
      0,
    );

    // Apply discount code (server-validated) if provided.
    let discountUsd = 0;
    let appliedCode: string | null = null;
    if (data.discount_code) {
      const codeUpper = data.discount_code.trim().toUpperCase();
      const { data: row } = await supabaseAdmin
        .from("discount_codes")
        .select("*")
        .eq("code", codeUpper)
        .maybeSingle();
      if (
        row &&
        row.active &&
        (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()) &&
        (row.max_uses == null || row.used_count < row.max_uses)
      ) {
        if (row.percent_off) discountUsd = (computedUsd * row.percent_off) / 100;
        else if (row.amount_off_usd) discountUsd = Number(row.amount_off_usd);
        discountUsd = Math.min(discountUsd, computedUsd);
        appliedCode = row.code;
      }
    }
    const finalUsd = Math.max(0, computedUsd - discountUsd);
    const computedGhs = finalUsd * USD_TO_GHS;
    const amount = Math.round(computedGhs * 100); // minor units (pesewas)

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
        currency: "GHS",
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
      amount: computedGhs,
      currency: "GHS",
      status: "pending",
      discount_code: appliedCode,
      discount_amount_usd: discountUsd > 0 ? discountUsd : null,
    });

    // Increment used_count on the discount code (best-effort).
    if (appliedCode) {
      const { data: cur } = await supabaseAdmin
        .from("discount_codes")
        .select("used_count")
        .eq("code", appliedCode)
        .maybeSingle();
      if (cur) {
        await supabaseAdmin
          .from("discount_codes")
          .update({ used_count: (cur.used_count ?? 0) + 1 })
          .eq("code", appliedCode);
      }
    }

    return {
      access_code: json.data.access_code,
      reference: json.data.reference,
      authorization_url: json.data.authorization_url,
      amount_ghs: computedGhs,
      discount_usd: discountUsd,
      applied_code: appliedCode,
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