import { Announcement } from "./Announcement";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { InAppBrowserBanner } from "./InAppBrowserBanner";
import { ExitIntentPopup } from "./ExitIntentPopup";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: "clip" }}>
      <InAppBrowserBanner />
      <div className="sticky top-0 z-40">
        <Announcement />
        <Header />
      </div>
      <main className="flex-1" style={{ overflowX: "clip" }}>{children}</main>
      <Footer />
      <CartDrawer />
      <ExitIntentPopup />
    </div>
  );
}