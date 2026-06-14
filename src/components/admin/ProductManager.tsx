import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getMoneyForCountry, formatLocal } from "@/lib/money";
import { getAdminProducts, saveAdminProduct, setAdminProductPublished } from "@/lib/product-admin.functions";

type Row = {
  handle: string;
  data: any;
  position: number;
  is_published: boolean;
  source: string;
  updated_at: string;
};

type Draft = {
  originalHandle?: string;
  title: string;
  handle: string;
  description: string;
  price: string;
  images: string[];
  sizes: string;
  published: boolean;
};

const EMPTY: Draft = { title: "", handle: "", description: "", price: "", images: [], sizes: "", published: false };
const GHS = getMoneyForCountry("Ghana");

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductManager() {
  const loadProducts = useServerFn(getAdminProducts);
  const saveProduct = useServerFn(saveAdminProduct);
  const setPublished = useServerFn(setAdminProductPublished);
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const result = await loadProducts();
    setRows(result.products as Row[]);
  };

  useEffect(() => { load().catch(() => setMessage("Could not load products.")); }, []);

  const edit = (row: Row) => {
    const product = row.data;
    const sizes = product.options?.find((option: any) => option.name?.toLowerCase() === "size")?.values ?? [];
    setDraft({
      originalHandle: row.handle,
      title: product.title ?? "",
      handle: row.handle,
      description: String(product.body_html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      price: product.variants?.[0]?.price ?? "",
      images: (product.images ?? []).map((image: any) => image.src).filter(Boolean),
      sizes: sizes.join(", "),
      published: row.is_published,
    });
    setMessage(null);
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length || !draft) return;
    setUploading(true);
    setMessage(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 12 - draft.images.length)) {
        if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) throw new Error("Images must be under 10 MB.");
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `admin/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
        if (error) throw error;
        urls.push(`/api/public/backup-image?p=${encodeURIComponent(path)}`);
      }
      setDraft((current) => current ? { ...current, images: [...current.images, ...urls] } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const priceUsd = Number(draft.price);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return setMessage("Enter a valid USD base price.");
    setBusy(true);
    setMessage(null);
    try {
      await saveProduct({ data: {
        originalHandle: draft.originalHandle,
        handle: slugify(draft.handle || draft.title),
        title: draft.title,
        description: draft.description,
        priceUsd,
        images: draft.images.filter((image) => /^https?:\/\//.test(image) || image.startsWith("/api/public/backup-image")),
        sizes: draft.sizes.split(",").map((size) => size.trim()).filter(Boolean),
        published: draft.published,
      } });
      await load();
      setDraft(null);
      setMessage("Product saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (row: Row) => {
    setBusy(true);
    try {
      await setPublished({ data: { handle: row.handle, published: !row.is_published } });
      await load();
      setMessage(row.is_published ? "Product moved to draft." : "Product published.");
    } finally {
      setBusy(false);
    }
  };

  const pricePreview = useMemo(() => Number(draft?.price || 0), [draft?.price]);

  return (
    <section className="mt-10 border-y border-border py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Store catalog</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight">Products &amp; Prices</h2>
          <p className="mt-1 text-xs text-muted-foreground">USD is your base price. Customers see their local display currency; checkout charges the GHS amount.</p>
        </div>
        <Button onClick={() => setDraft({ ...EMPTY })}>Create product</Button>
      </div>

      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}

      <div className="mt-5 overflow-x-auto border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted text-[10px] tracking-brand-wide uppercase text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-right">Base USD</th><th className="px-4 py-3 text-right">Displayed in Ghana</th><th className="px-4 py-3 text-right">Checkout GHS</th><th className="px-4 py-3 text-left">Published</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const usd = Number(row.data?.variants?.[0]?.price ?? 0);
              return (
                <tr key={row.handle} className="border-t border-border">
                  <td className="px-4 py-3"><div className="font-medium">{row.data?.title}</div><div className="text-xs text-muted-foreground">/{row.handle} · {row.source}</div></td>
                  <td className="px-4 py-3 text-right tabular-nums">${usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatLocal(usd, GHS)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">GH₵{(usd * GHS.rate).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={row.is_published ? "text-emerald-600" : "text-muted-foreground"}>{row.is_published ? "Live" : "Draft"}</span></td>
                  <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => edit(row)}>Edit</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => togglePublished(row)}>{row.is_published ? "Unpublish" : "Publish"}</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {draft && (
        <form onSubmit={submit} className="mt-6 grid gap-5 border border-border bg-card p-5 md:grid-cols-2">
          <div><label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Product name</label><Input className="mt-1" required maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, handle: draft.originalHandle ? draft.handle : slugify(e.target.value) })} /></div>
          <div><label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">URL handle</label><Input className="mt-1" required value={draft.handle} onChange={(e) => setDraft({ ...draft, handle: slugify(e.target.value) })} /></div>
          <div><label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Base price (USD)</label><Input className="mt-1" required type="number" min="0.01" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /><p className="mt-2 text-xs text-muted-foreground">Customer display: {formatLocal(pricePreview, GHS)} in Ghana · Checkout: GH₵{(pricePreview * GHS.rate).toFixed(2)}</p></div>
          <div><label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Sizes (comma separated)</label><Input className="mt-1" placeholder="S, M, L, XL" value={draft.sizes} onChange={(e) => setDraft({ ...draft, sizes: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Description</label><textarea className="mt-1 min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" maxLength={5000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="text-[10px] tracking-brand-wide uppercase text-muted-foreground">Photos</label><Input className="mt-1" type="file" accept="image/*" multiple onChange={(e) => uploadImages(e.target.files)} disabled={uploading || draft.images.length >= 12} /><div className="mt-3 flex flex-wrap gap-2">{draft.images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setDraft({ ...draft, images: draft.images.filter((_, i) => i !== index) })} className="group relative h-20 w-16 overflow-hidden border border-border"><img src={image} alt="" className="h-full w-full object-cover" /><span className="absolute inset-x-0 bottom-0 bg-background/90 py-1 text-[9px] uppercase opacity-0 group-hover:opacity-100">Remove</span></button>)}</div></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publish immediately</label>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={busy || uploading}>{busy ? "Saving…" : draft.published ? "Save & publish" : "Save draft"}</Button></div>
        </form>
      )}
    </section>
  );
}