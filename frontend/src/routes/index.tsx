import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazyPage } from "../components/common/LazyPage";
import SessionBootstrap from "../features/auth/SessionBootstrap";
import StoreLayout from "../components/layout/StoreLayout";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import AdminRoute from "../features/auth/AdminRoute";

// Auth
const Login = lazyPage(() => import("../features/auth/Login"));
const Register = lazyPage(() => import("../features/auth/Register"));
const ForgotPassword = lazyPage(
  () => import("../features/auth/ForgotPassword"),
);
const ResetPassword = lazyPage(() => import("../features/auth/ResetPassword"));
const Profile = lazyPage(() => import("../features/auth/Profile"));

// Loja pública
const HomePage = lazyPage(() => import("../features/home/HomePage"));
const AboutPage = lazyPage(() => import("../features/about/AboutPage"));
const ProductList = lazyPage(() => import("../features/products/ProductList"));
const ProductDetail = lazyPage(
  () => import("../features/products/ProductDetail"),
);
const CheckoutPage = lazyPage(
  () => import("../features/checkout/CheckoutPage"),
);

// Conta do cliente
const MyOrders = lazyPage(() => import("../features/account/MyOrders"));
const OrderDetail = lazyPage(() => import("../features/account/OrderDetail"));

// Admin
const Dashboard = lazyPage(() => import("../features/admin/Dashboard"));
const AdminProductList = lazyPage(
  () => import("../features/admin/products/AdminProductList"),
);
const AdminProductFormWrapper = lazyPage(
  () => import("../features/admin/products/AdminProductFormWrapper"),
);
const AdminOrderList = lazyPage(
  () => import("../features/admin/orders/AdminOrderList"),
);
const AdminOrderDetail = lazyPage(
  () => import("../features/admin/orders/AdminOrderDetail"),
);
const SalesReport = lazyPage(
  () => import("../features/admin/reports/SalesReport"),
);
const UserList = lazyPage(() => import("../features/admin/UserList"));
const UserFormWrapper = lazyPage(
  () => import("../features/admin/UserFormWrapper"),
);
const RoleList = lazyPage(() => import("../features/admin/RoleList"));
const RoleFormWrapper = lazyPage(
  () => import("../features/admin/RoleFormWrapper"),
);

export const router = createBrowserRouter([
  {
    element: <SessionBootstrap />,
    children: [
      // Autenticação (sem layout)
      { path: "/login", element: Login },
      { path: "/register", element: Register },
      { path: "/forgot-password", element: ForgotPassword },
      { path: "/reset-password/:token", element: ResetPassword },

      // Loja (layout público)
      {
        element: <StoreLayout />,
        children: [
          { path: "/", element: HomePage },
          { path: "/loja", element: ProductList },
          { path: "/produto/:slug", element: ProductDetail },
          { path: "/sobre", element: AboutPage },
          { path: "/checkout", element: CheckoutPage },
          // Área do cliente (protegida)
          {
            element: <ProtectedRoute />,
            children: [
              { path: "/conta/pedidos", element: MyOrders },
              { path: "/conta/pedidos/:id", element: OrderDetail },
              { path: "/profile", element: Profile },
            ],
          },
        ],
      },

      // Administração
      {
        path: "/admin",
        element: <AdminRoute />,
        children: [
          { index: true, element: Dashboard },
          { path: "produtos", element: AdminProductList },
          { path: "produtos/novo", element: AdminProductFormWrapper },
          { path: "produtos/:id/editar", element: AdminProductFormWrapper },
          { path: "pedidos", element: AdminOrderList },
          { path: "pedidos/:id", element: AdminOrderDetail },
          { path: "relatorios", element: SalesReport },
          { path: "users", element: UserList },
          { path: "users/new", element: UserFormWrapper },
          { path: "users/:id/edit", element: UserFormWrapper },
          { path: "roles", element: RoleList },
          { path: "roles/new", element: RoleFormWrapper },
          { path: "roles/:id/edit", element: RoleFormWrapper },
        ],
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
