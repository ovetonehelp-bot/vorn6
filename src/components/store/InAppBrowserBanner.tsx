import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

function detectInApp(ua: string): string | null {
  if (/TikTok/i.test(ua)) return "TikTok";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/Twitter/i.test(ua)) return "Twitter";
  if (/Line\//i.test(ua)) return "Line";
  return null;
}

const DISMISS_KEY = "ovetone_inapp_dismissed_v1";

export function InAppBrowserBanner() {
  const [app, setApp] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }
    setApp(detectInApp(navigator.userAgent));
  }, []);

  if (!app || dismissed) return null;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // On Android, intent:// can force Chrome to open the link
  const androidIntent = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
  // On iOS there's no reliable way to escape the in-app browser — instruct user
  const handleOpen = () => {
    if (isAndroid) {
      window.location.href = androidIntent;
    } else {
      // iOS fallback: try x-safari-https
      window.location.href = "x-safari-" + url;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied. Paste it in Safari or Chrome.");
    } catch {
      alert(url);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-amber-400 text-foreground border-b border-amber-500/40">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-start gap-3 text-[12px] md:text-sm">
        <div className="flex-1 leading-snug">
          <p className="font-semibold mb-1">
            You're using {app}'s in-app browser.
          </p>
          <p className="opacity-80">
            For the best shopping experience and secure checkout, open this site in {isIOS ? "Safari" : "Chrome"}.
            {app === "TikTok" && " Tap the ⋯ menu in the top corner and choose 'Open in browser'."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {isAndroid && (
              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 text-[11px] tracking-brand-wide uppercase font-semibold"
              >
                <ExternalLink className="h-3 w-3" /> Open in Chrome
              </button>
            )}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 border border-foreground/30 px-3 py-1.5 text-[11px] tracking-brand-wide uppercase font-semibold"
            >
              Copy link
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 hover:opacity-70"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
