import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  code: z.string().min(1).max(64),
  subtotal_usd: z.number().positive().max(1_000_000),
});

export type DiscountResult = {
  ok: boolean;
  message: string;
  code?: string;
  discount_usd?: number;
  total_usd?: number;
};

/** Publicly callable: validate a discount code and return the discount amount in USD. */
export const validateDiscountCode = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }): Promise<DiscountResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error || !row) return { ok: false, message: "Invalid code" };
    if (!row.active) return { ok: false, message: "Code is no longer active" };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
      return { ok: false, message: "Code has expired" };
    if (row.max_uses != null && row.used_count >= row.max_uses)
      return { ok: false, message: "Code usage limit reached" };

    let discount = 0;
    if (row.percent_off) discount = (data.subtotal_usd * row.percent_off) / 100;
    else if (row.amount_off_usd) discount = Number(row.amount_off_usd);
    discount = Math.min(discount, data.subtotal_usd);
    const total = Math.max(0, data.subtotal_usd - discount);

    return {
      ok: true,
      message: row.percent_off ? `${row.percent_off}% off applied` : `$${discount.toFixed(2)} off applied`,
      code: row.code,
      discount_usd: Number(discount.toFixed(2)),
      total_usd: Number(total.toFixed(2)),
    };
  });