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

/**
 * Identify the visitor in Klaviyo and fire a "Subscribed" event.
 * Klaviyo's flows can then trigger the welcome email automatically —
 * the user never sees a Klaviyo form, just our branded popup.
 */
export async function subscribeToKlaviyo({
  email,
  source = "popup",
  properties = {},
}: SubscribeArgs): Promise<void> {
  if (typeof window === "undefined") return;

  const profile = {
    $email: email,
    $source: source,
    ...properties,
  };

  // Ensure the onsite queue exists (the SDK script will drain it on load).
  window._klOnsite = window._klOnsite || [];
  window._klOnsite.push(["identify", profile]);
  window._klOnsite.push([
    "track",
    "Subscribed to Newsletter",
    { source, ...properties },
  ]);

  // If the SDK is already loaded, fire directly too.
  try {
    window.klaviyo?.identify?.(profile);
    window.klaviyo?.track?.("Subscribed to Newsletter", { source, ...properties });
  } catch {
    // ignore — queue path will pick it up
  }
}