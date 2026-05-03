import { Announcement } from "./Announcement";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { InAppBrowserBanner } from "./InAppBrowserBanner";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <InAppBrowserBanner />
      <Announcement />
      <Header />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}