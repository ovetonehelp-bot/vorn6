// Klaviyo client-side helpers.
//
// We use the Klaviyo onsite JS that is loaded in __root.tsx
// (https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=TECgZW).
// Once loaded it exposes `window._klOnsite` (queue) and `window.klaviyo`.
// We push events to `_klOnsite` so they queue safely even if the SDK
// hasn't finished loading yet.

declare global {
  interface Window {
    _klOnsite?: any[];
    klaviyo?: {
      identify?: (data: Record<string, any>) => void;
      track?: (event: string, props?: Record<string, any>) => void;
      push?: (args: any[]) => void;
    };
  }
}

interface SubscribeArgs {
  email: string;
  source?: string;
  properties?: Record<string, any>;
}

// Public Klaviyo identifiers — safe to ship in client code.
const KLAVIYO_COMPANY_ID = "TECgZW";
const KLAVIYO_LIST_ID = "Uj9Xrf";

/**
 * Subscribe a visitor to our Klaviyo list AND fire a tracked event.
 * Uses Klaviyo's client API (no private key required) so the email
 * actually lands in your "Email List" inside Klaviyo, where flows can
 * pick it up to send the welcome / discount email.
 */
export async function subscribeToKlaviyo({
  email,
  source = "popup",
  properties = {},
}: SubscribeArgs): Promise<void> {
  if (typeof window === "undefined") return;

  // 1) Create/update the profile via Klaviyo's client API. This guarantees
  //    the email lands in your Klaviyo account as a profile (visible under
  //    Audience → Profiles), even if list subscription requires double opt-in.
  try {
    const profileRes = await fetch(
      `https://a.klaviyo.com/client/profiles/?company_id=${KLAVIYO_COMPANY_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: "2024-10-15",
        },
        body: JSON.stringify({
          data: {
            type: "profile",
            attributes: {
              email,
              properties: { source, ...properties },
            },
          },
        }),
      }
    );
    if (!profileRes.ok) {
      console.warn("[klaviyo] profile create failed", profileRes.status, await profileRes.text());
    }
  } catch (e) {
    console.warn("[klaviyo] profile create error", e);
  }

  // 2) Subscribe the profile to the list (single opt-in if your list is set
  //    that way; otherwise Klaviyo sends a confirmation email).
  try {
    const subRes = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: "2024-10-15",
        },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              custom_source: source,
              profile: {
                data: {
                  type: "profile",
                  attributes: {
                    email,
                    properties: { source, ...properties },
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              },
            },
            relationships: {
              list: { data: { type: "list", id: KLAVIYO_LIST_ID } },
            },
          },
        }),
      }
    );
    if (!subRes.ok) {
      console.warn("[klaviyo] subscription failed", subRes.status, await subRes.text());
    }
  } catch (e) {
    console.warn("[klaviyo] subscription error", e);
  }

  // 2) Identify + event via onsite SDK so flows triggered by events still fire.
  const profile = { $email: email, $source: source, ...properties };
  window._klOnsite = window._klOnsite || [];
  window._klOnsite.push(["identify", profile]);
  window._klOnsite.push([
    "track",
    "Subscribed to Newsletter",
    { source, ...properties },
  ]);
  try {
    window.klaviyo?.identify?.(profile);
    window.klaviyo?.track?.("Subscribed to Newsletter", { source, ...properties });
  } catch {
    // ignore
  }
}