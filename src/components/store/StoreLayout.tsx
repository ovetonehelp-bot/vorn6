import { Announcement } from "./Announcement";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Announcement />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}