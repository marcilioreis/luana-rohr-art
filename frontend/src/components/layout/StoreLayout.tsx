import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectCartCount } from "@/features/cart/cartSlice";
import CartDrawer from "@/features/cart/CartDrawer";
import { Mandala, MandalaStar } from "@/components/brand/Mandala";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

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
          <Link to="/" className="group flex items-center gap-2.5">
            <Mandala className="h-8 w-8 text-primary transition-transform duration-500 group-hover:rotate-45" />
            <span className="flex flex-col leading-none">
              <span className="font-heading text-xl font-medium tracking-tight">
                Luana Rohr
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                arte autoral
              </span>
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

      <footer className="relative overflow-hidden border-t">
        {/* Mandala d'água (bem sutil) */}
        <MandalaStar
          strokeWidth={1.5}
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 text-primary/5"
        />
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <Mandala className="h-10 w-10 text-brand-red" />
            <p className="font-heading text-xl">Arte que veste manifesto.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Estampas autorais, edições limitadas e muito traço de mão por
              Luana Rohr.
            </p>
            <a
              href="https://www.instagram.com/luanarohrart/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <InstagramIcon className="h-4 w-4" />
              @luanarohrart
            </a>
          </div>
          <div className="mt-8 flex flex-col items-center gap-1 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} Luana Rohr Art</p>
            <p>Pagamento via PIX · Feito com carinho</p>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
