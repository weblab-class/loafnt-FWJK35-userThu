import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import LoginPage from "./components/pages/LoginPage";
import NotFound from "./components/pages/NotFound";
import Game from "./components/pages/Game";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { GoogleOAuthProvider } from "@react-oauth/google";

//TODO: REPLACE WITH YOUR OWN CLIENT_ID
const GOOGLE_CLIENT_ID = "664690037876-61rsdg0mngq6r0t9som9ivk0pusa7sce.apps.googleusercontent.com";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<NotFound />} element={<App />}>
      <Route path="/" element={<LoginPage />} />
      <Route path="/game" element={<Game />}/>
    </Route>
  )
);

// renders React Component "Root" into the DOM element with ID "root"
ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <RouterProvider router={router} />
  </GoogleOAuthProvider>
);
