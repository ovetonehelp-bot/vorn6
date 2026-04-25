import { Announcement } from "./Announcement";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Announcement />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}