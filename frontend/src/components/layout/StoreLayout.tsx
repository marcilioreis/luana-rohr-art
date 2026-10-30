import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectCartCount } from "@/features/cart/cartSlice";
import CartDrawer from "@/features/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User } from "lucide-react";

export default function StoreLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = useAppSelector(selectCartCount);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors hover:text-primary ${
      isActive ? "text-primary font-medium" : "text-muted-foreground"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight">Luana Rohr</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Art · Camisetas
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" end className={navClass}>
              Início
            </NavLink>
            <NavLink to="/loja" className={navClass}>
              Loja
            </NavLink>
            <NavLink to="/sobre" className={navClass}>
              Sobre
            </NavLink>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              to={isAuthenticated ? "/conta/pedidos" : "/login"}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title={isAuthenticated ? "Meus pedidos" : "Entrar"}
            >
              <User className="h-5 w-5" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
              data-testid="cart-icon"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Nav mobile */}
        <nav className="flex items-center justify-center gap-6 border-t py-2 md:hidden">
          <NavLink to="/" end className={navClass}>
            Início
          </NavLink>
          <NavLink to="/loja" className={navClass}>
            Loja
          </NavLink>
          <NavLink to="/sobre" className={navClass}>
            Sobre
          </NavLink>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Luana Rohr Art — Camisetas com arte
            autoral.
          </p>
          <p className="mt-1">Pagamento via PIX · Feito com carinho.</p>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
