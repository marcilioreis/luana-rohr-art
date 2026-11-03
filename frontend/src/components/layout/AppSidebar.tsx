import { NavLink } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { cn } from "@/lib/utils";
import { Mandala } from "@/components/brand/Mandala";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Shirt,
  ShoppingBag,
  BarChart3,
  Users,
  Shield,
  Store,
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

const links = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Shirt },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/users", label: "Usuários", icon: Users },
  { to: "/admin/roles", label: "Permissões", icon: Shield },
];

export function AppSidebar({ onClose }: SidebarProps) {
  const { user } = useAppSelector((state) => state.auth);

  const content = (
    <div className="flex h-full flex-col py-4">
      <div className="flex items-center gap-2.5 px-4">
        <Mandala className="h-7 w-7 text-primary" />
        <div>
          <h2 className="font-heading text-lg font-medium tracking-tight">
            Luana Rohr
          </h2>
          <p className="text-xs text-muted-foreground">Administração da loja</p>
        </div>
      </div>
      <Separator className="my-3" />
      <nav className="flex-1 space-y-1 p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Store className="h-4 w-4" />
          Ver a loja
        </NavLink>
      </nav>
      <Separator />
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Logado como {user?.name ?? "Usuário"}
        </p>
        {user?.email && (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen border-r bg-background md:flex md:w-64 md:flex-col">
        {content}
      </aside>
      <div className="md:hidden">{content}</div>
    </>
  );
}
