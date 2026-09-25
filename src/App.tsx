import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Cart, Checkout, Home, NotFound, Orders, Profile } from "./pages";
import { RootLayout } from "./layouts";
import { Menu } from "./modules";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import { AddressProvider } from "./context/AddressContext";
import { OrdersProvider } from "./context/OrdersContext";
import AdminLayout from "./admin/AdminLayout";
import RequireAdmin from "./admin/RequireAdmin";
import RequireSuperAdmin from "./admin/RequireSuperAdmin";
import { BannersPage, CategoriesPage, Dashboard, OrdersPage, ProductsPage, PromoCodesPage, SettingsPage, StaffPage, UsersPage } from "./admin/pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout/>,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />
      },
      {
        path:"home",
        element: <Home/>
      },
      {
        path:"menu",
        element: <Menu/>
      },
      {
        path:"profile",
        element: <Profile/>
      },
      {
        path:"cart",
        element: <Cart/>
      },
      {
        path:"checkout",
        element: <Checkout/>
      },
      {
        path:"orders",
        element: <Orders/>
      },
      {
        path:"*",
        element: <NotFound/>
      },
    ]
  },
  {
    path: "/dashboard",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "products", element: <ProductsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "banners", element: <BannersPage /> },
      { path: "promo-codes", element: <PromoCodesPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "users", element: <UsersPage /> },
      {
        path: "staff",
        element: (
          <RequireSuperAdmin>
            <StaffPage />
          </RequireSuperAdmin>
        ),
      },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <AddressProvider>
            <OrdersProvider>
              <CartProvider>
                <RouterProvider router={router} />
              </CartProvider>
            </OrdersProvider>
          </AddressProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
