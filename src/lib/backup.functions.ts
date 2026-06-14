import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_DOMAIN = "ovetone.myshopify.com";
const BUCKET = "product-images";

function extFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("svg")) return "svg";
  return "jpg";
}

/** Admin-only. Pulls live products from Shopify, copies every image into our
 *  storage bucket, rewrites image URLs to our own proxy, and upserts the
 *  result into `product_backup`. Safe to call repeatedly. */
export const backupShopifyProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=250`);
    if (!res.ok) throw new Error(`Shopify fetch failed: ${res.status}`);
    const { products } = (await res.json()) as { products: any[] };

    let imagesSaved = 0;
    let imagesSkipped = 0;

    for (let p = 0; p < products.length; p++) {
      const prod = products[p];
      const { data: existing } = await supabaseAdmin
        .from("product_backup")
        .select("source")
        .eq("handle", prod.handle)
        .maybeSingle();
      if (existing?.source === "admin") continue;
      const newImages: any[] = [];
      for (const img of prod.images ?? []) {
        const filename = `${img.id}.${extFromContentType(null)}`;
        const storagePath = `${prod.handle}/${filename}`;
        try {
          const imgRes = await fetch(img.src);
          if (!imgRes.ok) throw new Error(`status ${imgRes.status}`);
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          const ct = imgRes.headers.get("content-type") || "image/jpeg";
          const finalPath = `${prod.handle}/${img.id}.${extFromContentType(ct)}`;
          const { error: upErr } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(finalPath, buf, { contentType: ct, upsert: true });
          if (upErr) throw upErr;
          imagesSaved++;
          newImages.push({
            ...img,
            src: `/api/public/backup-image?p=${encodeURIComponent(finalPath)}`,
            original_src: img.src,
          });
        } catch (e) {
          imagesSkipped++;
          newImages.push({ ...img, original_src: img.src });
        }
      }

      // Rewrite featured_image refs inside variants too.
      const imgIdMap = new Map<number, string>();
      newImages.forEach((i) => imgIdMap.set(i.id, i.src));
      const newVariants = (prod.variants ?? []).map((v: any) => {
        if (v.featured_image?.id && imgIdMap.has(v.featured_image.id)) {
          return {
            ...v,
            featured_image: { ...v.featured_image, src: imgIdMap.get(v.featured_image.id) },
          };
        }
        return v;
      });

      const snapshot = { ...prod, images: newImages, variants: newVariants };

      await supabaseAdmin.from("product_backup").upsert({
        handle: prod.handle,
        data: snapshot,
        position: p,
        backed_up_at: new Date().toISOString(),
      });
    }

    return {
      products: products.length,
      imagesSaved,
      imagesSkipped,
      at: new Date().toISOString(),
    };
  });

/** Public — returns backup products (used as fallback if Shopify is gone). */
export const getBackupProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("product_backup")
    .select("handle, data, position, backed_up_at, source, is_published")
    .order("position", { ascending: true });
  if (error) throw error;
  return {
    products: (data ?? [])
      .filter((r: any) => r.is_published)
      .map((r: any) => ({ ...r.data, _source: r.source })),
    hidden_handles: (data ?? [])
      .filter((r: any) => !r.is_published && r.source === "admin")
      .map((r: any) => r.handle),
    backed_up_at: data?.[0]?.backed_up_at ?? null,
    count: data?.length ?? 0,
  };
});

const InfoSchema = z.object({}).optional();
export const getBackupInfo = createServerFn({ method: "GET" })
  .inputValidator(() => InfoSchema.parse({}))
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("product_backup")
      .select("handle", { count: "exact", head: true });
    const { data: latest } = await supabaseAdmin
      .from("product_backup")
      .select("backed_up_at")
      .order("backed_up_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { count: count ?? 0, last: latest?.backed_up_at ?? null };
  });
