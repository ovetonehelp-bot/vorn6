import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProductInput = z.object({
  originalHandle: z.string().trim().min(1).max(120).optional(),
  handle: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).default(""),
  priceUsd: z.number().positive().max(100000),
  images: z
    .array(
      z
        .string()
        .max(2000)
        .refine(
          (value) => /^https?:\/\//.test(value) || value.startsWith("/api/public/backup-image?p="),
          "Invalid image URL",
        ),
    )
    .max(12),
  sizes: z.array(z.string().trim().min(1).max(40)).max(30),
  published: z.boolean(),
});

const HandleInput = z.object({ handle: z.string().trim().min(1).max(120) });

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Forbidden");
}

export const getAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin
      .from("product_backup")
      .select("handle, data, position, is_published, source, updated_at")
      .order("position", { ascending: true });
    if (error) throw error;
    const savedRows = saved ?? [];
    try {
      const response = await fetch("https://ovetone.myshopify.com/products.json?limit=250");
      if (!response.ok) return { products: savedRows };
      const payload = (await response.json()) as { products?: any[] };
      const savedByHandle = new Map(savedRows.map((row) => [row.handle, row]));
      const liveRows = (payload.products ?? []).map(
        (product, position) =>
          savedByHandle.get(product.handle) ?? {
            handle: product.handle,
            data: product,
            position,
            is_published: true,
            source: "shopify",
            updated_at: product.updated_at ?? product.created_at,
          },
      );
      const liveHandles = new Set(liveRows.map((row) => row.handle));
      return {
        products: [...liveRows, ...savedRows.filter((row) => !liveHandles.has(row.handle))],
      };
    } catch {
      return { products: savedRows };
    }
  });

export const saveAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("product_backup")
      .select("data, position")
      .eq("handle", data.originalHandle ?? data.handle)
      .maybeSingle();

    const previous = (existing?.data ?? {}) as Record<string, any>;
    const productId = Number(previous.id) || Date.now();
    const oldVariants = Array.isArray(previous.variants) ? previous.variants : [];
    const sizeValues = data.sizes.length ? data.sizes : ["Default Title"];
    const variants = sizeValues.map((size, index) => ({
      ...(oldVariants[index] ?? {}),
      id: Number(oldVariants[index]?.id) || productId + index + 1,
      title: size,
      price: data.priceUsd.toFixed(2),
      available: true,
      option1: data.sizes.length ? size : null,
      option2: null,
      option3: null,
    }));
    const images = data.images.map((src, index) => ({
      id: Number(previous.images?.[index]?.id) || productId + 1000 + index,
      src,
      alt: data.title,
    }));
    const snapshot = {
      ...previous,
      id: productId,
      title: data.title,
      handle: data.handle,
      body_html: data.description,
      vendor: previous.vendor || "Ovetone",
      product_type: previous.product_type || "",
      created_at: previous.created_at || new Date().toISOString(),
      images,
      options: data.sizes.length ? [{ name: "Size", values: data.sizes }] : [],
      variants,
    };

    let position = existing?.position;
    if (position == null) {
      const { data: last } = await supabaseAdmin
        .from("product_backup")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      position = (last?.position ?? -1) + 1;
    }

    const { error } = await supabaseAdmin.from("product_backup").upsert({
      handle: data.handle,
      data: snapshot,
      position,
      backed_up_at: new Date().toISOString(),
      is_published: data.published,
      source: "admin",
    });
    if (error) throw error;

    if (data.originalHandle && data.originalHandle !== data.handle) {
      await supabaseAdmin.from("product_backup").delete().eq("handle", data.originalHandle);
    }
    return { ok: true, product: snapshot };
  });

export const setAdminProductPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => HandleInput.extend({ published: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("product_backup")
      .select("handle")
      .eq("handle", data.handle)
      .maybeSingle();
    if (!existing) {
      const response = await fetch("https://ovetone.myshopify.com/products.json?limit=250");
      if (!response.ok) throw new Error("Could not load this product.");
      const payload = (await response.json()) as { products?: Array<Record<string, unknown>> };
      const product = (payload.products ?? []).find((item) => item.handle === data.handle);
      if (!product) throw new Error("Product not found.");
      const { error } = await supabaseAdmin.from("product_backup").insert({
        handle: data.handle,
        data: product,
        position: (payload.products ?? []).findIndex((item) => item.handle === data.handle),
        backed_up_at: new Date().toISOString(),
        is_published: data.published,
        source: "admin",
      });
      if (error) throw error;
      return { ok: true };
    }
    const { error } = await supabaseAdmin
      .from("product_backup")
      .update({ is_published: data.published, source: "admin" })
      .eq("handle", data.handle);
    if (error) throw error;
    return { ok: true };
  });
