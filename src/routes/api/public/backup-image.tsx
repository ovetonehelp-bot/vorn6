import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/backup-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("p");
        if (!path || path.includes("..")) {
          return new Response("bad path", { status: 400 });
        }
        const { data, error } = await supabaseAdmin.storage
          .from("product-images")
          .download(path);
        if (error || !data) {
          return new Response("not found", { status: 404 });
        }
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
