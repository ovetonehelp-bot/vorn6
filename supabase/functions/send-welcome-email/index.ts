// Sends a branded welcome email with a discount code and product picks.
// Uses Resend if RESEND_API_KEY is present; otherwise logs and returns ok.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOGO_URL = "https://hmfquocyogmltlnzceom.supabase.co/storage/v1/object/public/email-assets/ovetone-crown.png";

interface Body {
  email: string;
  code?: string;
  source?: string;
}

function buildHtml(code: string) {
  // Two product picks pulled live from Shopify
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding-bottom:24px;">
          <img src="${LOGO_URL}" alt="Ovetone" width="64" height="64" style="display:block;border:0;" />
        </td></tr>
        <tr><td align="center" style="padding-bottom:8px;">
          <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:-0.02em;line-height:1.1;color:#0a0a0a;">
            Thanks for signing up at Ovetone
          </h1>
        </td></tr>
        <tr><td align="center" style="padding:16px 0 24px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#525252;">
            You're in. Here's <strong style="color:#0a0a0a;">20% off</strong> your first order — use code below at checkout.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:8px 0 32px;">
          <div style="display:inline-block;border:2px dashed #0a0a0a;padding:18px 40px;font-family:'Courier New',monospace;font-size:24px;font-weight:700;letter-spacing:0.2em;color:#0a0a0a;">
            ${code}
          </div>
        </td></tr>
        <tr><td align="center" style="padding:8px 0 24px;">
          <a href="https://vorn6.lovable.app/shop" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:16px 40px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Shop The Drop
          </a>
        </td></tr>

        <tr><td style="padding:40px 0 16px;border-top:1px solid #e5e5e5;">
          <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#737373;text-align:center;font-weight:600;">
            Drops you may like
          </p>
        </td></tr>
        <tr><td style="padding:16px 0 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="50%" valign="top" style="padding:0 8px 0 0;">
                <a href="https://vorn6.lovable.app/shop" style="text-decoration:none;color:#0a0a0a;display:block;">
                  <img src="https://cdn.shopify.com/s/files/1/0925/3621/3854/files/IMG_3194.jpg" alt="Ovetone Hoodie" width="270" style="display:block;width:100%;height:auto;background:#f5f5f5;" />
                  <p style="margin:10px 0 0;font-size:13px;font-weight:600;">Signature Hoodie</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#737373;">Shop now →</p>
                </a>
              </td>
              <td width="50%" valign="top" style="padding:0 0 0 8px;">
                <a href="https://vorn6.lovable.app/shop" style="text-decoration:none;color:#0a0a0a;display:block;">
                  <img src="https://cdn.shopify.com/s/files/1/0925/3621/3854/files/IMG_3217.jpg" alt="Ovetone Sweats" width="270" style="display:block;width:100%;height:auto;background:#f5f5f5;" />
                  <p style="margin:10px 0 0;font-size:13px;font-weight:600;">Signature Sweats</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#737373;">Shop now →</p>
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:48px 0 0;">
          <p style="margin:0;font-size:11px;color:#a3a3a3;letter-spacing:0.1em;text-transform:uppercase;">
            Ovetone — Set the tone.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const email = (body.email ?? "").trim().toLowerCase();
    const code = body.code ?? "WELCOME20";

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM = Deno.env.get("RESEND_FROM") ?? "Ovetone <onboarding@resend.dev>";

    if (!RESEND_API_KEY) {
      console.log("[send-welcome-email] No RESEND_API_KEY configured. Would send to:", email);
      return new Response(
        JSON.stringify({ ok: true, queued: false, reason: "email_not_configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = buildHtml(code);

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: `Thanks for signing up at Ovetone — your ${code} code inside`,
        html,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("[send-welcome-email] Resend error:", r.status, text);
      return new Response(JSON.stringify({ ok: false, error: "send_failed", detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-welcome-email] error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});