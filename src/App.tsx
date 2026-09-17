import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Home, NotFound } from "./pages";
import { RootLayout } from "./layouts";
import { Menu } from "./modules";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout/>,
      children: [
        {
          index: true,
          element: <Navigate to="/home" replace /> // ✅ redirect
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

          path:"*",
          element: <NotFound/>  
        },
      ]
    },
  ]);
return <RouterProvider router={router} />
}

export default App
