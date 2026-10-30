import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import Header from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function AdminRoute() {
  const { isAuthenticated, isLoading, roles, permissions } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Verificando permissões...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin =
    roles.includes("admin") ||
    permissions.includes("product:manage") ||
    permissions.includes("order:manage");

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-destructive">
        Acesso negado. Área restrita à administração da loja.
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
