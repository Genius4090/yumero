import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./pages";
import { RootLayout } from "./layouts";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout/>,
      children: [
        {
          index:true,
          path:"/home",
          element: <Home/>  
        }
      ]
    },
  ]);
return <RouterProvider router={router} />
}

export default App
