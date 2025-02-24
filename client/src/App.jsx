import "./index.scss";
import HomePage from "./routes/homePage/homePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ListPage from "./routes/listPage/listPage";
import { Layout, RequireAuth } from "./routes/layout/layout";
import SinglePage from "./routes/singlePage/singlePage";
import ProfilePage from "./routes/profilePage/profilePage";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import ProfileUpdatePage from "./routes/profileUpdatePage/profileUpdatePage";
import NewPostPage from "./routes/newPostPage/newPostPage";
import EditPostPage from "./routes/edit/EditPostPage";
import { listPageLoader, profilePageLoader, singlePageLoader } from "./lib/loaders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AboutPage from "./routes/aboutPage/aboutPage";
import ContactPage from "./routes/contactPage/contactPage";
import AgentsPage from "./routes/agentsPage/agentsPage";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <HomePage /> },
        { path: "/list", element: <ListPage />, loader: listPageLoader },
        { path: "/:id", element: <SinglePage />, loader: singlePageLoader },
        { path: "/login", element: <Login /> },
        { path: "/register", element: <Register /> },
        { path: "/about", element: <AboutPage /> },
        { path: "/contact", element: <ContactPage /> },
        { path: "/agents", element: <AgentsPage /> },
      ],
    },
    {
      path: "/",
      element: <RequireAuth />,
      children: [
        { path: "profile", element: <ProfilePage />, loader: profilePageLoader },
        { path: "profile/update", element: <ProfileUpdatePage /> },
        { path: "add", element: <NewPostPage /> },
        { path: "edit/:id", element: <EditPostPage /> },
      ],
    },
  ]);

  return (
    <NotificationProvider>
      <div className="app">
        <RouterProvider router={router} />
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="toast-container"
        />
      </div>
    </NotificationProvider>
  );
}

export default App;